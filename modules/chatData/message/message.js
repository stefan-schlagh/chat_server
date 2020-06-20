import {chatServer} from "../../chatServer.js";

export const messageTypes = {
    normalMessage: 0,
    statusMessage: 1
};

export default class Message{

    #_mid;
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
        this.mid = msgId;
    }
    /*
        an object containing this message is returned
     */
    getMessageObject(){

        return({
            uid: this.author.uid,
            mid: this.mid,
            date: this.date
        });
    }
    /*
        message gets saved in the database
     */
    async initNewMessage(){

        return(new Promise((resolve, reject) => {

            const isGroupChat = this.chat.type === 'groupChat' ? 1 : 0;

            const query_str1 =
                "INSERT " +
                "INTO message (date, isGroupChat, cid,uid) " +
                "VALUES (" +
                    "CURRENT_TIMESTAMP(),'" +
                    isGroupChat +"','" +
                    this.chat.chatId + "','" +
                    this.author.uid +
                "');";

            chatServer.con.query(query_str1, err => {
                if(err){
                    reject(err);
                }else {
                    /*
                        mid dieser msg wird selected
                     */
                    const query_str2 =
                        "SELECT max(mid) " +
                        "AS 'mid' FROM message";

                    chatServer.con.query(query_str2, (err, result, fields) => {
                        if(err){
                            reject(err);
                        }else {
                            this.mid = result[0].mid;
                            resolve();
                        }
                    });
                }
            });
        }));
    }

    get mid() {
        return this.#_mid;
    }

    set mid(value) {
        this.#_mid = value;
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
