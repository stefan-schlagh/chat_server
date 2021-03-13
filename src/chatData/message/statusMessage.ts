import Message from "./message";
import {chatData} from "../data";
import User from "../user";
import {Chat} from "../chat/chat";
import {logger} from "../../util/logger";
import {
    MessageDataOut,
    messageTypes,
    StatusMessageContent,
    statusMessageTypes
} from "../../models/message";
import {pool} from "../../app";
import {saveMessageInDB} from "../../database/message/message";
import {
    statusMessage,
    loadPassiveUsers,
    saveStatusMessageInDB,
    savePassiveUsersInDB
} from "../../database/message/statusMessage";

export default class StatusMessage extends Message {

    private _smid:number;
    private _type:statusMessageTypes;
    private _passiveUsers:User[] = [];

    constructor(chat:Chat,author:User,mid:number = -1) {
        super(
            chat,
            author,
            messageTypes.statusMessage,
            mid
        );
    }
    // load the message
    async loadMessage(){
        // load status message
        const {smid,type} = await statusMessage(this.mid);
        this.smid = smid;
        this.type = type;
        // load passive users
        await this.loadPassiveUsers();
    }

    async loadStatusMsgType(){

        return new Promise((resolve, reject) => {

            const query_str =
                "SELECT * " +
                "FROM statusmessage " +
                "WHERE mid = " + this.mid + ";";
            logger.verbose('SQL: %s',query_str);

            pool.query(query_str,(err:Error,result:any,fields:any) => {
                if(err)
                    reject(err);
                try {
                    this.smid = result[0].smid;
                    this.type = result[0].type;
                    resolve();
                }catch (e) {
                    reject(new Error('result is undefined!'))
                }
            })
        });
    }

    async loadPassiveUsers(){

        const passiveUsersUid = await loadPassiveUsers(this.smid);
        this.createPassiveUsers(passiveUsersUid);
    }
    /*
        create passive users out of a array with the user ids
     */
    createPassiveUsers(passiveUsersUid:number[]){
        this.passiveUsers = new Array(passiveUsersUid.length);
        for(let i = 0;i < passiveUsersUid.length;i++){
            /*
                user is searched
             */
            const user = chatData.user.get(passiveUsersUid[i]);
            if(user){
                this.passiveUsers[i] = user;
            }else{
                throw new Error('user does not exist! uid: ' + passiveUsersUid[i]);
            }
        }
    }
    /*
        statusMessage is initialized
            passiveUsers: array of uids
     */
    async initNewMessage(data:StatusMessageContent):Promise<void>{
        /*
            message gets saved
         */
        /*
            message gets saved
         */
        this.mid = await saveMessageInDB(
            this.chat.type,
            this.chat.chatId,
            this.messageType,
            this.author.uid
        );

        this.type = data.type;
        /*
            statusMsg is saved in the Database
            passive users are saved in the database
         */
        this.smid = await saveStatusMessageInDB(this.mid,this.type);
        await this.savePassiveUsersInDB(data.passiveUsers);
    }
    /*
        passive users are saved in the Database
     */
    async savePassiveUsersInDB(passiveUsersUid:number[]){

        this.createPassiveUsers(passiveUsersUid);

        if(this.passiveUsers.length > 0) {
            await savePassiveUsersInDB(this.smid,passiveUsersUid);
        }
    }
    /*
        an object containing this message is returned
     */
    getMessageObject():MessageDataOut {

        return {
            uid: this.author.uid,
            mid: this.mid,
            date: this.date.toISOString(),
            type: messageTypes.statusMessage,
            content: {
                type: this.type,
                passiveUsers: this.getPassiveUsers()
            }
        }
    }
    /*
        an array containing the passive users is returned
     */
    getPassiveUsers(){

        const rc = new Array(this.passiveUsers.length);
        for(let i=0;i<this.passiveUsers.length;i++){
            rc[i] = this.passiveUsers[i].uid;
        }
        return rc;
    }

    get smid(): number {
        return this._smid;
    }

    set smid(value: number) {
        this._smid = value;
    }

    get type(): statusMessageTypes {
        return this._type;
    }

    set type(value: statusMessageTypes) {
        this._type = value;
    }

    get passiveUsers(): any {
        return this._passiveUsers;
    }

    set passiveUsers(value: any) {
        this._passiveUsers = value;
    }
}
