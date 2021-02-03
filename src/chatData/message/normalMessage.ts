import Message,{messageTypes} from "./message";
import Mention from "./mention";
import Media from "./media";
import {chatData} from "../data";
import {logger} from "../../util/logger";
import {NormalMessageContent} from "../../models/message";
import {pool} from "../../app";

export default class NormalMessage extends Message {

    private _nmid:number;
    private _text:string;
    private _mentions:any = [];
    private _media:any = [];

    constructor(chat:any,author:any,mid:number = -1) {
        super(
            chat,
            author,
            messageTypes.normalMessage,
            mid
        );
    }
    // load message
    async loadMessage(){

        await this.loadMessageText();
        await this.loadMentions();
        await this.loadMedia();
    }

    async loadMessageText(){

        return new Promise((resolve, reject) => {

            const query_str =
                "SELECT nmid, text " +
                "FROM normalmessage " +
                "WHERE mid = " + this.mid + ";";
            logger.verbose('SQL: %s',query_str);

            pool.query(query_str,(err:Error,result:any) => {
                if(err)
                    reject(err);
                try {
                    this.nmid = result[0].nmid;
                    this.text = result[0].text;
                    resolve();
                }catch (e) {
                    reject(new Error('result is undefined!'))
                }
            });
        });
    }

    async loadMentions() {

        return new Promise((resolve, reject) => {

            const query_str =
                "SELECT muid,uid,textColumn " +
                "FROM mentioneduser " +
                "WHERE nmid = " + this.nmid + ";";
            logger.verbose('SQL: %s',query_str);

            pool.query(query_str, (err:Error, result:any, fields:any) => {
                if (err)
                    reject(err);
                /*
                     it is looped through the result
                 */
                this.mentions = new Array(result.length);
                for (let i = 0; i < result.length; i++) {
                    this.mentions[i] =
                        new Mention(
                            result[i].muid,
                            result[i].uid,
                            result[i].textColumn
                        );
                }
                resolve();
            });
        });
    }

    async loadMedia(){

        return new Promise((resolve, reject) => {

            const query_str =
                "SELECT * " +
                "FROM media " +
                "WHERE nmid = " + this.nmid + ";";
            logger.verbose('SQL: %s',query_str);

            pool.query(query_str,(err:Error,result:any,fields:any) => {
               if(err)
                   reject(err);

               this.media = new Array(result.length);
               for(let i=0;i<result.length;i++){
                   this.media[i] =
                       new Media(
                           result[i].meid,
                           result[i].type,
                           result[i].pathToFile
                       );
               }
               resolve();
            });
        });
    }
    /*
        normalMessage is initialized
     */
    async initNewMessage(data:NormalMessageContent):Promise<void>{
        /*
            message gets saved
         */
        await super.initNewMessageInner();

        this.text = data.text;
        /*
            message is saved in DB:
                text
                mentions are saved
                    mentions: [
                        {uid, textColumn},
                        {uid, textColumn}
                    ]
                media is saved
                    media: [
                        {type,pathToFile}
                    ]
         */
        await this.saveTextInDB();
        await this.saveMentionsInDB(data.mentions);
        await this.saveMediaInDB(data.media);
    }
    /*
        the text is saved in the database
     */
    async saveTextInDB(){

        return new Promise((resolve, reject) => {

            const text = pool.escape(this.text);
            const query_str1 =
               "INSERT " +
               "INTO normalmessage(mid,text) " +
               "VALUES (" + this.mid + "," + text + ");";
            logger.verbose('SQL: %s',query_str1);

            pool.query(query_str1,(err:Error,result:any,fields:any) => {
                if (err)
                    reject(err);
                /*
                    nmid is selected
                 */
                const query_str2 =
                    "SELECT max(nmid) AS 'nmid' " +
                    "FROM normalmessage;";
                logger.verbose('SQL: %s',query_str2);

                pool.query(query_str2,(err:Error,result:any,fields:any) => {
                    if (err)
                        reject(err);
                    try {
                        this.nmid = result[0].nmid;
                        resolve();
                    }catch (e) {
                        reject(new Error('result is undefined!'))
                    }
                });
            });
        });
    }
    /*
        mentions are saved in the database
     */
    async saveMentionsInDB(mentions:any){
        /*
            mentions-array that will be saved in this is created
         */
        this.mentions = new Array(mentions.length);

        for(let i=0;i<mentions.length;i++){
            /*
                user is searched
             */
            const uid = mentions[i].uid;
            const user = chatData.user.get(uid);
            if(!user)
                throw new Error('user not defined');
            /*
                mention - object is created
                    - gets saved in the Database
             */
            const mention = new Mention(-1,-1,mentions[i].textColumn);
            mention.user = user;
            await mention.saveMentionInDB(this.nmid);
            /*
                mention is added to the array
             */
            this.mentions[i] = mention;
        }

    }
    /*
        media is saved in the database
     */
    async saveMediaInDB(media:any){
        /*
            TODO
         */
    }
    /*
        an object containing this message is returned
     */
    getMessageObject(){

        const msg:any = super.getMessageObject();

        msg.type = messageTypes.normalMessage;
        msg.content = {
            text: this.text,
            mentions: this.getMentionsArray(),
            media: this.getMediaArray()
        };
        return msg;
    }
    /*
        a array with the mentions is returned
     */
    getMentionsArray(){

        const rc = new Array(this.mentions.length);
        for(let i=0;i<this.mentions.length;i++){

            rc[i] = {
                uid: this.mentions[i].user.uid,
                textColumn: this.mentions[i].textColumn
            }
        }
        return rc;
    }
    /*
        a array with the media is returned
     */
    getMediaArray(){

        const rc = new Array(this.media.length);
        for(let i=0;i<this.media.length;i++){

        }
        return rc;
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

    get mentions(): any {
        return this._mentions;
    }

    set mentions(value: any) {
        this._mentions = value;
    }

    get media(): any {
        return this._media;
    }

    set media(value: any) {
        this._media = value;
    }
}