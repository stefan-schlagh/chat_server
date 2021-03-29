import {pool} from "../pool";
// @ts-ignore
import {Connection} from "mysql2";
import {logger} from "../../util/logger";
import {isResultEmpty, ResultEmptyError} from "../../util/sqlHelpers";
import {FileDataOut, MessageFileData, TempMessageFileData} from "../../models/file";

/*
    save the data of the temporary message file in the database
 */
export async function saveTempMessageFileDataInDB(
    fileId:number,
    uid:number
):Promise<number>{

    return await new Promise<number>((resolve, reject) => {

        pool.getConnection(function(err:Error, conn:Connection) {
            if (err)
                reject(err)

            const query_str1 =
                "INSERT " +
                "INTO tempmessagefile (fid, uid) " +
                "VALUES (" +
                    fileId + ',' +
                    uid +
                ");";
            logger.verbose('SQL: %s',query_str1);

            conn.query(query_str1,(err:Error) => {
                if(err) {
                    pool.releaseConnection(conn);
                    reject(err)
                } else {
                    const query_str2 =
                        "SELECT LAST_INSERT_ID() " +
                        "AS 'tmfid';";
                    logger.verbose('SQL: %s', query_str2);

                    conn.query(query_str2, (err: Error, rows: any) => {
                        pool.releaseConnection(conn);
                        if (err)
                            reject(err);
                        else
                            resolve(rows[0].tmfid);
                    });
                }
            })
        })
    })
}
/*
    save the data of the message file in the database
 */
export async function saveMessageFileDataInDB(
    fileId:number,
    mid:number
):Promise<number>{

    return await new Promise<number>((resolve, reject) => {

        pool.getConnection(function(err:Error, conn:Connection) {
            if (err)
                reject(err)

            const query_str1 =
                "INSERT " +
                "INTO messagefile (fid, mid) " +
                "VALUES (" +
                    fileId + ',' +
                    mid +
                ");";
            logger.verbose('SQL: %s',query_str1);

            conn.query(query_str1,(err:Error) => {
                if(err) {
                    pool.releaseConnection(conn);
                    reject(err)
                } else {
                    const query_str2 =
                        "SELECT LAST_INSERT_ID() " +
                        "AS 'mfid';";
                    logger.verbose('SQL: %s', query_str2);

                    conn.query(query_str2, (err: Error, rows: any) => {
                        pool.releaseConnection(conn);
                        if (err)
                            reject(err);
                        else
                            resolve(rows[0].mfid);
                    });
                }
            })
        })
    })
}
export async function getTempMessageFileData(fileId:number):Promise<TempMessageFileData> {

    return  await new Promise<TempMessageFileData>((resolve, reject) => {

        const query_str =
            "SELECT f.fid, m.uid, f.mimeType, f.realFileName, f.serverFileName, f.serverFilePath, f.date " +
            "FROM tempmessagefile m " +
            "INNER JOIN file f " +
            "ON m.fid = f.fid " +
            "WHERE f.fid = " + fileId + ";";
        logger.verbose('SQL: %s',query_str);

        pool.query(query_str,(err:Error,rows:any) => {
            if(err)
                reject(err)
            else if(isResultEmpty(rows))
                reject(new ResultEmptyError())
            else if(rows.length > 1)
                reject('fid ' + fileId + ' exists multiple times')
            else
                resolve(rows[0])
        })
    })
}
export async function getTempMessageFileDataByUser(uid:number):Promise<TempMessageFileData[]> {

    return  await new Promise<TempMessageFileData[]>((resolve, reject) => {

        const query_str =
            "SELECT f.fid, m.uid, f.mimeType, f.realFileName, f.serverFileName, f.serverFilePath, f.date " +
            "FROM tempmessagefile m " +
            "INNER JOIN file f " +
            "ON m.fid = f.fid " +
            "WHERE m.uid = " + uid + ";";
        logger.verbose('SQL: %s',query_str);

        pool.query(query_str,(err:Error,rows:any) => {
            if(err)
                reject(err)
            else
                resolve(rows)
        })
    })
}
export async function getMessageFileData(fileId:number):Promise<MessageFileData> {

    return  await new Promise<MessageFileData>((resolve, reject) => {

        const query_str =
            "SELECT f.fid, m.mid, f.mimeType, f.realFileName, f.serverFileName, f.serverFilePath, f.date " +
            "FROM messagefile m " +
            "INNER JOIN file f " +
            "ON m.fid = f.fid " +
            "WHERE f.fid = " + fileId + ";";
        logger.verbose('SQL: %s',query_str);

        pool.query(query_str,(err:Error,rows:any) => {
            if(err)
                reject(err)
            else if(isResultEmpty(rows))
                reject(new ResultEmptyError())
            else if(rows.length > 1)
                reject('fid ' + fileId + ' exists multiple times')
            else
                resolve(rows[0])
        })
    })
}
export async function deleteTempMessageFileData(fileId:number):Promise<void> {

    return  await new Promise<void>((resolve, reject) => {

        const query_str =
            "DELETE " +
            "FROM tempmessagefile " +
            "WHERE fid = " + fileId + ";";
        logger.verbose('SQL: %s',query_str);

        pool.query(query_str,(err:Error) => {
            if(err)
                reject(err)
            resolve()
        })
    })
}
export async function deleteTempMessageFilesByUser(uid:number):Promise<void> {

    await new Promise<void>((resolve, reject) => {
        const query_str =
            "DELETE " +
            "FROM file " +
            "WHERE fid = ANY (SELECT fid FROM tempmessagefile WHERE uid = " + uid + ");"
        logger.verbose('SQL: %s',query_str);
        pool.query(query_str,(err:Error) => {
            if(err)
                reject(err)
            resolve()
        })
    })
    await new Promise<void>((resolve, reject) => {
        const query_str =
            "DELETE " +
            "FROM tempmessagefile " +
            "WHERE uid = " + uid + ";"
        logger.verbose('SQL: %s',query_str);
        pool.query(query_str,(err:Error) => {
            if(err)
                reject(err)
            resolve()
        })
    })
}
/*
    get message files by message id
 */
export async function getMessageFiles(mid:number):Promise<FileDataOut[]> {

    return  await new Promise<FileDataOut[]>((resolve, reject) => {

        const query_str =
            "SELECT f.fid, f.realFileName as 'fileName', f.mimeType " +
            "FROM messagefile m " +
            "INNER JOIN file f " +
            "ON m.fid = f.fid " +
            "WHERE m.mid = " + mid + ";";
        logger.verbose('SQL: %s',query_str);

        pool.query(query_str,(err:Error,rows:any) => {
            if(err)
                reject(err)
            resolve(rows)
        })
    })
}