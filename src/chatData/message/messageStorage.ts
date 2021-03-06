import BinSearchArray from "../../util/binsearcharray";
import {chatData} from "../data";
import StatusMessage from "./statusMessage";
import NormalMessage from "./normalMessage";
import Message from "./message";
import {Chat, chatTypes} from "../chat/chat";
import {logger} from "../../util/logger";
import {pool} from "../../app";
import {MessageDataOut, messageTypes, NewestMessage} from "../../models/message";
import User from "../user";
import {GroupChat} from "../chat/groupChat";

export default class MessageStorage {
    /*
        are all messages in this chat already loaded?
     */
    private _loadedAllMessages:boolean = false;
    private _chat:Chat;
    // -1 --> default values when empty
    private _minMid:number = -1;
    private _maxMid:number = -1;
    private _messages = new BinSearchArray();

    constructor(chat:any) {

        this.chat = chat;
    }
    async initFirstMessage():Promise<void>{
        /*
            first message is loaded
         */
        await this.loadMessages(1);
    }
    /*
        messages are returned
            firstMid: the mid of the first message that should not be selected
                ->all selected messages have lower mid
            num -> how many messages should be selected
            user: the user who requested the messages
     */
    async getMessagesByMid(firstMid:number,num:number,user:User):Promise<MessageDataOut[]> {
        /*
            nextIndex is selected
            if index is -1 --> error is thrown
         */
        let iMessage = this.messages.getIndex(firstMid);
        /*
            the array that is going to be returned
                --> earlier messages have lower indexes in array
         */
        let rMessages:MessageDataOut[] = [];

        if(iMessage === -1){

            throw new Error('a message with this mid does not exist in this chat!');
        }else{
            /*
                iMessage --> current index in messageStorage
                i --> loadedMessages
             */
            for(
                let i = 0;
                i < num;
                iMessage--,i++
            ){
                /*
                    if there are no more messages --> load
                 */
                if(iMessage < 0){
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
                // add at the end of the array
                const message:Message = this.messages[iMessage].value;
                if(await message.authenticateMessage(user))
                    rMessages.unshift(message.getMessageObject());
                else
                    // i--, because message does not get added
                    i--;
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
                user: the user who requested the messages
         */
    async getMessagesByDate(nextDate:Date,num:number,user:User){

        let found = false;
        for(let i=this.messages.length-1; i>=0 && !found; i--){
            /*
                date is lower than nextDate
                TODO ?
             */
            const arr:any = this;
            if(arr.value.date.getTime() < nextDate.getTime()){
                const mid = arr.value.mid;
                return await this.getMessagesByMid(mid,num,user);
            }
        }
        return [];
    }
    /*
        messages are loaded
     */
    async loadMessages(num:number):Promise<number> {

        if(this.minMid === -1) {
            await this.getMaxMid();
            this.minMid = this.maxMid + 1;
        }

        const result:any = await this.selectMessages(num);

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
                        message = new NormalMessage(this.chat,user,mid);
                        break;
                    }
                    case messageTypes.statusMessage: {
                        message = new StatusMessage(this.chat,user,mid);
                        break;
                    }
                }
                message.date = result[i].date;
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
        function mysqlTimeStampToDate(timestamp:string) {

            /*
                function parses mysql datetime string and returns javascript Date object
                input has to be in this format: 2007-06-05 15:26:02
             */
            const regex=/^([0-9]{2,4})-([0-1][0-9])-([0-3][0-9]) (?:([0-2][0-9]):([0-5][0-9]):([0-5][0-9]))?$/;
            const parts:string[] = timestamp.replace(regex,"$1 $2 $3 $4 $5 $6").split(' ');
            let partsNumber:number[] = new Array<number>(parts.length);
            parts.forEach((value:string,index:number) => {
                partsNumber[index] = parseInt(value);
            })
            return new Date(partsNumber[0],partsNumber[1]-1,partsNumber[2],partsNumber[3],partsNumber[4],partsNumber[5]);
        }
    }
    /*
        messages are selected
     */
    async selectMessages(num:number){

        return new Promise((resolve,reject) => {

            const isGroupChat = this.chat.type === chatTypes.groupChat ? 1 : 0;

            const query_str =
                "SELECT * " +
                "FROM message " +
                "WHERE isGroupChat = '" + isGroupChat + "' && cid = '" + this.chat.chatId + "' && mid < " + this.minMid + " " +
                "ORDER BY mid DESC " +
                "LIMIT " + num + ";";
            logger.verbose('SQL: %s',query_str);

            pool.query(query_str,(err:Error,result:any,fields:any) => {
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
    addNewMessage(message:Message): void{

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
    async getMaxMid(): Promise<number>{

        return new Promise((resolve,reject) => {

            const isGroupChat = this.chat.type === chatTypes.groupChat ? 1 : 0;

            const query_str1 =
                "SELECT max(mid) " +
                "AS 'mid' " +
                "FROM message " +
                "WHERE isGroupChat = '" + isGroupChat + "' && cid = '" + this.chat.chatId + "';";
            logger.verbose('SQL: %s',query_str1);

            pool.query(query_str1,(err:Error,result:any) => {
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
                    logger.verbose('SQL: %s',query_str2);

                    pool.query(query_str2,(err:Error,result:any) => {
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
    getEarliestMessage():Message {
        return this.messages[0].value;
    }
    getNewestMessage():Message {
        return this.messages[this.messages.length - 1].value;
    }
    /*
        an object containing the newest message is returned
     */
    async getNewestMessageObject(user:User):Promise<NewestMessage> {
        /*
            does there exist a message?
         */
        if(this.messages.length > 0){
            /*
                authenticate message if it can be shown
             */
            if(await this.getNewestMessage().authenticateMessage(user)) {
                const messageObject: MessageDataOut = this.getNewestMessage().getMessageObject();
                return {
                    empty: false,
                    canBeShown: true,
                    ...messageObject
                }
            }else{
                /*
                    get date when the user left
                 */
                const member = (this.chat as GroupChat).getMember(user.uid);
                const changeDate:Date = await member.getLastMemberChangeDate();
                const newestMsg = this.getNewestMessage();
                return {
                    empty: false,
                    canBeShown: false,
                    mid: newestMsg.mid,
                    date: changeDate.toISOString()
                }
            }
        }else{
            return {
                empty: true,
                canBeShown:true
            };
        }
    }
    /*
        the mid below the given is returned
     */
    async getMidBelow(mid:number):Promise<number> {

        const index = this.messages.getIndex(mid);
        /*
            if message not found --> error
         */
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

    get loadedAllMessages(): boolean {
        return this._loadedAllMessages;
    }

    set loadedAllMessages(value: boolean) {
        this._loadedAllMessages = value;
    }

    get chat(): Chat {
        return this._chat;
    }

    set chat(value: Chat) {
        this._chat = value;
    }

    get minMid(): number {
        return this._minMid;
    }

    set minMid(value: number) {
        this._minMid = value;
    }

    get maxMid(): number {
        return this._maxMid;
    }

    set maxMid(value: number) {
        this._maxMid = value;
    }

    get messages(): BinSearchArray {
        return this._messages;
    }

    set messages(value: BinSearchArray) {
        this._messages = value;
    }
}