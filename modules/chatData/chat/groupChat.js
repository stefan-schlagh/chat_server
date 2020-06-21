import {Chat} from "./chat.js";
import chatData from "../chatData.js";
import BinSearchArray from "binsearcharray";
import {randomString} from "../../util/random.js";
import {chatServer} from "../../chatServer.js";
import User from "../user.js";
import GroupChatMember from "./groupChatMember.js";
import StatusMessage,{statusMessageTypes} from "../message/statusMessage.js";

export class GroupChat extends Chat{

    //BinSearchArray - groupChatMembers
    #_members = new BinSearchArray();
    #_chatName;
    #_description;
    #_isPublic;
    #_socketRoomName;

    constructor(chatId = -1, chatName, description, isPublic) {
        super('groupChat',chatId);
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
    /*
        chat is saved in the database
     */
    async saveChatInDB(){

        return new Promise((resolve,reject) => {

            const con = chatServer.con;
            const query_str1 =
                "INSERT " +
                "INTO groupchat (name,description,isPublic) " +
                "VALUES (" +
                    con.escape(this.chatName) + "," +
                    con.escape(this.description) + "," +
                    con.escape(this.isPublic) +
                ")";

            con.query(query_str1,(err) => {
                /*
                    if no error has occured, the chatID gets requested
                 */
                if(err) {
                    reject(err);
                }else{

                    const query_str2 =
                        "SELECT max(gcid) AS 'gcid' " +
                        "FROM groupchat;";

                    con.query(query_str2,(err,result,fields) => {

                        if(err){
                            reject(err);
                        }else{
                            this.chatId = result[0].gcid;
                            resolve(this.chatId);
                        }
                    });
                }
            });
        });
    }
    /*
        status messages at the start of the chat are created
            createdBy: the user who created the chat
     */
    async createStatusMessagesStart(createdBy){

        const chatCreated =
            new StatusMessage(this,createdBy);

        await chatCreated.initNewMessage(
            statusMessageTypes.chatCreated,
            []
        );

        const usersAdded =
            new StatusMessage(this,createdBy);

        await usersAdded.initNewMessage(
            statusMessageTypes.usersAdded,
            this.getMemberUids()
        );
        /*
            messages are added to messageStorage
         */
        this.messageStorage.addNewMessage(chatCreated);
        this.messageStorage.addNewMessage(usersAdded);
    }
    /*
        all uids of the groupChatMembers are returned
     */
    getMemberUids(){

        const uids = new Array(this.members.length);

        for(let i=0;i<this.members.length;i++){
            uids[i] = this.members[i].key;
        }
        return uids;
    }
    /*
        all members of this chat are loaded
     */
    async loadGroupChatMembers(){

        const usersChatDB = await this.selectGroupChatMembers();
        this.members = new BinSearchArray();
        /*
            loop through users, if not exists --> gets created
         */
        for (let j = 0; j < usersChatDB.length; j++) {

            const userChatDB = usersChatDB[j];
            const isAdmin = userChatDB.isAdmin === 1;
            const unreadMessages = userChatDB.unreadMessages;
            /*
                does user already exist?
             */
            if (chatData.user.getIndex(userChatDB.uid) === -1) {
                /*
                    new user gets created
                 */
                const newUser = new User(userChatDB.uid, userChatDB.username);
                chatData.user.add(newUser.uid, newUser);
            }

            const newUser = chatData.user.get(userChatDB.uid);
            const groupChatMember =
                new GroupChatMember(
                    userChatDB.gcmid,
                    this,
                    newUser,
                    isAdmin,
                    unreadMessages
                );
            this.members.add(newUser.uid, groupChatMember);
        }
        /*
            chat gets added to the members
         */
        for (let j = 0; j < this.members.length; j++) {
            this.members[j].value.user.addLoadedChat(this);
        }
    }
    /*
        groupChatMembers are selected
     */
    async selectGroupChatMembers(){

        return new Promise((resolve, reject) => {

            const con = chatServer.con;
            const query_str =
                "SELECT u.uid, " +
                "u.username, " +
                "gcm.isAdmin, " +
                "gcm.gcmid, " +
                "gcm.unreadMessages " +
                "FROM user u " +
                "JOIN groupchatmember gcm " +
                "ON u.uid = gcm.uid " +
                "WHERE gcm.gcid = '" + this.chatId + "';";

            con.query(query_str,(err,result,fields) => {
                if(err)
                    reject(err);
                resolve(result);
            });
        });
    }
    /*
        unreadMessages of the user with this uid are set
     */
    setUnreadMessages(uid,unreadMessages){
        /*
            is the groupChatMember defined?
         */
        const groupChatMember = this.members.get(uid);

        if(groupChatMember)
            groupChatMember.setUnreadMessages(unreadMessages);

    }
    /*
        unreadMessages are incremented at all users
     */
    incrementUnreadMessages(num){

        for(let i=0;i<this.members.length;i++){

            this.members[i].value.incrementUnreadMessages(num);
        }
    }
    /*
        unreadMessages are increment at the user with this uid
     */
    incrementUnreadMessagesAt(uid,num){
        /*
            is the groupChatMember defined?
         */
        const groupChatMember = this.members.get(uid);

        if(groupChatMember) {
            groupChatMember.incrementUnreadMessages(num);
        }
    }
    /*
        unread Messages of the user with this uid are returned
     */
    getUnreadMessages(uid){
        /*
            is the groupChatMember defined?
         */
        const groupChatMember = this.members.get(uid);

        if(groupChatMember) {
            return groupChatMember.unreadMessages;
        }
        return 0;
    }
    /*
        event is emitted to all participants of the chat
     */
    sendToAll(sentBy,emitName,rest){
        /*
            msg gets emitted to all users
         */
        const data = {
            chat: {
                type: this.type,
                id: this.chatId
            },
            ...rest
        };
        sentBy.socket.to(this.socketRoomName).emit(emitName,data);
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
                    username: member.username
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