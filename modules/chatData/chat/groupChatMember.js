import {chatServer} from "../../chatServer.js";

export default class GroupChatMember{

    // the id in the database
    #_gcmid;
    /*
        the parent chat
     */
    #_chat;
    #_user;
    /*
        is this groupChatMember admin in the chat?
     */
    #_isAdmin;
    /*
        the unredMessages for this member in this chat
     */
    #_unreadMessages;

    constructor(
        gcmid = -1,
        chat,
        user,
        isAdmin,
        unreadMessages = 0
    ) {

        this.gcmid = gcmid;
        this.chat = chat;
        this.user = user;
        this.isAdmin = isAdmin;
        this.unreadMessages = unreadMessages
    }
    /*
        groupChatMember is saved in the database
     */
    async saveGroupChatMemberInDB(){

        return new Promise((resolve,reject) => {

            const con = chatServer.con;
            const query_str1 =
                "INSERT " +
                "INTO groupchatmember(uid,gcid,isAdmin) " +
                "VALUES (" +
                    this.user.uid + ",'" +
                    this.chat.chatId + "'," +
                    con.escape(this.isAdmin) +
                ");";

            con.query(query_str1,(err) => {
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
                    con.query(query_str2,(err,result,fields) => {
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

        chatServer.con.query(query_str,(err) => {
            if(err)
                throw err;
        });
    }
    /*
        unreadMessages of this member are set
     */
    setUnreadMessages(unreadMessages){

        this.unreadMessages = unreadMessages;

        this.updateUnreadMessages();
    }
    /*
        unreadMessages of this member are incremented
     */
    incrementUnreadMessages(num){
        /*
            is the chat the currentChat of the user?
                --> do nothing
         */
        if(!this.user.isCurrentChat(this.chat)) {

            this.unreadMessages += num;
            this.updateUnreadMessages();
        }
    }

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
}