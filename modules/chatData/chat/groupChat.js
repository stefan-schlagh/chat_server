import {Chat} from "../chat/chat.js";
import chatData from "../chatData.js";
import BinSearchArray from "binsearcharray";
import {randomString} from "../../util/random.js";

export class GroupChat extends Chat{

    //BinSearchArray - groupChatMembers
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
        this.socketRoomName = randomString(10);

        this.initChat();
    }
    /*
        chat gets initialized
     */
    initChat(){
        /*
            each users socket joins the roo,
         */
        for(let i=0;i<this.members.length;i++){
            const user = this.members[i].value.user;
            if(user.socket){
                user.socket.join(this.socketRoomName);
            }
        }
    }

    sendMessage(sentBy,msg,callback) {
        super.sendMessage(sentBy,msg,msgId => {
            /*
                message is sent to everyone except the author
             */
            callback(msgId);
            this.sendToAll(sentBy,'chat message',msg,msgId);
        });

    }
    sendToAll(sentBy,type,content,mid = -1){
        /*
            msg gets emitted to all users
         */
        const data = {
            type: this.type,
            id: this.chatId,
            uid: sentBy.uid,
            mid: mid,
            content: content
        };
        sentBy.socket.to(this.socketRoomName).emit(type,data);
    }
    /*
        is called:
            loadCHats.js ca. 150
     */
    subscribeToRoom(user){
        if(user.socket !== null)
            user.socket.join(this.socketRoomName);
    }
    leaveRoom(user){
        user.socket.leave(this.socketRoomName);
    }
    isAnyoneOnline(){
        for(let i=0;i<this.members.length;i++){
            if(this.members[i].online)
                return true;
        }
        return false;
    }
    removeUsers(uid){
        for(let i=0;i<this.members.length;i++){

            const member = this.members[i].value.user;
            /*
                if the uid is not the one of the removing user
             */
            if(this.members[i].value.uid !== uid) {
                /*
                    if there are no other chats, the user gets deleted
                 */
                if (member.chats.length() <= 1) {
                    chatData.user.remove(member.uid);
                }
                /*
                    chat is deleted
                 */
                else {
                    member.removeUnloadedChat(this);
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

    forEachUser(callback){
        for(let i=0;i<this.members.length;i++){
            callback(this.members[i].value.user,i,this.members[i].key);
        }
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