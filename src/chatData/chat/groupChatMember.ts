import User from "../user";
import {logger} from "../../util/logger";
import {pool} from "../../app";
import {statusMessageTypes} from "../../models/message";
import {Chat} from "./chat";

export enum groupChatMemberChangeTypes {
    joined = 0,
    left = 1
}
interface GroupChatMemberChange {
    date: Date,
    type: groupChatMemberChangeTypes
}
export default class GroupChatMember{

    // the id in the database
    private _gcmid:number;
    /*
        the parent chat
     */
    private _chat:Chat;
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
        const gcmid:number = await new Promise((resolve,reject) => {

            const query_str1 =
                "INSERT " +
                "INTO groupchatmember(uid,gcid,isAdmin,isStillMember) " +
                "VALUES (" +
                    this.user.uid + ",'" +
                    this.chat.chatId + "'," +
                    pool.escape(this.isAdmin) +
                    ",1" +
                ");";
            logger.verbose('SQL: %s',query_str1);

            pool.query(query_str1,(err:Error) => {
                if(err)
                    reject(err);
                else {
                    /*
                        the gcmid is selected
                     */
                    const query_str2 =
                        "SELECT max(gcmid) " +
                        "AS 'gcmid' " +
                        "FROM groupchatmember;";
                    logger.verbose('SQL: %s',query_str2);

                    pool.query(query_str2,(err:Error,result:any,fields:any) => {
                        if(err)
                            reject(err);
                        else {
                            this.gcmid = result[0].gcmid;
                            resolve(this.gcmid)
                        }
                    })
                }
            })
        });
        // groupChatMemberChanged
        await this.addGroupChatMemberChange(groupChatMemberChangeTypes.joined);
        // return groupChatMemberId
        return gcmid;
    }
    /*
        unread messages are updated in the Database
     */
    async updateUnreadMessages():Promise<void>{

        return new Promise((resolve, reject) => {
            const query_str =
                "UPDATE groupchatmember " +
                "SET unreadMessages = " + this.unreadMessages + " " +
                "WHERE gcmid = " + this.gcmid + ";";
            logger.verbose('SQL: %s',query_str);

            pool.query(query_str,(err:Error) => {
                if(err)
                    reject(err);
                resolve();
            });
        });
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
        groupChatMember is deleted in the database
     */
    async deleteGroupChatMember():Promise<void>{
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
    }
    /*
        delete is undone
     */
    async undoDelete():Promise<void>{
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

        await new Promise((resolve, reject) => {

            const admin = this.isAdmin ? 1 : 0;
            const isStillMember = this.isStillMember ? 1 : 0;

            const query_str =
                "UPDATE groupchatmember " +
                "SET isAdmin = '" + admin + "', " +
                "isStillMember = '" + isStillMember + "' " +
                "WHERE gcmid = " + this.gcmid + ";";
            logger.verbose('SQL: %s',query_str);

            pool.query(query_str,(err:Error) => {
                if(err)
                    reject(err);
                resolve();
            });
        });
    }
    /*
        add a new groupChatMemberChange
     */
    async addGroupChatMemberChange(type:groupChatMemberChangeTypes):Promise<void> {

        await new Promise<void>((resolve, reject) => {

            const query_str =
                "INSERT " +
                "INTO groupchatmemberchange (date,gcmid,type) " +
                "VALUES (CURRENT_TIMESTAMP()," + this.gcmid + "," + type.valueOf() + ");";
            logger.verbose('SQL: %s',query_str);

            pool.query(query_str,(err:Error) => {
                if(err)
                    reject(err);
                resolve();
            });
        });
        // update latest change
        await this.getLatestGroupChatMemberChange();
    }
    private async getLatestGroupChatMemberChange(){
        /*
            get last change
                if no change -> date 0
         */
        this.latestChange = await new Promise<GroupChatMemberChange>((resolve, reject) => {
            /*const query_str =
                "SELECT * " +
                "FROM groupchatmemberchange " +
                "WHERE gcmid = " + this.gcmid + " AND DATEDIFF( date, FROM_UNIXTIME(" + date.getTime() + " / 1000) ) < 1 " +
                "ORDER BY DATEDIFF( date, FROM_UNIXTIME(" + date.getTime() + " / 1000) ) " +
                "LIMIT 1;";*/
            const query_str =
                "SELECT date, type " +
                "FROM groupchatmemberchange " +
                "WHERE gcmid = " + this.gcmid + " " +
                "ORDER BY gcmcid DESC " +
                "LIMIT 1;";
            pool.query(query_str, (err: Error, result: any) => {
                if (err)
                    reject(err);
                else if (!result || result.length === 0)
                    resolve({
                        type: this.isStillMember ? groupChatMemberChangeTypes.joined : groupChatMemberChangeTypes.left,
                        date: new Date(0)
                    });
                else
                    resolve({
                        type: result[0].type,
                        date: result[0].date
                    });
            });
        });
    }
    /*
        was the groupChatMember at this point of time in the chat?
     */
    async wasInChat(date:Date):Promise<boolean> {
        if(this.latestChange === null)
            await this.getLatestGroupChatMemberChange();

        if(this.latestChange.type === groupChatMemberChangeTypes.joined)
            return true;
        else // result.type === groupChatMemberChangeTypes.left
            // if user left before message was sent, return false
            return !(this.latestChange.date.getTime() < date.getTime())
    }

    async getLastMemberChangeDate():Promise<Date> {
        if(this.latestChange === null)
            await this.getLatestGroupChatMemberChange();
        return this.latestChange.date;
    }

    get gcmid(): number {
        return this._gcmid;
    }

    set gcmid(value: number) {
        this._gcmid = value;
    }

    get chat(): any {
        return this._chat;
    }

    set chat(value: any) {
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