import {Chat} from "./chat";
import {chatServer} from "../../chatServer";
import chatData from "../chatData";

export default class NormalChat extends Chat{

    // TODO
    private _user1:any;
    private _user2:any;
    /*
        the unread messages of each user
     */
    private _unreadMessages1:number;
    private _unreadMessages2:number;

    constructor(
        chatId:number = -1,
        user1:any,
        user2:any,
        unreadMessages1:number = 0,
        unreadMessages2:number = 0
    ) {
        super('normalChat',chatId);
        this._user1 = user1;
        this._user2 = user2;
        this._unreadMessages1 = unreadMessages1;
        this._unreadMessages2 = unreadMessages2;
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
                    this._user1.uid + "','" +
                    this._user2.uid +
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

        if(this._user1.uid===sentBy.uid){
            /*
                es wird geschaut, ob Socket definiert ist
             */
            if(this._user2.socket != null)
                chatServer.io.to(this._user2.socket.id).emit(emitName,data);
        }
        else {
            /*
                es wird geschaut, ob Socket definiert ist
             */
            if(this._user1.socket != null)
                chatServer.io.to(this._user1.socket.id).emit(emitName,data);
        }
    }
    /*
        the number of unread messages in the database is updated
     */
    updateUnreadMessages(){

        const query_str =
            "UPDATE normalchat " +
            "SET unreadMessages1 = " + this._unreadMessages1 + ", " +
            "unreadMessages2 = " + this._unreadMessages2 + " " +
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

        if (this._user1.uid === uid)
            this._unreadMessages1 = unreadMessages;

        else if (this._user2.uid === uid)
            this._unreadMessages2 = unreadMessages;

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
        if(!this._user1.isCurrentChat(this)) {
            this.incrementUnreadMessagesAt(this._user1.uid, num);
        }
        if(!this._user2.isCurrentChat(this)) {
            this.incrementUnreadMessagesAt(this._user2.uid, num);
        }
    }
    /*
        unreadMessages are increment at the user with this uid
     */
    incrementUnreadMessagesAt(uid:number,num:number){

        if (this._user1.uid === uid)
            this._unreadMessages1 += num;

        else if (this._user2.uid === uid)
            this._unreadMessages2 += num;

        this.updateUnreadMessages();
    }
    /*
        unread Messages of the user with this uid are returned
     */
    getUnreadMessages(uid:number){

        if (this._user1.uid === uid)
            return this._unreadMessages1;

        else if (this._user2.uid === uid)
            return this._unreadMessages2;
        else
            return 0;
    }

    isAnyoneOnline(){
        return this._user1.online || this._user2.online;
    }
    removeUsers(uid:number){
        /*
            es wird der user ermittelt, der nicht die uid hat
         */
        let user;
        if(this._user1.uid === uid)
            user = this._user2;
        else if(this._user2 === uid)
            user = this._user1;
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
        if(this._user1.uid === uidSelf){
            return this._user2.username;
        }else{
            return  this._user1.username;
        }
    }
    /*
        all members of the chat get returned
     */
    getMemberObject(uidSelf:number) {

        if (uidSelf === this._user1.uid) {
            return [{
                uid: this._user2.uid,
                username: this._user2.username
            }];
        } else {
            return [{
                uid: this._user1.uid,
                username: this._user1.username
            }];
        }
    }

    get user1(): any {
        return this._user1;
    }

    set user1(value: any) {
        this._user1 = value;
    }

    get user2(): any {
        return this._user2;
    }

    set user2(value: any) {
        this._user2 = value;
    }

    get unreadMessages1(): number {
        return this._unreadMessages1;
    }

    set unreadMessages1(value: number) {
        this._unreadMessages1 = value;
    }

    get unreadMessages2(): number {
        return this._unreadMessages2;
    }

    set unreadMessages2(value: number) {
        this._unreadMessages2 = value;
    }
}