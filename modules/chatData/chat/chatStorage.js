import BinSearchArray from "binsearcharray";
import NormalChat from "./normalChat.js";
import chatData from "../chatData.js";
import {GroupChat} from "./groupChat.js";
import GroupChatMember from "./groupChatMember.js";

export default class ChatStorage{

    #_normal = new BinSearchArray();
    #_group = new BinSearchArray();


    addChat(chat){
        if(chat.type === 'normalChat'){
            this.normal.add(chat.chatId,chat);
        }else if(chat.type === 'groupChat'){
            this.group.add(chat.chatId,chat);
        }
    }

    removeChat(chat){
        if(chat.type === 'normalChat'){
            this.normal.remove(chat.chatId);
        }else if(chat.type === 'groupChat'){
            this.group.remove(chat.chatId);
        }
    }
    /*
        the sum of how many chats are stored is returned
     */
    length(){
        return this.normal.length + this.group.length;
    }
    /*
        value, index , key
     */
    forEach(callback){

        for(let i=0;i<this.normal.length;i++){
            const val = this.normal[i].value;
            callback(val,i,this.normal[i].key,val.type);
        }
        for(let i=0;i<this.group.length;i++){
            const val = this.group[i].value;
            callback(val,i,this.group[i].key,val.type);
        }
    }
    /*
        value, index , key
     */
    forEachGroup(callback){
        for(let i=0;i<this.group.length;i++){
            callback(this.group[i].value,i,this.group[i].key);
        }
    }
    /*
        the requested chat gets returned
            type: the type of the chat
            id: the id of the chat
     */
    getChat(type,id){
        /*
            is the chat a normalchat?
         */
        if(type === 'normalChat'){
            const chat = this.normal.get(id);
            if(chat)
                return chat;
            /*
                is the chat a groupChat?
             */
        }else if(type === 'groupChat'){
            const chat = this.group.get(id);
            if(chat)
                return chat;
        }
        return null;
    }
    /*
        new normalChat is created
     */
    async newNormalChat(user1,user2,message){

        const newChat = new NormalChat(
            -1,
            user1,
            user2
        );
        /*
            chat is saved in the database
         */
        const ncid = await newChat.saveChatInDB();

        chatData.chats.normal.add(ncid,newChat);
        /*
            chats are added to the users
         */
        user1.chats.addChat(ncid,newChat);
        user2.chats.addChat(ncid,newChat);
        /*
            first message gets initialized
         */
        const firstMessage = await newChat.addMessage(user1,message);
        const mid = firstMessage.mid;
        /*
            if the user is online, the data gets sent to it too
         */
        user2.addNewChat(newChat);

        return {
            ncid: ncid,
            mid: mid
        }
    }
    /*
        new groupChat is created
     */
    async newGroupChat(userFrom, data, users){
        /*
            chat is created
         */
        const newChat = new GroupChat(
            -1,
            data.name
            ,data.description,
            data.isPublic
        );
        /*
            chat is saved in the database
         */
        const gcid = await newChat.saveChatInDB();
        /*
            groupChatMembers are created
         */
        const members = new BinSearchArray();
        /*
            groupChatMemberSelf is created
         */
        const gcmSelf = new GroupChatMember(
            -1,
            newChat,
            chatData.user.get(userFrom.uid),
            userFrom.isAdmin,
            0
        );
        await gcmSelf.saveGroupChatMemberInDB();
        members.add(userFrom.uid,gcmSelf);
        /*
            other users are added
         */
        for(let i=0;i<users.length;i++){

            const user = chatData.user.get(users[i].uid);
            const gcm = new GroupChatMember(
                -1,
                newChat,
                user,
                users[i].isAdmin,
                0
            );
            await gcm.saveGroupChatMemberInDB();

            members.add(user.uid,gcm);
        }
        newChat.members = members;
        chatData.chats.group.add(newChat.chatId,newChat);
        /*
            chat gets added to the members
         */
        newChat.forEachUser((user,index,key) => {
            user.addLoadedChat(newChat);
            user.addNewChat(newChat);
        });
    }

    get normal() {
        return this.#_normal;
    }

    set normal(value) {
        this.#_normal = value;
    }

    get group() {
        return this.#_group;
    }

    set group(value) {
        this.#_group = value;
    }
}