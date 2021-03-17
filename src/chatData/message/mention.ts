import {chatData} from "../data";
import User from "../user";
import {logger} from "../../util/logger";
import {pool} from "../../database/pool";

export default class Mention {

    private _muid:number;
    private _user:User;
    private _textColumn:number;

    /*
        params:
            muid: the mention-id
            uid: the uid of the mentioned user
                if -1 it is left undefined
            textColumn: the column where the mention is at
     */
    constructor(muid:number,uid:number,textColumn:number) {

        this.muid = muid;
        /*
            if uid is -1, user is left undefined
         */
        if(uid !==- 1) {
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
    async saveMentionInDB(nmid:number) {

        return new Promise((resolve, reject) => {

            const query_str1 =
                "INSERT " +
                "INTO mentioneduser (ncmid,uid,textColumn)" +
                "VALUES (" +
                    nmid + "," +
                    this.user.uid + "," +
                    this.textColumn +
                ");";
            logger.verbose('SQL: %s',query_str1);

            pool.query(query_str1, (err:Error) => {
                if (err)
                    reject(err);
                /*
                    the muid of this mention is selected
                 */
                const query_str2 =
                    "SELECT max(muid) AS 'muid'" +
                    "FROM mentioneduser;";
                logger.verbose('SQL: %s',query_str2);

                pool.query(query_str2, (err:Error, result:any) => {
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

    get muid(): number {
        return this._muid;
    }

    set muid(value: number) {
        this._muid = value;
    }

    get user(): User {
        return this._user;
    }

    set user(value: User) {
        this._user = value;
    }

    get textColumn(): number {
        return this._textColumn;
    }

    set textColumn(value: number) {
        this._textColumn = value;
    }
}