import BinSearchArray from "../../util/binsearcharray";
import {Chat} from "./chat";
import chatData from "../chatData";
import {randomString} from "../../util/random";
import {chatServer} from "../../chatServer";
import User from "../user";
import GroupChatMember from "./groupChatMember";
import StatusMessage,{statusMessageTypes} from "../message/statusMessage";
import {logger} from "../../util/logger";

export class GroupChat extends Chat{

    //BinSearchArray - groupChatMembers
    private _members:BinSearchArray = new BinSearchArray();
    private _chatName:string;
    private _description:string;
    private _isPublic:boolean;
    private _socketRoomName:string;

    constructor(chatId:number = -1, chatName:string, description:string, isPublic:boolean) {
        super('groupChat',chatId);
        this._chatName = chatName;
        this._description = description;
        this._isPublic = isPublic;
        this._socketRoomName = randomString(10);

    }
    /*
        subscribeUsersToSocket
     */
    subscribeUsersToSocket(){
        /*
            each users socket joins the roo,
         */
        for(let i=0; i<this.members.length; i++){
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
            const isPublic = this.isPublic ? 1 : 0;

            const query_str1 =
                "INSERT " +
                "INTO groupchat (name,description,isPublic) " +
                "VALUES (" +
                    con.escape(this.chatName) + "," +
                    con.escape(this.description) + "," +
                    isPublic +
                ")";
            logger.verbose('SQL: %s',query_str1);

            con.query(query_str1,(err:Error) => {
                /*
                    if no error has occured, the chatID gets requested
                 */
                if(err) {
                    reject(err);
                }else{

                    const query_str2 =
                        "SELECT max(gcid) AS 'gcid' " +
                        "FROM groupchat;";
                    logger.verbose('SQL: %s',query_str2);

                    con.query(query_str2,(err:Error,result:any,fields:any) => {

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
        member is added to chat
     */
    async addGroupChatMember(user:User){
        /*
            is there already a groupChatMember for this user?
         */
        const groupChatMember = this.members.get(user.uid);
        /*
            if defined --> isStillMember is updated
         */
        if(groupChatMember){

            await groupChatMember.undoDelete();
        }else {
            /*
                else --> new groupChatMember is created
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
            this.members.add(user.uid, groupChatMember);
        }
        /*
            chat is sent to user
        */
        user.addNewChat(this);
        /*
            member is subscribed to socket
         */
        this.subscribeToRoom(user);

        return groupChatMember;
    }
    /*
        member is added to groupChat by admin
     */
    async addMember(memberFrom:any,otherUser:any){

        await this.addGroupChatMember(otherUser);
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
        await this.sendMessage(
            memberFrom.user,
            message,
            true
        );
    }
    /*
        multiple members are added to the chat
     */
    async addMembers(memberFrom:any,users:any){

        const members = new Array(users.length);
        const uids = new Array(users.length);

        for(let i=0;i<users.length;i++){

            const user = users[i];

            const groupChatMember = await this.addGroupChatMember(user);
            /*
                infos at the array index is set
             */
            uids[i] = user.uid;
            members[i] = groupChatMember;
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
        await this.sendMessage(
            memberFrom.user,
            message,
            true
        );
    }
    /*
        member is removed from groupChat by admin
     */
    async removeMember(memberFrom:any,memberOther:any){
        /*
            member is removed from DB
         */
        await memberOther.deleteGroupChatMember();
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
    async joinChat(user:any){

        await this.addGroupChatMember(user);
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
        await this.sendMessage(
            user,
            message
        );
    }
    /*
        chat is left by the user
     */
    async leaveChat(member:any){
        /*
            member is removed from DB
         */
        await member.deleteGroupChatMember();
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
        await this.sendMessage(
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
    async addStatusMessage(type:any,userFrom:any,passiveUsers:any){

        const message = new StatusMessage(this,userFrom);

        await message.initNewMessage({
            type: type,
            passiveUsers: passiveUsers
        });
        /*
            message is added to messageStorage
         */
        this.messageStorage.addNewMessage(message);

        return message;
    }
    /*
        requested member is returned
     */
    getMember(uid:number){
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
    async createStatusMessagesStart(createdBy:any){

        const chatCreated =
            new StatusMessage(this,createdBy);

        await chatCreated.initNewMessage({
            type: statusMessageTypes.chatCreated,
            passiveUsers: []
        });

        const usersAdded =
            new StatusMessage(this,createdBy);

        await usersAdded.initNewMessage({
            type: statusMessageTypes.usersAdded,
            passiveUsers: this.getMemberUids(createdBy.uid)
        });
        /*
            messages are added to messageStorage
         */
        this.messageStorage.addNewMessage(chatCreated);
        this.messageStorage.addNewMessage(usersAdded);
    }
    /*
        all uids of the groupChatMembers are returned
     */
    getMemberUids(uidC:number):number[]{

        const uids = new Array(this.members.length - 1);

        for(let i=0; i<this.members.length; i++){
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

        const usersChatDB:any = await this.selectGroupChatMembers();
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
            this._members.add(
                newUser.uid,
                groupChatMember
            );
        }
        /*
            chat gets added to the members
         */
        for (let j = 0; j < this._members.length; j++) {

            const member = this._members[j].value;
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
            logger.verbose('SQL: %s',query_str);

            con.query(query_str,(err:Error,result:any,fields:any) => {
                if(err)
                    reject(err);
                resolve(result);
            });
        });
    }
    /*
        unreadMessages of the user with this uid are set
     */
    async setUnreadMessages(uid:number,unreadMessages:number):Promise<void>{
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
    async incrementUnreadMessages(num:number):Promise<void>{

        for(let i=0; i<this.members.length; i++){

            await this.members[i].value.incrementUnreadMessages(num);
        }
    }
    /*
        unreadMessages are increment at the user with this uid
     */
    async incrementUnreadMessagesAt(uid:number,num:number){
        /*
            is the groupChatMember defined?
         */
        const groupChatMember = this.members.get(uid);

        if(groupChatMember) {
            await groupChatMember.incrementUnreadMessages(num);
        }
    }
    /*
        unread Messages of the user with this uid are returned
     */
    getUnreadMessages(uid:number){
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
    sendToAll(sentBy:any,emitName:any,rest:any,includeSender:boolean = false){
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
    subscribeToRoom(user:any){
        if(user.socket !== null)
            user.socket.join(this.socketRoomName);
    }

    leaveRoom(user:any){
        if(user.socket !== null)
            user.socket.leave(this.socketRoomName);
    }
    isAnyoneOnline(){
        for(let i=0; i<this.members.length; i++){
            if(this.members[i].online)
                return true;
        }
        return false;
    }
    removeUsers(uid:number){
        for(let i=0; i<this.members.length; i++){

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
    getMemberObject(uid:number,minified = true){

        let members = [];

        for(let j=0; j<this.members.length; j++) {

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

    forEachUser(callback:any){
        for(let i=0; i<this.members.length; i++){
            callback(this._members[i].value.user,i,this.members[i].key);
        }
    }
    /*
        groupChatInfo is returned
     */
    getGroupChatInfo(memberSelf:any){
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

        for(let i=0; i<this.members.length; i++){
            if(this.members[i].value.isAdmin)
                counter ++;
        }

        return counter;
    }
    /*
        info is updated in the database:
            chatName
            description
            isPublic
     */
    async update(){

        await new Promise((resolve,reject) => {

            const con = chatServer.con;
            const isPublic = this.isPublic ? 1 : 0;

            const query_str1 =
                "UPDATE groupchat " +
                "SET name = " + con.escape(this.chatName) + ", " +
                "description = " + con.escape(this.description) + ", " +
                "isPublic = " + isPublic + " " +
                "WHERE gcid = " + this.chatId;
            logger.verbose('SQL: %s',query_str1);

            con.query(query_str1,(err:Error) => {
                /*
                    if no error has occured, the chatID gets requested
                 */
                if(err)
                    reject(err);
                else
                    resolve();
            });
        });

        //TODO: emit via socket
    }

    get members(): BinSearchArray {
        return this._members;
    }

    set members(value: BinSearchArray) {
        this._members = value;
    }

    get chatName(): string {
        return this._chatName;
    }

    set chatName(value: string) {
        this._chatName = value;
    }

    get description(): string {
        return this._description;
    }

    set description(value: string) {
        this._description = value;
    }

    get isPublic(): boolean {
        return this._isPublic;
    }

    set isPublic(value: boolean) {
        this._isPublic = value;
    }

    get socketRoomName(): string {
        return this._socketRoomName;
    }

    set socketRoomName(value: string) {
        this._socketRoomName = value;
    }
}