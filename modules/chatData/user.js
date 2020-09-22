import EventEmitter from 'events';
import chatData from "./chatData.js";
import ChatStorage from "./chat/chatStorage.js";
import {
    verifyCode,
    verificationCodeTypes,
    generateVerificationCode
} from "../verification/code.js";
import {con} from "../app.js";
import {isEmpty,createEmptyError} from "../util/sqlHelpers";
import {sendMail} from "../verification/sendMail";

class Emitter extends EventEmitter {}

export default class User{
    /*
        eventEmitter
     */
    #_eventEmitter = new Emitter();
    #_chats = new ChatStorage();
    #_socket;
    #_uid;
    #_username;
    #_online;
    #_currentChat;
    /*
        are the chats of this user loaded?
     */
    #_chatsLoaded = false;

    /*
        Wenn user nicht online, wird nur uid und username aus DB geladen
     */
    constructor(uid,username,socket = null,online = false) {
        this.uid = uid;
        this.online = online;
        this.username = username;
        this.socket = socket;
        this.currentChat = null;
    }

    /*
        Die chats des users werden geladen.
     */
    async loadChats(){
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
        this.chats.forEachGroup((chat,index,key) => {
            chat.subscribeToRoom(this);
        });

        const chats = await this.getChatJson();

        this.chatsLoaded = true;

        this.eventEmitter.emit('chats loaded', chats);

    }
    /*
        chats des users werden gespeichert und gelöscht
     */
    async saveAndDeleteChats(){

        this.chatsLoaded = false;

        return new Promise(((resolve, reject) => {
            /*
                if someone in any chat where the user is, is online, the chat does not get deleted
             */
            let userInfoNeeded = false;
            let i = 0;

            this.chats.forEach((item,index,key,type) => {
                i++;
                /*
                    is there anyone online at the chat?
                 */
                if(item.isAnyoneOnline())
                    userInfoNeeded = true;
                else {
                    /*
                        chat is deleted
                     */
                    const chat = chatData.chats.getChat(type,key);
                    chat.removeUsers(this.uid);
                    chatData.chats.removeChat(chat);
                }
                if (type === 'groupChat')
                    item.leaveRoom(this);
                if(i === this.chats.length())
                    resolve(userInfoNeeded);
            });
        }));
    }
    startedTyping(){

        /*
            nur wenn derzeitiger chat definiert ist, kann msg gesendet werden
         */
        if(this.currentChat !== null)
            this.currentChat.sendToAll(
                this,
                'started typing',
                {uid: this.uid}
            );
    }
    stoppedTyping(){
        /*
            nur wenn derzeitiger chat definiert ist, kann msg gesendet werden
         */
        if(this.currentChat !== null)
            this.currentChat.sendToAll(
                this,
                'stopped typing',
                {uid: this.uid}
            );
    }
    async sendMessage(data){
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
        wird aufgerufen, wenn chat geladen wurde und zum array hinzugefügt werden soll.
     */
    addLoadedChat(chat){
        this.chats.addChat(chat);
    }
    /*
        wird aufgerufen, wenn geladener chat gespeichert
        und aus server-speicher entfernt werden soll
        aufgerufen in:
            removeUsers:
                Normalchat
                Grpupchat
     */
    removeUnloadedChat(chat){
        //Referenz im eigenen chat-array wird gelöscht
        this.chats.removeChat(chat);
    }
    /*
        A object with all chats where the user is in gets returned
     */
    async getChatJson(){

        return new Promise((resolve, reject) => {

            let rc = [];
            let i=0;
            /*
                if length is 0, empty array gets returned
             */
            if(this.chats.length() === 0)
                resolve(rc);

            this.chats.forEach((chat,index,key) => {

                try {
                    /*
                        if groupChat -->
                            is the user still member in this chat?
                            TODO
                     */
                    if (chat.type === "groupChat") {

                        chat.getMember(this.uid);
                    }

                    const members = chat.getMemberObject(this.uid);
                    const chatName = chat.getChatName(this.uid);
                    const fm = chat.messageStorage.getNewestMessageObject();
                    /*
                        Objekt wird erstellt und zum Array hinzugefügt
                     */
                    rc.push({
                        type: chat.type,
                        id: key,
                        chatName: chatName,
                        members: members,
                        firstMessage: fm,
                        unreadMessages: chat.getUnreadMessages(this.uid)
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
    addNewChat(chat){

        if(this.socket !== null) {
            /*
                info gets emitted to the server
             */
            const data = {
                type: chat.type,
                id: chat.chatId,
                chatName: chat.getChatName(this.uid),
                members: chat.getMemberObject(this.uid),
                firstMessage: chat.messageStorage.getNewestMessageObject()
            };

            this.socket.emit("new chat", data);
        }
    }
    /*
        is the chat the currentChat of the user?
     */
    isCurrentChat(chat){
        if(!this.currentChat)
            return false;
        return this.currentChat.type === chat.type
            && this.currentChat.chatId === chat.chatId;
    }
    async createPasswordResetCode(){
        return await generateVerificationCode(verificationCodeTypes.pwReset,this.uid);
    }
    /*
        set a new password
            password: the new password
            code: the code sent by the user
     */
    async setPassword(hash,code){
        //is email verified?
        if(await this.isVerified()) {
            //verify code
            if (await verifyCode({
                uid: this.uid,
                code: code
            }, verificationCodeTypes.pwReset)) {

                const query_str =
                    "UPDATE user " +
                    "SET password = " + hash + " " +
                    "WHERE uid = " + this.uid + ";";

                await new Promise((resolve, reject) => {
                    con.query(query_str, (err) => {
                        if (err)
                            reject(err);
                    });
                });
            } else
                throw new Error("invalid code")
        }else
            throw new Error("Email not verified!");
    }
    async isVerified(){
        const result = await new Promise((resolve, reject) => {
            const query_str =
                "SELECT isVerified " +
                "FROM user " +
                "WHERE uid = " + this.uid + ";";
            con.query(query_str,(err,result) => {
                if(err)
                    reject(err);
                resolve(result);
            });
        });
        return result[0].isVerified === 1;
    }
    //email of the user is set
    async setEmail(email){

        await this.deleteVerificationCodes();

        await new Promise((resolve, reject) => {
            const query_str =
                "INSERT " +
                "INTO emailChange (uid,newEmail,date) " +
                "VALUES (" + this.uid + "," + con.escape(email) + ",CURRENT_TIMESTAMP());"
            con.query(query_str,(err,result) => {
               if(err)
                   reject(err);
               if(isEmpty(result))
                   reject(createEmptyError());
               resolve(result);
            });
        });

        const sCode = await generateVerificationCode(verificationCodeTypes.verification,this.uid);

        await sendMail(email,"Chat App: email verification",sCode);
    }
    //all current verificationCodes are deleted
    async deleteVerificationCodes(){
        await new Promise((resolve, reject) => {
            const query_str =
                "DELETE " +
                "FROM verificationcode " +
                "WHERE uid = " + this.uid + ";";
            con.query(query_str,(err) => {
                if(err)
                    reject(err);
                resolve();
            });
        });
    }

    get eventEmitter() {
        return this.#_eventEmitter;
    }

    set eventEmitter(value) {
        this.#_eventEmitter = value;
    }

    get uid() {
        return this.#_uid;
    }

    set uid(value) {
        this.#_uid = value;
    }

    get username() {
        return this.#_username;
    }

    set username(value) {
        this.#_username = value;
    }

    get socket() {
        return this.#_socket;
    }

    set socket(value) {
        this.#_socket = value;
    }

    get chats() {
        return this.#_chats;
    }

    set chats(value) {
        this.#_chats = value;
    }

    get online() {
        return this.#_online;
    }

    set online(online){
        this.#_online = online;
    }

    get currentChat() {
        return this.#_currentChat;
    }

    set currentChat(value) {
        this.#_currentChat = value;
        /*
            unreadMessages at currentChat are set to 0
         */
        if(value) {

            value.setUnreadMessages(this.uid,0);
        }
    }

    get chatsLoaded() {
        return this.#_chatsLoaded;
    }

    set chatsLoaded(value) {
        this.#_chatsLoaded = value;
    }
}