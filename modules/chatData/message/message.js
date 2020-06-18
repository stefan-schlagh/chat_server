import {saveMessageInDB} from "../database/newMessage.js";

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

    }
    /*
        message gets saved in the database
     */
    async saveInDB(){

        return await saveMessageInDB(this);
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
