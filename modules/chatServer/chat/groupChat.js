import {Chat} from "../chat/chat.js";
import {chatServer} from "../chat_server.js";
import BinSearchArray from "../../util/BinSearch.js";

export class GroupChat extends Chat{

    //BinSearchArray
    #_members = new BinSearchArray();
    #_chatName;
    #_description;
    #_isPublic;
    #_socketRoomName;

    constructor(chatId, members, chatName, description, isPublic) {
        super('groupChat',chatId);
        this.members = members;
        this.chatName = chatName;
        this.description = description;
        this.isPublic = isPublic;
    }

    sendMessage(sentBy,msg) {
        super.sendMessage(sentBy,msg);
        //TODO
        /*
            msg gets emitted to all users
         */
    }
    sendToAll(sentBy,type,content){

    }
    isAnyoneOnline(){
        for(let i=0;i<this.users.length;i++){
            if(this.users[i].online)
                return true;
        }
        return false;
    }
    removeUsers(uid){
        for(let i=0;i<this.users.length;i++){
            if(this.users[i].value.uid !== uid) {
                /*
                    wenn keine anderen Chats verhanden, wird user gelöscht
                 */
                if (this.users[i].chats.length <= 1) {
                    chatServer.user.remove(this.users[i].uid);
                }
                /*
                    sonst wird chat entfernt
                 */
                else {
                    this.users[i].removeUnloadedChat(this);
                }
            }
        }
    }
    getChatName(){
        return this.chatName;
    }
    /*
        all members of the chat get returned
     */
    getMemberObject(uid){

        let members = [];

        for(let j=0;j<this.members.length;j++){

            const member = this.members[j].value.user;
            if(!(uid === member.uid))
                members.push({
                    uid: member.uid,
                    username: member.username,
                    isOnline: member.online
                });
        }
        return members;
    }

    get members() {
        return this.#_members;
    }

    set members(value) {
        this.#_members = value;
    }
    get chatName() {
        return this.#_chatName;
    }

    set chatName(value) {
        this.#_chatName = value;
    }

    get description() {
        return this.#_description;
    }

    set description(value) {
        this.#_description = value;
    }

    get isPublic() {
        return this.#_isPublic;
    }

    set isPublic(value) {
        this.#_isPublic = value;
    }

    get socketRoomName() {
        return this.#_socketRoomName;
    }

    set socketRoomName(value) {
        this.#_socketRoomName = value;
    }

}