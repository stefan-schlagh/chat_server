import {pool} from "../../app";
import {instanceOfUserInfoSelf, SimpleUser, UserInfo, UserInfoSelf} from "../../models/user";
import {logger} from "../../util/logger";
import {GroupChatInfoWithoutMembers} from "../../models/chat";
import {isResultEmpty, ResultEmptyError} from "../../util/sqlHelpers";

/*
    A user gets requested
        uidFrom --> uid of the requesting user
        uid -->  uid that should be requested
 */
// TODO blocked
export async function getUserInfo(uidFrom:number,uid:number):Promise<UserInfo> {

    const userInfo:UserInfo = await new Promise(function(resolve, reject) {

        const query_str =
            "SELECT username " +
            "FROM user " +
            "WHERE uid = " + uid + ";";
        logger.verbose('SQL: %s',query_str);

        pool.query(query_str, function (err:Error, rows:any, fields:any) {

            let username:string = '';
            let userExists:boolean = false;
            let blocked:boolean = false;

            // Call reject on error states,
            // call resolve with results
            if (err) {
                reject(err);
            } else if(isResultEmpty(rows)){
                userExists = false
            } else if(rows.length === 1){
                username = rows[0].username;
                userExists = true;
                blocked = false;
            } else {
                throw new Error('uid ' + uid + ' appears more than once!');
            }

            let result:UserInfo = {
                username: username,
                blocked: blocked,
                userExists: userExists,
                groups: null
            };
            
            resolve(result);
        });
    });
    if(userInfo.userExists && !userInfo.blocked){
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
    })

}
/*
    all Users where the specified user does not have a chat with get selected and returned
    search does have to be validated
 */
export async function selectUsersNoChat(
    uid:number,
    search:string,
    limit:number,
    start:number = 0
):Promise<SimpleUser[]> {

    return new Promise(function(resolve, reject) {
        // The Promise constructor should catch any errors thrown on
        // this tick. Alternately, try/catch and reject(err) on catch

        /*
            SELECT uid, username
            FROM user
            WHERE (NOT uid = ANY (
                        SELECT uid1
                        FROM normalchat
                        WHERE uid1 = uid OR uid2 = uid))
            AND (NOT uid = ANY (
                        SELECT uid2
                        FROM normalchat
                        WHERE uid1 = uid OR uid2 = uid))
            AND username LIKE '%search%'
            LIMIT 10
         */
        const query_str =
            "SELECT uid, username " +
            "FROM user WHERE " +
                "(NOT uid = ANY (" +
                    "SELECT uid1 " +
                    "FROM normalchat " +
                    "WHERE uid1 = " + uid+" OR uid2 = " + uid + " )) " +
            "AND (NOT uid = ANY (" +
                    "SELECT uid2 " +
                    "FROM normalchat " +
                    "WHERE uid1 = " + uid + " OR uid2 = " + uid + " )) " +
            "AND username LIKE " + pool.escape('%' + search + '%') + " " +
            "LIMIT " + start + "," + limit + ";";
        logger.verbose('SQL: %s',query_str);

        pool.query(query_str, function (err:Error, rows:any, fields:any) {
            // Call reject on error states,
            // call resolve with results
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    });
}
/*
    all users are selected
 */
export async function selectAllUsers(
    uid:number,
    search:string,
    limit:number,
    start:number = 0
):Promise<SimpleUser[]> {

    return new Promise(function(resolve, reject) {

        const query_str =
            "SELECT uid, username " +
            "FROM user " +
            "WHERE NOT uid = '" + uid + "' " +
            "AND username LIKE " + pool.escape('%' + search + '%') + " " +
            "LIMIT " + start + "," + limit + ";";
        logger.verbose('SQL: %s',query_str);

        pool.query(query_str, function (err:Error, rows:any, fields:any) {
            // Call reject on error states,
            // call resolve with results
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    });
}
/*
    users who are not in the group are returned
 */
export async function selectUsersNotInGroup(
    gcid:number,
    search:string,
    limit:number,
    start:number = 0
):Promise<SimpleUser[]> {
    return await new Promise((resolve, reject) => {

        const query_str =
            "SELECT DISTINCT u.uid, u.username " +
            "FROM user u " +
            "WHERE NOT u.uid = " +
            "ANY (SELECT uid " +
                "FROM groupchatmember gcm " +
                "WHERE gcm.gcid = " + gcid + " " +
                "AND isStillMember = 1 " +
            ")" +
            "AND u.username LIKE " + pool.escape('%' + search + '%') +
            "LIMIT " + start + "," + limit + ";";
        logger.verbose('SQL: %s',query_str);

        pool.query(query_str,(err:Error,result:any,fields:any) => {
            if(err)
                reject(err);
            if(result) {
                resolve(result);
            }
            else
                resolve([]);
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