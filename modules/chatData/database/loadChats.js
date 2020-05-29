import {chatServer} from "../../chatServer.js";
import chatData from "../chatData.js";
import NormalChat from "../chat/normalChat.js";
import User from "../user.js";
import BinSearchArray from "binsearcharray";
import GroupChatMember from "../groupChatMember.js";
import {GroupChat} from "../chat/groupChat.js";

export async function loadNormalChats(user) {

    const normalChatsDB = await selectNormalChats(user.uid);

    for(let i=0;i<normalChatsDB.length;i++){

        const normalChatDB = normalChatsDB[i];
        /*
            is the chat already loaded?
         */
        if(chatData.chats.normal.getIndex(normalChatDB.ncid) !== -1){
            /*
                if chat is already loaded, it gets added to user
             */
            user.addLoadedChat(chatData.chats.normal.get(normalChatDB.ncid));
        }
        /*
            if not, it gets created
         */
        else {
            /*
                es wird der user ermittelt, der nicht der user selbst ist.
             */
            let otherUid;
            let otherUsername;
            if (normalChatDB.uid1 === user.uid) {
                otherUid = normalChatDB.uid2;
                otherUsername = normalChatDB.uname2;
            } else {
                otherUid = normalChatDB.uid1;
                otherUsername = normalChatDB.uname1;
            }
            /*
                wenn dieser undefined ist, wird er neu erstellt
             */
            let otherUser;
            if (chatData.user.getIndex(otherUid) === -1) {
                otherUser = new User(otherUid, otherUsername);
                chatData.user.add(otherUid,otherUser);
            }else{
                otherUser = chatData.user.get(otherUid);
            }
            /*
                neuer chat wird erstellt
             */
            const newChat = new NormalChat(normalChatDB.ncid, user, otherUser);
            /*
                chat gets added to user and otherUser
             */
            user.addLoadedChat(newChat);
            otherUser.addLoadedChat(newChat);
            /*
                first message gets loaded
             */
            await newChat.loadFirstMessage();
            /*
                chat wird bei array, das alle chats beinhaltet hinzugefügt
             */
            chatData.chats.normal.add(normalChatDB.ncid,newChat);
        }

    }
}
async function selectNormalChats(uid){

    return new Promise((resolve, reject) => {

        const con = chatServer.con;
        const query_str =
            "SELECT nc.ncid, nc.uid1, u1.username AS 'uname1', nc.uid2, u2.username AS 'uname2' " +
            "FROM normalchat nc " +
            "INNER JOIN user u1 " +
            "ON nc.uid1 = u1.uid " +
            "INNER JOIN user u2 " +
            "ON nc.uid2 = u2.uid " +
            "WHERE uid1 = '" + uid + "' OR uid2 = '" + uid + "';";

        con.query(query_str,(err,result,fields) => {
            if(err)
                reject(err);
            resolve(result);
        });
    });
}
export async function loadGroupChats(user) {

    const groupChatsDB = await selectGroupChats(user.uid);

    for(let i=0;i<groupChatsDB.length;i++){

        const groupChatDB = groupChatsDB[i];
        const members = new BinSearchArray();
        /*
            is chat already loaded?
         */
        if(chatData.chats.group.getIndex(groupChatDB.gcid) !== -1){
            /*
                if chat is already loaded, it gets added to user
             */
            user.addLoadedChat(chatData.chats.group.get(groupChatDB.gcid));
        }
        /*
            chat is not already loaded, a new one is created
         */
        else{
            /*
                users are requested from DB
             */
            const usersChatDB = await selectUsers(groupChatDB.gcid);
            /*
                loop through users, if not exists --> gets created
             */
            for(let j=0;j<usersChatDB.length;j++){

                const userChatDB = usersChatDB[j];
                const isAdmin = userChatDB.isAdmin === 1;
                /*
                    does user already exist?
                 */
                if(chatData.user.getIndex(userChatDB.uid) === -1){
                    /*
                        new user gets created
                     */
                    const newUser = new User(userChatDB.uid,userChatDB.username);
                    chatData.user.add(newUser.uid,newUser);
                }

                const newUser = chatData.user.get(userChatDB.uid);
                const groupChatMember = new GroupChatMember(newUser,isAdmin);
                members.add(newUser.uid,groupChatMember);
            }

            const isPublic = groupChatDB.isPublic === 1;
            const newChat = new GroupChat(groupChatDB.gcid,members,groupChatDB.name,groupChatDB.description,isPublic);
            /*
                first message gets loaded
             */
            await newChat.loadFirstMessage();
            /*
                chat gets added to the members
             */
            for(let j=0;j<newChat.members.length;j++){
                members[j].value.user.addLoadedChat(newChat);
            }
            /*
                chat gets added in chatData
             */
            chatData.chats.group.add(newChat.chatId,newChat);
        }
    }
    /*
        subscribe to all socket-rooms in the chats
    */
    user.chats.forEachGroup((chat,index,key) => {
        chat.subscribeToRoom(user);
    });
}
async function selectGroupChats(uid){

    return new Promise((resolve, reject) => {

        const con = chatServer.con;
        const query_str =
            "SELECT * " +
            "FROM groupchatmember gcm " +
            "JOIN groupchat gc " +
            "ON gcm.gcid = gc.gcid " +
            "WHERE gcm.uid = '" + uid + "';";

        con.query(query_str,(err,result,fields) => {
            if(err)
                reject(err);
            resolve(result);
        });
    });
}
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
            "SELECT u.uid, u.username, gcm.isAdmin " +
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