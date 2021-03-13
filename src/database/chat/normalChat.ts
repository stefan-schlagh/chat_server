import {logger} from "../../util/logger";
import {pool} from "../../app";

/*
    chat is saved in the database
 */
export async function saveChatInDB(uid1:number,uid2:number):Promise<number> {

    return new Promise((resolve,reject) => {

        const query_str1 =
            "INSERT " +
            "INTO normalchat(uid1,uid2)" +
            "VALUES(" +
                uid1 + "," +
                uid2 +
            ");";
        logger.verbose('SQL: %s',query_str1);

        pool.query(query_str1,(err:Error) => {
            /*
                if no error has occured, the chatID gets requested
             */
            if(err) {
                reject(err);
            }else{

                const query_str2 =
                    "SELECT max(ncid) AS 'ncid' " +
                    "FROM normalchat;";
                logger.verbose('SQL: %s',query_str2);

                pool.query(query_str2,(err:Error,rows:any) => {

                    if(err){
                        reject(err);
                    }else{
                        resolve(rows[0].ncid);
                    }
                });
            }
        })
    });
}
/*
        the number of unread messages in the database is updated
     */
export async function updateUnreadMessages(
    unreadMessages1:number,
    unreadMessages2:number,
    chatId:number
):Promise<void> {

    await new Promise((resolve, reject) => {
        const query_str =
            "UPDATE normalchat " +
            "SET unreadMessages1 = " + unreadMessages1 + ", " +
            "unreadMessages2 = " + unreadMessages2 + " " +
            "WHERE ncid = " + chatId + ";";
        logger.verbose('SQL: %s',query_str);

        pool.query(query_str,(err:Error) => {
            if(err)
                reject(err);
            else
                resolve();
        });
    })
}