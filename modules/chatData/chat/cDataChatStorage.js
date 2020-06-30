import BinSearchArray from "binsearcharray";
import NormalChat from "./normalChat.js";
import {GroupChat} from "./groupChat.js";
import GroupChatMember from "./groupChatMember.js";
import {chatServer} from "../../chatServer.js";
import User from "../user.js";
import ChatStorage from "./chatStorage.js";

export default class CDataChatStorage extends ChatStorage {

    #_user;

    constructor(user) {
        super();
        this.user = user;
    }
    /*
        if chat is loaded
            --> gets returned
            else --> is loaded from DB
     */
    async getGroupChat(gcid){

        const chat = this.getChat('groupChat',gcid);

        if(chat){
            return chat;
        }else{
            return await this.loadGroupChat(gcid);
        }
    }
    /*
        groupChat with this id is loaded from the Database
     */
    async loadGroupChat(gcid){

        const data = await new Promise((resolve, reject) => {

            const query_str =
                "SELECT * " +
                "FROM groupchat " +
                "WHERE gcid = " + gcid + ";";

            chatServer.con.query(query_str,(err,result,fields) => {
                if(err)
                    reject(err);
                else if(!result || result.length === 0)
                    resolve();
                else
                    resolve(result[0]);
            });
        });
        /*
            if nothing found, undefined is returned
         */
        if(!data)
            return undefined;

        const isPublic = data.isPublic === 1;
        const chat = new GroupChat(
            gcid,
            data.name,
            data.description,
            isPublic
        );
        /*
            members of the chat are laoded
         */
        await chat.loadGroupChatMembers();
        /*
            first message is loaded
         */
        await chat.messageStorage.initFirstMessage();

        return chat;
    }
    /*
        new normalChat is created
     */
    async newNormalChat(user1,user2,message){

        const newChat = new NormalChat(
            -1,
            user1,
            user2
        );
        /*
            chat is saved in the database
         */
        const ncid = await newChat.saveChatInDB();

        this.normal.add(ncid,newChat);
        /*
            chats are added to the users
         */
        user1.chats.addChat(ncid,newChat);
        user2.chats.addChat(ncid,newChat);
        /*
            first message gets initialized
         */
        const firstMessage = await newChat.addMessage(user1,message);
        const mid = firstMessage.mid;
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
        new groupChat is created
     */
    async newGroupChat(userFrom, data, users){
        /*
            chat is created
         */
        const newChat = new GroupChat(
            -1,
            data.name
            ,data.description,
            data.isPublic
        );
        /*
            chat is saved in the database
         */
        await newChat.saveChatInDB();
        /*
            groupChatMembers are created
         */
        const members = new BinSearchArray();
        /*
            groupChatMemberSelf is created
         */
        const gcmSelf = new GroupChatMember(
            -1,
            newChat,
            this.user.get(userFrom.uid),
            userFrom.isAdmin,
            0
        );
        await gcmSelf.saveGroupChatMemberInDB();
        members.add(userFrom.uid,gcmSelf);
        /*
            other users are added
         */
        for(let i=0;i<users.length;i++){

            const user = this.user.get(users[i].uid);
            const gcm = new GroupChatMember(
                -1,
                newChat,
                user,
                users[i].isAdmin,
                0
            );
            await gcm.saveGroupChatMemberInDB();

            members.add(user.uid,gcm);
        }
        newChat.members = members;
        this.group.add(newChat.chatId,newChat);
        /*
            statusMessages are added
         */
        await newChat.createStatusMessagesStart(userFrom);
        /*
            chat gets added to the members
         */
        newChat.forEachUser((user,index,key) => {
            user.addLoadedChat(newChat);
            user.addNewChat(newChat);
        });
    }
    /*
        all normalChats of the user are loaded
     */
    async loadNormalChats(user){

        const normalChatsDB = await this.selectNormalChats(user.uid);

        for(let i=0;i<normalChatsDB.length;i++){

            const normalChatDB = normalChatsDB[i];
            /*
                is the chat already loaded?
             */
            if(this.normal.getIndex(normalChatDB.ncid) !== -1){
                /*
                    if chat is already loaded, it gets added to user
                 */
                user.addLoadedChat(this.normal.get(normalChatDB.ncid));
            }
            /*
                if not, it gets created
             */
            else {
                /*
                    es wird der user ermittelt, der nicht der user selbst ist.
                 */
                let user1;
                let user2;

                const getOtherUser = (uid,username) => {
                    /*
                        does the user already exist at the server?
                     */
                    if (this.user.getIndex(uid) === -1) {
                        const newUser =  new User(uid, username);
                        this.user.add(uid,newUser);
                        return newUser;
                    }else{
                        return this.user.get(uid);
                    }
                };

                if (normalChatDB.uid1 === user.uid) {
                    user1 = user;
                    user2 = getOtherUser(normalChatDB.uid2,normalChatDB.uname2);
                } else {
                    user1 = getOtherUser(normalChatDB.uid1,normalChatDB.uname1);
                    user2 = user;
                }
                /*
                    new chat is created
                 */
                const newChat =
                    new NormalChat(
                        normalChatDB.ncid,
                        user1,
                        user2,
                        normalChatDB.unreadMessages1,
                        normalChatDB.unreadMessages2
                    );
                await newChat.messageStorage.initFirstMessage();
                /*
                    chat gets added to user and otherUser
                 */
                user1.addLoadedChat(newChat);
                user2.addLoadedChat(newChat);
                /*
                    chat wird bei array, das alle chats beinhaltet hinzugefügt
                 */
                this.normal.add(normalChatDB.ncid,newChat);
            }

        }
    }
    /*
        normalChats of the user are selected
     */
    async selectNormalChats(uid){

        return new Promise((resolve, reject) => {

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

            chatServer.con.query(query_str,(err,result,fields) => {
                if(err)
                    reject(err);
                resolve(result);
            });
        });
    }
    /*
        all groupChats of the user are loaded
     */
    async loadGroupChats(user){

        const groupChatsDB = await this.selectGroupChats(user.uid);

        for(let i=0;i<groupChatsDB.length;i++) {

            const groupChatDB = groupChatsDB[i];
            /*
                is chat already loaded?
             */
            if (this.group.getIndex(groupChatDB.gcid) !== -1) {
                /*
                    if chat is already loaded, it gets added to user
                 */
                user.addLoadedChat(this.group.get(groupChatDB.gcid));
            }
            /*
                chat is not already loaded, a new one is created
             */
            else {
                /*
                    groupChat is initialized
                 */
                const isPublic = groupChatDB.isPublic === 1;
                const newChat = new GroupChat(
                    groupChatDB.gcid,
                    groupChatDB.name,
                    groupChatDB.description,
                    isPublic
                );
                /*
                    members of the chat are laoded
                 */
                await newChat.loadGroupChatMembers();
                /*
                    first message is loaded
                 */
                await newChat.messageStorage.initFirstMessage();
                /*
                    chat gets added in chatData
                 */
                this.group.add(newChat.chatId, newChat);
            }
        }
    }
    /*
        all groupChats of the user are selected
     */
    async selectGroupChats(uid){

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

    get user() {
        return this.#_user;
    }

    set user(value) {
        this.#_user = value;
    }
}