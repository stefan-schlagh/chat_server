import {chatServer} from "../chat_server.js";
import User from "../user.js";
import NormalChat from "../chat/normalChat.js";
import Message from "../message.js";
import {saveMessageInDB} from "./newMessage.js";
import {GroupChat} from "../chat/groupChat.js";
import GroupChatMember from "../groupChatMember.js";
import BinSearchArray from "../../util/BinSearch.js";

export async function newNormalChat(uidSelf,uidOther,usernameOther,message){

    /*
        does user already exist in server?
            if not --> gets created
    */
    if(chatServer.user.getIndex(uidOther) === -1){

        chatServer.user.add(uidOther,new User(uidOther,usernameOther));
    }

    const ncid = await saveNormalChatInDb(uidSelf,uidOther);
    const user1 = chatServer.user.get(uidSelf);
    const user2 = chatServer.user.get(uidOther);

    const newChat = new NormalChat(ncid,user1,user2);
    chatServer.normalChats.add(ncid,newChat);

    user1.chats.addChat(ncid,newChat);
    user2.chats.addChat(ncid,newChat);
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
/*
    new groupChat gets created
 */
export async function newGroupChat(userFrom,data,users){

    for(let i=0;i<users.length;i++){

        const user = users[i];
        if(chatServer.user.getIndex(user.uid) === -1){

            chatServer.user.add(user.uid,new User(user.uid,user.username));
        }
    }
    const gcid = await saveGroupChatInDB(data);
    await saveGroupChatMembersInDB(gcid,users.concat(userFrom));
    /*
        groupChatMembers are created
     */
    const groupChatMembers = new BinSearchArray();
    groupChatMembers.add(userFrom.uid,new GroupChatMember(chatServer.user.get(userFrom.uid),userFrom.isAdmin));

    for(let i=0;i<users.length;i++){

        const user = chatServer.user.get(users[i].uid);
        groupChatMembers.add(user.uid,new GroupChatMember(user,users[i].isAdmin));
    }

    const newChat = new GroupChat(gcid,groupChatMembers,data.name,data.description,data.isPublic);
    chatServer.groupChats.add(newChat.chatId,newChat);
    newChat.initMessages(() => {});
    /*
        chat gets added to the members
     */
    newChat.forEachUser((user,index,key) => {
        user.addLoadedChat(newChat);
        user.addNewChat(newChat);
    });
}
/*
    groupChat is saved in database
 */
async function saveGroupChatInDB(data){

    return new Promise(function(resolve,reject){

        const con = chatServer.con;
        const query_str1 =
            "INSERT " +
            "INTO groupchat (name,description,isPublic) " +
            "VALUES (" + con.escape(data.name) + "," + con.escape(data.description) + "," + con.escape(data.isPublic) + ")";

        con.query(query_str1,(err) => {
            /*
                if no error has occured, the chatID gets requested
             */
            if(err) {
                reject(err);
            }else{

                const query_str2 =
                    "SELECT max(gcid) AS 'gcid' " +
                    "FROM groupchat;";

                con.query(query_str2,(err,result,fields) => {

                    if(err){
                        reject(err);
                    }else{

                        resolve(result[0].gcid);
                    }
                });
            }
        });
    });
}
/*
    groupChatsMembers get saved in DB
 */
async function saveGroupChatMembersInDB(gcid,users){

    for(let i=0;i<users.length;i++){
        await saveGroupChatMemberInDB(gcid,users[i]);
    }
}
/*
    groupChatMember gets saved in DB
 */
async function saveGroupChatMemberInDB(gcid,user){

    return new Promise(function(resolve,reject){

        const con = chatServer.con;
        const query_str =
            "INSERT " +
            "INTO groupchatmember(uid,gcid,isAdmin) " +
            "VALUES (" + user.uid + ",'" + gcid + "'," + con.escape(user.isAdmin) + ");";

        con.query(query_str,(err) => {
            if(err)
                reject(err);
            resolve();
        })
    });
}