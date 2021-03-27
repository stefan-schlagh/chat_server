import {logger} from "../../util/logger";
import {pool} from "../pool";
import {GroupChatDataOfUser} from "../../models/chat";

export interface NormalChatDataDB {
    ncid: number,
    uid1: number,
    uname1: string,
    unreadMessages1: number,
    uid2: number,
    uname2: string,
    unreadMessages2: number
}
// normalChats of the user are selected
export async function selectNormalChats(uid:number):Promise<NormalChatDataDB[]> {

    return new Promise<NormalChatDataDB[]>((resolve, reject) => {

        const query_str =
            "SELECT nc.ncid, " +
                "nc.uid1, " +
                "u1.username AS 'uname1', " +
                "nc.unreadMessages1, " +
                "nc.uid2, " +
                "u2.username AS 'uname2', " +
                "nc.unreadMessages2 " +
            "FROM normalchat nc " +
            "INNER JOIN user u1 " +
            "ON nc.uid1 = u1.uid " +
            "INNER JOIN user u2 " +
            "ON nc.uid2 = u2.uid " +
            "WHERE uid1 = '" + uid + "' OR uid2 = '" + uid + "';";
        logger.verbose('SQL: %s',query_str);

        pool.query(query_str,(err:Error,rows:any) => {
            if(err)
                reject(err);
            resolve(rows);
        });
    });
}
// all groupChats of the user are selected
export async function selectGroupChatsOfUser(uid:number):Promise<GroupChatDataOfUser[]> {

    return new Promise<GroupChatDataOfUser[]>((resolve, reject) => {

        const query_str =
            "SELECT gc.gcid, gc.name, gc.description, gc.isPublic, gcm.isStillMember, gcm.gcmid " +
            "FROM groupchatmember gcm " +
            "INNER JOIN groupchat gc " +
            "ON gcm.gcid = gc.gcid " +
            "WHERE gcm.uid = '" + uid + "';";
        logger.verbose('SQL: %s',query_str);

        pool.query(query_str,(err:Error,rows:any) => {
            if(err)
                reject(err);
            resolve(rows);
        });
    });
}