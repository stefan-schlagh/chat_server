import Message from "../message/message";
import MessageStorage from "../message/messageStorage";
import NormalMessage from "../message/normalMessage";
import StatusMessage from "../message/statusMessage";
import User from "../user";
import {
    LoadedMessages, MessageContent,
    MessageDataIn,
    messageTypes,
    NormalMessageContent,
    StatusMessageContent
} from "../../models/message";
import {SimpleUser} from "../../models/user";

export enum chatTypes {
    normalChat = 0,
    groupChat = 1
}
export function getChatType(type:string){
    if(type === 'normalChat')
        return chatTypes.normalChat;
    else if(type === 'groupChat')
        return chatTypes.groupChat;
    else
        throw new Error('chatType ' + type + ' does not exist!');
}
export abstract class Chat{

    private _type:chatTypes;
    private _messageStorage:MessageStorage;
    //wenn -1 --> noch keine Nachrichten im chat
    private _chatId:number;

    protected constructor(type:chatTypes, id:number) {

        this._type = type;
        this._chatId = id;

        this._messageStorage = new MessageStorage(this);
    }
    // get the chat type as string
    public getChatTypeString(){
        if(this.type === chatTypes.normalChat)
            return 'normalChat';
        else
            return 'groupChat';
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
    async addMessage(author:User,data:MessageDataIn):Promise<Message> {
        /*
            message is created & initialized
         */
        let message;

        switch(data.type){

            case messageTypes.normalMessage: {
                const content:MessageContent = data.content;
                message = new NormalMessage(this,author);
                /*
                    message is saved in DB, mid is saved
                 */
                await message.initNewMessage(content as NormalMessageContent);
                break;
            }
            case messageTypes.statusMessage: {
                const content:MessageContent = data.content;
                message = new StatusMessage(this,author);
                /*
                    message is saved in DB, mid is saved
                 */
                await message.initNewMessage(content as StatusMessageContent);
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
    async getMessages(msgIdStart:number,num:number):Promise<LoadedMessages> {
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
            //TODO return first messages otherwise

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
                    this.messageStorage.loadedAllMessages
                        ? 'reached top'
                        : 'success',
                messages: messages
            });
        }
    }
    // a message is sent to all members of the chat via a socket
    abstract sendToAll(author:User,socketMessage:string,messageObject:any,includeSender:boolean): void;
    // increment the unread messages by the number
    abstract async incrementUnreadMessages(num:number): Promise<void>;
    // set the unreadMessages of the user with this uid to the specified number
    abstract async setUnreadMessages(uid:number,unreadMessages:number): Promise<void>;
    // returns if there is someone online in this chat
    abstract async isAnyoneOnline():Promise<boolean>;
    /*
        remove all users from the chat, gets called when chat gets unloaded
            uid: the requesting user
     */
    async abstract removeUsers(uid:number):Promise<void>;
    // all members of the chat get returned
    async abstract getMemberObject(uidSelf:number):Promise<SimpleUser[]>;
    // the name of the chat gets returned
    abstract getChatName(uidSelf:number):string;
    // unread Messages of the user with this uid are returned
    abstract getUnreadMessages(uid:number):number;
    // chat is saved in the database
    abstract async saveChatInDB():Promise<number>;

    get type(): chatTypes {
        return this._type;
    }

    set type(value: chatTypes) {
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