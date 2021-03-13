import {logger} from "../../util/logger";
import {pool} from "../../app";
import {NormalMessageDB} from "../../models/message";
import {isResultEmpty} from "../../util/sqlHelpers";

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

        const query_str1 =
            "INSERT " +
            "INTO normalmessage(mid,text) " +
            "VALUES (" + mid + "," + pool.escape(text) + ");";
        logger.verbose('SQL: %s',query_str1);

        pool.query(query_str1,(err:Error) => {
            if (err)
                reject(err);
            /*
                nmid is selected
             */
            const query_str2 =
                "SELECT max(nmid) AS 'nmid' " +
                "FROM normalmessage;";
            logger.verbose('SQL: %s',query_str2);

            pool.query(query_str2,(err:Error,rows:any) => {
                if (err)
                    reject(err);
                if(isResultEmpty(rows))
                    reject(new Error('result is undefined!'))
                else
                    resolve(rows[0].nmid);
            });
        });
    });
}