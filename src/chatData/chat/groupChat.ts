import {Chat, chatTypes} from "./chat";
import chatData from "../chatData";
import {randomString} from "../../util/random";
import {socketServer} from "../../socketServer";
import User from "../user";
import GroupChatMember from "./groupChatMember";
import StatusMessage from "../message/statusMessage";
import {logger} from "../../util/logger";
import {SimpleUser} from "../../models/user";
import {GroupChatInfo, GroupChatMemberDataAll} from "../../models/chat";
import {statusMessageTypes} from "../../models/message";
import {selectGroupChatMembers,GroupChatMemberDB} from "../../database/chat/groupChatMember";
import {NotificationTypes, sendNotification} from "../../database/push/push";
import {saveChatInDB, updateGroupChat} from "../../database/chat/groupChat";
import user from "../../routes/user";

export class GroupChat extends Chat{

    //BinSearchArray - groupChatMembers
    private _members:Map<number,GroupChatMember> = new Map<number,GroupChatMember>();
    private _chatName:string;
    private _description:string;
    private _isPublic:boolean;
    private _socketRoomName:string;

    constructor(chatId:number = -1, chatName:string, description:string, isPublic:boolean) {
        super(chatTypes.groupChat,chatId);
        this.chatName = chatName;
        this.description = description;
        this.isPublic = isPublic;
        this.socketRoomName = randomString(10);
    }
    /*
        subscribeUsersToSocket
     */
    async subscribeUsersToSocket():Promise<void> {
        /*
            each users socket joins the roo,
         */
        await new Promise<void>((resolve, reject) => {
            let callCounter = 0;

            this.members.forEach(((value:GroupChatMember,key:number) => {
                if(socketServer.clients.has(value.user.uid) && value.isStillMember)
                    socketServer.getSocket(value.user.uid).join(this.socketRoomName);
                callCounter ++;
                if(callCounter === this.members.size)
                    resolve();
            }));
        })
    }
    /*
        chat is saved in the database
     */
    async saveChatInDB():Promise<number> {

        this.chatId = await saveChatInDB(
            this.chatName,
            this.description,
            this.isPublic
        );
        return this.chatId;
    }
    /*
        member is added to chat
     */
    private async addGroupChatMember(user:User):Promise<GroupChatMember> {
        /*
            is there already a groupChatMember for this user?
         */
        const groupChatMember = this.members.get(user.uid);
        /*
            if defined --> isStillMember is updated
         */
        if(groupChatMember){

            await groupChatMember.undoRemove();
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
            this.members.set(user.uid, groupChatMember);
        }
        /*
            chat is sent to user
        */
        await user.addNewChat(this);
        /*
            member is subscribed to socket
         */
        this.subscribeToRoom(user);

        return groupChatMember;
    }
    /*
        member is added to groupChat by admin
     */
    async addMember(
        memberFrom:GroupChatMember,
        otherUser:User
    ):Promise<void> {

        await this.addGroupChatMember(otherUser);
        /*
            statusMessage is added
         */
        await this.addStatusMessage(
            statusMessageTypes.usersAdded,
            memberFrom.user,
            [otherUser.uid]
        );

        await this.emitChatUpdated();
    }
    /*
        multiple members are added to the chat
     */
    async addMembers(
        memberFrom:GroupChatMember,
        users:User[]
    ):Promise<void> {

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
        await this.addStatusMessage(
            statusMessageTypes.usersAdded,
            memberFrom.user,
            uids
        );

        await this.emitChatUpdated();
    }
    /*
        member is removed from groupChat by admin
     */
    async removeMember(
        memberFrom:GroupChatMember,
        memberOther:GroupChatMember
    ):Promise<void> {
        /*
            member is removed from DB
         */
        await memberOther.removeGroupChatMember();
        /*
            statusMessage is added
         */
        await this.addStatusMessage(
            statusMessageTypes.usersRemoved,
            memberFrom.user,
            [memberOther.user.uid]
        );
        /*
            socket room is left
         */
        this.leaveRoom(memberOther.user);

        await this.emitChatUpdated();
    }
    /*
        member joins chat --> only when public
     */
    async joinChat(user:User):Promise<void> {

        await this.addGroupChatMember(user);
        /*
            statusMessage is added
         */
        await this.addStatusMessage(
            statusMessageTypes.usersJoined,
            user,
            []
        );

        await this.emitChatUpdated();
    }
    /*
        chat is left by the user
     */
    async leaveChat(member:GroupChatMember):Promise<void> {
        /*
            member is removed from DB
         */
        await member.removeGroupChatMember();
        /*
            statusMessage is added
         */
        await this.addStatusMessage(
            statusMessageTypes.usersLeft,
            member.user,
            []
        );
        /*
            socket room is left
         */
        this.leaveRoom(member.user);

        await this.emitChatUpdated();
    }
    /*
        statusMessage is addedd
            passiveUsers: uids
     */
    async addStatusMessage(
        type:statusMessageTypes,
        userFrom:User,
        passiveUsers:number[]
    ):Promise<void> {

        const message = new StatusMessage(this,userFrom);

        await message.initNewMessage({
            type: type,
            passiveUsers: passiveUsers
        });
        /*
            message is added to messageStorage
         */
        this.messageStorage.addNewMessage(message);

        /*
            message is sent
         */
        await this.sendMessage(
            userFrom,
            message,
            true
        );
    }
    /*
        requested member is returned
     */
    getMember(uid:number,ignoreNotFound:boolean = false):GroupChatMember {
        const member = this.members.get(uid);
        if(!member) {
            if (ignoreNotFound)
                return null;
            else
                /*
                    member is not in this chat
                 */
                throw new Error('member does not exist');
        }
        return member;
    }
    /*
        status messages at the start of the chat are created
            createdBy: the user who created the chat
     */
    async createStatusMessagesStart(createdBy:User):Promise<void> {

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
            passiveUsers: await this.getMemberUids(createdBy.uid)
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
    async getMemberUids(uidExclude:number):Promise<number[]> {

       return new Promise<number[]>((resolve, reject) => {

           const uids:number[] = [];
           let callCounter = 0;

           this.members.forEach((value:GroupChatMember, key:number) => {
               if(key !== uidExclude)
                   uids.push(key)
               callCounter ++;
               if(callCounter === this.members.size)
                   resolve(uids);
           });
       })
    }
    /*
        all members of this chat are loaded
     */
    async loadGroupChatMembers():Promise<void> {

        const usersChatDB:GroupChatMemberDB[] = await selectGroupChatMembers(this.chatId);
        this.members = new Map<number,GroupChatMember>();
        /*
            loop through users, if not exists --> gets created
         */
        for (let j = 0; j < usersChatDB.length; j++) {

            const userChatDB = usersChatDB[j];
            const isAdmin = userChatDB.isAdmin === 1;
            const unreadMessages = userChatDB.unreadMessages;
            const isStillMember = userChatDB.isStillMember === 1;
            /*
                does user already exist in the Map
                    if not: add
             */
            if (!chatData.user.has(userChatDB.uid)) {
                /*
                    new user gets created
                 */
                const newUser = new User(
                    userChatDB.uid,
                    userChatDB.username
                );
                // add user
                chatData.user.set(newUser.uid, newUser);
            }
            // get the user from chatData
            const newUser = chatData.user.get(userChatDB.uid);
            // create new groupChatMember
            const groupChatMember =
                new GroupChatMember(
                    userChatDB.gcmid,
                    this,
                    newUser,
                    isAdmin,
                    unreadMessages,
                    isStillMember
                );
            // add member to member list
            this.members.set(
                newUser.uid,
                groupChatMember
            );
        }
        /*
            chat gets added to the members
         */
        await new Promise<void>((resolve, reject) => {

            let callCounter = 0;

            this.members.forEach((value:GroupChatMember, key:number) => {
                // add chat
                value.user.addLoadedChat(this);
                callCounter ++;
                if(callCounter === this.members.size)
                    resolve();
            });
        })
        /*
            users are subscribed to socket
         */
        await this.subscribeUsersToSocket();
    }
    /*
        unreadMessages of the user with this uid are set
     */
    async setUnreadMessages(uid:number,unreadMessages:number):Promise<void>  {
        /*
            is the groupChatMember defined?
         */
        const groupChatMember = this.members.get(uid);

        if(groupChatMember)
            await groupChatMember.setUnreadMessages(unreadMessages);

    }
    /*
        unreadMessages are incremented at all users
     */
    async incrementUnreadMessages(num:number):Promise<void> {

        await new Promise<void>((resolve, reject) => {
            let callCounter = 0;
            this.members.forEach(async (value:GroupChatMember, key:number) => {
                await value.incrementUnreadMessages(num);
                callCounter ++;
                if(callCounter === this.members.size)
                    resolve();
            });
        })
    }
    /*
        unreadMessages are increment at the user with this uid
     */
    async incrementUnreadMessagesAt(uid:number,num:number):Promise<void> {
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
    getUnreadMessages(uid:number):number {
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
    sendToAll(sentBy:User,socketMessage:string,messageObject:any,includeSender:boolean = false):void {
        /*
            msg gets emitted to all users
         */
        const data = {
            chat: {
                type: this.getChatTypeString(),
                id: this.chatId
            },
            ...messageObject
        };
        if(includeSender)
            socketServer.io.to(this.socketRoomName).emit(socketMessage,data);
        else if(socketServer.clients.has(sentBy.uid))
            socketServer.getSocket(sentBy.uid).to(this.socketRoomName).emit(socketMessage,data);
        else
            socketServer.io.to(this.socketRoomName).emit(socketMessage,data);
        logger.info({
            info: 'send socket message to all users',
            message: socketMessage,
            socketMessage: socketMessage,
            includeSender: includeSender,
            roomName: this.socketRoomName,
            groupName: this.getChatName(0)
        });
    }
    // a push notification is sent to all users who are not online
    async sendNotification(type:NotificationTypes) {
        await new Promise<void>((resolve, reject) => {
            let callCounter:number = 0;
            this.members.forEach(async (value:GroupChatMember, key:number) => {
                /*
                    if member is not online, send notification
                 */
                if(!value.user.online && value.isStillMember)
                    await sendNotification(value.user.uid,await value.user.getNotificationString(type));

                callCounter ++;
                if(callCounter === this.members.size)
                    resolve();
            });
        });
    }
    /*
        subscribe users o the room in the socket:
            not, if member not in chat anymore
     */
    subscribeToRoom(user:User):void {
        const member:GroupChatMember = this.getMember(user.uid);
        if(socketServer.clients.has(user.uid) && member.isStillMember)
            socketServer.getSocket(user.uid).join(this.socketRoomName);
    }

    leaveRoom(user:User):void {
        if(socketServer.clients.has(user.uid))
            socketServer.getSocket(user.uid).leave(this.socketRoomName);
    }
    /*
        returns if there is someone online in this chat
     */
    async isAnyoneOnline():Promise<boolean> {
        return await new Promise<boolean>((resolve, reject) => {
            let callCounter = 0;
            let anyOneOnline = false;
            this.members.forEach((value:GroupChatMember, key:number) => {
                if(value.user.online)
                    anyOneOnline = true
                callCounter ++;
                if(callCounter === this.members.size)
                    resolve(anyOneOnline);
            });
        })
    }
    /*
        remove all users from the chat, gets called when chat gets unloaded
            uid: the requesting user
     */
    async removeUsers(uid:number):Promise<void> {
        await new Promise<void>((resolve, reject) => {

            let callCounter = 0;
            this.members.forEach((value:GroupChatMember, key:number) => {
                /*
                    if the uid is not the one of the removing user
                 */
                if(value.user.uid !== uid) {
                    /*
                        if there are no other chats, the user gets deleted
                     */
                    if (value.user.chats.length() <= 1) {
                        chatData.user.delete(value.user.uid);
                    }
                    /*
                        chat is deleted
                     */
                    else {
                        value.user.removeUnloadedChat(this);
                    }
                }
                callCounter ++;
                if(callCounter === this.members.size)
                    resolve();
            });
        });
    }
    // the name of the chat gets returned
    getChatName(uidSelf:number):string {
        return this.chatName;
    }
    /*
        all members of the chat get returned, only the most important information
            uid: the id of the user that should be excluded, -1 if no one should
     */
    async getMemberObject(uid:number,minified = true):Promise<SimpleUser[]> {

        return await new Promise<SimpleUser[]>((resolve, reject) => {
            let callCounter = 0;
            let members:SimpleUser[] = [];
            this.members.forEach((member:GroupChatMember, key:number) => {
                members.push({
                    uid: member.user.uid,
                    username: member.user.username
                });
                callCounter ++;
                if(callCounter === this.members.size)
                    resolve(members);
            });
        })
    }
    /*
        all members of the chat get returned, all info
     */
    async getMemberObjectAll():Promise<GroupChatMemberDataAll[]> {

        return await new Promise<GroupChatMemberDataAll[]>((resolve, reject) => {
            let callCounter = 0;
            let members:GroupChatMemberDataAll[] = [];
            this.members.forEach((member:GroupChatMember, key:number) => {
                // if member is not member anymore --> do not show
                if(member.isStillMember)
                    members.push({
                        uid: member.user.uid,
                        username: member.user.username,
                        isAdmin: member.isAdmin,
                        gcmid: member.gcmid
                    });
                callCounter ++;
                if(callCounter === this.members.size)
                    resolve(members);
            });
        })
    }

    forEachUser(callback: (user: User, key: number) => void):void {
        this.members.forEach((value:GroupChatMember, key:number) => {
            callback(value.user,key);
        })
    }
    /*
        groupChatInfo is returned
            memberSelf: can be null
     */
    async getGroupChatInfo(memberSelf:GroupChatMember):Promise<GroupChatInfo> {
        let memberSelfObject:any;
        if(memberSelf === null){
            memberSelfObject = {
                isAdmin: false,
                isStillMember: true
            }
        }else{
            memberSelfObject =  {
                isAdmin: memberSelf.isAdmin,
                isStillMember: memberSelf.isStillMember
            }
        }
        return({
            type: this.getChatTypeString(),
            id: this.chatId,
            chatName: this.chatName,
            description: this.description,
            public: this.isPublic,
            memberSelf: memberSelfObject,
            members: await this.getMemberObjectAll(),
        });
    }
    /*
        the number of admins in this chat is returned
     */
    async getAdminCount():Promise<number> {

        return new Promise((resolve, reject) => {

            let callCounter = 0,
                adminCounter = 0;


            this.members.forEach((value:GroupChatMember,key:number) => {
                callCounter ++;
                //if groupChatMember is admin, increase adminCounter by 1
                if(value.isAdmin)
                    adminCounter ++;
                if(callCounter == this.members.size)
                    resolve(adminCounter);
            });
        });
    }
    /*
        info is updated in the database:
            chatName
            description
            isPublic
     */
    async update():Promise<void> {

        await updateGroupChat(this.chatId,this.chatName,this.description,this.isPublic);

        await this.emitChatUpdated()
    }
    /*
        emit updated groupChat info
     */
    async emitChatUpdated():Promise<void> {
        this.sendToAll(
            null,
            "groupChat updated",
            await this.getGroupChatInfo(null),
            true
        );
    }
    async forAllMembers(callback: (value:GroupChatMember,key:number) => void):Promise<void> {
        await new Promise<void>((resolve, reject) => {
            let callCounter = 0;
            this.members.forEach((value:GroupChatMember, key:number) => {
                callback(value,key);
                callCounter ++;
                if(callCounter === this.members.size)
                    resolve();
            });
        })
    }

    get members(): Map<number,GroupChatMember> {
        return this._members;
    }

    set members(value: Map<number,GroupChatMember>) {
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