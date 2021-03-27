import {chatTypes} from "../../chatData/chat/chat";
import {logger} from "../../util/logger";
import {MessageDB, messageTypes} from "../../models/message";
import {isResultEmpty} from "../../util/sqlHelpers";
import {pool} from "../pool";
import {Connection} from "mysql2";
import {getGroupChatMember} from "../chat/groupChatMember";
import {getLatestGroupChatMemberChange} from "../chat/groupChatMember";
import {groupChatMemberChangeTypes} from "../../models/chat";

/*
    message gets saved in the database
        chatType: the type of the chat
        chatId: the id of the chat
        messageType: the type of the message
        uid: the id of the message author
        returns: the id of the new message
 */
export async function saveMessageInDB(
    chatType:chatTypes,
    chatId:number,
    messageType:messageTypes,
    uid:number
):Promise<number> {

    return new Promise((resolve, reject) => {

        pool.getConnection(function(err:Error, conn:Connection) {
            if (err)
                reject(err)
            const isGroupChatNumber = chatType === chatTypes.groupChat ? 1 : 0;

            const query_str1 =
                "INSERT " +
                "INTO message (" +
                    "date, " +
                    "isGroupChat, " +
                    "messageType," +
                    "cid," +
                    "uid" +
                ") VALUES (" +
                "CURRENT_TIMESTAMP(),'" +
                    isGroupChatNumber + "','" +
                    messageType + "','" +
                    chatId + "','" +
                    uid +
                "');";
            logger.verbose('SQL: %s', query_str1);

            conn.query(query_str1, (err: Error) => {
                if (err) {
                    pool.releaseConnection(conn);
                    reject(err);
                } else {
                    /*
                        message id og the message is selected
                     */
                    const query_str2 =
                        "SELECT LAST_INSERT_ID() " +
                        "AS 'mid';";
                    logger.verbose('SQL: %s', query_str2);

                    conn.query(query_str2, (err: Error, rows: any) => {
                        pool.releaseConnection(conn);
                        if (err) {
                            reject(err);
                        } else {
                            resolve(rows[0].mid);
                        }
                    });
                }
            });
        })
    });
}
/*
    messages are selected
 */
export async function selectMessages(num:number,chatType:chatTypes,chatId:number,minMid:number):Promise<MessageDB[]> {

    return new Promise((resolve,reject) => {

        const isGroupChat = chatType === chatTypes.groupChat ? 1 : 0;

        const query_str =
            "SELECT * " +
            "FROM message " +
            "WHERE isGroupChat = '" + isGroupChat + "' && cid = '" + chatId + "' && mid < " + minMid + " " +
            "ORDER BY mid DESC " +
            "LIMIT " + num + ";";
        logger.verbose('SQL: %s',query_str);

        pool.query(query_str,(err:Error,rows:any) => {
            if(err)
                reject(err);
            else {
                resolve(rows);
            }
        });
    });
}
export async function authMessage(mid:number,uid:number):Promise<boolean> {

    const messageData = await getMessageData(mid)

    if(messageData.isGroupChat !== 1)
        return true
    else {
        const groupChatMemberData = await getGroupChatMember(messageData.cid, uid);
        if(groupChatMemberData.isStillMember)
            return true;
        else {
            logger.info(groupChatMemberData.gcmid)
            const latestChange =
                await getLatestGroupChatMemberChange(
                    groupChatMemberData.gcmid,
                    groupChatMemberData.isStillMember === 1
                );

            if(latestChange.type === groupChatMemberChangeTypes.joined)
                return true;
            else // result.type === groupChatMemberChangeTypes.left
                // if user left before message was sent, return false
                return !(latestChange.date.getTime() < messageData.date.getTime())
        }
    }
}
export async function getMessageData(mid:number):Promise<MessageDB> {

    return await new Promise<MessageDB>((resolve, reject) => {

        const query_str =
            "SELECT * " +
            "FROM message " +
            "WHERE mid = " + mid + ";";
        logger.verbose('SQL: %s',query_str);

        pool.query(query_str,(err:Error,rows:any) => {
            if(err)
                reject(err)
            else if(rows.length !== 1)
                reject(new Error('message ' + mid + ' does not exist'))
            else
                resolve(rows[0])
        })
    })
}
/*
    messages are selected
 */
export async function getMidBelow(mid:number,cid:number,chatType:chatTypes):Promise<number> {

    return new Promise((resolve,reject) => {

        const isGroupChat = chatType === chatTypes.groupChat ? 1 : 0;

        const query_str =
            "SELECT mid " +
            "FROM message " +
            "WHERE isGroupChat = '" + isGroupChat + "' && cid = '" + cid + "' && mid < " + mid + " " +
            "ORDER BY mid DESC;";
        logger.verbose('SQL: %s',query_str);

        pool.query(query_str,(err:Error,rows:any) => {
            if(err)
                reject(err);
            else if(isResultEmpty(rows))
                resolve(-1)
            else {
                resolve(rows[0].mid);
            }
        });
    });
}
/*
    the message in this chat with the highest messageId gets searched
 */
export async function getMaxMid(chatType:chatTypes,chatId:number):Promise<number>{

    return new Promise((resolve,reject) => {

        const isGroupChat = chatType === chatTypes.groupChat ? 1 : 0;

        const query_str1 =
            "SELECT max(mid) " +
            "AS 'mid' " +
            "FROM message " +
            "WHERE isGroupChat = '" + isGroupChat + "' && cid = '" + chatId + "';";
        logger.verbose('SQL: %s',query_str1);

        pool.query(query_str1,(err:Error,rows:any) => {
            if(err)
                reject(err);
            /*
                is result empty?
             */
            else if(!isResultEmpty(rows)) {
                resolve(rows[0].mid);
            }
            /*
                no messages found in this chat
                    --> highest mid in all chats is searched
             */
            else {
                const query_str2 =
                    "SELECT max(mid) " +
                    "AS 'mid' " +
                    "FROM message;";
                logger.verbose('SQL: %s',query_str2);

                pool.query(query_str2,(err:Error,rows:any) => {
                    if(err)
                        reject(err);
                    /*
                        is mid defined?
                     */
                    else if(rows[0].mid !== null) {
                        resolve(rows[0].mid);
                    }else{
                        resolve(0);
                    }
                });
            }
        });
    });
}