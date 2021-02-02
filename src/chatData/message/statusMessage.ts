import Message,{messageTypes} from "./message";
import {chatServer} from "../../chatServer";
import {chatData} from "../data";
import User from "../user";
import {Chat} from "../chat/chat";
import {logger} from "../../util/logger";
import {StatusMessageContent} from "../../models/message";

export enum statusMessageTypes {
    chatCreated,
    usersAdded ,
    usersRemoved,
    usersJoined,
    usersLeft,
    usersMadeAdmin,
    usersRemovedAdmin,
    /*
        when user resigns from admin status
     */
    userResignedAdmin
}

export default class StatusMessage extends Message {

    private _smid:number;
    private _type:statusMessageTypes;
    private _passiveUsers:any = [];

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

        await this.loadStatusMsgType();
        await this.loadPassiveUsers();
    }

    async loadStatusMsgType(){

        return new Promise((resolve, reject) => {

            const query_str =
                "SELECT * " +
                "FROM statusmessage " +
                "WHERE mid = " + this.mid + ";";
            logger.verbose('SQL: %s',query_str);

            chatServer.con.query(query_str,(err:Error,result:any,fields:any) => {
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

        return new Promise((resolve, reject) => {

            const query_str =
                "SELECT * " +
                "FROM stmsgpassiveu " +
                "WHERE smid = " + this.smid + ";";
            logger.verbose('SQL: %s',query_str);

            chatServer.con.query(query_str,(err:Error,result:any,fields:any) => {
                if(err)
                   reject(err);

                this.passiveUsers = new Array(result.length);
                for(let i=0;i<result.length;i++){
                    /*
                        user is searched
                     */
                    const user = chatData.user.get(result[i].uid);
                    if(user){
                        this.passiveUsers[i] = user;
                    }else{
                        throw new Error('user does not exist!');
                    }
                }
                resolve();
            });
        });
    }
    /*
        statusMessage is initialized
            passiveUsers: array of uids
     */
    async initNewMessage(data:StatusMessageContent):Promise<void>{
        /*
            message gets saved
         */
        await super.initNewMessageInner();

        this.type = data.type;
        /*
            statusMsg is saved in the Database
            passive users are saved in the database
         */
        await this.saveStatusMsgInDB();
        await this.savePassiveUsersInDB(data.passiveUsers);
    }
    /*
        statusMsg is saved in the Database
     */
    async saveStatusMsgInDB(){

        return new Promise((resolve, reject) => {

            const query_str1 =
                "INSERT " +
                "INTO statusmessage(mid,type) " +
                "VALUES (" + this.mid + "," + this.type + ");";
            logger.verbose('SQL: %s',query_str1);

            chatServer.con.query(query_str1,(err:Error) => {
                if (err)
                    reject(err);
                /*
                    smid of this statusmessage is requested
                 */
                const query_str2 =
                    "SELECT max(smid) AS 'smid'" +
                    "FROM statusmessage;";
                logger.verbose('SQL: %s',query_str2);

                chatServer.con.query(query_str2,(err:Error,result:any,fields:any) => {
                    if (err)
                        reject(err);
                    try {
                        this.smid = result[0].smid;
                        resolve();
                    }catch (e) {
                        reject(new Error('result is undefined!'))
                    }
                });
            });
        });
    }
    /*
        passive users are saved in the Database
     */
    async savePassiveUsersInDB(passiveUsers:number[]){
        /*
            passiveUsers are created
         */
        this.passiveUsers = new Array(passiveUsers.length);

        for(let i=0;i<passiveUsers.length;i++){
            /*
                user is searched
             */
            const uid = passiveUsers[i];
            const user = chatData.user.get(uid);
            if(!user)
                throw new Error('user not defined');
            /*
                user is added to array
             */
            this.passiveUsers[i] = user;
        }

        await new Promise((resolve, reject) => {

            if(this.passiveUsers.length > 0) {
                let query_str =
                    "INSERT " +
                    "INTO stmsgpassiveu(smid,uid) " +
                    "VALUES ";
                /*
                    rows are added to query
                 */
                let i = 0;
                for (;i < this.passiveUsers.length-1; i++) {
                    query_str += "(" + this.smid + "," + this.passiveUsers[i].uid + "), "
                }
                query_str += "(" + this.smid + "," + this.passiveUsers[i].uid + ");";
                logger.verbose('SQL: %s',query_str);
                /*
                    rows are saved in the database
                 */
                chatServer.con.query(query_str,(err:Error,result:any,fields:any) => {
                    if (err)
                        reject(err);
                    resolve();
                });
            }else{
                resolve();
            }
        });
    }
    /*
        an object containing this message is returned
     */
    getMessageObject(){

        const msg:any = super.getMessageObject();

        msg.type = messageTypes.statusMessage;
        msg.content = {
            type: this.type,
            passiveUsers: this.getPassiveUsers()
        };
        return msg;
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
