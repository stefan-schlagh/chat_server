import {chatServer} from "../../chatServer";
import {statusMessageTypes} from "../message/statusMessage";
import User from "../user";
import {logger} from "../../util/logger";

export default class GroupChatMember{

    // the id in the database
    private _gcmid:number;
    /*
        the parent chat
     */
    private _chat:any;
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

    constructor(
        gcmid:number = -1,
        chat:any,
        user:any,
        isAdmin:boolean,
        unreadMessages:number = 0,
        isStillMember:boolean = true
    ) {

        this._gcmid = gcmid;
        this._chat = chat;
        this._user = user;
        this._isAdmin = isAdmin;
        this._unreadMessages = unreadMessages;
        this._isStillMember = isStillMember;
    }
    /*
        groupChatMember is saved in the database
     */
    async saveGroupChatMemberInDB():Promise<number>{

        return new Promise((resolve,reject) => {

            const con = chatServer.con;
            const query_str1 =
                "INSERT " +
                "INTO groupchatmember(uid,gcid,isAdmin,isStillMember) " +
                "VALUES (" +
                    this.user.uid + ",'" +
                    this.chat.chatId + "'," +
                    con.escape(this.isAdmin) +
                    ",1" +
                ");";
            logger.verbose('SQL: %s',query_str1);

            con.query(query_str1,(err:Error) => {
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

                    con.query(query_str2,(err:Error,result:any,fields:any) => {
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

            chatServer.con.query(query_str,(err:Error) => {
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
        if(!this._user.isCurrentChat(this.chat)) {

            this.unreadMessages += num;
            await this.updateUnreadMessages();
        }
    }
    /*
        admin status is set
     */
    async setAdmin(userFrom:any,value:any){
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

        return {
            mid: statusMessage.mid
        }
    }
    /*
        groupChatMember is deleted in the database
     */
    async deleteGroupChatMember():Promise<void>{
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

            chatServer.con.query(query_str,(err:Error) => {
                if(err)
                    reject(err);
                resolve();
            });
        });
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
}