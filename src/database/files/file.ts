import {pool} from "../pool";
// @ts-ignore
import {Connection} from "mysql2";
import {logger} from "../../util/logger";
import {isResultEmpty, ResultEmptyError} from "../../util/sqlHelpers";
import {FileData} from "../../models/file";
/*
    save the file data in the database
        returns: fileId
 */
export async function saveFileDataInDB(
    mimeType:string,
    realFileName:string,
    serverFileName:string,
    serverFilePath:string
):Promise<number> {
    return await new Promise<number>((resolve, reject) => {

        pool.getConnection(function(err:Error, conn:Connection) {
            if (err)
                reject(err)

            const query_str1 =
                "INSERT " +
                "INTO file (mimeType, realFileName, serverFileName, serverFilePath) " +
                "VALUES (" +
                    conn.escape(mimeType) + "," +
                    conn.escape(realFileName) + "," +
                    conn.escape(serverFileName) + "," +
                    conn.escape(serverFilePath) +
                ");";
            logger.verbose('SQL: %s',query_str1);

            conn.query(query_str1,(err:Error) => {
                if(err) {
                    pool.releaseConnection(conn);
                    reject(err)
                } else {
                    const query_str2 =
                        "SELECT LAST_INSERT_ID() " +
                        "AS 'fid';";
                    logger.verbose('SQL: %s', query_str2);

                    conn.query(query_str2, (err: Error, rows: any) => {
                        pool.releaseConnection(conn);
                        if (err)
                            reject(err);
                        else
                            resolve(rows[0].fid);
                    });
                }
            })
        })
    })
}
export async function setServerFileName(
    fileId:number,
    serverFileName:string
):Promise<void> {

    await new Promise<void>((resolve, reject) => {

        const query_str =
            "UPDATE file " +
            "SET serverFileName = " + pool.escape(serverFileName) + " " +
            "WHERE fid = " + fileId + ";";
        logger.verbose('SQL: %s',query_str);

        pool.query(query_str,(err:Error) => {
            if(err)
                reject(err)
            else
                resolve()
        })
    })
}
export async function setServerFilePath(
    fileId:number,
    serverFilePath:string
):Promise<void> {

    await new Promise<void>((resolve, reject) => {

        const query_str =
            "UPDATE file " +
            "SET serverFilePath = " + pool.escape(serverFilePath) + " " +
            "WHERE fid = " + fileId + ";";
        logger.verbose('SQL: %s',query_str);

        pool.query(query_str,(err:Error) => {
            if(err)
                reject(err)
            else
                resolve()
        })
    })
}
export async function getFileData(fileId:number):Promise<FileData> {

    return await new Promise<FileData>((resolve, reject) => {

        const query_str =
            "SELECT * " +
            "FROM file " +
            "WHERE fid = " + fileId + ";";
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