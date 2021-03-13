import CDataChatStorage from "./chat/cDataChatStorage";
import User from "./user";
import {setChatData} from "./data";
import {LoadedMessages, MessageDataIn} from "../models/message";
import {GroupChatData, GroupChatMemberData, NewNormalChatData} from "../models/chat";
import {Chat, chatTypes, getChatType} from "./chat/chat";
import {Socket} from "socket.io";
import {SimpleUser} from "../models/user";
import {getSimpleUserInfo, getUserEmail} from "../database/user/user";

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
    async sendMessage(user:User,data:MessageDataIn):Promise<number>{
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
    async loadMessages(
        user:User,
        type:chatTypes,
        id:number,
        lastMsgId:number,
        num:number
    ):Promise<LoadedMessages> {
        /*
            does the chat exist?
         */
        const chat = this.chats.getChat(type,id);
        if(chat)
            /*
                messages in this chat are loaded
             */
            return await chat.getMessages(lastMsgId,num,user);
        else{
            /*
                chat not found,
                    if chats not loaded --> load chats of user
             */
            if(!user.chatsLoaded){
                const chatsLoadingBefore = user.chatsLoading;
                let messages:LoadedMessages;
                await user.loadChatsIfNotLoaded();
                const chat = this.chats.getChat(type,id);
                if(chat)
                    messages = await chat.getMessages(lastMsgId,num,user);
                else
                    throw new Error('chat not found');
                if(!chatsLoadingBefore)
                    await user.saveAndDeleteChats();
                return messages;
            }else{
                throw new Error('chat not found');
            }
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
        message:MessageDataIn
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
                if(user === null)
                    //if user does not exist, throw error
                    throw new Error('user does not exist');
            } else {
                throw new Error('user does not exist in storage');
            }
        }
        return user;
    }
    /*
        get a user by the username and the email address
        returns null, if user not found
     */
    async getUserEmail(username:string,email:string):Promise<User> {
        /*
            select user
         */
        const userData:SimpleUser = await getUserEmail(username,email);
        if(userData === null)
            return null;
        else {
            let user:User = this.user.get(userData.uid);
            if (!user) {
                // create user object, set at map
                user = new User(userData.uid,userData.username);
                this.user.set(userData.uid, user);
                // return new user
                return user;
            }
            return user;
        }
    }
    /*
        userdata is loaded, user is saved
     */
    async loadUser(uid:number):Promise<User> {

        const userData:SimpleUser = await getSimpleUserInfo(uid);
        //if not exactly 1 user found, return null --> error
        if(userData === null)
            return null
        else {
            const user = new User(userData.uid,userData.username);
            this.user.set(uid, user);
            // return new user
            return user;
        }
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