import {Chat, chatTypes} from "../chat/chat";
import User from "../user";
import {logger} from "../../util/logger";
import {pool} from "../../app";
import {MessageDataOut, messageTypes} from "../../models/message";

export default abstract class Message{

    private _mid:number;
    private _messageType:messageTypes;
    private _chat:Chat;
    private _author:User;
    private _date:Date;

    protected constructor(
        chat:Chat,
        author:User,
        messageType:messageTypes,
        mid:number = -1
    ) {

        this.messageType = messageType;
        this.chat = chat;
        this.date = new Date(Date.now());
        this.author = author;
        this.mid = mid;
    }
    // an object containing this message is returned
    abstract getMessageObject():MessageDataOut;
    //data is type of MessageContent
    abstract async initNewMessage(data:any):Promise<void>;
    /*
        message gets saved in the database
     */
    protected async initNewMessageInner():Promise<void> {

        return new Promise((resolve, reject) => {

            const isGroupChat = this.chat.type === chatTypes.groupChat ? 1 : 0;

            const query_str1 =
                "INSERT " +
                "INTO message (" +
                    "date, " +
                    "isGroupChat, " +
                    "messageType," +
                    "cid," +
                    "uid" +
                ") " +
                "VALUES (" +
                    "CURRENT_TIMESTAMP(),'" +
                    isGroupChat + "','" +
                    this.messageType + "','" +
                    this.chat.chatId + "','" +
                    this.author.uid +
                "');";
            logger.verbose('SQL: %s',query_str1);

            pool.query(query_str1,(err:Error) => {
                if(err){
                    reject(err);
                }else {
                    /*
                        message id og the message is selected
                     */
                    const query_str2 =
                        "SELECT max(mid) " +
                        "AS 'mid' FROM message";
                    logger.verbose('SQL: %s',query_str2);

                    pool.query(query_str2, (err:Error, result:any, fields:any) => {
                        if(err){
                            reject(err);
                        }else {
                            this.mid = result[0].mid;
                            resolve();
                        }
                    });
                }
            });
        });
    }

    get mid(): number {
        return this._mid;
    }

    set mid(value: number) {
        this._mid = value;
    }

    get messageType(): messageTypes {
        return this._messageType;
    }

    set messageType(value: messageTypes) {
        this._messageType = value;
    }

    get chat(): Chat {
        return this._chat;
    }

    set chat(value: Chat) {
        this._chat = value;
    }

    get author(): User {
        return this._author;
    }

    set author(value: User) {
        this._author = value;
    }

    get date(): Date {
        return this._date;
    }

    set date(value: Date) {
        this._date = value;
    }
}
