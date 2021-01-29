import Message, {messageTypes} from "../message/message";
import MessageStorage from "../message/messageStorage";
import NormalMessage from "../message/normalMessage";
import StatusMessage from "../message/statusMessage";

export abstract class Chat{

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
    async sendMessage(author:any,message:Message,includeSender:boolean = false){
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
    async addMessage(author:any,data:any){
        /*
            message is created & initialized
         */
        let message;
        const content = data.content;

        switch(data._type){

            case messageTypes.normalMessage: {
                message = new NormalMessage(this,author);
                /*
                    message is saved in DB, mid is saved
                 */
                await message.initNewMessage(
                    content.text,
                    content.mentions,
                    content.media
                );
                break;
            }
            case messageTypes.statusMessage: {
                message = new StatusMessage(this,author);
                /*
                    message is saved in DB, mid is saved
                 */
                await message.initNewMessage(
                    content._type,
                    content.passiveUsers
                );
                break;
            }
        }
        /*
            message is added to messageStorage
         */
        this._messageStorage.addNewMessage(message);
        /*
            new messages are incremented
         */
        this.incrementUnreadMessages(1);

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

        if(this._messageStorage.loadedAllMessages){

            return({
                status: 'reached top',
                messages: []
            });
        }

        const mid = await this._messageStorage.getMidBelow(msgIdStart);

        if(mid === -1)
            return({
                status: 'reached top',
                messages: []
            });
        else {
            const messages = await this._messageStorage.getMessagesByMid(mid, num);
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

    abstract incrementUnreadMessages(num:number): any;

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