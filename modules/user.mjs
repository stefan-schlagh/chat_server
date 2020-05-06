import {chatServer} from "./chat_server.mjs";
import {Chat,NormalChat,GroupChat} from "./chat.mjs";
import BinSearchArray from "./BinSearch.mjs";

export default class User{
    /*
        Reihenfolge egal, Sortierung macht client
     */
    #_chats;
    #_socket;
    #_uid;
    #_username;
    #_online;
    #_con;
    #_currentChat;

    /*
        Wenn user nicht online, wird nur uid und username aus DB geladen
     */
    constructor(con,uid,username,socket = null,online = false) {
        this.con = con;
        this.uid = uid;
        this.chats = new BinSearchArray();
        this.online = online;
        this.username = username;
        this.socket = socket;
        this.currentChat = null;
    }

    /*
        Die chats des users werden geladen.
     */
    loadChats(){
        /*
            Die Anzahl der erledigten callbacks wird mitgezählt, da alle ausgeführt sein müssen
         */
        let callBacksFinished = 0;
        /*
            normalchats werden geladen
         */
        chatServer.con.query("SELECT nc.ncid, nc.uid1, u1.username AS 'uname1', nc.uid2, u2.username AS 'uname2' FROM normalchat nc INNER JOIN user u1 ON nc.uid1 = u1.uid INNER JOIN user u2 ON nc.uid2 = u2.uid WHERE uid1 = '"+this.uid+"' OR uid2 = '"+this.uid+"';",
            (err,result,fields) => {
                if(result!==undefined) {
                    result = JSON.parse(JSON.stringify(result));
                    for (let i = 0; i < result.length; i++) {
                        /*
                            es wird ermittelt, ob chat bereits existiert
                         */
                        if(chatServer.normalChats.getIndex(result[i].ncid) !== -1){
                            /*
                                wenn chat bereits existiert, wird dieser nur bei user hinzugefügt
                                chat wird bei User angelegt
                             */
                            this.addLoadedChat(chatServer.normalChats.get(result[i].ncid));
                            callBackFinished();
                        }
                        /*
                            wenn nicht, wird chat neu erstellt
                         */
                        else {
                            /*
                                es wird der user ermittelt, der nicht der user selbst ist.
                             */
                            let otherUid;
                            let otherUsername;
                            if (result[i].uid1 === this.uid) {
                                otherUid = result[i].uid2;
                                otherUsername = result[i].uname2;
                            } else {
                                otherUid = result[i].uid1;
                                otherUsername = result[i].uname1;
                            }
                            /*
                                wenn dieser undefined ist, wird er neu erstellt
                             */
                            let otherUser;
                            if (chatServer.user.getIndex(otherUid) === -1) {
                                otherUser = new User(this.con, otherUid, otherUsername);
                                chatServer.user.add(otherUid,otherUser);
                            }
                            /*
                                neuer chat wird erstellt
                             */
                            const newChat = new NormalChat(result[i].ncid, this, otherUser);
                            /*
                                chat wird bei user hinzugefügt
                                "--" wird bei otherUser hinzugefügt
                             */
                            this.addLoadedChat(newChat);
                            otherUser.addLoadedChat(newChat);
                            /*
                                erste msg wird jeweils geladen
                             */
                            newChat.initMessages(() => {
                                callBackFinished();
                            });
                            /*
                                chat wird bei array, das alle chats beinhaltet hinzugefügt
                             */
                            chatServer.normalChats.add(result[i].ncid,newChat);
                        }
                    }
                }
            callBackFinished();
        });
        /*
            groupchats werden geladen
         */
        chatServer.con.query("SELECT * FROM groupchatmember gcm JOIN groupchat gc ON gcm.gcid = gc.gcid JOIN user u on gcm.uid = u.uid WHERE u.uid = ''"+this.uid+"';",
            function (err, result, fields) {
                if(result!==undefined) {
                    result = JSON.parse(JSON.stringify(result));
                    for (let i = 0; i < result.size(); i++) {

                    }
                }
                callBackFinished();
        });
        /*
            es wird überprüft, ob bereits alle callbacks abgearbeitet wurden
         */
        const callBackFinished = () => {
            callBacksFinished++;
            /*
                Anzahl der callbacks:
                    2
                 + normalchats.length
                 +groupchats.length
             */
            if(callBacksFinished === (2 + this.chats.length)){
                sendChatsToClient();
            }
        };
        /*
            user werden chats geschickt
         */
        const sendChatsToClient = () => {
            const chats = this.getChatJson();
            this.socket.emit('all chats', chats);
        }
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
                    chat.removeUsers(this.uid);
                    chatServer.normalChats.remove(this.chats[i].value.chatId);
                }
                else if(this.chats[i].value.type === 'groupChat') {
                    const chat = chatServer.groupChats.get(this.chats[i].value.chatId);
                    chat.removeUsers(this.uid);
                    chatServer.groupChats.remove(this.chats[i].value.chatId);
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
        this.chats.add(chat.chatId,chat);
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
        this.chats.remove(chat.chatId);
    }
    /*
        Es wird ein Objekt mit allen chats, in denen sich der user derzeit befindet zurückgegeben
     */
    getChatJson(){
        let rc = [];
        for(let i=0;i<this.chats.length;i++){
            const currentChat = this.chats[i].value;
            /*
                members werden in Form eines Arrays mit allen uids der user gespeichert.
                bei normalchat ist chatname name des gegenübers, bei groupchat der chatname
             */
            let members = [];
            let chatName;
            /*
                    chatId wird initialisiert
                 */
            const chatId = currentChat.chatId;
            if(currentChat.type === 'normalChat'){
                /*
                    members werden angelegt
                 */
                if(this.uid === currentChat.user1.uid){
                    members = [{
                        uid : currentChat.user2.uid,
                        username: currentChat.user2.username,
                        isOnline: currentChat.user2.online
                    }];
                }else{
                    members = [{
                        uid : currentChat.user1.uid,
                        username: currentChat.user1.username,
                        isOnline: currentChat.user1.online
                    }];
                }
                /*
                    chatname wird ermittelt
                 */
                if(currentChat.user1.uid === this.uid){
                    chatName = currentChat.user2.username;
                }else{
                    chatName = currentChat.user1.username;
                }
            }else if(currentChat.type === 'groupChat'){
                /*
                    members werden initialisiert
                 */
                const users = currentChat.users;
                for(let j=0;j<users.length;j++){
                    if(!this.uid === users[j].value.uid)
                        members.push({
                            uid: users[j].value.uid,
                            username: users[j].value.username,
                            isOnline: users[j].value.online
                        });
                }
                /*
                    chatName wird initialisiert
                 */
                chatName = currentChat.chatName;
            }
            /*
                firstmessage wird initialisiert
             */
            const firstMessage = currentChat.messages[currentChat.messages.length - 1];
            let fm;
            if(firstMessage)
                fm = {
                    uid: firstMessage.author.uid,
                    mid: firstMessage.msgId,
                    date: firstMessage.date,
                    content: firstMessage.msg
                };
            else
                fm = {
                    empty: true
                };
            /*
                Objekt wird erstellt und zum Array hinzugefügt
             */
            rc.push({
                type:  currentChat.type,
                id: chatId,
                chatName: chatName,
                members: members,
                firstMessage: fm
            });
        }
        return rc;
    }
    get con() {
        return this.#_con;
    }

    set con(value) {
        this.#_con = value;
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