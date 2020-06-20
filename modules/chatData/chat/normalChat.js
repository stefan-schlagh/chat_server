import {Chat} from "../chat/chat.js";
import {chatServer} from "../../chatServer.js";
import chatData from "../chatData.js";

export default class NormalChat extends Chat{

    //ncid = this.chatId
    #_user1;
    #_user2;
    /*
        the unread messages of each user
     */
    #_unreadMessages1;
    #_unreadMessages2;

    constructor(
        chatId,
        user1,
        user2,
        unreadMessages1 = 0,
        unreadMessages2 = 0
    ) {
        super('normalChat',chatId);
        this.user1 = user1;
        this.user2 = user2;
        this.unreadMessages1 = unreadMessages1;
        this.unreadMessages2 = unreadMessages2;
    }

    async sendMessage(sentBy,data) {
        /*
            message is saved
         */
        const mid = await super.sendMessage(sentBy,data);
        /*
            message gets sent to all users
         */
        this.sendToAll(sentBy,'chat message',data,mid);
        /*
            messageId is returned
         */
        return mid;
    }

    sendToAll(sentBy,type,content,mid = -1){
        const data = {
            type: this.type,
            id: this.chatId,
            uid: sentBy.uid,
            mid: mid,
            content: content
        };
        /*
            es wird der user, der nicht der Sender ist, definiert
         */

        if(this.user1.uid===sentBy.uid){
            /*
                es wird geschaut, ob Socket definiert ist
             */
            if(this.user2.socket != null)
                chatServer.io.to(this.user2.socket.id).emit(type,data);
        }
        else {
            /*
                es wird geschaut, ob Socket definiert ist
             */
            if(this.user1.socket != null)
                chatServer.io.to(this.user1.socket.id).emit(type,data);
        }
    }
    /*
        the number of unread messages in the database is updated
     */
    updateUnreadMessages(){

        const query_str =
            "UPDATE normalchat " +
            "SET unreadMessages1 = " + this.unreadMessages1 + ", " +
            "unreadMessages2 = " + this.unreadMessages2 + " " +
            "WHERE ncid = " + this.chatId + ";";

        chatServer.con.query(query_str,(err) => {
            if(err)
                throw err;
        });
    }
    /*
        unreadMessages of the user with this uid are set
     */
    setUnreadMessages(uid,unreadMessages) {

        if (this.user1.uid === uid)
            this.unreadMessages1 = unreadMessages;

        else if (this.user2.uid === uid)
            this.unreadMessages2 = unreadMessages;

        this.updateUnreadMessages();
    }
    /*
        unreadMessages are incremented at all users
     */
    incrementUnreadMessages(num){
        /*
            is this chat the currentChat of the user?
                --> do nothing
         */
        if(!this.user1.isCurrentChat(this)) {
            this.incrementUnreadMessagesAt(this.user1.uid, num);
        }
        if(!this.user2.isCurrentChat(this)) {
            this.incrementUnreadMessagesAt(this.user2.uid, num);
        }
    }
    /*
        unreadMessages are increment at the user with this uid
     */
    incrementUnreadMessagesAt(uid,num){

        if (this.user1.uid === uid)
            this.unreadMessages1 += num;

        else if (this.user2.uid === uid)
            this.unreadMessages2 += num;

        this.updateUnreadMessages();
    }
    /*
        unread Messages of the user with this uid are returned
     */
    getUnreadMessages(uid){

        if (this.user1.uid === uid)
            return this.unreadMessages1;

        else if (this.user2.uid === uid)
            return this.unreadMessages2;
        else
            return 0;
    }

    isAnyoneOnline(){
        return this.user1.online || this.user2.online;
    }
    removeUsers(uid){
        /*
            es wird der user ermittelt, der nicht die uid hat
         */
        let user;
        if(this.user1.uid === uid)
            user = this.user2;
        else if(this.user2 === uid)
            user = this.user1;
        /*
            wenn keine anderen Chats verhanden, wird user gelöscht
         */
        if(user !== undefined) {
            if (user.chats.length <= 1) {
                chatData.user.remove(user.uid);
            }
            /*
                sonst wird chat entfernt
             */
            else {
                user.removeUnloadedChat(this);
            }
        }
    }
    getChatName(uidSelf){
        if(this.user1.uid === uidSelf){
            return this.user2.username;
        }else{
            return  this.user1.username;
        }
    }
    /*
        all members of the chat get returned
     */
    getMemberObject(uidSelf){

        if(uidSelf === this.user1.uid){
            return [{
                uid : this.user2.uid,
                username: this.user2.username
            }];
        }else{
            return [{
                uid : this.user1.uid,
                username: this.user1.username
            }];
        }
    }

    get user1(){
        return this.#_user1;
    }

    get user2(){
        return this.#_user2;
    }

    set user1(user1){
        this.#_user1 = user1;
    }

    set user2(user2){
        this.#_user2 = user2;
    }

    get unreadMessages1() {
        return this.#_unreadMessages1;
    }

    set unreadMessages1(value) {
        this.#_unreadMessages1 = value;
    }

    get unreadMessages2() {
        return this.#_unreadMessages2;
    }

    set unreadMessages2(value) {
        this.#_unreadMessages2 = value;
    }
}