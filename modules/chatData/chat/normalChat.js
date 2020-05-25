import {Chat} from "../chat/chat.js";
import {chatServer} from "../chat_server.js";

export default class NormalChat extends Chat{

    #_user1;
    #_user2;

    constructor(chatId,user1,user2) {
        super('normalChat',chatId);
        this.user1 = user1;
        this.user2 = user2;
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

    sendMessage(sentBy,msg,callback) {
        super.sendMessage(sentBy,msg,msgId => {
            /*
                Nachricht wird an den user geschickt, der nicht der Author ist
                callback wird mit msgId aufgerufen
                chatID, msgId und content wird mitgeliefert
            */
            callback(msgId);
            this.sendToAll(sentBy,'chat message',msg,msgId);
        });
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
                chatServer.user.remove(user.uid);
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
                username: this.user2.username,
                isOnline: this.user2.online
            }];
        }else{
            return [{
                uid : this.user1.uid,
                username: this.user1.username,
                isOnline: this.user1.online
            }];
        }
    }
}