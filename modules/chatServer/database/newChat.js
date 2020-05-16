import {chatServer} from "../chat_server.js";
import User from "../user.js";
import {NormalChat} from "../chat.js";
import Message from "../message.js";
import {saveMessageInDB} from "./newMessage.js";

export async function newNormalChat(uidSelf,uidOther,usernameOther,message){

    /*
        does user already exist in server?
            if not --> gets created
    */
    if(chatServer.user.getIndex(uidOther) === -1){

        chatServer.user.add(uidOther,new User(chatServer.con,uidOther,usernameOther));
    }

    const ncid = await saveNormalChatInDb(uidSelf,uidOther);
    const user1 = chatServer.user.get(uidSelf);
    const user2 = chatServer.user.get(uidOther);

    const newChat = new NormalChat(ncid,user1,user2);
    chatServer.normalChats.add(ncid,newChat);

    user1.chats.add(ncid,newChat);
    user2.chats.add(ncid,newChat);
    /*
        if the other user is online, the chat gets added at him too
     */
    const online = user2.online;
    /*
        first message gets initialized
     */
    const firstMessage = new Message(newChat,user1,message);
    newChat.messages.push(firstMessage);
    /*
        message gets saved in the database
     */
    const mid = await saveMessageInDB(firstMessage);
    /*
        if the user is online, the data gets sent to it too
     */
    user2.addNewChat(newChat);

    return {
        ncid: ncid,
        mid: mid,
        //is the other user online
        online: online
    }
}
/*
    the chat gets saved in the database
 */
async function saveNormalChatInDb(uid1,uid2) {

    return new Promise(function(resolve,reject){

        const query_str1 =
            "INSERT " +
            "INTO normalchat(uid1,uid2)" +
            "VALUES('" + uid1 + "','" + uid2 + "');";

        chatServer.con.query(query_str1,(err) => {
            /*
                if no error has occured, the chatID gets requested
             */
            if(err) {
                reject(err);
            }else{

                const query_str2 =
                    "SELECT max(ncid) AS 'ncid' " +
                    "FROM normalchat;";

                chatServer.con.query(query_str2,(err,result,fields) => {

                    if(err){
                        reject(err);
                    }else{

                        resolve(result[0].ncid);
                    }
                });
            }
        })
    });
}