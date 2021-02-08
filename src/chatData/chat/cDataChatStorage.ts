import NormalChat from "./normalChat";
import {GroupChat} from "./groupChat";
import GroupChatMember from "./groupChatMember";
import User from "../user";
import ChatStorage from "./chatStorage";
import {pool} from "../../app";
import {ChatData} from "../chatData";
import {logger} from "../../util/logger";
import {Chat, chatTypes} from "./chat";
import {MessageDataIn} from "../../models/message";
import {GroupChatData, GroupChatMemberData, NewNormalChatData} from "../../models/chat";

export default class CDataChatStorage extends ChatStorage {

    private _chatData:ChatData;

    constructor(chatData: ChatData) {
        super();
        this.chatData = chatData;
    }
    /*
        if chat is loaded
            --> gets returned
            else --> is loaded from DB
     */
    async getGroupChat(gcid:number):Promise<Chat> {
        const chat = this.getChat(chatTypes.groupChat, gcid);

        if(chat){
            return chat;
        }else{
            return await this.loadGroupChat(gcid);
        }
    }
    /*
        groupChat with this id is loaded from the Database
     */
    async loadGroupChat(gcid:number):Promise<GroupChat> {

        const data:any = await new Promise((resolve, reject) => {

            const query_str =
                "SELECT * " +
                "FROM groupchat " +
                "WHERE gcid = " + gcid + ";";
            logger.verbose('SQL: %s',query_str);

            pool.query(query_str,(err:Error,result:any,fields:any) => {
                if(err)
                    reject(err);
                else if(!result || result.length === 0)
                    resolve();
                else
                    resolve(result[0]);
            });
        });
        /*
            if nothing found, null is returned
         */
        if(!data)
            return null;

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
    async newNormalChat(
        user1:User,
        user2:User,
        message:MessageDataIn
    ):Promise<NewNormalChatData> {

        const newChat = new NormalChat(
            -1,
            user1,
            user2
        );
        /*
            chat is saved in the database
         */
        const ncid:number = await newChat.saveChatInDB();

        this.normal.set(ncid,newChat);
        /*
            chats are added to the users
         */
        user1.chats.addChat(newChat);
        user2.chats.addChat(newChat);
        /*
            first message gets initialized
         */
        const firstMessage = await newChat.addMessage(user1,message);
        const mid = firstMessage.mid;
        /*
            if the user is online, the data gets sent to it too
         */
        await user2.addNewChat(newChat);

        return {
            ncid: ncid,
            mid: mid
        }
    }
    /*
        new groupChat is created
     */
    async newGroupChat(
        userFrom:GroupChatMemberData,
        data:GroupChatData,
        users:GroupChatMemberData[]
    ):Promise<number> {
        /*
            chat is created
         */
        const newChat = new GroupChat(
            -1,
            data.name,
            data.description,
            data.isPublic
        );
        /*
            chat is saved in the database
         */
        await newChat.saveChatInDB();
        /*
            groupChatMembers are created
         */
        const members = new Map<number,GroupChatMember>();
        /*
            groupChatMemberSelf is created
         */
        const gcmSelf = new GroupChatMember(
            -1,
            newChat,
            this.chatData.user.get(userFrom.uid),
            userFrom.isAdmin,
            0
        );
        await gcmSelf.saveGroupChatMemberInDB();
        members.set(userFrom.uid,gcmSelf);
        /*
            other users are added
         */
        for(let i=0;i<users.length;i++){

            const user = this.chatData.user.get(users[i].uid);
            const gcm = new GroupChatMember(
                -1,
                newChat,
                user,
                users[i].isAdmin,
                0
            );
            await gcm.saveGroupChatMemberInDB();

            members.set(user.uid,gcm);
        }
        //set members
        newChat.members = members;
        // add groupChat to list
        this.group.set(newChat.chatId,newChat);
        /*
            statusMessages are added
         */
        await newChat.createStatusMessagesStart(gcmSelf.user);
        /*
            chat gets added to the members
         */
        newChat.forEachUser((user:User,key:number) => {
            user.addLoadedChat(newChat);
            user.addNewChat(newChat);
        });
        /*
            users are subscribed to socket
         */
        await newChat.subscribeUsersToSocket();

        return newChat.chatId;
    }
    /*
        all normalChats of the user are loaded
     */
    async loadNormalChats(user:User):Promise<void> {

        const normalChatsDB:any = await this.selectNormalChats(user.uid);

        for(let i=0;i<normalChatsDB.length;i++){

            const normalChatDB = normalChatsDB[i];
            /*
                is the chat already loaded?
             */
            if(this.normal.has(normalChatDB.ncid)){
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

                if (normalChatDB.uid1 === user.uid) {
                    user1 = user;
                    user2 = this.chatData.getUserUsername(normalChatDB.uid2,normalChatDB.uname2);
                } else {
                    user1 = this.chatData.getUserUsername(normalChatDB.uid1,normalChatDB.uname1);
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
                this.normal.set(normalChatDB.ncid,newChat);
            }
        }
    }
    /*
        normalChats of the user are selected
     */
    //TODO type
    async selectNormalChats(uid:number):Promise<any> {

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
            logger.verbose('SQL: %s',query_str);

            pool.query(query_str,(err:Error,result:any,fields:any) => {
                if(err)
                    reject(err);
                resolve(result);
            });
        });
    }
    /*
        all groupChats of the user are loaded
     */
    async loadGroupChats(user:User):Promise<void> {

        const groupChatsDB:any = await this.selectGroupChats(user.uid);

        for(let i=0;i<groupChatsDB.length;i++) {

            const groupChatDB = groupChatsDB[i];
            /*
                is chat already loaded?
             */
            if (this.group.has(groupChatDB.gcid)) {
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
                this.group.set(newChat.chatId, newChat);
            }
        }
    }
    /*
        all groupChats of the user are selected
     */
    //TODO type
    async selectGroupChats(uid:number):Promise<any> {

        return new Promise((resolve, reject) => {

            const query_str =
                "SELECT * " +
                "FROM groupchatmember gcm " +
                "JOIN groupchat gc " +
                "ON gcm.gcid = gc.gcid " +
                "WHERE gcm.uid = '" + uid + "';";
            logger.verbose('SQL: %s',query_str);

            pool.query(query_str,(err:Error,result:any,fields:any) => {
                if(err)
                    reject(err);
                resolve(result);
            });
        });
    }

    get chatData(): ChatData {
        return this._chatData;
    }

    set chatData(value: ChatData) {
        this._chatData = value;
    }
}