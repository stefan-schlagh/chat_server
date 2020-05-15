import {chatServer} from "./chat_server.mjs";

export default class Message{

    #_msgId;
    #_chat;
    #_author;
    #_msg;
    #_date;

    constructor(chat,author,msg,msgId = -1) {
        this.chat = chat;
        //aktuelles Datum
        this.date = new Date(Date.now());
        this.author = author;
        this.msg = msg;
        this.msgId = msgId;
    }
    /*
        msg wird in DB gespeichert
        TODO: relocate to /database/newMessage
     */
    saveInDB(callback){
        //const formattedDate = this.date.toISOString().slice(0, 19).replace('T', ' ');
        const isGroupchat = this.chat.type === 'groupChat';
        chatServer.con.query("INSERT INTO message (content, date, isGroupChat, cid,uid) VALUES ('"+this.msg+"',CURRENT_TIMESTAMP(),'"+isGroupchat+"','"+this.chat.chatId+"','"+this.author.uid+"');",
        () => {
            /*
                mid dieser msg wird selected
             */
            chatServer.con.query("SELECT max(mid) AS 'mid' FROM message",(err,result,fields) => {
                this.msgId = result[0].mid;
                callback(this.msgId);
            });
        });
    }

    get msgId() {
        return this.#_msgId;
    }

    set msgId(value) {
        this.#_msgId = value;
    }

    get chat() {
        return this.#_chat;
    }

    set chat(value) {
        this.#_chat = value;
    }

    get author() {
        return this.#_author;
    }

    set author(value) {
        this.#_author = value;
    }

    get msg() {
        return this.#_msg;
    }

    set msg(value) {
        this.#_msg = value;
    }

    get date() {
        return this.#_date;
    }

    set date(value) {
        this.#_date = value;
    }
}
