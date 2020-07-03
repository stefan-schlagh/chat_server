import Message,{messageTypes} from "./message.js";
import {chatServer} from "../../chatServer.js";
import {chatData} from "../data.js";

export const statusMessageTypes = {
    chatCreated: 0,
    usersAdded: 1,
    usersRemoved: 2,
    usersJoined: 3,
    usersLeft: 4,
    usersMadeAdmin: 5,
    usersRemovedAdmin: 6,
    /*
        when user resigns from admin status
     */
    userResignedAdmin: 7
};

export default class StatusMessage extends Message {

    #_smid;
    #_type;
    #_passiveUsers = [];

    constructor(chat,author,mid = -1) {
        super(
            chat,
            author,
            messageTypes.statusMessage,
            mid
        );
    }

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

            chatServer.con.query(query_str,(err,result,fields) => {
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

            chatServer.con.query(query_str,(err,result,fields) => {
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
    async initNewMessage(type,passiveUsers){
        /*
            message gets saved
         */
        await super.initNewMessage();

        this.type = type;
        /*
            statusMsg is saved in the Database
            passive users are saved in the database
         */
        await this.saveStatusMsgInDB();
        await this.savePassiveUsersInDB(passiveUsers);
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

            chatServer.con.query(query_str1,(err) => {
                if (err)
                    reject(err);
                /*
                    smid of this statusmessage is requested
                 */
                const query_str2 =
                    "SELECT max(smid) AS 'smid'" +
                    "FROM statusmessage;";

                chatServer.con.query(query_str2,(err,result,fields) => {
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
    async savePassiveUsersInDB(passiveUsers){
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
                /*
                    rows are saved in the database
                 */
                chatServer.con.query(query_str,(err,result,fields) => {
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

        const msg = super.getMessageObject();

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

    get smid() {
        return this.#_smid;
    }

    set smid(value) {
        this.#_smid = value;
    }

    get passiveUsers() {
        return this.#_passiveUsers;
    }

    set passiveUsers(value) {
        this.#_passiveUsers = value;
    }

    get type() {
        return this.#_type;
    }

    set type(value) {
        this.#_type = value;
    }
}
