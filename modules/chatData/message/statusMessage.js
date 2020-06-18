import Message from "./message.js";
import {chatServer} from "../../chatServer.js";
import chatData from "../chatData.js";

export const statusMessageTypes = {
    chatCreated: 0,
    usersAdded: 1,
    usersRemoved: 2,
    usersJoined: 3,
    usersLeft: 4
};

export default class StatusMessage extends Message {

    #_smid;
    #_type;
    #_passiveUsers;

    constructor(chat,author,mid) {
        super(
            chat,
            author,
            '',
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
     */
    async initNewMessage(type,passiveUsers){

        this.type = type;
        this.passiveUsers = passiveUsers;
        /*
            statusMsg is saved in the Database
            passive users are saved in the database
         */
        await this.saveStatusMsgInDB();
        await this.savePassiveUsersInDB()
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
    async savePassiveUsersInDB(){

        return new Promise((resolve, reject) => {

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
                });
            }else{
                resolve();
            }
        });
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
