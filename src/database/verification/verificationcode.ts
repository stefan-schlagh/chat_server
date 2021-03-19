import {logger} from "../../util/logger";
import {isResultEmpty, ResultEmptyError} from "../../util/sqlHelpers";
import {verificationCodeTypes} from "../../verification/code";
import {VerificationCodeDB} from "../../models/code";
import {pool} from "../pool";

export async function saveCodeInDB(type: verificationCodeTypes, uid: number, hash: string): Promise<number> {

    const query_str =
        "INSERT " +
        "INTO verificationcode(type,uid,hash,date) " +
        "VALUES(" + type.valueOf() + "," + uid + "," + pool.escape(hash) + ",CURRENT_TIMESTAMP());";
    logger.verbose('SQL: %s', query_str);

    await new Promise((resolve, reject) => {
        pool.query(query_str, async (err: Error, result: any) => {
            if (err)
                reject(err);
            resolve();
        });
    });
    return await new Promise((resolve, reject) => {
        const query_str1 =
            "SELECT max(vcid) " +
            "AS 'vcid' " +
            "FROM verificationcode " +
            "WHERE uid = " + uid + ";";
        logger.verbose('SQL: %s', query_str1);

        pool.query(query_str1, (err: Error, rows: any) => {
            if (err)
                reject(err);
            else if (isResultEmpty(rows))
                reject(new ResultEmptyError());
            else
                resolve(rows[0].vcid);
        });
    });
}
export async function deleteOldCodes(uid:number):Promise<void> {
    //codes older than 2 days are deleted
    await new Promise((resolve, reject) => {
        const query_str =
            "DELETE " +
            "FROM verificationcode " +
            "WHERE uid = " + uid + " AND DATEDIFF(CURRENT_TIMESTAMP(),date) > 2;";
        logger.verbose('SQL: %s',query_str);

        pool.query(query_str,(err:Error) => {
            if(err)
                reject(err);
            resolve();
        });
    });
}
export async function getCodes(uid:number,type:verificationCodeTypes):Promise<VerificationCodeDB[]> {
    return  await new Promise((resolve, reject) => {
        const query_str =
            "SELECT vcid, type, hash " +
            "FROM verificationcode " +
            "WHERE uid = " + uid + " " +
            "AND type = " + type.valueOf() + ";";
        logger.verbose('SQL: %s',query_str);

        pool.query(query_str,(err:Error,rows:any) => {
            if(err)
                reject(err);
            else if(isResultEmpty(rows))
                resolve([]);
            else
                resolve(rows);
        });
    });
}