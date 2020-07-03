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

    }
    /*
        subscribeUsersToSocket
     */
    subscribeUsersToSocket(){
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

        return await new Promise((resolve,reject) => {

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
        member is added to groupChat by admin
     */
    async addMember(memberFrom,otherUser){
        /*
            groupChatMember is created
         */
        const groupChatMember =
            new GroupChatMember(
                -1,
                this,
                otherUser,
                false,
                0
            );
        /*
            groupChatMember is saved in the database
         */
        await groupChatMember.saveGroupChatMemberInDB();
        /*
            member is added at chat
         */
        this.members.add(otherUser.uid,groupChatMember);
        /*
            chat is sent to user
        */
        otherUser.addNewChat(this);
        /*
            statusMessage is added
         */
        const message = await this.addStatusMessage(
            statusMessageTypes.usersAdded,
            memberFrom.user,
            [otherUser.uid]
        );
        /*
            message is sent
         */
        this.sendMessage(
            memberFrom.user,
            message,
            true
        );
        /*
            member is subscribed to socket
         */
        this.subscribeToRoom(otherUser);
    }
    /*
        multiple members are added to the chat
     */
    async addMembers(memberFrom,users){

        const members = new Array(users.length);
        const uids = new Array(users.length);

        for(let i=0;i<users.length;i++){

            const user = users[i];
            /*
                groupChatMember is created
             */
            const groupChatMember =
                new GroupChatMember(
                    -1,
                    this,
                    user,
                    false,
                    0
                );
            /*
                groupChatMember is saved in the database
             */
            await groupChatMember.saveGroupChatMemberInDB();
            /*
                member is added at chat
             */
            this.members.add(user.uid,groupChatMember);
            /*
                chat is sent to user
            */
            user.addNewChat(this);
            /*
                infos at the array index is set
             */
            members[i] = groupChatMember;
            uids[i] = user.uid;
        }
        /*
            statusMessage is added
         */
        const message = await this.addStatusMessage(
            statusMessageTypes.usersAdded,
            memberFrom.user,
            uids
        );
        /*
            message is sent
         */
        this.sendMessage(
            memberFrom.user,
            message,
            true
        );
    }
    /*
        member is removed from groupChat by admin
     */
    async removeMember(memberFrom,memberOther){
        /*
            member is removed from DB
         */
        await memberOther.deleteGroupChatMember();
        /*
            member is removed from groupChat
         */
        this.members.remove(memberOther.user.uid);
        /*
            statusMessage is added
         */
        const message = await this.addStatusMessage(
            statusMessageTypes.usersRemoved,
            memberFrom.user,
            [memberOther.user.uid]
        );
        /*
            message is sent
         */
        await this.sendMessage(
            memberFrom.user,
            message,
            true
        );
        /*
            socket room is left
         */
        this.leaveRoom(memberOther.user);

        return {
            mid: message.mid
        }
    }
    /*
        member joins chat --> only when public
     */
    async joinChat(user){
        /*
            groupChatMember is created
         */
        const groupChatMember =
            new GroupChatMember(
                -1,
                this,
                user,
                false,
                0
            );
        /*
            groupChatMember is saved in the database
         */
        await groupChatMember.saveGroupChatMemberInDB();
        /*
            member is added at chat
         */
        this.members.add(user.uid,groupChatMember);
        /*
            statusMessage is added
         */
        const message = await this.addStatusMessage(
            statusMessageTypes.usersJoined,
            user,
            []
        );
        /*
            message is sent
         */
        this.sendMessage(
            user,
            message
        );
        /*
            member is subscribed to socket
         */
        this.subscribeToRoom(user);
    }
    /*
        chat is left by the user
     */
    async leaveChat(member){
        /*
            member is removed from DB
         */
        await member.deleteGroupChatMember();
        /*
            member is removed from groupChat
         */
        this.members.remove(member.user.uid);
        /*
            statusMessage is added
         */
        const message = await this.addStatusMessage(
            statusMessageTypes.usersLeft,
            member.user,
            []
        );
        /*
            message is sent
         */
        this.sendMessage(
            member.user,
            message,
            true
        );
        /*
            socket room is left
         */
        this.leaveRoom(member.user);
    }
    /*
        statusMessage is addedd
            passiveUsers: uids
     */
    async addStatusMessage(type,userFrom,passiveUsers){

        const message = new StatusMessage(this,userFrom);

        await message.initNewMessage(
            type,
            passiveUsers
        );
        /*
            message is added to messageStorage
         */
        this.messageStorage.addNewMessage(message);

        return message;
    }
    /*
        requested member is returned
     */
    getMember(uid){
        const member = this.members.get(uid);
        if(!member)
            /*
                member is not in this chat
             */
            throw new Error('member does not exist');
        if(!member.isStillMember)
            /*
                member is not in the chat anymore
             */
            throw new Error('member not in chat anymore');
        return member;
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
            this.getMemberUids(createdBy.uid)
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
    getMemberUids(uidC){

        const uids = new Array(this.members.length - 1);

        for(let i=0;i<this.members.length;i++){
            const uid = this.members[i].key;
            if(uid !== uidC)
                uids[i] = uid;
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
            const isStillMember = userChatDB.isStillMember === 1;
            /*
                does user already exist?
             */
            if (chatData.user.getIndex(userChatDB.uid) === -1) {
                /*
                    new user gets created
                 */
                const newUser = new User(
                    userChatDB.uid,
                    userChatDB.username
                );
                chatData.user.add(newUser.uid, newUser);
            }

            const newUser = chatData.user.get(userChatDB.uid);
            const groupChatMember =
                new GroupChatMember(
                    userChatDB.gcmid,
                    this,
                    newUser,
                    isAdmin,
                    unreadMessages,
                    isStillMember
                );
            this.members.add(
                newUser.uid,
                groupChatMember
            );
        }
        /*
            chat gets added to the members
         */
        for (let j = 0; j < this.members.length; j++) {

            const member = this.members[j].value;
            /*
                is the member still member?
             */
            if(member.isStillMember)
                member.user.addLoadedChat(this);
        }
        /*
            users are subscribed to socket
         */
        this.subscribeUsersToSocket();
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
                "gcm.unreadMessages, " +
                "gcm.isStillMember " +
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
    sendToAll(sentBy,emitName,rest,includeSender=false){
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
        if(includeSender)
            chatServer.io.to(this.socketRoomName).emit(emitName,data);
        else
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
        if(user.socket !== null)
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
            minified: show only the most important information
     */
    getMemberObject(uid,minified = true){

        let members = [];

        for(let j=0;j<this.members.length;j++) {

            if (minified) {

                const member = this.members[j].value.user;
                if (!(uid === member.uid)) {
                    members.push({
                        uid: member.uid,
                        username: member.username
                    });
                }
            }else{
                const member = this.members[j].value;
                if(member.isStillMember)
                    members.push({
                        uid: member.user.uid,
                        username: member.user.username,
                        isAdmin: member.isAdmin,
                        gcmid: member.gcmid
                    });
            }
        }
        return members;
    }

    forEachUser(callback){
        for(let i=0;i<this.members.length;i++){
            callback(this.members[i].value.user,i,this.members[i].key);
        }
    }
    /*
        groupChatInfo is returned
     */
    getGroupChatInfo(memberSelf){
        return({
            type: this.type,
            id: this.chatId,
            chatName: this.chatName,
            description: this.description,
            public: this.isPublic,
            memberSelf: {
                isAdmin: memberSelf.isAdmin
            },
            members: this.getMemberObject(-1,false),
        });
    }
    /*
        the number of admins in this chat is returned
     */
    getAdminCount(){

        let counter = 0;

        for(let i=0;i<this.members.length;i++){
            if(this.members[i].value.isAdmin)
                counter ++;
        }

        return counter;
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