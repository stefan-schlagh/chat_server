import Message from "./message";
import {MessageDataOut, messageTypes, NormalMessageContent} from "../../models/message";
import {saveMessageInDB} from "../../database/message/message";
import {loadNormalMessage, saveNormalMessageInDB} from "../../database/message/normalMessage";
import User from "../user";
import {Chat} from "../chat/chat";

export default class NormalMessage extends Message {

    private _nmid:number;
    private _text:string;

    constructor(chat:Chat,author:User,mid:number = -1) {
        super(
            chat,
            author,
            messageTypes.normalMessage,
            mid
        );
    }
    // load message
    async loadMessage(){

        const {nmid,text} = await loadNormalMessage(this.mid);
        this.nmid = nmid;
        this.text = text;
    }
    /*
        normalMessage is initialized
     */
    async initNewMessage(data:NormalMessageContent):Promise<void>{
        /*
            message gets saved
         */
        this.mid = await saveMessageInDB(
            this.chat.type,
            this.chat.chatId,
            this.messageType,
            this.author.uid
        );

        this.text = data.text;
        /*
            message is saved in DB:
                text
         */
        await saveNormalMessageInDB(this.mid,this.text);
    }
    /*
        an object containing this message is returned
     */
    getMessageObject(): MessageDataOut {

        return {
            uid: this.author.uid,
            mid: this.mid,
            date: this.date.toISOString(),
            type: messageTypes.normalMessage,
            content: {
                text: this.text
            }
        }
    }

    get nmid(): number {
        return this._nmid;
    }

    set nmid(value: number) {
        this._nmid = value;
    }

    get text(): string {
        return this._text;
    }

    set text(value: string) {
        this._text = value;
    }
}