import {chatServer} from "../chat_server.mjs";

export function selectUser(uid){

}
/*
    all Users where the specified user does not have a chat with get selected and returned
    search does have to be validated
 */
export async function selectUsersNoChat(uid,search,limit){

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
                    "WHERE uid1 = "+uid+" OR uid2 = "+uid+" )) " +
            "AND (NOT uid = ANY (" +
                    "SELECT uid2 " +
                    "FROM normalchat " +
                    "WHERE uid1 = "+uid+" OR uid2 = "+uid+" )) " +
            "AND username LIKE '%"+search+"%' " +
            "LIMIT " + limit + ";";

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