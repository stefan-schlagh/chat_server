import {logger} from "../../util/logger";
import {StatusMessageDB, statusMessageTypes} from "../../models/message";
import {isResultEmpty} from "../../util/sqlHelpers";
import {pool} from "../pool";

// load the statusMessage
export async function loadStatusMessage(mid:number):Promise<StatusMessageDB> {

    return new Promise((resolve, reject) => {

        const query_str =
            "SELECT smid,type " +
            "FROM statusmessage " +
            "WHERE mid = " + mid + ";";
        logger.verbose('SQL: %s',query_str);

        pool.query(query_str,(err:Error,rows:any) => {
            if(err)
                reject(err);
            if(isResultEmpty(rows) || rows.length > 1)
                reject(new Error('invalid statusMessage: mid: ' + mid));
            else
                resolve(rows[0]);
        })
    });
}
// load passive users
export async function loadPassiveUsers(smid:number):Promise<number[]> {

    return new Promise((resolve, reject) => {

        const query_str =
            "SELECT uid " +
            "FROM stmsgpassiveu " +
            "WHERE smid = " + smid + ";";
        logger.verbose('SQL: %s',query_str);

        pool.query(query_str,(err:Error,rows:any) => {
            if(err)
                reject(err);

            const passiveUsers:number[] = new Array(rows.length);
            for(let i=0;i<rows.length;i++){
                passiveUsers[i] = rows[i].uid;
            }
            resolve(passiveUsers);
        });
    });
}
/*
    statusMsg is saved in the Database
        returns the id of the statusMessage
 */
export async function saveStatusMessageInDB(mid:number,type:statusMessageTypes):Promise<number> {

    return new Promise((resolve, reject) => {

        pool.getConnection(function(err:Error, conn:any) {
            if (err)
                reject(err)

            const query_str1 =
                "INSERT " +
                "INTO statusmessage(mid,type) " +
                "VALUES (" + mid + "," + type + ");";
            logger.verbose('SQL: %s', query_str1);

            conn.query(query_str1, (err: Error) => {
                if (err) {
                    pool.releaseConnection(conn);
                    reject(err);
                }
                /*
                    smid of this statusmessage is requested
                 */
                const query_str2 =
                    "SELECT LAST_INSERT_ID() " +
                    "AS 'smid';";
                logger.verbose('SQL: %s', query_str2);

                conn.query(query_str2, (err: Error, rows: any) => {
                    pool.releaseConnection(conn);
                    if (err)
                        reject(err);
                    if (isResultEmpty(rows))
                        reject(new Error('result is undefined!'))
                    else
                        resolve(rows[0].smid);
                });
            });
        })
    });
}
// passive users are saved in the database, uid for each user is saved
export async function savePassiveUsersInDB(smid:number,passiveUsers:number[]):Promise<void> {
    await new Promise((resolve, reject) => {

        let query_str =
            "INSERT " +
            "INTO stmsgpassiveu(smid,uid) " +
            "VALUES ";
        /*
            rows are added to query
         */
        let i = 0;
        for (;i < passiveUsers.length-1; i++) {
            query_str += "(" + smid + "," + passiveUsers[i] + "), "
        }
        query_str += "(" + smid + "," + passiveUsers[i] + ");";
        logger.verbose('SQL: %s',query_str);
        /*
            rows are saved in the database
         */
        pool.query(query_str,(err:Error) => {
            if (err)
                reject(err);
            resolve();
        });
    });
}