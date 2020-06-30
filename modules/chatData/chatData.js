import BinSearchArray from 'binsearcharray';
import CDataChatStorage from "./chat/cDataChatStorage.js";
import User from "./user.js";
import {setChatData} from "./data.js";
import {chatServer} from "../chatServer.js";

class ChatData{

    #_user = new BinSearchArray();
    #_chats = new CDataChatStorage(this.user);
    /*
        the current chat is changed
            user: the user where the currentChat should be changed
            type: the type of the new chat
            id. the id of the new chat
     */
    changeChat(user,type,id){

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
            const newChat = this.chats.getChat(type, id);
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
    async sendMessage(user,data){
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
    async loadMessages(user,type,id,lastMsgId,num){
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
    unloadUser(user){

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
                .then(userInfoNeeded => {
                    if(!userInfoNeeded)
                        /*
                            if userInfo is not needed anywhere anymore, it gets deleted
                         */
                        this.user.remove(user.uid);
                })
                .catch(err => console.log(err));
        }
    }
    /*
        returns if the user is online
     */
    isUserOnline(uid){
        if(this.user.getIndex(uid) === -1) return false;
        return this.user.get(uid).online;
    }
    /*
        new user gets added
     */
    addNewUser(uid,username){
        /*
            does the user already exist?
         */
        if(this.user.getIndex(uid) === -1) {
            const user = new User(uid, username);
            this.user.add(uid,user);
            return user;
        }
    }
    /*
        the socket of a user is initialized
     */
    async initUserSocket(uid,username,socket){
        /*
            if user does not exist -> is created new
         */
        if(this.user.getIndex(uid) === -1) {
            const user = new User(uid, username, socket, true);
            /*
                user is added to array
             */
            this.user.add(user.uid,user);
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
    async newNormalChat(userSelf,uidOther,usernameOther,message){
        /*
            does user already exist in server?
                if not --> gets created
        */
        let otherUser = this.user.get(uidOther);
        if(!otherUser){
            /*
                user gets created
             */
            otherUser = new User(uidOther,usernameOther);
            chatData.user.add(uidOther,otherUser);
        }
        return await this.chats.newNormalChat(userSelf,otherUser,message);
    }
    /*
        a new groupChat is created
     */
    async newGroupChat(userFrom,data,users){
        /*
            not saved users are created
         */
        for(let i=0;i<users.length;i++){

            const user = users[i];
            if(chatData.user.getIndex(user.uid) === -1){

                chatData.user.add(user.uid,new User(user.uid,user.username));
            }
        }
        return await this.chats.newGroupChat(userFrom,data,users);
    }
    /*
        requested chat is returned
     */
    getChat(type,id){
        const chat = this.chats.getChat(type,id);
        if(!chat)
            throw new Error('chat does not exist');
        return chat;
    }
    /*
        requested user is returned
            createNew:
                if true the userdata is requested from the database and saved
                else, an exception is thrown
     */
    async getUser(uid,createNew) {
        let user = this.user.get(uid);
        if (!user) {
            if (createNew) {
                user = await this.loadUser()
            } else {
                throw new Error('user does not exist');
            }
        }
        return user;
    }
    /*
        userdata is loaded, user is saved
     */
    async loadUser(uid){

        return new Promise((resolve, reject) => {

            const query_str =
                "SELECT username " +
                "FROM user " +
                "WHERE uid = " + uid + ";";

            chatServer.con.query(query_str,(err,result,fields) => {
                if(err)
                    reject(err);
                /*
                    user is initialized
                 */
                const user = new User(uid,result[0].username);
                this.user.add(uid,user);
                resolve(user);
            });
        });
    }

    get chats() {
        return this.#_chats;
    }

    set chats(value) {
        this.#_chats = value;
    }

    get user() {
        return this.#_user;
    }

    set user(value) {
        this.#_user = value;
    }
}

const chatData = new ChatData();

setChatData(chatData);

export default chatData;