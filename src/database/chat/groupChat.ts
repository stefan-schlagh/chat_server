import {pool} from "../../app";
import {logger} from "../../util/logger";
import {SearchPublicGroup} from "../../routes/group";
import {GroupChatDataOut} from "../../models/chat";
import {isResultEmpty} from "../../util/sqlHelpers";

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

        const query_str =
            "UPDATE groupchat " +
            "SET name = " + pool.escape(chatName) + ", " +
            "description = " + pool.escape(description) + ", " +
            "isPublic = " + isPublicNumber + " " +
            "WHERE gcid = " + chatId;
        logger.verbose('SQL: %s',query_str);

        pool.query(query_str,(err:Error) => {
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
/*
    get public groups
 */
export async function getPublicGroups(uid:number,search:SearchPublicGroup):Promise<GroupChatDataOut[]> {

    return await new Promise<GroupChatDataOut[]>((resolve, reject) => {

        const query_str = "" +
            "SELECT gcid AS 'id', name, description " +
            "FROM groupchat " +
            "WHERE isPublic = 1 " +
            // if isNotPart is true, exclude all chats where user is part of
            (search.isNotPart ? "AND NOT gcid = ANY (SELECT gcid FROM groupchatmember WHERE uid = " + uid + ") " : "") +
            "AND name LIKE " + pool.escape('%' + search.search + '%') + " " +
            "LIMIT " + search.start + "," + search.limit + ";";
        logger.verbose('SQL: %s',query_str);

        pool.query(query_str,(err:Error,rows:any) => {
            if(err)
                reject(err)
            else if(isResultEmpty(rows))
                resolve([])
            const data:GroupChatDataOut[] = [];
            for(const row of rows){
                data.push({
                    ...row,
                    isPublic: true
                })
            }
            resolve(data);
        })
    })
}