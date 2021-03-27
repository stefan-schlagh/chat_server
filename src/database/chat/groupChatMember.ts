import {logger} from "../../util/logger";
import {GroupChatDataOfUser, GroupChatMemberChange, groupChatMemberChangeTypes} from "../../models/chat";
import {pool} from "../pool";

export interface GroupChatMemberDB {
    uid: number,
    username: string,
    gcmid: number,
    isAdmin: number,
    unreadMessages: number,
    isStillMember: number
}
// groupChatMembers are selected
export async function selectGroupChatMembers(chatId:number):Promise<GroupChatMemberDB[]> {

    return new Promise<GroupChatMemberDB[]>((resolve, reject) => {

        const query_str =
            "SELECT u.uid, " +
            "u.username, " +
            "gcm.isAdmin, " +
            "gcm.gcmid, " +
            "gcm.unreadMessages, " +
            "gcm.isStillMember " +
            "FROM user u " +
            "INNER JOIN groupchatmember gcm " +
            "ON u.uid = gcm.uid " +
            "WHERE gcm.gcid = '" + chatId + "';";
        logger.verbose('SQL: %s',query_str);

        pool.query(query_str,(err:Error,rows:any) => {
            if(err)
                reject(err);
            resolve(rows);
        });
    });
}
/*
    groupChatMember is saved in the database
 */
export async function saveGroupChatMemberInDB(uid:number,chatId:number,isAdmin:boolean):Promise<number> {

    //save groupChatMember
    return await new Promise((resolve, reject) => {

        pool.getConnection(function(err:Error, conn:any) {
            if (err)
                reject(err)

            const isAdminNumber = isAdmin  ? 1 : 0;
            const query_str1 =
                "INSERT " +
                "INTO groupchatmember(uid,gcid,isAdmin,isStillMember) " +
                "VALUES (" +
                uid + ",'" +
                chatId + "'," +
                isAdminNumber +
                ",1" +
                ");";
            logger.verbose('SQL: %s', query_str1);

            conn.query(query_str1, (err: Error) => {
                if (err) {
                    pool.releaseConnection(conn);
                    reject(err);
                } else {
                    /*
                        the gcmid is selected
                     */
                    const query_str2 =
                        "SELECT LAST_INSERT_ID() " +
                        "AS 'gcmid';";
                    logger.verbose('SQL: %s', query_str2);

                    conn.query(query_str2, (err: Error, rows: any) => {
                        pool.releaseConnection(conn);
                        if (err)
                            reject(err);
                        else {
                            resolve(rows[0].gcmid)
                        }
                    })
                }
            })
        })
    });
}
/*
    unread messages are updated in the Database
 */
export async function updateUnreadMessages(gcmid:number,unreadMessages:number):Promise<void>{

    await new Promise((resolve, reject) => {
        const query_str =
            "UPDATE groupchatmember " +
            "SET unreadMessages = " + unreadMessages + " " +
            "WHERE gcmid = " + gcmid + ";";
        logger.verbose('SQL: %s',query_str);

        pool.query(query_str,(err:Error) => {
            if(err)
                reject(err);
            resolve();
        });
    });
}
/*
        groupChatMember is updated in the DB
     */
export async function updateGroupChatMember(gcmid:number,isAdmin:boolean,isStillMember:boolean):Promise<void>{

    await new Promise((resolve, reject) => {

        const isAdminNumber = isAdmin ? 1 : 0;
        const isStillMemberNumber = isStillMember ? 1 : 0;

        const query_str =
            "UPDATE groupchatmember " +
            "SET isAdmin = '" + isAdminNumber + "', " +
            "isStillMember = '" + isStillMemberNumber + "' " +
            "WHERE gcmid = " + gcmid + ";";
        logger.verbose('SQL: %s',query_str);

        pool.query(query_str,(err:Error) => {
            if(err)
                reject(err);
            resolve();
        });
    });
}
/*
    add a new groupChatMemberChange
 */
export async function addGroupChatMemberChange(
    gcmid:number,
    type:groupChatMemberChangeTypes
):Promise<void> {

    await new Promise<void>((resolve, reject) => {

        const query_str =
            "INSERT " +
            "INTO groupchatmemberchange (date,gcmid,type) " +
            "VALUES (CURRENT_TIMESTAMP()," + gcmid + "," + type.valueOf() + ");";
        logger.verbose('SQL: %s',query_str);

        pool.query(query_str,(err:Error) => {
            if(err)
                reject(err);
            resolve();
        });
    });
}
// get groupChatMember
export async function getGroupChatMember(gcid:number,uid:number):Promise<GroupChatDataOfUser> {

    return new Promise<GroupChatDataOfUser>((resolve, reject) => {

        const query_str =
            "SELECT gc.gcid, gc.name, gc.description, gc.isPublic, gcm.isStillMember, gcm.gcmid " +
            "FROM groupchatmember gcm " +
            "INNER JOIN groupchat gc " +
            "ON gcm.gcid = gc.gcid " +
            "WHERE gc.gcid = " + gcid + " AND gcm.uid = " + uid + ";";
        logger.verbose('SQL: %s',query_str);

        pool.query(query_str,(err:Error,rows:any) => {
            if(err)
                reject(err);
            else if(rows.length !== 1)
                reject(new Error('groupchat ' + gcid + ' does not exist'))
            else
                resolve(rows[0]);
        });
    });
}
export async function getLatestGroupChatMemberChange(
    gcmid:number,
    isStillMember:boolean
):Promise<GroupChatMemberChange>{
    /*
        get last change
            if no change -> date 0
     */
    return  await new Promise<GroupChatMemberChange>((resolve, reject) => {
        /*const query_str =
            "SELECT * " +
            "FROM groupchatmemberchange " +
            "WHERE gcmid = " + gcmid + " AND DATEDIFF( date, FROM_UNIXTIME(" + date.getTime() + " / 1000) ) < 1 " +
            "ORDER BY DATEDIFF( date, FROM_UNIXTIME(" + date.getTime() + " / 1000) ) " +
            "LIMIT 1;";*/
        const query_str =
            "SELECT date, type " +
            "FROM groupchatmemberchange " +
            "WHERE gcmid = " + gcmid + " " +
            "ORDER BY gcmcid DESC " +
            "LIMIT 1;";
        logger.verbose('SQL: %s',query_str);

        pool.query(query_str, (err: Error, result: any) => {
            if (err)
                reject(err);
            else if (!result || result.length === 0)
                resolve({
                    type: isStillMember ? groupChatMemberChangeTypes.joined : groupChatMemberChangeTypes.left,
                    date: new Date(0)
                });
            else
                resolve({
                    type: result[0].type,
                    date: result[0].date
                });
        });
    });
}