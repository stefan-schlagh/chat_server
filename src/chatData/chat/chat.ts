import Message, {messageTypes} from "../message/message";
import MessageStorage from "../message/messageStorage";
import NormalMessage from "../message/normalMessage";
import StatusMessage from "../message/statusMessage";
import User from "../user";
import {MessageData, NormalMessageContent, StatusMessageContent} from "../../models/message";

export abstract class Chat{

    //TODO
    private _type:string;
    private _messageStorage:MessageStorage;
    //wenn -1 --> noch keine Nachrichten im chat
    private _chatId:number;

    protected constructor(type:string, id:number) {

        this._type = type;
        this._chatId = id;

        this._messageStorage = new MessageStorage(this);
    }
    /*
        neue Message wird zu message-array hinzugefügt
        im Callback wird die msgId zurückgegeben
     */
    async sendMessage(author:any,message:Message,includeSender:boolean = false):Promise<void> {
        /*
            message gets sent to all users
         */
        this.sendToAll(
            author,
            'chat message',
            message.getMessageObject(),
            includeSender
        );
    }
    /*
        a new message is added to the chat
     */
    async addMessage(author:User,data:MessageData):Promise<Message> {
        /*
            message is created & initialized
         */
        let message;

        switch(data.type){

            case messageTypes.normalMessage: {
                const content:NormalMessageContent = data.content;
                message = new NormalMessage(this,author);
                /*
                    message is saved in DB, mid is saved
                 */
                await message.initNewMessage(content);
                break;
            }
            case messageTypes.statusMessage: {
                const content:StatusMessageContent = data.content;
                message = new StatusMessage(this,author);
                /*
                    message is saved in DB, mid is saved
                 */
                await message.initNewMessage(content);
                break;
            }
        }
        /*
            message is added to messageStorage
         */
        this.messageStorage.addNewMessage(message);
        /*
            new messages are incremented
         */
        await this.incrementUnreadMessages(1);

        return message;
    }
    /*
        indexes werden vom Arrayende angegeben
        msgIdStart: wenn -1, wird mit der letzten Nachricht angefangen
        num: Anzahl der msg, die geladen werden sollen
     */
    async getMessages(msgIdStart:number,num:number){
        /*
            if msgIdStart is -1, it is started with maxMid
         */
        if(msgIdStart === -1)

        if(this.messageStorage.loadedAllMessages){

            return({
                status: 'reached top',
                messages: []
            });
        }

        const mid = await this.messageStorage.getMidBelow(msgIdStart);

        if(mid === -1)
            return({
                status: 'reached top',
                messages: []
            });
        else {
            const messages = await this.messageStorage.getMessagesByMid(mid, num);
            return ({
                status:
                    this._messageStorage.loadedAllMessages
                        ? 'reached top'
                        : 'success',
                messages: messages
            });
        }
    }

    //TODO
    abstract sendToAll(author:any,socketMessage:any,messageObject:any,includeSender:boolean): any;

    abstract async incrementUnreadMessages(num:number): Promise<void>;

    abstract async setUnreadMessages(uid:number,unreadMessages:number): Promise<void>;

    get type(): string {
        return this._type;
    }

    set type(value: string) {
        this._type = value;
    }

    get messageStorage(): MessageStorage {
        return this._messageStorage;
    }

    set messageStorage(value: MessageStorage) {
        this._messageStorage = value;
    }

    get chatId(): number {
        return this._chatId;
    }

    set chatId(value: number) {
        this._chatId = value;
    }
}