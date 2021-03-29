import Message from "../message/message";
import MessageStorage from "../message/messageStorage";
import NormalMessage from "../message/normalMessage";
import StatusMessage from "../message/statusMessage";
import User from "../user";
import {
    LoadedMessages,
    MessageContentIn,
    MessageDataIn,
    messageTypes,
    NormalMessageContentIn,
    StatusMessageContent
} from "../../models/message";
import {SimpleUser} from "../../models/user";
import {NotificationTypes} from "../../database/push/push";
import {logger} from "../../util/logger";

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
        new message gets sent to users
     */
    async sendMessage(author:User,message:Message,includeSender:boolean = false):Promise<void> {
        /*
            message gets sent to all users
         */
        this.sendToAll(
            author,
            'chat message',
            await message.getMessageObject(),
            includeSender
        );
        // send notification
        this.sendNotification(NotificationTypes.newMessage)
            .then(() => {})
            .catch(err => {
                logger.error(err);
            });
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
                const content:MessageContentIn = data.content;
                message = new NormalMessage(this,author);
                /*
                    message is saved in DB, mid is saved
                 */
                await message.initNewMessage(content as NormalMessageContentIn);
                break;
            }
            case messageTypes.statusMessage: {
                const content:MessageContentIn = data.content;
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
        indexes start at array end
        msgIdStart:
            the last mid that is loaded
            if -1, start with last message
        num: number how many messages should be loaded
     */
    async getMessages(msgIdStart:number,num:number,user:User):Promise<LoadedMessages> {
        /*
            if msgIdStart is -1, msgIdStart is maxMid
         */
        if(msgIdStart === -1)
            // if message storage is empty and all messages have been loaded
            if(this.messageStorage.messages.length === 0 && this.messageStorage.loadedAllMessages)
                return({
                    status: 'reached top',
                    messages: []
                });
            else
                msgIdStart = this.messageStorage.maxMid;

        const mid = await this.messageStorage.getMidBelow(msgIdStart);

        if(mid === -1)
            return({
                status: 'reached top',
                messages: []
            });
        else {
            const messages = await this.messageStorage.getMessagesByMid(mid, num,user);
            return ({
                status:
                    // are all messages loaded?
                    this.messageStorage.loadedAllMessages
                    // and are all at the client?
                    && messages[0].mid === this.messageStorage.getEarliestMessage().mid
                        ? 'reached top'
                        : 'success',
                messages: messages
            });
        }
    }
    // a message is sent to all members of the chat via a socket
    abstract sendToAll(author:User,socketMessage:string,messageObject:any,includeSender:boolean): void;
    // a push notification is sent to all users who are not online
    abstract sendNotification(type:NotificationTypes): Promise<void>;
    // increment the unread messages by the number
    abstract incrementUnreadMessages(num:number): Promise<void>;
    // set the unreadMessages of the user with this uid to the specified number
    abstract setUnreadMessages(uid:number,unreadMessages:number): Promise<void>;
    // returns if there is someone online in this chat
    abstract isAnyoneOnline():Promise<boolean>;
    /*
        remove all users from the chat, gets called when chat gets unloaded
            uid: the requesting user
     */
    abstract removeUsers(uid:number):Promise<void>;
    // all members of the chat get returned
    abstract getMemberObject(uidSelf:number):Promise<SimpleUser[]>;
    // the name of the chat gets returned
    abstract getChatName(uidSelf:number):string;
    // unread Messages of the user with this uid are returned
    abstract getUnreadMessages(uid:number):number;
    // chat is saved in the database
    abstract saveChatInDB():Promise<number>;

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