import {pool} from "../../app";
import {logger} from "../../util/logger";

/*
    chat is saved in the database
 */
export async function saveChatInDB(
    chatName:string,
    description:string,
    isPublic:boolean
):Promise<number> {

    return await new Promise<number>((resolve,reject) => {

        const isPublicNumber = isPublic ? 1 : 0;

        const query_str1 =
            "INSERT " +
            "INTO groupchat (name,description,isPublic) " +
            "VALUES (" +
                pool.escape(chatName) + "," +
                pool.escape(description) + "," +
                isPublicNumber +
            ")";
        logger.verbose('SQL: %s',query_str1);

        pool.query(query_str1,(err:Error) => {
            /*
                if no error has occured, the chatID gets requested
             */
            if(err) {
                reject(err);
            }else{

                const query_str2 =
                    "SELECT max(gcid) AS 'gcid' " +
                    "FROM groupchat;";
                logger.verbose('SQL: %s',query_str2);

                pool.query(query_str2,(err:Error,rows:any) => {

                    if(err){
                        reject(err);
                    }else{
                        resolve(rows[0].gcid);
                    }
                });
            }
        });
    });
}
/*
    info is updated in the database:
        chatName
        description
        isPublic
 */
export async function updateGroupChat(
    chatId:number,
    chatName:string,
    description:string,
    isPublic:boolean
):Promise<void> {

    await new Promise((resolve,reject) => {

        const isPublicNumber = isPublic ? 1 : 0;

        const query_str1 =
            "UPDATE groupchat " +
            "SET name = " + pool.escape(chatName) + ", " +
            "description = " + pool.escape(description) + ", " +
            "isPublic = " + isPublicNumber + " " +
            "WHERE gcid = " + chatId;
        logger.verbose('SQL: %s',query_str1);

        pool.query(query_str1,(err:Error) => {
            /*
                if no error has occured, the chatID gets requested
             */
            if(err)
                reject(err);
            else
                resolve();
        });
    });
}