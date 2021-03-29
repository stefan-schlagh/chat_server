import {logger} from "../../util/logger";
import {NormalMessageDB} from "../../models/message";
import {isResultEmpty} from "../../util/sqlHelpers";
import {pool} from "../pool";
import {Connection} from "mysql2";

export async function loadNormalMessage(mid:number):Promise<NormalMessageDB> {

    return new Promise((resolve, reject) => {

        const query_str =
            "SELECT nmid, text " +
            "FROM normalmessage " +
            "WHERE mid = " + mid + ";";
        logger.verbose('SQL: %s',query_str);

        pool.query(query_str,(err:Error,rows:any) => {
            if(err)
                reject(err);
            if(isResultEmpty(rows) || rows.length > 1)
                reject(new Error('invalid normalMessage: mid: ' + mid));
            else
                resolve(rows[0]);
        });
    });
}
/*
    normalMessage is saved in the database
        the id of the normalMessage is returned
 */
export async function saveNormalMessageInDB(mid:number,text:string):Promise<number> {

    return new Promise((resolve, reject) => {

        pool.getConnection(function(err:Error, conn:Connection) {
            if (err)
                reject(err)

            const query_str1 =
                "INSERT " +
                "INTO normalmessage(mid,text) " +
                "VALUES (" + mid + "," + pool.escape(text) + ");";
            logger.verbose('SQL: %s', query_str1);

            conn.query(query_str1, (err: Error) => {
                if (err) {
                    pool.releaseConnection(conn);
                    reject(err);
                }
                /*
                    nmid is selected
                 */
                const query_str2 =
                    "SELECT LAST_INSERT_ID() " +
                    "AS 'nmid';";
                logger.verbose('SQL: %s', query_str2);

                conn.query(query_str2, (err: Error, rows: any) => {
                    pool.releaseConnection(conn);
                    if (err)
                        reject(err);
                    if (isResultEmpty(rows))
                        reject(new Error('result is undefined!'))
                    else
                        resolve(rows[0].nmid);
                });
            });
        })
    });
}