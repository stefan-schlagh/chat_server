import BinSearchArray from '../util/binsearcharray';
import CDataChatStorage from "./chat/cDataChatStorage";
import User from "./user";
import {setChatData} from "./data";
import {pool} from "../app";
import {logger} from "../util/logger";

class ChatData{

    private _user = new BinSearchArray();
    private _chats = new CDataChatStorage(this._user);
    /*
        the current chat is changed
            user: the user where the currentChat should be changed
            type: the type of the new chat
            id. the id of the new chat
     */
    changeChat(user:any,type:any,id:number){

        /*
            is no chat selected
         */
        if(type === '') {
            /*
                the new chat of the user is set
            */
            user.currentChat = null;
        }
        else {
            const newChat = this._chats.getChat(type, id);
            if (newChat){
                user.currentChat = newChat;
            }else{
                user.currentChat = null;
            }
        }
    }
    /*
        a message is sent
     */
    async sendMessage(user:any,data:any){
        /*
            mid is returned
         */
        return await user.sendMessage(data);
    }
    /*
        messages get loaded
            user: The user where the messages should be loaded
            type: The type of the chat
            id: the id of the chat
            lastMsgId: The id of the message loaded last
            num: The number how many messages should be loaded

            returns: messages
     */
    async loadMessages(user:User,type:string,id:number,lastMsgId:number,num:number){
        /*
            does the chat exist?
         */
        const chat = this._chats.getChat(type,id);
        if(chat)
            /*
                messages in this chat are loaded
             */
            return await chat.getMessages(lastMsgId,num);
        else{
            /*
                chat not found, Promise rejected with error
             */
            throw new Error('chat not found');
        }
    }
    /*
        user is unloaded. this happens when the client disconnects
            user: the user
     */
    unloadUser(user:User){

        if(user) {
            /*
                user is not online anymore.
             */
            user.online = false;
            /*
                user and all references are deleted
                + all others who are not needed anymore (chats etc...)
            */
            user.saveAndDeleteChats()
                .then((userInfoNeeded:boolean) => {
                    if(!userInfoNeeded)
                        /*
                            if userInfo is not needed anywhere anymore, it gets deleted
                         */
                        this._user.remove(user.uid);
                })
                .catch((err:Error) => console.log(err));
        }
    }
    /*
        returns if the user is online
     */
    isUserOnline(uid:number){
        if(this._user.getIndex(uid) === -1) return false;
        return this._user.get(uid).online;
    }
    /*
        new user gets added
     */
    addNewUser(uid:number,username:string){
        /*
            does the user already exist?
         */
        if(this._user.getIndex(uid) === -1) {
            const user = new User(uid, username);
            this._user.add(uid,user);
            return user;
        }
    }
    /*
        the socket of a user is initialized
     */
    async initUserSocket(uid:number,username:string,socket:any){
        /*
            if user does not exist -> is created new
         */
        if(this._user.getIndex(uid) === -1) {
            const user = new User(uid, username, socket, true);
            /*
                user is added to array
             */
            this._user.add(user.uid,user);
            /*
                chats are loaded
             */
            await user.loadChats();
        }
        /*
            if user exists
                socket is saved
                online is set to true
         */
        else{
            const user = this._user.get(uid);
            user.socket = socket;
            user.online = true;
            /*
                chats are loaded
             */
            await user.loadChats();
        }
        return this._user.get(uid);
    }
    /*
         a new normalChat is created
     */
    async newNormalChat(userSelf:any,uidOther:number,usernameOther:string,message:any){
        /*
            does user already exist in server?
                if not --> gets created
        */
        let otherUser = this._user.get(uidOther);
        if(!otherUser){
            /*
                user gets created
             */
            otherUser = new User(uidOther,usernameOther);
            chatData._user.add(uidOther,otherUser);
        }
        return await this._chats.newNormalChat(userSelf,otherUser,message);
    }
    /*
        a new groupChat is created
     */
    async newGroupChat(userFrom:any,data:any,users:any){
        /*
            not saved users are created
         */
        for(let i=0;i<users.length;i++){

            const user = users[i];
            if(chatData._user.getIndex(user.uid) === -1){

                chatData._user.add(user.uid,new User(user.uid,user.username));
            }
        }
        return await this._chats.newGroupChat(userFrom,data,users);
    }
    /*
        requested chat is returned
     */
    getChat(type:any,id:number){
        const chat = this._chats.getChat(type,id);
        if(!chat)
            throw new Error('chat does not exist');
        return chat;
    }
    /*
        requested user is returned
            loadUser:
                if true the userdata is requested from the database and saved
                else, an exception is thrown
     */
    async getUser(uid:number,loadUser:boolean) {
        let user = this._user.get(uid);
        if (!user) {
            if (loadUser) {
                user = await this.loadUser(uid);
            } else {
                throw new Error('user does not exist');
            }
        }
        return user;
    }
    async getUserEmail(username:string,email:string){

        const result:any = await new Promise((resolve, reject) => {

            const query_str =
                "SELECT * " +
                "FROM user WHERE username = " + pool.escape(username) + ";";
            logger.verbose('SQL: %s',query_str);

            pool.query(query_str,(err:Error,result:any) => {
                if(err)
                   reject(err)
                if(!result || result.length === 0)
                    reject(new Error("result is not defined!"))
                resolve(result);
            });
        });
        /*
            is email equal with the email in the database?
         */
        if(result[0].email !== email)
            throw new Error("wrong email!")
        else
            return await this.getUser(result[0].uid,true);
    }
    /*
        userdata is loaded, user is saved
     */
    async loadUser(uid:number){

        return new Promise((resolve, reject) => {

            const query_str =
                "SELECT username " +
                "FROM user " +
                "WHERE uid = " + uid + ";";
            logger.verbose('SQL: %s',query_str);

            pool.query(query_str,(err:Error,result:any,fields:any) => {
                if(err)
                    reject(err);
                /*
                    user is initialized
                 */
                const user = new User(uid,result[0].username);
                this._user.add(uid,user);
                resolve(user);
            });
        });
    }

    get user(): BinSearchArray {
        return this._user;
    }

    set user(value: BinSearchArray) {
        this._user = value;
    }

    get chats(): CDataChatStorage {
        return this._chats;
    }

    set chats(value: CDataChatStorage) {
        this._chats = value;
    }
}

const chatData = new ChatData();

setChatData(chatData);

export default chatData;