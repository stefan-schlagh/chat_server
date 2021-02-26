import {logger} from "../../util/logger";
import {pool} from "../../app";

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

        pool.query(query_str,(err:Error,result:any,fields:any) => {
            if(err)
                reject(err);
            resolve(result);
        });
    });
}