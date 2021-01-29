import {chatServer} from "../../chatServer";
import {statusMessageTypes} from "../message/statusMessage";
import User from "../user";

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
    async saveGroupChatMemberInDB(){

        return new Promise((resolve,reject) => {

            const con = chatServer.con;
            const query_str1 =
                "INSERT " +
                "INTO groupchatmember(uid,gcid,isAdmin,isStillMember) " +
                "VALUES (" +
                    this._user.uid + ",'" +
                    this._chat.chatId + "'," +
                    con.escape(this._isAdmin) +
                    ",1" +
                ");";

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
                        "FROM groupchatmember";
                    con.query(query_str2,(err:Error,result:any,fields:any) => {
                        if(err)
                            reject(err);
                        else {
                            this._gcmid = result[0]._gcmid;
                            resolve(this._gcmid)
                        }
                    })
                }
            })
        });
    }
    /*
        unread messages are updated in the Database
     */
    updateUnreadMessages(){

        const query_str =
            "UPDATE groupchatmember " +
            "SET unreadMessages = " + this._unreadMessages + " " +
            "WHERE gcmid = " + this._gcmid + ";";

        chatServer.con.query(query_str,(err:Error) => {
            if(err)
                throw err;
        });
    }
    /*
        unreadMessages of this member are set
     */
    setUnreadMessages(unreadMessages:number){

        this._unreadMessages = unreadMessages;

        this.updateUnreadMessages();
    }
    /*
        unreadMessages of this member are incremented
     */
    incrementUnreadMessages(num:number){
        /*
            is the chat the currentChat of the user?
                --> do nothing
         */
        if(!this._user.isCurrentChat(this._chat)) {

            this._unreadMessages += num;
            this.updateUnreadMessages();
        }
    }
    /*
        admin status is set
     */
    async setAdmin(userFrom:any,value:any){
        /*
            change adminStatus in object
         */
        this._isAdmin = value;
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
                : (userFrom.uid === this._user.uid ?
                    statusMessageTypes.userResignedAdmin
                    : statusMessageTypes.usersRemovedAdmin);

        const statusMessage = await this._chat.addStatusMessage(
            statusMessageType,
            userFrom,
            [this._user.uid]
        );
        /*
            send message to all users
        */
        await this._chat.sendMessage(
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
    async deleteGroupChatMember(){
        /*
            isStillMember is set to false
         */
        this._isStillMember = false;
        /*
             admin is set to false
         */
        this._isAdmin = false;
        /*
            isStillMember is updated in the Database
         */
        await this.update();
    }
    /*
        delete is undone
     */
    async undoDelete(){
        /*
            isStillMember is set to true
         */
        this._isStillMember = true;
        /*
            isStillMember is updated in the Database
         */
        await this.update();
    }
    /*
        groupChatMember is updated in the DB
     */
    async update(){

        await new Promise((resolve, reject) => {

            const admin = this._isAdmin ? 1 : 0;
            const isStillMember = this._isStillMember ? 1 : 0;

            const query_str =
                "UPDATE groupchatmember " +
                "SET isAdmin = '" + admin + "', " +
                "isStillMember = '" + isStillMember + "' " +
                "WHERE gcmid = " + this._gcmid + ";";
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