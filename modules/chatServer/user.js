import {chatServer} from "./chat_server.js";
import {loadNormalChats,loadGroupChats} from "./database/loadChats.js";
import ChatStorage from "../util/chatStorage.js";

export default class User{
    /*
        Reihenfolge egal, Sortierung macht client
     */
    #_chats = new ChatStorage();
    #_socket;
    #_uid;
    #_username;
    #_online;
    #_currentChat;

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
            Die Anzahl der erledigten callbacks wird mitgezählt, da alle ausgeführt sein müssen
         */
        //let callBacksFinished = 0;
        /*
            normalChats are loaded
         */
        await loadNormalChats(this);
        /*
            groupChats are loaded
         */
        await loadGroupChats(this);

        const chats = await this.getChatJson();
        this.socket.emit('all chats', chats);

    }
    /*
        chats des users werden gespeichert und gelöscht
     */
    saveAndDeleteChats(){
        /*
            es wird bei allen chats geschaut, ob noch wer online ist
            wenn ein chat geladen bleibt, wird die userInfo weiterhin benötigt
         */
        let userInfoNeeded = false;
        for(let i=0;i<this.chats.length;i++){
            /*
                Wenn keiner online ist, wird chat gelöscht
             */
            if(this.chats[i].value.isAnyoneOnline())
                userInfoNeeded = true;
            else {
                /*
                    keiner online
                        -> alle Referenzen in chatserver werden gelöscht
                        -> alle Refernzen von chat auf User werden gelöscht
                 */
                if(this.chats[i].value.type === 'normalChat') {
                    const chat = chatServer.normalChats.get(this.chats[i].value.chatId);
                    //should not be undefined
                    if(chat !== undefined) {
                        chat.removeUsers(this.uid);
                        chatServer.normalChats.remove(this.chats[i].value.chatId);
                    }
                }
                else if(this.chats[i].value.type === 'groupChat') {
                    const chat = chatServer.groupChats.get(this.chats[i].value.chatId);
                    if(chat !== undefined) {
                        chat.removeUsers(this.uid);
                        chatServer.groupChats.remove(this.chats[i].value.chatId);
                    }
                }
                //Referenz im eigenen chat-array wird gelöscht
                this.chats.remove(this.chats[i].value.chatId);
            }
        }
        return userInfoNeeded;
    }
    startedTyping(){

        /*
            nur wenn derzeitiger chat definiert ist, kann msg gesendet werden
         */
        if(this.currentChat !== null)
            this.currentChat.sendToAll(this,'started typing',this.uid);
    }
    stoppedTyping(){
        /*
            nur wenn derzeitiger chat definiert ist, kann msg gesendet werden
         */
        if(this.currentChat !== null)
            this.currentChat.sendToAll(this,'stopped typing',this.uid);
    }
    sendMessage(msg,callback){
        /*
            nur wenn derzeitiger chat definiert ist, kann msg gesendet werden
         */
        if(this.currentChat !== null) {
            this.currentChat.sendMessage(this,msg,callback);
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

        return new Promise(((resolve, reject) => {

            let rc = [];

            this.chats.forEach((chat,index,key) => {

                const members = chat.getMemberObject(this.uid);
                const chatName = chat.getChatName(this.uid);
                const fm = chat.getNewestMessageObject();
                /*
                    Objekt wird erstellt und zum Array hinzugefügt
                 */
                rc.push({
                    type:  chat.type,
                    id: key,
                    chatName: chatName,
                    members: members,
                    firstMessage: fm
                });

                if(rc.length === this.chats.length())
                    resolve(rc);

            });
        }));
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
                firstMessage: chat.getNewestMessageObject()
            };

            this.socket.emit("new chat", data);
        }
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
    }

}