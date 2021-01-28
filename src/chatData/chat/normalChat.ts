import {Chat} from "./chat";
import {chatServer} from "../../chatServer";
import chatData from "../chatData";

export default class NormalChat extends Chat{

    //ncid = this.chatId
    public user1:any;
    public user2:any;
    /*
        the unread messages of each user
     */
    public unreadMessages1:any;
    public unreadMessages2:any;

    constructor(
        chatId:number = -1,
        user1:any,
        user2:any,
        unreadMessages1:number = 0,
        unreadMessages2:number = 0
    ) {
        super('normalChat',chatId);
        this.user1 = user1;
        this.user2 = user2;
        this.unreadMessages1 = unreadMessages1;
        this.unreadMessages2 = unreadMessages2;
    }
    /*
        chat is saved in the database
     */
    async saveChatInDB(){

        return new Promise((resolve,reject) => {

            const query_str1 =
                "INSERT " +
                "INTO normalchat(uid1,uid2)" +
                "VALUES('" +
                    this.user1.uid + "','" +
                    this.user2.uid +
                "');";

            chatServer.con.query(query_str1,(err:Error) => {
                /*
                    if no error has occured, the chatID gets requested
                 */
                if(err) {
                    reject(err);
                }else{

                    const query_str2 =
                        "SELECT max(ncid) AS 'ncid' " +
                        "FROM normalchat;";

                    chatServer.con.query(query_str2,(err:Error,result:any,fields:any) => {

                        if(err){
                            reject(err);
                        }else{
                            this.chatId = result[0].ncid;
                            resolve(this.chatId);
                        }
                    });
                }
            })
        });
    }
    /*
        event is emitted to all participants of the chat
     */
    sendToAll(sentBy:any,emitName:any,rest:any){
        const data = {
            chat: {
                type: this.type,
                id: this.chatId,
            },
            uid: sentBy.uid,
            ...rest
        };
        /*
            es wird der user, der nicht der Sender ist, definiert
         */

        if(this.user1.uid===sentBy.uid){
            /*
                es wird geschaut, ob Socket definiert ist
             */
            if(this.user2.socket != null)
                chatServer.io.to(this.user2.socket.id).emit(emitName,data);
        }
        else {
            /*
                es wird geschaut, ob Socket definiert ist
             */
            if(this.user1.socket != null)
                chatServer.io.to(this.user1.socket.id).emit(emitName,data);
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

        chatServer.con.query(query_str,(err:Error) => {
            if(err)
                throw err;
        });
    }
    /*
        unreadMessages of the user with this uid are set
     */
    setUnreadMessages(uid:number,unreadMessages:any) {

        if (this.user1.uid === uid)
            this.unreadMessages1 = unreadMessages;

        else if (this.user2.uid === uid)
            this.unreadMessages2 = unreadMessages;

        this.updateUnreadMessages();
    }
    /*
        unreadMessages are incremented at all users
     */
    incrementUnreadMessages(num:number){
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
    incrementUnreadMessagesAt(uid:number,num:number){

        if (this.user1.uid === uid)
            this.unreadMessages1 += num;

        else if (this.user2.uid === uid)
            this.unreadMessages2 += num;

        this.updateUnreadMessages();
    }
    /*
        unread Messages of the user with this uid are returned
     */
    getUnreadMessages(uid:number){

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
    removeUsers(uid:number){
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
    getChatName(uidSelf:number){
        if(this.user1.uid === uidSelf){
            return this.user2.username;
        }else{
            return  this.user1.username;
        }
    }
    /*
        all members of the chat get returned
     */
    getMemberObject(uidSelf:number){

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
/*
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
    }*/
}