import {chatServer} from "../../chatServer.js";

/*
    a specific groupChat is loaded
 */
export async function selectGroupChat(gcid){

    return new Promise(((resolve, reject) => {

        const con = chatServer.con;
        const query_str =
            "SELECT  * " +
            "FROM groupchat " +
            "WHERE gcid = " + con.escape(gcid) + ";";

        con.query(query_str,(err,result,fields) => {
            if(err)
                reject(err);
            else if(!result)
                resolve({exists: false});
            else if(result.length === 0)
                resolve({exists: false});
            else
                resolve({
                    exists: true,
                    name: result[0].name,
                    description: result[0].description,
                    public: (result[0].isPublic !== 0)
                })
        })

    }));
}
/*
    returns true, if the user with this uid is part of the groupChat
 */
export async function isUserPartOfGroup(uid,gcid){

    return new Promise(((resolve, reject) => {

        const con = chatServer.con;
        const query__str =
            "SELECT * " +
            "FROM groupchatmember gcm " +
            "JOIN groupchat gc " +
            "ON gcm.gcid = gc.gcid " +
            "WHERE gcm.uid = " + con.escape(uid) + " " +
            "AND gcm.gcid = " + con.escape(gcid) + ";";

        con.query(query__str,(err,result,fields) => {
           if(err)
               reject(err);
           else if(!result)
                resolve(false);
           else if(result.length === 0)
                resolve(false);
           else
               resolve(true);
        });
    }));
}
/*
    all users in the specified groupchat get selected
 */
export async function selectUsers(gcid){

    return new Promise((resolve, reject) => {

        const con = chatServer.con;
        const query_str =
            "SELECT u.uid, " +
                "u.username, " +
                "gcm.isAdmin, " +
                "gcm.gcmid, " +
                "gcm.unreadMessages " +
            "FROM user u " +
            "JOIN groupchatmember gcm " +
            "ON u.uid = gcm.uid " +
            "WHERE gcm.gcid = '" + gcid + "';";

        con.query(query_str,(err,result,fields) => {
            if(err)
                reject(err);
            resolve(result);
        });
    });
}