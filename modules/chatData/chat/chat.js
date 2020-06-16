import Message from "../message/message.js";
import chatData from "../chatData.js";
import {getMaxMid,loadMessages} from "../database/existingChat.js";

export class Chat{

    #_type;
    #_messages = [];
    //wenn -1 --> noch keine Nachrichten im chat
    #_maxMid;
    #_chatId;

    constructor(type,id) {

        if (new.target === Chat)
            throw new TypeError("Cannot construct Abstract instances directly");
        if(this.incrementUnreadMessages === undefined)
            throw new TypeError("Must override function incrementUnreadMessages");
        if(this.getUnreadMessages === undefined)
            throw new TypeError("Must override function getUnreadMessages");

        this.type = type;
        this.chatId = id;
    }
    /*
        neue Message wird zu message-array hinzugefügt
        im Callback wird die msgId zurückgegeben
     */
    async sendMessage(author,msg){
        const newMsg = new Message(this,author,msg);
        /*
            mid gets returned
         */
        const mid = await newMsg.saveInDB();
        this.maxMid;
        this.messages.push(newMsg);
        /*
            new messages are incremented
         */
        this.incrementUnreadMessages(1);

        return mid;
    }
    async loadFirstMessage(){

        return new Promise(((resolve, reject) => {
            try {
                this.initMessages(() => {
                    resolve(true);
                });
            }catch(err){
                reject(err);
            }
        }));
    }
    /*
        messages werden initialisiert
     */
    initMessages(callback){
        /*
            the message in this chat with the highest messageId gets searched
         */
        getMaxMid(this)
            .then(messageFound => {
                if(messageFound)
                    this.loadMessages(10,callback);
                else
                    callback();
            })
            .catch(err => console.log(err));
    }
    /*
        Messages werden geladen
        @param num Anzahl der Nachrichten, die geladen werden sollen
     */
    loadMessages(num,callback){

        loadMessages(this,num)
            .then(result => {
                /*
                    if results of SQL-query are less tham num
                    --> end of chat reached, all messages loaded
                 */
                if (result !== undefined) {
                    const reachedTop = num > result.length;
                    const resCount = result.length;
                    for (let i = 0; i < result.length; i++) {
                        /*
                            new messages are inserted at the start of the array
                         */
                        const user = chatData.user.get(result[i].uid);
                        if(!user) {
                            /*console.log('user undefined');
                            console.log(this.getMemberObject(3));
                            console.log(chatData.user);*/
                        }
                        const message = new Message(this, user, result[i].content, result[i].mid);
                        message.date = mysqlTimeStampToDate(result[i].date);
                        this.messages.unshift(message);
                    }
                    callback(resCount, reachedTop);
                }else{
                    callback(0,true);
                }
            })
            .catch(err => console.log(err));
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
        alle msg, kleiner als lowestMsgId werden geladen
     */
    getLowestMsgId(){
        if(this.messages[0] === undefined)
            return this.maxMid+1;
        return this.messages[0].msgId;
    }
    /*
        es wird der index der gegebenen msgId ermittelt
     */
    getIndexOfMsgId(msgId){
        for(let i=this.messages.length-1;i>=0;i--){
            if(this.messages[i].msgId === msgId)
                return i;
        }
        //not found
        return -1;
    }
    /*
        indexes werden vom Arrayende angegeben
        msgIdStart: wenn -1, wird mit der letzten Nachricht angefangen
        num: Anzahl der msg, die geladen werden sollen
     */
    getMessages(msgIdStart,num){

        return new Promise(((resolve, reject) => {

            let indexOfMsgId;
            /*
                bei client noch keine Nachrichten vorhanden
             */
            if(msgIdStart === -1) {
                //wenn maxMid -1 --> noch keine Nachrichten vorhanden
                if(this.maxMid === -1){
                    /*
                        leeres Array wird zurückgegeben, noch keine Nachrichten vorhanden
                    */
                    resolve({
                        chatType: this.type,
                        chatId: this.chatId,
                        status: 'no msg found',
                        messages: []
                    });
                }
                indexOfMsgId = this.messages.length;
            }
            else
                indexOfMsgId = this.getIndexOfMsgId(msgIdStart);

            if(indexOfMsgId !== -1){
                /*
                    es wird der Bereich ausgegeben
                 */
                const loopResult = (indexStart,iNum,reachedTop) => {
                    const arr = new Array(iNum);
                    for(let i=indexStart,j=iNum-1;i>indexStart-iNum && j>=0;i--,j--){
                        /*
                            msg-Objekt wird erstellt
                         */
                        arr[j] = {
                            uid: this.messages[i].author.uid,
                            mid: this.messages[i].msgId,
                            date: this.messages[i].date,
                            content: this.messages[i].msg
                        };
                    }
                    resolve({
                        chatType: this.type,
                        chatId: this.chatId,
                        status: reachedTop?'reached top':'success',
                        messages: arr
                    });
                };
                /*
                    es wird geschaut, ob die messages auch im Server existieren. Wenn nicht, werden sie aus der DB geladen
                 */
                if(indexOfMsgId<num)
                    /*
                        messages werden geladen
                        num - msgIdStart --> Anzahl der zu ladenden Nachrichten
                        callback:
                                rNum: Anzahl der tatsächlich geladenen
                                reachedTop: wurden bereits alle Nachrichten geladen?
                     */
                    this.loadMessages(num-indexOfMsgId,(rNum,reachedTop) => {
                        /*
                            num: Zahl der messages, die geladen werden sollte
                                - Zahl der messages die aus DB geladen werden sollen
                                + Zahl der messages die tatsächlich aus DB geladen wurde
                         */
                        loopResult(indexOfMsgId-1+rNum,num-(num-indexOfMsgId)+rNum,reachedTop);
                    });
                else
                    loopResult(indexOfMsgId-1,num,false);
            }else{
                /*
                    leeres Array wird zurückgegeben
                 */
                reject(new Error('error: message loading'));
            }
        }));
    }
    /*
        returns the newest message
     */
    getNewestMessageObject(){

        const firstMessage = this.messages[this.messages.length - 1];
        /*
            does there exist a message?
         */
        if(firstMessage){
            return {
                uid: firstMessage.author.uid,
                mid: firstMessage.msgId,
                date: firstMessage.date,
                content: firstMessage.msg
            };
        }else{
            return {
                empty: true
            };
        }
    }

    get type() {
        return this.#_type;
    }

    set type(value) {
        this.#_type = value;
    }

    get messages() {
        return this.#_messages;
    }

    set messages(value) {
        this.#_messages = value;
    }

    get maxMid() {
        return this.#_maxMid;
    }

    set maxMid(value) {
        this.#_maxMid = value;
    }

    get chatId() {
        return this.#_chatId;
    }

    set chatId(value) {
        this.#_chatId = value;
    }
}