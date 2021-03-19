import {SimpleUser} from "../../models/user";
import {logger} from "../../util/logger";
import {pool} from "../pool";

const query_excludeBlockedUsers =
    "AND NOT uid = ANY(SELECT uidFrom AS 'uid' FROM blockedusers WHERE uidFrom = uid) " +
    "AND NOT uid = ANY(SELECT uidAffected AS 'uid' FROM blockedusers WHERE uidAffected = uid)"
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
            "FROM user " +
            "WHERE " +
                "(NOT uid = ANY (" +
                    "SELECT uid1 " +
                    "FROM normalchat " +
                    "WHERE uid1 = " + uid+" OR uid2 = " + uid + " )) " +
            "AND (NOT uid = ANY (" +
                    "SELECT uid2 " +
                    "FROM normalchat " +
                    "WHERE uid1 = " + uid + " OR uid2 = " + uid + " )) " +
            "AND username LIKE " + pool.escape('%' + search + '%') + " " +
            query_excludeBlockedUsers +
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
            query_excludeBlockedUsers +
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
            "AND u.username LIKE " + pool.escape('%' + search + '%') + " " +
            query_excludeBlockedUsers +
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