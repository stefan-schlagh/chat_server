import {chatServer} from "../../chatServer";
import {statusMessageTypes} from "../message/statusMessage";

export default class GroupChatMember{

    // the id in the database
    public gcmid:number;
    /*
        the parent chat
     */
    public chat:any;
    public user:any;
    /*
        is this groupChatMember admin in the chat?
     */
    public isAdmin:boolean;
    /*
        the unredMessages for this member in this chat
     */
    public unreadMessages:number;
    /*
        has the member already left the chat?
     */
    public isStillMember:boolean;

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
    async saveGroupChatMemberInDB(){

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
    updateUnreadMessages(){

        const query_str =
            "UPDATE groupchatmember " +
            "SET unreadMessages = " + this.unreadMessages + " " +
            "WHERE gcmid = " + this.gcmid + ";";

        chatServer.con.query(query_str,(err:Error) => {
            if(err)
                throw err;
        });
    }
    /*
        unreadMessages of this member are set
     */
    setUnreadMessages(unreadMessages:number){

        this.unreadMessages = unreadMessages;

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
        if(!this.user.isCurrentChat(this.chat)) {

            this.unreadMessages += num;
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
    async deleteGroupChatMember(){
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
    async undoDelete(){
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
    async update(){

        await new Promise((resolve, reject) => {

            const admin = this.isAdmin ? 1 : 0;
            const isStillMember = this.isStillMember ? 1 : 0;

            const query_str =
                "UPDATE groupchatmember " +
                "SET isAdmin = '" + admin + "', " +
                "isStillMember = '" + isStillMember + "' " +
                "WHERE gcmid = " + this.gcmid + ";";
            chatServer.con.query(query_str,(err:Error) => {
                if(err)
                    reject(err);
                resolve();
            });
        });
    }
/*
    get gcmid() {
        return this.#_gcmid;
    }

    set gcmid(value) {
        this.#_gcmid = value;
    }

    get chat() {
        return this.#_chat;
    }

    set chat(value) {
        this.#_chat = value;
    }

    get user() {
        return this.#_user;
    }

    set user(value) {
        this.#_user = value;
    }

    get isAdmin() {
        return this.#_isAdmin;
    }

    set isAdmin(value) {
        this.#_isAdmin = value;
    }

    get unreadMessages() {
        return this.#_unreadMessages;
    }

    set unreadMessages(value) {
        this.#_unreadMessages = value;
    }

    get isStillMember() {
        return this.#_isStillMember;
    }

    set isStillMember(value) {
        this.#_isStillMember = value;
    }*/
}