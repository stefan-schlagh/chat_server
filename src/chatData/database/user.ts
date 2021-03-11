import {pool} from "../../app";
import {instanceOfUserInfoSelf, UserBlockInfo, UserInfo, UserInfoSelf} from "../../models/user";
import {isResultEmpty} from "../../util/sqlHelpers";
import {logger} from "../../util/logger";
import {GroupChatInfoWithoutMembers} from "../../models/chat";

/*
    A user gets requested
        uidFrom --> uid of the requesting user
        uid -->  uid that should be requested
 */
export async function getUserInfo(uidFrom:number,uid:number):Promise<UserInfo> {

    const userInfo:UserInfo = await new Promise<UserInfo>(function(resolve, reject) {

        const query_str =
            "SELECT username " +
            "FROM user " +
            "WHERE uid = " + uid + ";";
        logger.verbose('SQL: %s',query_str);

        pool.query(query_str, async (err:Error, rows:any, fields:any) => {

            // Call reject on error states,
            // call resolve with results
            if (err) {
                reject(err);
            } else if(isResultEmpty(rows)){
                resolve({
                    username: '',
                    userExists: false,
                    blockedBySelf: false,
                    blockedByOther: false,
                    groups: []
                });
            } else if(rows.length === 1){
                try{
                    const blockInfo:UserBlockInfo = await getUserBlockInfo(uidFrom, uid);
                    resolve({
                        username: rows[0].username,
                        userExists: true,
                        blockedBySelf: blockInfo.blockedBySelf,
                        blockedByOther: blockInfo.blockedByOther,
                        groups: []
                    });
                }catch (err) {
                    reject(err);
                }
            } else {
                reject(new Error('uid ' + uid + ' appears more than once!'));
            }
        });
    });
    /*
        if user does not exist or is blocked, groups are not returned
     */
    if(userInfo.userExists && !(userInfo.blockedBySelf || userInfo.blockedByOther)) {
        userInfo.groups = await getGroupsOfUser(uidFrom,uid);
    }
    return userInfo;
}
/*
    Get all chats a user has together with the requesting
        uidFrom --> uid of the requesting user
        uidReq -->  uid that should be requested
 */
export async function getGroupsOfUser(uidFrom:number,uid:number):Promise<GroupChatInfoWithoutMembers[]> {
    /*
        SELECT *
        FROM groupchat
        WHERE gcid = ANY (SELECT gcid FROM groupchatmember WHERE uid = 1 AND isStillMember = 1)
        AND gcid = ANY (SELECT gcid FROM groupchatmember WHERE uid = 2 AND isStillMember = 1)
     */
    return await new Promise<GroupChatInfoWithoutMembers[]>((resolve, reject) => {

        const query_str =
            "SELECT gcid, name, description, isPublic " +
            "FROM groupchat " +
            "WHERE gcid = ANY (SELECT gcid FROM groupchatmember WHERE uid = " + uidFrom + " AND isStillMember = 1) " +
            "AND gcid = ANY (SELECT gcid FROM groupchatmember WHERE uid = " + uid + " AND isStillMember = 1);";
        logger.verbose('SQL: %s',query_str);

        pool.query(query_str,(err:Error,rows:any) => {
            if(err)
                reject(err);
            if(isResultEmpty(rows))
                resolve([]);
            const groups:GroupChatInfoWithoutMembers[] = new Array<GroupChatInfoWithoutMembers>(rows.length);
            for(let i = 0;i < rows.length;i++){
                groups[i] = {
                    id: rows[i].gcid,
                    chatName: rows[i].name,
                    description: rows[i].description,
                    public: rows[i].isPublic === 1
                }
            }
            resolve(groups);
        });
    });
}
/*
    returns info about the requesting user
 */
export async function getUserInfoSelf(uid:number):Promise<UserInfoSelf> {

    return await new Promise<UserInfoSelf>((resolve, reject) => {

        const query_str =
            "SELECT uid, username, time, email, isVerified " +
            "FROM user " +
            "WHERE uid = " + uid;
        logger.verbose('SQL: %s',query_str);

        pool.query(query_str,(err:Error,result:any[],fields:any) => {
            if(err)
                reject(err);
            else if(result.length !== 1)
                reject(new Error('invalid result!'));
            else
                try{
                    const time:Date = result[0].time;
                    const res:UserInfoSelf = {
                        uid: result[0].uid,
                        username: result[0].username,
                        email: result[0].email,
                        emailVerified: result[0].isVerified == 1,
                        accountCreationTime: time.toISOString()
                    };
                    instanceOfUserInfoSelf(res);
                    resolve(res);
                }catch(err){
                    reject(err);
                }
        });
    });
}
export async function getUserBlockInfo(uidFrom:number,uid:number):Promise<UserBlockInfo> {
    return {
        blockedBySelf: await hasBlocked(uidFrom,uid),
        blockedByOther: await hasBlocked(uid,uidFrom)
    }
}
/*
    return if userFrom blocked the other user
 */
export async function hasBlocked(uidFrom:number,uid:number):Promise<boolean> {

    return await new Promise<boolean>((resolve, reject) => {

        const query_str =
            "SELECT * " +
            "FROM blockedusers " +
            "WHERE uidFrom =  " + uidFrom + " AND uidAffected = " + uid + ";";
        logger.verbose('SQL: %s',query_str);

        pool.query(query_str,(err:Error,rows:any) => {
            if(err)
                reject(err);
            // if no results --> not blocked
            else if(isResultEmpty(rows))
                resolve(false);
            // if result --> true
            else
                resolve(true);
        })
    });
}
// a user gets blocked by user with uidFrom
export async function blockUser(uidFrom:number, uid:number):Promise<void> {
    // is user already blocked?
    const blockInfo:UserBlockInfo = await getUserBlockInfo(uidFrom, uid);
    // if not already blocked --> block
    if(!blockInfo.blockedBySelf)
        await new Promise<void>((resolve, reject) => {
            const query_str =
                "INSERT " +
                "INTO blockedusers (uidFrom,uidAffected) " +
                "VALUES (" + uidFrom + "," + uid + ");";
            logger.verbose('SQL: %s',query_str);

            pool.query(query_str,(err:Error) => {
                if(err)
                    reject(err);
                else
                    resolve();
            })
        })
}
// a user gets unblocked by user with uidFrom
export async function unblockUser(uidFrom:number,uid:number):Promise<void> {
    await new Promise<void>((resolve, reject) => {
         const query_str =
             "DELETE " +
             "FROM blockedusers " +
             "WHERE uidFrom =  " + uidFrom + " AND uidAffected = " + uid + ";";
        logger.verbose('SQL: %s',query_str);

        pool.query(query_str,(err:Error) => {
            if(err)
                reject(err);
            else
                resolve();
        })
    })
}
export interface UserUnreadMessages {
    chatsWithUnreadMessages:number,
    unreadMessages:number
}
/*
    return number of unread messages in all chats
        and number of chats with unread messages
 */
export async function getUnreadMessagesOfUser(uid:number):Promise<UserUnreadMessages> {

    const unreadMessages = {
        chatsWithUnreadMessages: 0,
        unreadMessages: 0
    }
    /*
        get normalChats with unread messages:

        SELECT uid1 AS 'uid', unreadMessages1 AS 'unreadMessages'
        FROM normalchat
        WHERE uid1 = uid AND unreadMessages1 > 1
        UNION
        SELECT uid2 AS 'uid', unreadMessages2 AS 'unreadMessages'
        FROM normalchat
        WHERE uid2 = uid AND unreadMessages2 > 1
     */
    await new Promise<void>((resolve, reject) => {
        const query_str =
            "SELECT uid1 AS 'uid', unreadMessages1 AS 'unreadMessages'" +
            "FROM normalchat " +
            "WHERE uid1 = " + uid + " AND unreadMessages1 > 0 " +
            "UNION " +
            "SELECT uid2 AS 'uid', unreadMessages2 AS 'unreadMessages'" +
            "FROM normalchat " +
            "WHERE uid2 = " + uid + " AND unreadMessages2 > 0 " +
            ";";
        logger.verbose('SQL: %s',query_str);

        pool.query(query_str,(err:Error,rows:any) => {
            if(err)
                reject(err);
            else if(!isResultEmpty(rows))
                for (const row of rows) {
                    unreadMessages.chatsWithUnreadMessages ++;
                    unreadMessages.unreadMessages += row.unreadMessages;
                }
            resolve();
        });

    })
    /*
        get groupChats with unread messages
     */
    await new Promise<void>((resolve, reject) => {
        const query_str =
            "SELECT uid, unreadMessages " +
            "FROM groupchatmember " +
            "WHERE uid = " + uid + " AND unreadMessages > 0 AND isStillMember = 1;";
        logger.verbose('SQL: %s',query_str);

        pool.query(query_str,(err:Error,rows:any) => {
            if(err)
                reject(err);
            else if(!isResultEmpty(rows))
                for (const row of rows) {
                    unreadMessages.chatsWithUnreadMessages ++;
                    unreadMessages.unreadMessages += row.unreadMessages;
                }
            resolve();
        })
    })
    return unreadMessages;
}