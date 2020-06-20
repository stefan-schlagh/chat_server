import BinSearchArray from 'binsearcharray';
import ChatStorage from "../util/chatStorage.js";
import User from "./user.js";

class ChatData{

    #_user = new BinSearchArray();
    #_chats = new ChatStorage();
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

export default chatData;