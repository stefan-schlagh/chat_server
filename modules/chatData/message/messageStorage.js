import {chatServer} from "../../chatServer.js";
import {chatData} from "../data.js";
import StatusMessage from "./statusMessage.js";
import NormalMessage from "./normalMessage.js";
import BinSearchArray from 'binsearcharray';
import {messageTypes} from "./message.js";

export default class MessageStorage {
    /*
        are all messages in this chat already loaded?
     */
    #_loadedAllMessages = false;
    #_chat;
    #_minMid;
    #_maxMid;
    #_messages = new BinSearchArray();

    constructor(chat) {

        this.chat = chat;
    }
    async initFirstMessage(){
        /*
            first message is loaded
         */
        await this.loadMessages(1);
    }
    /*
        messages are returned
            the mid of the first message that should not be selected
                ->all selected messages have lower mid
            num -> how many messages should be selected
     */
    async getMessagesByMid(firstMid,num){
        /*
            nextIndex is selected
            if index is -1 --> error is thrown
         */
        let iMessage = this.messages.getIndex(firstMid);
        /*
            the array that is going to be returned
                --> earlier messages have lower indexes in array
         */
        let rMessages = [];

        if(iMessage === -1){

            throw new Error('a message with this mid does not exist in this chat!');
        }else{
            /*
                iMessage --> current index in messageStorage
                i --> loadedMessages
             */
            for(
                let i=0;
                i<num;
                iMessage--,i++
                ){
                /*
                    if there are no more messages --> load
                 */
                if(iMessage<0){
                    /*
                        the mid of the earliest message now is selected
                     */
                    const emid = this.getEarliestMessage().mid;
                    /*
                        num-i+1 --> number of the messages already loaded
                     */
                    const numLoaded = await this.loadMessages(num-i+1);
                    /*
                        if there are no more messages --> return
                     */
                    if(numLoaded === 0)
                        return rMessages;
                    /*
                        new index of iMessage is selected
                     */
                    iMessage = this.messages.getIndex(emid);
                }
                rMessages.unshift(this.messages[iMessage].value.getMessageObject());
            }
            /*
                messages are returned
             */
            return rMessages;
        }
    }
    /*
            messages are returned
                the next date that should not be selected
                    ->all selected messages have a lower date
                num -> how many messages should be selected
         */
    async getMessagesByDate(nextDate,num){

        let found = false;
        for(let i=this.messages.length-1;i>=0 && !found;i--){
            /*
                date is lower than nextDate
             */
            if(this[i].value.date.getTime() < nextDate.getTime()){
                const mid = this[i].value.mid;
                return await this.getMessagesByMid(mid,num);
            }
        }
        return [];
    }
    /*
        messages are loaded
     */
    async loadMessages(num){

        if(!this.minMid) {
            await this.getMaxMid();
            this.minMid = this.maxMid+1;
        }

        const result = await this.selectMessages(num);

        /*
            if results of SQL-query are less than num
            --> end of chat reached, all messages loaded
         */
        if (result !== undefined) {
            if(num > result.length)
                this.loadedAllMessages = true;
            const resCount = result.length;
            for (let i = 0; i < result.length; i++) {
                /*
                    new messages are inserted at the start of the array
                 */
                const user = chatData.user.get(result[i].uid);
                /*
                    is this message a statusMessage?
                        if:
                            new StatusMessage
                        else:
                            new NormalMessage
                 */
                const messageType = result[i].messageType;
                const mid = result[i].mid;
                this.minMid = mid;
                /*
                    message is created and loaded
                 */
                let message;
                switch(messageType){

                    case messageTypes.normalMessage: {
                        message = new NormalMessage(this,user,mid);
                        break;
                    }
                    case messageTypes.statusMessage: {
                        message = new StatusMessage(this,user,mid);
                        break;
                    }
                }
                message.date = mysqlTimeStampToDate(result[i].date);
                await message.loadMessage();
                this.messages.add(message.mid,message);
            }
            /*
                the number of the loaded messages is returned
             */
            return resCount;
        }else{
            this.loadedAllMessages = true;
            return 0;
        }
        /*
            source: https://dzone.com/articles/convert-mysql-datetime-js-date
         */
        function mysqlTimeStampToDate(timestamp) {

            /*
                function parses mysql datetime string and returns javascript Date object
                input has to be in this format: 2007-06-05 15:26:02
             */
            const regex=/^([0-9]{2,4})-([0-1][0-9])-([0-3][0-9]) (?:([0-2][0-9]):([0-5][0-9]):([0-5][0-9]))?$/;
            const parts=timestamp.replace(regex,"$1 $2 $3 $4 $5 $6").split(' ');
            return new Date(parts[0],parts[1]-1,parts[2],parts[3],parts[4],parts[5]);
        }
    }
    /*
        messages are selected
     */
    async selectMessages(num){

        return new Promise((resolve,reject) => {

            const isGroupChat = this.chat.type === 'groupChat' ? 1 : 0;

            const query_str =
                "SELECT * " +
                "FROM message " +
                "WHERE isGroupChat = '" + isGroupChat + "' && cid = '" + this.chat.chatId + "' && mid < " + this.minMid + " " +
                "ORDER BY mid DESC " +
                "LIMIT " + num + ";";

            chatServer.con.query(query_str,(err,result,fields) => {
                if(err)
                    reject(err);
                else {
                    resolve(result);
                }
            });
        });
    }
    /*
        a new message is added, should be initialized already
     */
    addNewMessage(message){

        this.messages.add(message.mid,message);
        this.maxMid = message.mid;
        /*
            if this is the only message, minMid is set
         */
        if(this.messages.length === 1){
            this.minMid = message.mid;
        }
    }
    /*
        the message in this chat with the highest messageId gets searched
     */
    async getMaxMid(){

        return new Promise((resolve,reject) => {

            const isGroupChat = this.chat.type === 'groupChat' ? 1 : 0;

            const query_str1 =
                "SELECT max(mid) " +
                "AS 'mid' " +
                "FROM message " +
                "WHERE isGroupChat = '" + isGroupChat + "' && cid = '" + this.chat.chatId + "';";

            chatServer.con.query(query_str1,(err,result) => {
                if(err)
                    reject(err);
                /*
                    is mid defined?
                 */
                else if(result[0].mid !== null) {
                    this.maxMid = result[0].mid;
                    resolve();
                }
                /*
                    no messages found in this chat
                        --> highest mid in all chats is searched
                 */
                else {

                    const query_str2 =
                        "SELECT max(mid) " +
                        "AS 'mid' " +
                        "FROM message;";

                    chatServer.con.query(query_str1,(err,result) => {
                        if(err)
                            reject(err);
                        /*
                            is mid defined?
                         */
                        else if(result[0].mid !== null) {
                            this.maxMid = result[0].mid;
                            resolve();
                        }else{
                            this.maxMid = 0;
                            resolve();
                        }
                    });
                }
            });
        });
    }
    /*
        the earliest loaded message is returned
     */
    getEarliestMessage(){
        return this.messages[0].value;
    }
    /*
        an object containing the newest message is returned
     */
    getNewestMessageObject(){

        const newestMsg = this.messages[this.messages.length - 1];
        /*
            does there exist a message?
         */
        if(newestMsg){
            return newestMsg.value.getMessageObject();
        }else{
            return {
                empty: true
            };
        }
    }
    /*
        the mid below the given is returned
     */
    async getMidBelow(mid){

        const index = this.messages.getIndex(mid);

        if(index === -1)
            throw new Error('mid does not exist');
        else{
            /*
                is there no message below --> 1 message is loaded
             */
            if(index === 0) {
                /*
                    are messages loaded
                        if not --> returns -1
                        else --> key from messages(0) is returned
                 */
                if (await this.loadMessages(1) === 0)
                    return -1;
                return this.messages[0].key;
            }else
                return this.messages[index - 1].key;
        }
    }

    get loadedAllMessages() {
        return this.#_loadedAllMessages;
    }

    set loadedAllMessages(value) {
        this.#_loadedAllMessages = value;
    }

    get chat() {
        return this.#_chat;
    }

    set chat(value) {
        this.#_chat = value;
    }

    get minMid() {
        return this.#_minMid;
    }

    set minMid(value) {
        this.#_minMid = value;
    }

    get maxMid() {
        return this.#_maxMid;
    }

    set maxMid(value) {
        this.#_maxMid = value;
    }

    get messages() {
        return this.#_messages;
    }

    set messages(value) {
        this.#_messages = value;
    }
}