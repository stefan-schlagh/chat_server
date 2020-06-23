import EventEmitter from 'events';
import chatData from "./chatData.js";
import ChatStorage from "./chat/chatStorage.js";

class Emitter extends EventEmitter {}

export default class User{
    /*
        eventEmitter
     */
    #_eventEmitter = new Emitter();
    #_chats = new ChatStorage();
    #_socket;
    #_uid;
    #_username;
    #_online;
    #_currentChat;
    /*
        are the chats of this user loaded?
     */
    #_chatsLoaded = false;

    /*
        Wenn user nicht online, wird nur uid und username aus DB geladen
     */
    constructor(uid,username,socket = null,online = false) {
        this.uid = uid;
        this.online = online;
        this.username = username;
        this.socket = socket;
        this.currentChat = null;
    }

    /*
        Die chats des users werden geladen.
     */
    async loadChats(){
        /*
            normalChats are loaded
         */
        await chatData.chats.loadNormalChats(this);
        /*
            groupChats are loaded
         */
        await chatData.chats.loadGroupChats(this);

        const chats = await this.getChatJson();

        this.chatsLoaded = true;

        this.eventEmitter.emit('chats loaded', chats);

    }
    /*
        chats des users werden gespeichert und gelöscht
     */
    async saveAndDeleteChats(){

        this.chatsLoaded = false;

        return new Promise(((resolve, reject) => {
            /*
                if someone in any chat where the user is, is online, the chat does not get deleted
             */
            let userInfoNeeded = false;
            let i = 0;

            this.chats.forEach((item,index,key,type) => {
                i++;
                /*
                    is there anyone online at the chat?
                 */
                if(item.isAnyoneOnline())
                    userInfoNeeded = true;
                else {
                    /*
                        chat is deleted
                     */
                    const chat = chatData.chats.getChat(type,key);
                    chat.removeUsers(this.uid);
                    chatData.chats.removeChat(chat);
                }
                if (type === 'groupChat')
                    item.leaveRoom(this);
                if(i === this.chats.length())
                    resolve(userInfoNeeded);
            });
        }));
    }
    startedTyping(){

        /*
            nur wenn derzeitiger chat definiert ist, kann msg gesendet werden
         */
        if(this.currentChat !== null)
            this.currentChat.sendToAll(
                this,
                'started typing',
                {uid: this.uid}
            );
    }
    stoppedTyping(){
        /*
            nur wenn derzeitiger chat definiert ist, kann msg gesendet werden
         */
        if(this.currentChat !== null)
            this.currentChat.sendToAll(
                this,
                'stopped typing',
                {uid: this.uid}
            );
    }
    async sendMessage(data){
        /*
            only when a chat is selected it can be sent
         */
        if(this.currentChat !== null) {
            /*
                a new message is added to the chat
             */
            const message = await this.currentChat.addMessage(this,data);
            /*
                message is sent
             */
            await this.currentChat.sendMessage(this,message);
            /*
                mid is returned
             */
            return message.mid;
        }else{
            throw new Error('no chat selected')
        }
    }
    /*
        wird aufgerufen, wenn chat geladen wurde und zum array hinzugefügt werden soll.
     */
    addLoadedChat(chat){
        this.chats.addChat(chat);
    }
    /*
        wird aufgerufen, wenn geladener chat gespeichert
        und aus server-speicher entfernt werden soll
        aufgerufen in:
            removeUsers:
                Normalchat
                Grpupchat
     */
    removeUnloadedChat(chat){
        //Referenz im eigenen chat-array wird gelöscht
        this.chats.removeChat(chat);
    }
    /*
        A object with all chats where the user is in gets returned
     */
    async getChatJson(){

        return new Promise((resolve, reject) => {

            let rc = [];
            /*
                if length is 0, empty array gets returned
             */
            if(this.chats.length() === 0)
                resolve(rc);

            this.chats.forEach((chat,index,key) => {

                const members = chat.getMemberObject(this.uid);
                const chatName = chat.getChatName(this.uid);
                const fm = chat.messageStorage.getNewestMessageObject();
                /*
                    Objekt wird erstellt und zum Array hinzugefügt
                 */
                rc.push({
                    type: chat.type,
                    id: key,
                    chatName: chatName,
                    members: members,
                    firstMessage: fm,
                    unreadMessages: chat.getUnreadMessages(this.uid)
                });

                if(rc.length === this.chats.length())
                    resolve(rc);

            });
        });
    }
    /*
        a new chat gets added to the user
        this also gets emitted to the client
     */
    addNewChat(chat){

        if(this.socket !== null) {
            /*
                info gets emitted to the server
             */
            const data = {
                type: chat.type,
                id: chat.chatId,
                chatName: chat.getChatName(this.uid),
                members: chat.getMemberObject(this.uid),
                firstMessage: chat.messageStorage.getNewestMessageObject()
            };

            this.socket.emit("new chat", data);
        }
    }
    /*
        is the chat the currentChat of the user?
     */
    isCurrentChat(chat){
        if(!this.currentChat)
            return false;
        return this.currentChat.type === chat.type
            && this.currentChat.chatId === chat.chatId;
    }

    get eventEmitter() {
        return this.#_eventEmitter;
    }

    set eventEmitter(value) {
        this.#_eventEmitter = value;
    }

    get uid() {
        return this.#_uid;
    }

    set uid(value) {
        this.#_uid = value;
    }

    get username() {
        return this.#_username;
    }

    set username(value) {
        this.#_username = value;
    }

    get socket() {
        return this.#_socket;
    }

    set socket(value) {
        this.#_socket = value;
    }

    get chats() {
        return this.#_chats;
    }

    set chats(value) {
        this.#_chats = value;
    }

    get online() {
        return this.#_online;
    }

    set online(online){
        this.#_online = online;
    }

    get currentChat() {
        return this.#_currentChat;
    }

    set currentChat(value) {
        this.#_currentChat = value;
        /*
            unreadMessages at currentChat are set to 0
         */
        if(value) {

            value.setUnreadMessages(this.uid,0);
        }
    }

    get chatsLoaded() {
        return this.#_chatsLoaded;
    }

    set chatsLoaded(value) {
        this.#_chatsLoaded = value;
    }
}