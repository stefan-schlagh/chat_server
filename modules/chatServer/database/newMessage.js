import {chatServer} from "../chat_server.js";
/*
    message gets saved in the Database
        param message:  Object of class Message
 */
export async function saveMessageInDB(message){

    return(new Promise(function(resolve, reject){

        const isGroupChat = message.chat.type === 'groupChat';
        const content = chatServer.con.escape(message.msg);

        const query_str1 =
            "INSERT " +
            "INTO message (content, date, isGroupChat, cid,uid) " +
            "VALUES (" + content + ",CURRENT_TIMESTAMP(),'" + isGroupChat+"','" + message.chat.chatId + "','" + message.author.uid + "');";

        chatServer.con.query(query_str1, err => {
            if(err){
                reject(err);
            }else {
                /*
                    mid dieser msg wird selected
                 */
                const query_str2 =
                    "SELECT max(mid) " +
                    "AS 'mid' FROM message";

                chatServer.con.query(query_str2, (err, result, fields) => {
                    if(err){
                        reject(err);
                    }else {
                        message.msgId = result[0].mid;
                        resolve(message.msgId);
                    }
                });
            }
        });
    }));
}