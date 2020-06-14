import {saveMessageInDB} from "./database/newMessage.js";

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
        if(!author) {
            console.log('author undefined');
        }
        this.msg = msg;
        this.msgId = msgId;
    }
    /*
        message gets saved in the database
     */
    async saveInDB(){

        return await saveMessageInDB(this);
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
