import User from "../user";
import {logger} from "../../util/logger";
import {pool} from "../../app";
import {statusMessageTypes} from "../../models/message";
import {GroupChat} from "./groupChat";
import {
    addGroupChatMemberChange,
    saveGroupChatMemberInDB,
    updateGroupChatMember,
    updateUnreadMessages,
    getLatestGroupChatMemberChange
} from "../../database/chat/groupChatMember";
import {GroupChatMemberChange, groupChatMemberChangeTypes} from "../../models/chat";

export default class GroupChatMember{

    // the id in the database
    private _gcmid:number;
    /*
        the parent chat
     */
    private _chat:GroupChat;
    private _user:User;
    /*
        is this groupChatMember admin in the chat?
     */
    private _isAdmin:boolean;
    /*
        the unredMessages for this member in this chat
     */
    private _unreadMessages:number;
    /*
        has the member already left the chat?
     */
    private _isStillMember:boolean;
    // the last change
    private _latestChange:GroupChatMemberChange = null;

    constructor(
        gcmid:number = -1,
        chat:any,
        user:any,
        isAdmin:boolean,
        unreadMessages:number = 0,
        isStillMember:boolean = true
    ) {

        this.gcmid = gcmid;
        this.chat = chat;
        this.user = user;
        this.isAdmin = isAdmin;
        this.unreadMessages = unreadMessages;
        this.isStillMember = isStillMember;
    }
    /*
        groupChatMember is saved in the database
     */
    async saveGroupChatMemberInDB():Promise<number>{
        //save groupChatMember
        this.gcmid = await saveGroupChatMemberInDB(this.user.uid,this.chat.chatId,this.isAdmin);
        // groupChatMemberChanged
        await this.addGroupChatMemberChange(groupChatMemberChangeTypes.joined);
        // return groupChatMemberId
        return this.gcmid;
    }
    /*
        unread messages are updated in the Database
     */
    async updateUnreadMessages():Promise<void>{

        await updateUnreadMessages(this.gcmid,this.unreadMessages);
    }
    /*
        unreadMessages of this member are set
     */
    async setUnreadMessages(unreadMessages:number):Promise<void>{

        this.unreadMessages = unreadMessages;

        await this.updateUnreadMessages();
    }
    /*
        unreadMessages of this member are incremented
     */
    async incrementUnreadMessages(num:number):Promise<void>{
        /*
            is the chat the currentChat of the user?
                --> do nothing
         */
        if(!this.user.isCurrentChat(this.chat)) {

            this.unreadMessages += num;
            await this.updateUnreadMessages();
        }
    }
    /*
        admin status is set
            value: the value that should be set
     */
    async setAdmin(userFrom:User,value:boolean):Promise<void> {
        /*
            change adminStatus in object
         */
        this.isAdmin = value;
        /*
            update adminStatus in DB
         */
        await this.update();
        /*
            add statusMessage in chat
         */
        const statusMessageType =
            value ?
                statusMessageTypes.usersMadeAdmin
                : (userFrom.uid === this.user.uid ?
                    statusMessageTypes.userResignedAdmin
                    : statusMessageTypes.usersRemovedAdmin);

        const statusMessage = await this.chat.addStatusMessage(
            statusMessageType,
            userFrom,
            [this.user.uid]
        );
        /*
            send message to all users
        */
        await this.chat.sendMessage(
            userFrom,
            statusMessage,
            true
        );
    }
    /*
        remove groupChatMember from the chat
     */
    async removeGroupChatMember():Promise<void>{
        // add groupChatMemberChange
        await this.addGroupChatMemberChange(groupChatMemberChangeTypes.left);
        /*
            isStillMember is set to false
         */
        this.isStillMember = false;
        /*
             admin is set to false
         */
        this.isAdmin = false;
        /*
            isStillMember is updated in the Database
         */
        await this.update();
        // send message to client, if online
        if(this.user.socket !== null)
            this.user.socket.emit("removed chat",{
                id: this.chat.chatId,
                type: this.chat.getChatTypeString()
            });
    }
    /*
        remove is undone
     */
    async undoRemove():Promise<void>{
        // add groupChatMemberChange, joined again
        await this.addGroupChatMemberChange(groupChatMemberChangeTypes.joined);
        /*
            isStillMember is set to true
         */
        this.isStillMember = true;
        /*
            isStillMember is updated in the Database
         */
        await this.update();
    }
    /*
        groupChatMember is updated in the DB
     */
    async update():Promise<void>{

        await updateGroupChatMember(this.gcmid,this.isAdmin,this.isStillMember);
    }
    /*
        add a new groupChatMemberChange
     */
    async addGroupChatMemberChange(type:groupChatMemberChangeTypes):Promise<void> {

        await addGroupChatMemberChange(this.gcmid,type);
        // update latest change
        this.latestChange = await getLatestGroupChatMemberChange(this.gcmid,this.isStillMember);
    }
    /*
        was the groupChatMember at this point of time in the chat?
     */
    async wasInChat(date:Date):Promise<boolean> {
        if(this.latestChange === null)
            this.latestChange = await getLatestGroupChatMemberChange(this.gcmid,this.isStillMember);

        if(this.latestChange.type === groupChatMemberChangeTypes.joined)
            return true;
        else // result.type === groupChatMemberChangeTypes.left
            // if user left before message was sent, return false
            return !(this.latestChange.date.getTime() < date.getTime())
    }

    async getLastMemberChangeDate():Promise<Date> {
        if(this.latestChange === null)
            this.latestChange = await getLatestGroupChatMemberChange(this.gcmid,this.isStillMember);
        return this.latestChange.date;
    }

    get gcmid(): number {
        return this._gcmid;
    }

    set gcmid(value: number) {
        this._gcmid = value;
    }

    get chat(): GroupChat {
        return this._chat;
    }

    set chat(value: GroupChat) {
        this._chat = value;
    }

    get user(): User {
        return this._user;
    }

    set user(value: User) {
        this._user = value;
    }

    get isAdmin(): boolean {
        return this._isAdmin;
    }

    set isAdmin(value: boolean) {
        this._isAdmin = value;
    }

    get unreadMessages(): number {
        return this._unreadMessages;
    }

    set unreadMessages(value: number) {
        this._unreadMessages = value;
    }

    get isStillMember(): boolean {
        return this._isStillMember;
    }

    set isStillMember(value: boolean) {
        this._isStillMember = value;
    }

    get latestChange(): GroupChatMemberChange {
        return this._latestChange;
    }

    set latestChange(value: GroupChatMemberChange) {
        this._latestChange = value;
    }
}