import {chatData} from "../data.js";
import {chatServer} from "../../chatServer.js";

export default class Mention {

    #_muid;
    #_user;
    #_textColumn;

    /*
        params:
            muid: the mention-id
            uid: the uid of the mentioned user
                if -1 it is left undefined
            textColumn: the column where the mention is at
     */
    constructor(muid,uid,textColumn) {

        this.muid = muid;
        /*
            if uid is -1, user is left undefined
         */
        if(uid!==-1) {
            const user = chatData.user.get(uid);
            if (user) {
                this.user = user;
            } else {
                throw new Error('user does not exist!');
            }
        }
        this.textColumn = textColumn;
    }
    /*
        mention is saved in the Database
     */
    async saveMentionInDB(nmid) {

        return new Promise((resolve, reject) => {

            const query_str1 =
                "INSERT " +
                "INTO mentioneduser (ncmid,uid,textColumn)" +
                "VALUES (" +
                    nmid + "," +
                    this.user.uid + "," +
                    this.textColumn +
                ");";

            chatServer.con.query(query_str1, (err) => {
                if (err)
                    reject(err);
                /*
                    the muid of this mention is selected
                 */
                const query_str2 =
                    "SELECT max(muid) AS 'muid'" +
                    "FROM mentioneduser;";

                chatServer.con.query(query_str2, (err, result) => {
                    if (err)
                        reject(err);
                    try {
                        this.muid = result[0].muid;
                        resolve();
                    } catch (e) {
                        reject(new Error('result is undefined!'))
                    }
                });
            });
        });
    }

    get muid() {
        return this.#_muid;
    }

    set muid(value) {
        this.#_muid = value;
    }

    get user() {
        return this.#_user;
    }

    set user(value) {
        this.#_user = value;
    }

    get textColumn() {
        return this.#_textColumn;
    }

    set textColumn(value) {
        this.#_textColumn = value;
    }
}