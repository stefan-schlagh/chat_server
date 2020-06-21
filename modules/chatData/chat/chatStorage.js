import BinSearchArray from "binsearcharray";
import NormalChat from "./normalChat.js";
import {GroupChat} from "./groupChat.js";
import GroupChatMember from "./groupChatMember.js";
import {chatServer} from "../../chatServer.js";
import User from "../user.js";

export default class ChatStorage{

    #_user;
    /*
        chats
     */
    #_normal = new BinSearchArray();
    #_group = new BinSearchArray();

    constructor(user) {
        this.user = user;
    }

    addChat(chat){
        if(chat.type === 'normalChat'){
            this.normal.add(chat.chatId,chat);
        }else if(chat.type === 'groupChat'){
            this.group.add(chat.chatId,chat);
        }
    }

    removeChat(chat){
        if(chat.type === 'normalChat'){
            this.normal.remove(chat.chatId);
        }else if(chat.type === 'groupChat'){
            this.group.remove(chat.chatId);
        }
    }
    /*
        the sum of how many chats are stored is returned
     */
    length(){
        return this.normal.length + this.group.length;
    }
    /*
        value, index , key
     */
    forEach(callback){

        for(let i=0;i<this.normal.length;i++){
            const val = this.normal[i].value;
            callback(val,i,this.normal[i].key,val.type);
        }
        for(let i=0;i<this.group.length;i++){
            const val = this.group[i].value;
            callback(val,i,this.group[i].key,val.type);
        }
    }
    /*
        value, index , key
     */
    forEachGroup(callback){
        for(let i=0;i<this.group.length;i++){
            callback(this.group[i].value,i,this.group[i].key);
        }
    }
    /*
        the requested chat gets returned
            type: the type of the chat
            id: the id of the chat
     */
    getChat(type,id){
        /*
            is the chat a normalchat?
         */
        if(type === 'normalChat'){
            const chat = this.normal.get(id);
            if(chat)
                return chat;
            /*
                is the chat a groupChat?
             */
        }else if(type === 'groupChat'){
            const chat = this.group.get(id);
            if(chat)
                return chat;
        }
        return null;
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
        return this._user;
    }

    set user(value) {
        this._user = value;
    }

    get normal() {
        return this.#_normal;
    }

    set normal(value) {
        this.#_normal = value;
    }

    get group() {
        return this.#_group;
    }

    set group(value) {
        this.#_group = value;
    }
}