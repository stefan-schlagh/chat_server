import {chatServer} from "../../chatServer.js";

/*
    the message in this chat with the highest messageId gets searched
 */
export async function getMaxMid(chat){

    return new Promise(function(resolve,reject){

        const isGroupChat = chat.type === 'groupChat' ? 1 : 0;

        const query_str =
            "SELECT max(mid) " +
            "AS 'mid' " +
            "FROM message " +
            "WHERE isGroupChat = '" + isGroupChat + "' && cid = '" + chat.chatId + "';";

        chatServer.con.query(query_str,(err,result,fields) => {

            if(err)
                reject(err);

            else{
                /*
                    no messages found in this chat
                 */
                if(result[0].mid !== null) {
                    chat.maxMid = result[0].mid;
                    resolve(true);
                }
                /*
                    keine Nachricht gefunden
                 */
                else {
                    chat.maxMid = -1;
                    resolve(false);
                }
            }
        });
    });
}
/*
    messages get loaded
        param num --> number how many messages should be loaded
 */
export async function loadMessages(chat,num){

    return new Promise(function(resolve,reject){

        const isGroupChat = chat.type === 'groupChat' ? 1 : 0;

        const query_str =
            "SELECT * " +
            "FROM message " +
            "WHERE isGroupChat = '" + isGroupChat + "' && cid = '" + chat.chatId + "' && mid < " + chat.getLowestMsgId() + " " +
            "ORDER BY mid DESC " +
            "LIMIT " + num + ";";

        chatServer.con.query(query_str,(err,result,fields) => {

            if(err)
                reject(err);
            else {
                resolve(result);
            }
        });
    });
}