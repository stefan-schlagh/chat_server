const chat = require('./chat');

class User{
    /*
        Reihenfolge egal, Sortierung macht client
     */
    #_chats = [];
    #_socket;
    #_uid;
    #_username;
    #_online;
    #_con;
    #_currentChat;

    /*
        statische Felder
     */
    static allUsers;
    static allNormalChats;
    static allGroupChats;
    static io;

    static setStaticFields(io,users,normalChats,groupChats){
        this.io = io;
        this.allUsers = users;
        this.allNormalChats = normalChats;
        this.allGroupChats = groupChats;

        chat.Chat.io = io;
    }
    /*
        Wenn user nicht online, wird nur uid und username aus DB geladen
     */
    constructor(con,uid,username,socket = null,online = false) {
        this.con = con;
        this.uid = uid;
        this.chats = [];
        this.online = online;
        this.username = username;
        this.socket = socket;
        this.currentChat = null;
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
        if(online){
            this.loadChats();
        }
    }

    get currentChat() {
        return this.#_currentChat;
    }

    set currentChat(value) {
        this.#_currentChat = value;
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
        this.con.query("SELECT nc.ncid, nc.uid1, u1.username AS 'uname1', nc.uid2, u2.username AS 'uname2' FROM normalchat nc INNER JOIN user u1 ON nc.uid1 = u1.uid INNER JOIN user u2 ON nc.uid2 = u2.uid WHERE uid1 = '"+this.uid+"' OR uid2 = '"+this.uid+"';",
            (err,result,fields) => {
                if(result!==undefined) {
                    result = JSON.parse(JSON.stringify(result));
                    for (let i = 0; i < result.length; i++) {
                        /*
                            es wird ermittelt, ob chat bereits existiert
                         */
                        if(typeof(User.allNormalChats[result[i].ncid]) === 'object'){
                            /*
                                chat wird bei User angelegt
                             */
                            this.addLoadedChat(User.allNormalChats[result[i].ncid]);
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
                            if (User.allUsers[otherUid] === undefined || User.allUsers[otherUid] === null) {
                                otherUser = new User(this.con, otherUid, otherUsername);
                                User.allUsers[otherUid] = otherUser;
                            }
                            /*
                                neuer chat wird erstellt
                             */
                            const newChat = new chat.NormalChat(result[i].ncid, this, otherUser);
                            /*
                                chat wird bei user hinzugefügt
                             */
                            this.addLoadedChat(newChat);
                            /*
                                chat wird bei array, das alle chats beinhaltet hinzugefügt
                             */
                            User.allNormalChats[result[i].ncid] = newChat;
                        }
                    }
                }
            callBacksFinished++;
            if(callBacksFinished === 2)
                sendChatsToClient();
        });
        /*
            groupchats werden geladen
         */
        this.con.query("SELECT * FROM groupchatmember gcm JOIN groupchat gc ON gcm.gcid = gc.gcid JOIN user u on gcm.uid = u.uid WHERE u.uid = ''"+this.uid+"';",
            function (err, result, fields) {
                if(result!==undefined) {
                    result = JSON.parse(JSON.stringify(result));
                    for (let i = 0; i < result.size(); i++) {

                    }
                }
                callBacksFinished++;
                if(callBacksFinished === 2)
                    sendChatsToClient();
            //TODO
        });
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
            if(this.chats[i].isAnyoneOnline())
                userInfoNeeded = true;
            else {
                /*
                    alle Referenzen werden gelöscht
                 */
                if(this.chats[i].type === 'normalChat') {
                    const chat = User.allNormalChats[this.chats[i].chatId];
                    chat.removeUsers(this.uid);
                    User.allNormalChats[this.chats[i].chatId] = undefined;
                }
                else if(this.chats[i].type === 'groupChat') {
                    const chat = User.allGroupChats[this.chats[i].chatId];
                    chat.removeUsers(this.uid);
                    User.allGroupChats[this.chats[i].chatId] = undefined;
                }
                this.chats[i] = undefined;
            }
        }
        //chats löschen
        this.chats = [];
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
        this.chats.push(chat);
    }
    /*
        wird aufgerufen, wenn geladener chat gespeichert und aus server-speicher entfernt werden soll
     */
    removeUnloadedChat(chat){
        const index = this.chats.indexOf(chat);
        if (index > -1) {
            this.chats.splice(index, 1);
        }
    }
    /*
        Es wird ein Objekt mit allen chats, in denen sich der user derzeit befindet zurückgegeben
     */
    getChatJson(){
        let rc = [];
        for(let i=0;i<this.chats.length;i++){
            const currentChat = this.chats[i];
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
                members = [{
                    uid : currentChat.user1.uid,
                    username: currentChat.user1.username,
                    isOnline: currentChat.user1.online,
                    isSelf: (this.uid === currentChat.user1.uid)
                },{
                    uid: currentChat.user2.uid,
                    username:  currentChat.user2.username,
                    isOnline: currentChat.user1.online,
                    isSelf: (this.uid === currentChat.user2.uid)
                }];
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
                    let isSelf = false;
                    if(this.uid === users[j].uid)
                        isSelf = true;
                    members.push({
                        uid: users[j].uid,
                        username: users [j].username,
                        isOnline: users[j].online,
                        isSelf: isSelf
                    });
                }
                /*
                    chatName wird initialisiert
                 */
                chatName = currentChat.chatName;
            }
            /*
                Objekt wird erstellt und zum Array hinzugefügt
             */
            rc.push({
                type:  currentChat.type,
                id: chatId,
                chatName: chatName,
                members: members
            });
        }
        return rc;
    }
}
module.exports = User;