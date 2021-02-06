import CDataChatStorage from "./chat/cDataChatStorage";
import User from "./user";
import {setChatData} from "./data";
import {pool} from "../app";
import {logger} from "../util/logger";
import {MessageData} from "../models/message";
import {GroupChatData, GroupChatMemberData, NewNormalChatData} from "../models/chat";
import {Chat, chatTypes, getChatType} from "./chat/chat";
import {Socket} from "socket.io";

export class ChatData{

    private _user = new Map<number,User>();
    private _chats = new CDataChatStorage(this);
    /*
        the current chat is changed
            user: the user where the currentChat should be changed
            type: the type of the new chat
            id. the id of the new chat
     */
    changeChat(user:User,type:string,id:number):void {

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
            const newChat = this.chats.getChat(getChatType(type), id);
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
    async sendMessage(user:User,data:MessageData):Promise<number>{
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
    //TODO return type
    async loadMessages(user:User,type:chatTypes,id:number,lastMsgId:number,num:number){
        /*
            does the chat exist?
         */
        const chat = this.chats.getChat(type,id);
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
    async unloadUser(user:User):Promise<void> {

        if(user) {
            /*
                user is not online anymore.
             */
            user.online = false;
            /*
                user and all references are deleted
                + all others who are not needed anymore (chats etc...)
            */
            const userInfoNeeded:boolean = await user.saveAndDeleteChats();

            if(!userInfoNeeded)
                /*
                    if userInfo is not needed anywhere anymore, it gets deleted
                 */
                this.user.delete(user.uid);
        }
    }
    /*
        returns if the user is online
     */
    isUserOnline(uid:number):boolean {
        // is user loaded?
        if(!this.user.has(uid)) return false;
        return this.user.get(uid).online;
    }
    /*
        new user gets added
     */
    addNewUser(uid:number,username:string):User {
        /*
            does the user already exist?
         */
        if(!this.user.has(uid)) {
            const user = new User(uid, username);
            this.user.set(uid,user);
            return user;
        }
    }
    /*
        the socket of a user is initialized
     */
    async initUserSocket(uid:number,username:string,socket:Socket):Promise<User> {
        /*
            if user does not exist -> is created new
         */
        if(!this.user.has(uid)) {
            const user = new User(uid, username,socket,true);
            /*
                user is added to array
             */
            this.user.set(user.uid,user);
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
            const user = this.user.get(uid);
            user.socket = socket;
            user.online = true;
            /*
                chats are loaded
             */
            await user.loadChats();
        }
        return this.user.get(uid);
    }
    /*
         a new normalChat is created
     */
    async newNormalChat(
        userSelf:User,
        uidOther:number,
        usernameOther:string,
        message:MessageData
    ):Promise<NewNormalChatData> {
        /*
            does user already exist in server?
                if not --> gets created
        */
        if(!this.user.has(uidOther)){
            /*
                user gets created
             */
            const otherUser = new User(uidOther,usernameOther);
            this.user.set(uidOther,otherUser);
        }
        const otherUser = this.user.get(uidOther);
        return await this.chats.newNormalChat(userSelf,otherUser,message);
    }
    /*
        a new groupChat is created
     */
    async newGroupChat(
        userFrom:GroupChatMemberData,
        data:GroupChatData,
        users:GroupChatMemberData[]
    ):Promise<number> {
        /*
            not saved users are created
         */
        for(let i=0;i<users.length;i++){

            const user = users[i];
            /*
                if the user does not exist in Map
             */
            if(!this.user.has(user.uid)){
                // user gets created
                const newUser = new User(user.uid,user.username);
                this.user.set(newUser.uid,newUser);
            }
        }
        return await this.chats.newGroupChat(userFrom,data,users);
    }
    /*
        requested chat is returned
     */
    getChat(type:chatTypes,id:number):Chat {
        const chat = this.chats.getChat(type,id);
        if(!chat)
            throw new Error('chat does not exist');
        return chat;
    }
    /*
        requested user is returned, the username is already known
     */
    getUserUsername(uid:number,username:string):User {
        /*
            does the user already exist in the Map?
         */
        if (this.user.has(uid)) {
            return this.user.get(uid);
        }else{
            // user is created
            const newUser =  new User(uid, username);
            this.user.set(uid,newUser);
            return newUser;
        }
    }
    /*
        requested user is returned
            loadUser:
                if true the userdata is requested from the database and saved
                else, an exception is thrown
     */
    async getUser(uid:number,loadUser:boolean):Promise<User> {
        let user = this.user.get(uid);
        if (!user) {
            if (loadUser) {
                //should the name of the user be loaded?
                user = await this.loadUser(uid);
            } else {
                throw new Error('user does not exist');
            }
        }
        return user;
    }
    /*
        get a user by the username and the email address
     */
    async getUserEmail(username:string,email:string):Promise<User> {

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
    async loadUser(uid:number):Promise<User> {

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
                this.user.set(uid,user);
                resolve(user);
            });
        });
    }

    get user(): Map<number,User> {
        return this._user;
    }

    set user(value: Map<number,User>) {
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