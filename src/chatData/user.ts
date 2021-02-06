import EventEmitter from 'events';
import chatData from "./chatData";
import ChatStorage from "./chat/chatStorage";
import {
    generateVerificationCode,
    Parts,
    VerificationCode,
    verificationCodeTypes,
    verifyCode
} from "../verification/code";
import {pool} from "../app";
import {isResultEmpty, ResultEmptyError} from "../util/sqlHelpers";
import {sendMail} from "../verification/sendMail";
import {logger} from "../util/logger";
import {Chat, chatTypes} from "./chat/chat";
import {MessageData} from "../models/message";
import {GroupChat} from "./chat/groupChat";
import {Socket} from "socket.io";

class Emitter extends EventEmitter {}

export default class User{
    /*
        eventEmitter
     */
    private _eventEmitter = new Emitter();
    private _chats:ChatStorage = new ChatStorage();
    private _socket:Socket;
    private _uid:number;
    private _username:string;
    private _online:boolean;
    private _currentChat:Chat;
    /*
        are the chats of this user loaded?
     */
    private _chatsLoaded:boolean = false;

    /*
        Wenn user nicht online, wird nur uid und username aus DB geladen
     */
    constructor(uid:number,username:string,socket:Socket = null,online:boolean = false) {
        this.uid = uid;
        this.username = username;
        this.socket = socket;
        this.online = online;
        this.currentChat = null;
    }

    /*
        chats of the user are loaded
     */
    async loadChats():Promise<void> {
        /*
            normalChats are loaded
         */
        await chatData.chats.loadNormalChats(this);
        /*
            groupChats are loaded
         */
        await chatData.chats.loadGroupChats(this);
        /*
            subscribe to all socket-rooms in the chats
        */
        this.chats.group.forEach((chat:GroupChat) => {
            chat.subscribeToRoom(this);
        });

        const chats = await this.getChatJson();

        this.chatsLoaded = true;

        this.eventEmitter.emit('chats loaded', chats);

    }
    /*
        chats of user are saved and deleted
     */
    async saveAndDeleteChats():Promise<boolean> {

        this.chatsLoaded = false;

        return new Promise(((resolve, reject) => {
            /*
                if someone in any chat where the user is, is online, the chat does not get deleted
             */
            let userInfoNeeded = false;
            let i = 0;

            this.chats.forEach(async (value:Chat,key) => {
                i++;
                /*
                    is there anyone online at the chat?
                 */
                if(await value.isAnyoneOnline())
                    userInfoNeeded = true;
                else {
                    /*
                        chat is deleted
                     */
                    const chat = chatData.chats.getChat(value.type,key);
                    await chat.removeUsers(this.uid);
                    chatData.chats.removeChat(chat);
                }
                if (value.type === chatTypes.groupChat)
                    (value as GroupChat).leaveRoom(this);
                if(i === this.chats.length())
                    resolve(userInfoNeeded);
            });
        }));
    }
    startedTyping():void {

        /*
            if there is no current chat, msg cannot be sent
         */
        if(this.currentChat !== null)
            this.currentChat.sendToAll(
                this,
                'started typing',
                {uid: this.uid},
                false
            );
    }
    stoppedTyping():void {
        /*
            if there is no current chat, msg cannot be sent
         */
        if(this.currentChat !== null)
            this.currentChat.sendToAll(
                this,
                'stopped typing',
                {uid: this.uid},
                false
            );
    }
    async sendMessage(data:MessageData):Promise<number> {
        /*
            only when a chat is selected it can be sent
         */
        if(this.currentChat !== null) {
            /*
                a new message is added to the chat
             */
            const message = await this.currentChat.addMessage(this,data);
            /*
                message is sent
             */
            await this.currentChat.sendMessage(this,message);
            /*
                mid is returned
             */
            return message.mid;
        }else{
            throw new Error('no chat selected')
        }
    }
    /*
        is called, when a newly loaded chat should be added to the list
     */
    addLoadedChat(chat:Chat):void {
        this.chats.addChat(chat);
    }
    /*
        loaded chat gets saved and removed from storage
        called in:
            removeUsers:
                normalchat
                groupchat
     */
    removeUnloadedChat(chat:Chat):void {
        //Referenz im eigenen chat-array wird gelöscht
        this.chats.removeChat(chat);
    }
    /*
        A object with all chats where the user is in gets returned
     */
    //TODO return type
    async getChatJson(){

        return new Promise((resolve, reject) => {

            let rc:any = [];
            let i=0;
            /*
                if length is 0, empty array gets returned
             */
            if(this.chats.length() === 0)
                resolve(rc);

            this.chats.forEach(async (value:Chat,key:number) => {

                try {
                    /*
                        if groupChat -->
                            is the user still member in this chat?
                            TODO
                     */
                    if (value.type === chatTypes.groupChat) {

                        (value as GroupChat).getMember(this.uid);
                    }

                    const members = await value.getMemberObject(this.uid);
                    const chatName = value.getChatName(this.uid);
                    const fm = value.messageStorage.getNewestMessageObject();
                    /*
                        Objekt wird erstellt und zum Array hinzugefügt
                     */
                    rc.push({
                        type: value.getChatTypeString(),
                        id: key,
                        chatName: chatName,
                        members: members,
                        firstMessage: fm,
                        unreadMessages: value.getUnreadMessages(this.uid)
                    });

                }catch(e) {

                }finally {

                    i++;
                    if (i === this.chats.length())
                        resolve(rc);
                }
            });
        });
    }
    /*
        a new chat gets added to the user
        this also gets emitted to the client
     */
    async addNewChat(chat:Chat):Promise<void> {

        if(this.socket !== null) {
            /*
                info gets emitted to the server
             */
            const data = {
                type: chat.getChatTypeString(),
                id: chat.chatId,
                chatName: chat.getChatName(this.uid),
                members: await chat.getMemberObject(this.uid),
                firstMessage: chat.messageStorage.getNewestMessageObject()
            };

            this.socket.emit("new chat", data);
        }
    }
    /*
        is the chat the currentChat of the user?
     */
    isCurrentChat(chat:Chat):boolean {
        if(!this.currentChat)
            return false;
        return this.currentChat.type === chat.type
            && this.currentChat.chatId === chat.chatId;
    }
    async createPasswordResetCode():Promise<VerificationCode>{
        return await generateVerificationCode(verificationCodeTypes.pwReset,this.uid);
    }
    /*
        set a new password
            password: the new password
            code: the code sent by the user
     */
    async setPassword(hash:string,code:string):Promise<void> {
        //is email verified?
        if(await this.isVerified()) {
            const parts:Parts = {
                uid: this.uid,
                code: code
            }
            //verify code
            if (await verifyCode(parts, verificationCodeTypes.pwReset) !== -1) {

                const query_str =
                    "UPDATE user " +
                    "SET password = " + pool.escape(hash) + " " +
                    "WHERE uid = " + this.uid + ";";
                logger.verbose('SQL: %s',query_str);

                await new Promise((resolve, reject) => {
                    pool.query(query_str, (err:Error) => {
                        if (err)
                            reject(err);
                        resolve();
                    });
                });
            } else
                throw new Error("invalid code")
        }else
            throw new Error("Email not verified!");
    }
    async isVerified():Promise<boolean> {
        const result:any = await new Promise((resolve, reject) => {
            const query_str =
                "SELECT isVerified " +
                "FROM user " +
                "WHERE uid = " + this.uid + ";";
            logger.verbose('SQL: %s',query_str);

            pool.query(query_str,(err:Error,result:any) => {
                if(err)
                    reject(err);
                resolve(result);
            });
        });
        return result[0].isVerified === 1;
    }
    //email of the user is set
    async setEmail(email:string):Promise<void> {

        await this.deleteVerificationCodes();

        const {sCode,vcid} = await generateVerificationCode(verificationCodeTypes.emailVerification,this.uid);

        await new Promise((resolve, reject) => {
            const query_str =
                "INSERT " +
                "INTO emailchange (uid,vcid,newEmail,date,isVerified) " +
                "VALUES (" + this.uid + "," + vcid + "," + pool.escape(email) + ",CURRENT_TIMESTAMP(),0);"
            logger.verbose('SQL: %s',query_str);

            pool.query(query_str,(err:Error,result:any) => {
               if(err)
                   reject(err);
               // TODO: result type?
               if(isResultEmpty(result))
                   reject(new ResultEmptyError());
               resolve(result);
            });
        });

        await sendMail(email,"Chat App: email verification",sCode);
    }
    //all current verificationCodes are deleted
    async deleteVerificationCodes():Promise<void> {
        await new Promise((resolve, reject) => {
            const query_str =
                "DELETE " +
                "FROM verificationcode " +
                "WHERE uid = " + this.uid + ";";
            logger.verbose('SQL: %s',query_str);

            pool.query(query_str,(err:Error) => {
                if(err)
                    reject(err);
                resolve();
            });
        });
    }

    async verifyEmail(parts:Parts):Promise<boolean> {
        //verifyCode
        const vcid:number = await verifyCode(parts,verificationCodeTypes.emailVerification);
        if(vcid != -1){
            //email change is selected from DB
            const result:any = await new Promise((resolve, reject) => {
               const query_str =
                   "SELECT * " +
                   "FROM emailchange " +
                   "WHERE vcid = " + vcid + ";";
                logger.verbose('SQL: %s',query_str);

                pool.query(query_str,(err:Error,result:any) => {
                   if(err)
                       reject(err);
                   else if(isResultEmpty(result))
                       reject(new ResultEmptyError())
                   else
                       resolve(result[0]);
               });
            });
            //emailChange is set to verified
            await new Promise((resolve, reject) => {
                const query_str =
                    "UPDATE emailchange " +
                    "SET isVerified = 1 " +
                    "WHERE vcid = " + vcid + ";";
                logger.verbose('SQL: %s',query_str);

                pool.query(query_str,(err:Error) => {
                   if(err)
                       reject(err);
                   resolve();
                });
            });
            //new email is written to user
            await new Promise((resolve, reject) => {
                const query_str =
                    "UPDATE user " +
                    "SET email = " + pool.escape(result.newEmail) + ",isVerified = 1 " +
                    "WHERE uid = " + this.uid + ";";
                logger.verbose('SQL: %s',query_str);

                pool.query(query_str,(err:Error) => {
                    if(err)
                        reject(err);
                    resolve();
                });
            });
            return true;
        }else{
            return false;
        }
    }

    get eventEmitter():EventEmitter {
        return this._eventEmitter;
    }

    set eventEmitter(value:EventEmitter) {
        this._eventEmitter = value;
    }

    get uid():number {
        return this._uid;
    }

    set uid(value:number) {
        this._uid = value;
    }

    get username():string {
        return this._username;
    }

    set username(value:string) {
        this._username = value;
    }

    get socket():Socket {
        return this._socket;
    }

    set socket(value:Socket) {
        this._socket = value;
    }

    get chats():ChatStorage {
        return this._chats;
    }

    set chats(value:ChatStorage) {
        this._chats = value;
    }

    get online():boolean {
        return this._online;
    }

    set online(online:boolean){
        this._online = online;
    }

    get currentChat():Chat {
        return this._currentChat;
    }

    set currentChat(value:Chat) {
        this._currentChat = value;
        /*
            unreadMessages at currentChat are set to 0
         */
        if(value) {

            value.setUnreadMessages(this.uid,0)
                .catch(err => {
                    logger.error(err);
                });
        }
    }

    get chatsLoaded():boolean {
        return this._chatsLoaded;
    }

    set chatsLoaded(value:boolean) {
        this._chatsLoaded = value;
    }
}