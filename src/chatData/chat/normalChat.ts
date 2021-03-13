import {Chat, chatTypes} from "./chat";
import {chatServer} from "../../chatServer";
import chatData from "../chatData";
import {logger} from "../../util/logger";
import {SimpleUser, UserBlockInfo} from "../../models/user";
import User from "../user";
import {getUserBlockInfo} from "../../database/user/user";
import {NotificationTypes, sendNotification} from "../../database/push";
import {saveChatInDB, updateUnreadMessages} from "../../database/chat/normalChat";

export default class NormalChat extends Chat{

    private _user1:User;
    private _user2:User;
    /*
        the unread messages of each user
     */
    private _unreadMessages1:number;
    private _unreadMessages2:number;

    constructor(
        chatId:number = -1,
        user1:User,
        user2:User,
        unreadMessages1:number = 0,
        unreadMessages2:number = 0
    ) {
        super(chatTypes.normalChat,chatId);
        this.user1 = user1;
        this.user2 = user2;
        this.unreadMessages1 = unreadMessages1;
        this.unreadMessages2 = unreadMessages2;
    }
    /*
        chat is saved in the database
     */
    async saveChatInDB():Promise<number> {

        this.chatId = await saveChatInDB(this.user1.uid,this.user2.uid);
        return this.chatId;
    }
    /*
        event is emitted to all participants of the chat
     */
    sendToAll(sentBy:User,socketMessage:string,messageObject:any):void {

        const data = {
            chat: {
                type: this.getChatTypeString(),
                id: this.chatId,
            },
            uid: sentBy.uid,
            ...messageObject
        };
        /*
            es wird der user, der nicht der Sender ist, definiert
         */

        if(this.user1.uid === sentBy.uid){
            this.sendToUser(this.user2,socketMessage,data);
        }
        else {
            this.sendToUser(this.user1,socketMessage,data);
        }
    }
    // a push notification is sent to all users who are not online
    async sendNotification(type:NotificationTypes) {
        // if user is not online, send notification
        if(!this.user1.online)
            await sendNotification(this.user1.uid,await this.user1.getNotificationString(type));
        else if(!this.user2.online)
            await sendNotification(this.user2.uid,await this.user2.getNotificationString(type));
    }
    sendToUser(user:User,socketMessage:string,data:any):void {
        // is socket not null?
        if(user.online && user.socket !== null) {
            chatServer.io.to(user.socket.id).emit(socketMessage, data);
            logger.info({
                info: 'send socket message to other user',
                message: socketMessage,
                socketMessage: socketMessage,
                socketId: user.socket.id,
                uid: user.uid
            });
        }else
            logger.info('send socket message to other user: %s, other user not online',socketMessage);
    }
    /*
        the number of unread messages in the database is updated
     */
    async updateUnreadMessages():Promise<void> {

        await updateUnreadMessages(
            this.unreadMessages1,
            this.unreadMessages2,
            this.chatId
        );
    }
    /*
        unreadMessages of the user with this uid are set
     */
    async setUnreadMessages(uid:number,unreadMessages:number):Promise<void> {

        if (this.user1.uid === uid)
            this.unreadMessages1 = unreadMessages;

        else if (this.user2.uid === uid)
            this.unreadMessages2 = unreadMessages;

        await this.updateUnreadMessages();
    }
    /*
        unreadMessages are incremented at all users
     */
    async incrementUnreadMessages(num:number):Promise<void> {
        /*
            is this chat the currentChat of the user?
                --> do nothing
         */
        if(!this._user1.isCurrentChat(this)) {
            await this.incrementUnreadMessagesAt(this.user1.uid, num);
        }
        if(!this._user2.isCurrentChat(this)) {
            await this.incrementUnreadMessagesAt(this.user2.uid, num);
        }
    }
    /*
        unreadMessages are increment at the user with this uid
     */
    async incrementUnreadMessagesAt(uid:number,num:number):Promise<void> {

        if (this.user1.uid === uid)
            this.unreadMessages1 += num;

        else if (this.user2.uid === uid)
            this.unreadMessages2 += num;

        await this.updateUnreadMessages();
    }
    /*
        unread Messages of the user with this uid are returned
     */
    getUnreadMessages(uid:number):number {

        if (this.user1.uid === uid)
            return this.unreadMessages1;

        else if (this.user2.uid === uid)
            return this.unreadMessages2;
        else
            return 0;
    }
    /*
        returns if there is someone online in this chat
     */
    async isAnyoneOnline():Promise<boolean> {
        return await new Promise((resolve, reject) => {
            resolve(this.user1.online || this.user2.online)
        });
    }
    /*
        remove all users from the chat, gets called when chat gets unloaded
            uid: the requesting user
     */
    async removeUsers(uid:number):Promise<void> {

        await new Promise<void>((resolve, reject) => {
            /*
                the user who does not have the uid is identified
             */
            let user;
            if(this.user1.uid === uid)
                user = this.user2;
            else if(this.user2.uid === uid)
                user = this.user1;
            if(user !== undefined) {
                /*
                    if no other chats, user is deleted
                 */
                if (user.chats.length() <= 1) {
                    chatData.user.delete(user.uid);
                }
                /*
                    otherwise, chat gets removed
                 */
                else {
                    user.removeUnloadedChat(this);
                }
            }
            resolve();
        })
    }
    // the name of the chat gets returned
    getChatName(uidSelf:number):string {
        if(this.user1.uid === uidSelf){
            return this.user2.username;
        }else{
            return this.user1.username;
        }
    }
    /*
        all members of the chat get returned
     */
    async getMemberObject(uidSelf:number):Promise<SimpleUser[]> {

        return await new Promise<SimpleUser[]>((resolve, reject) => {
            if (uidSelf === this.user1.uid) {
                resolve ([{
                    uid: this.user2.uid,
                    username: this.user2.username
                }]);
            } else {
                resolve ([{
                    uid: this.user1.uid,
                    username: this.user1.username
                }]);
            }
        })
    }
    // is there one user blocking the other?
    async isSomeOneBlocked():Promise<boolean> {
        // get blockInfo of the user
        const blockInfo:UserBlockInfo = await getUserBlockInfo(this.user1.uid,this.user2.uid);
        return blockInfo.blockedBySelf || blockInfo.blockedByOther;
    }

    getOtherUser(user:User){
        if(user.uid === this.user1.uid)
            return this.user2;
        return this.user1;
    }

    get user1(): User {
        return this._user1;
    }

    set user1(value: User) {
        this._user1 = value;
    }

    get user2(): User {
        return this._user2;
    }

    set user2(value: User) {
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