import Message from "./message";
import {MessageDataOut, messageTypes, NormalMessageContentIn} from "../../models/message";
import {saveMessageInDB} from "../../database/message/message";
import {loadNormalMessage, saveNormalMessageInDB} from "../../database/message/normalMessage";
import User from "../user";
import {Chat} from "../chat/chat";
import {getMessageFiles} from "../../database/files/messageFile";
import {FileDataOut} from "../../models/file";
import {deleteTempMessageFiles, saveMessageFile} from "../../files/messageFile";
import {logger} from "../../util/logger";

export default class NormalMessage extends Message {

    private _nmid:number;
    private _text:string;
    private _files:FileDataOut[] = [];

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
        // load file data
        this.files = await getMessageFiles(this.mid)
    }
    /*
        normalMessage is initialized
     */
    async initNewMessage(data:NormalMessageContentIn):Promise<void>{
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
        // save files
        if(data.files){
            for(const fileId of data.files){
                try {
                    await saveMessageFile(fileId, this.mid, this.chat.type, this.chat.chatId)
                }catch (err) {
                    logger.info('error at saving file: ' + fileId)
                }
            }
            // delete older temp messages of user
            await deleteTempMessageFiles(this.author.uid)
            // load file data
            this.files = await getMessageFiles(this.mid)
        }
    }
    /*
        an object containing this message is returned
     */
    async getMessageObject():Promise<MessageDataOut> {

        return {
            uid: this.author.uid,
            mid: this.mid,
            date: this.date.toISOString(),
            type: messageTypes.normalMessage,
            content: {
                text: this.text,
                files: this.files
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

    get files(): FileDataOut[] {
        return this._files;
    }

    set files(value: FileDataOut[]) {
        this._files = value;
    }
}