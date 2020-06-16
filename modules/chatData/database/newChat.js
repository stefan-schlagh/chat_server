import {chatServer} from "../../chatServer.js";
import chatData from "../chatData.js";
import User from "../user.js";
import NormalChat from "../chat/normalChat.js";
import Message from "../message/message.js";
import {saveMessageInDB} from "./newMessage.js";
import {GroupChat} from "../chat/groupChat.js";
import GroupChatMember from "../chat/groupChatMember.js";
import BinSearchArray from "binsearcharray";

export async function newNormalChat(uidSelf,uidOther,usernameOther,message){

    /*
        does user already exist in server?
            if not --> gets created
    */
    if(chatData.user.getIndex(uidOther) === -1){

        chatData.user.add(uidOther,new User(uidOther,usernameOther));
    }

    const ncid = await saveNormalChatInDb(uidSelf,uidOther);

    const user1 = chatData.user.get(uidSelf);
    const user2 = chatData.user.get(uidOther);

    const newChat = new NormalChat(ncid,user1,user2,0,0);
    chatData.chats.normal.add(ncid,newChat);

    user1.chats.addChat(ncid,newChat);
    user2.chats.addChat(ncid,newChat);
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
        mid: mid
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
        if(chatData.user.getIndex(user.uid) === -1){

            chatData.user.add(user.uid,new User(user.uid,user.username));
        }
    }
    /*
        groupChat is saved
     */
    const gcid = await saveGroupChatInDB(data);
    /*
        the userFrom is saved
     */
    const gcmidFrom = await saveGroupChatMemberInDB(gcid,userFrom);
    /*
        the chat is created
     */
    const newChat = new GroupChat(gcid,data.name,data.description,data.isPublic);
    /*
        groupChatMembers are created
     */
    const members = new BinSearchArray();
    /*
        the userFrom is added
     */
    members.add(
        userFrom.uid,
        new GroupChatMember(
            gcmidFrom,
            newChat,
            chatData.user.get(userFrom.uid),
            userFrom.isAdmin,
            0
        ));

    for(let i=0;i<users.length;i++){
        /*
            user is saved, created
            groupChatMember is created
         */
        const gcmid = await saveGroupChatMemberInDB(gcid,users[i]);
        const user = chatData.user.get(users[i].uid);
        members.add(
            user.uid,
            new GroupChatMember(
                gcmid,
                newChat,
                user,
                users[i].isAdmin,
                0
            ));
    }
    newChat.members = members;
    chatData.chats.group.add(newChat.chatId,newChat);
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
    groupChatMember gets saved in DB
 */
async function saveGroupChatMemberInDB(gcid,user){

    return new Promise(function(resolve,reject){

        const con = chatServer.con;
        const query_str1 =
            "INSERT " +
            "INTO groupchatmember(uid,gcid,isAdmin) " +
            "VALUES (" + user.uid + ",'" + gcid + "'," + con.escape(user.isAdmin) + ");";

        con.query(query_str1,(err) => {
            if(err)
                reject(err);
            else {
                /*
                    the gcmid is selected
                 */
                const query_str2 =
                    "SELECT max(gcmid) " +
                    "AS 'gcmid' " +
                    "FROM groupchatmember";
                con.query(query_str2,(err,result,fields) => {
                    if(err)
                        reject(err);
                    else
                        resolve(result[0].gcmid)
                })
            }
        })
    });
}