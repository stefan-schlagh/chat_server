import {chatServer} from "../../chatServer.js";

/*
    A user gets requested
        uidFrom --> uid of the requesting user
        uidReq -->  uid that should be requested
 */
export async function getUser(uidFrom,uidReq){

    return new Promise(function(resolve, reject) {

        const query_str =
            "SELECT username " +
            "FROM user " +
            "WHERE uid = " + uidReq + ";";

        chatServer.con.query(query_str, function (err, rows, fields) {
            // Call reject on error states,
            // call resolve with results
            if (err) {
                reject(err);
            }
            
            let username = '';
            let userExists = false;
            let blocked = false;
            
            if(rows.length > 0){

                username = rows[0].username;
                userExists = true;
                blocked = false;
            }
            
            const result = {
                uidSelf: uidFrom,
                username: username,
                blocked: blocked,
                userExists: userExists
            };
            
            resolve(result);
        });

    });
}
/*
    all Users where the specified user does not have a chat with get selected and returned
    search does have to be validated
 */
export async function selectUsersNoChat(uid,search,limit,start = 0){

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
            "AND username LIKE " + chatServer.con.escape('%' + search + '%') + " " +
            "LIMIT " + start + "," + limit + ";";

        chatServer.con.query(query_str, function (err, rows, fields) {
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
export async function selectAllUsers(uid,search,limit,start = 0){

    return new Promise(function(resolve, reject) {

        const query_str =
            "SELECT uid, username " +
            "FROM user " +
            "WHERE NOT uid = '" + uid + "' " +
            "AND username LIKE " + chatServer.con.escape('%' + search + '%') + " " +
            "LIMIT " + start + "," + limit + ";";

        chatServer.con.query(query_str, function (err, rows, fields) {
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
    get the info of a user
 */
export async function getUserInfo(uidFrom,uidReq){

    return await getUser(uidFrom, uidReq);
}
/*
    users who are not in the group are returned
 */
export async function selectUsersNotInGroup(
    gcid,
    search,
    limit,
    start=0
){
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
            "AND u.username LIKE " + chatServer.con.escape('%' + search + '%') +
            "LIMIT " + start + "," + limit + ";";

        chatServer.con.query(query_str,(err,result,fields) => {
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