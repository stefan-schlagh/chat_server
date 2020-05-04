const User = require('./user');
const chat = require('./chat');

let chatServer;
let con;
let app;

exports.createChatServer = function(http,con1,app1){
    con = con1;
    app = app1;
    chatServer = new ChatServer(http);
    chat.Chat.con = con;
    chat.Chat.staticConstructor();
    return chatServer;
};

class ChatServer{
    #_http;
    #_io;
    #_user = [];//user werden an der Stelle ihrer uid gespeichert
    #_normalChats = [];//chats werden an der Stelle ihrer chatid gespeichert
    #_groupChats = [];

    constructor(http) {

        this.io = require('socket.io')(http);
        const io = this.io;

        User.setStaticFields(this.io,this.user,this.normalChats,this.groupChats);
        chat.Chat.allUsers = this.user;

        this.io.on('connection', socket => {

            let user;

            socket.on('userInfo', userInfo => {
                /*
                    user-Objekt wird initialisiert
                 */
                user = this.initUserSocket(userInfo,socket);

            });
            /*
                wird aufgerufen, wenn chat gewechselt wird
             */
            socket.on('change chat',chatInfo => {
                let newChat;
                /*
                    chat wird ermittelt
                 */
                if(chatInfo.type === 'normalChat'){
                    newChat = this.normalChats[chatInfo.id];
                }else if(chatInfo.type === 'groupChat'){
                    newChat = this.groupChats[chatInfo.id];
                }
                this.changeCurrentChat(user,newChat);
            });
            /*
                Wird aufgerufen, wenn Nachricht gesendet wurde
             */
            socket.on('chat message', (msg,callback) => {
                user.sendMessage(msg,callback);
            });
            /*
                Wird aufgerufen, wenn einem chat beigetreten wird
             */
            socket.on('join chat', chat => {

            });
            /*
                wird aufgerufen, wenn ein chat verlassen wird
             */
            socket.on('leave chat', chat => {

            });
            /*
                wird aufgerufen, wenn Nachrichten geladen werden sollen
             */
            socket.on('load messages', data => {
                /*console.log('load messages');
                console.log(this.normalChats);
                for(let i=0;i<=this.normalChats.length;i++){
                    if(this.normalChats[i] !== undefined)
                        console.log(this.normalChats[i].messages);
                }*/
                let chat;
                if(data.chatType === 'normalChat')
                    chat = this.normalChats[data.chatId];
                else if(data.chatType === 'groupChat')
                    chat = this.groupChats[data.chatId];
                chat.getMessages(data.lastMsgId,data.num,data => {
                    /*
                        Daten werden zu client gesendet
                     */
                    socket.emit('messages',data);
                });
            });
            /*
                wird aufgerufen, wenn client disconnected
             */
            socket.on('disconnect',() => {
                if(user!==undefined) {
                    this.unloadUser(user);
                    user = null;
                }
            });
            socket.on('started typing',() => {
                user.startedTyping();
            });
            socket.on('stopped typing',() => {
                user.stoppedTyping();
            });
        });
    }
    /*
        nach user joined event
     */
    initUserSocket(userInfo,socket){
        const uid = userInfo.uid;
        /*
            wenn user noch nicht existiert, wird er komplett neu angelegt
         */
        if(typeof(this.user[uid]) !== 'object') {
            const user = new User(con, userInfo.uid, userInfo.username, socket, true);
            user.loadChats();
            this.user[uid] = new User(con, userInfo.uid, userInfo.username, socket, true);
        }
        /*
            wenn er bereits existiert, wird socket gespeichert, und online auf true gesetzt
         */
        else{
            const user = this.user[uid];
            user.socket = socket;
            user.online = true;
            user.loadChats();
        }
        return this.user[uid];
    }
    /*
        es wird nur username und uid hinzugefügt
    */
    addUser(userInfo){
        this.user[userInfo.uid] = new User1(con,userInfo.uid,userInfo.username);
    }
    isUserOnline(uid){
        if(this.user[uid] === undefined) return false;
        return this.user[uid].online;
    }
    /*
        User wird offline gesetzt
     */
    unloadUser(user){
        user.online = false;
        let userInfoNeeded = user.saveAndDeleteChats();
        if(!userInfoNeeded) {
            this.user[user.uid] = undefined;
        }
    }
    changeCurrentChat(user,newChat){
        user.currentChat = newChat;
    }
    joinGroupChat(chat){

    }
    leaveGroupChat(chat){

    }
    get http() {
        return this.#_http;
    }

    set http(value) {
        this.#_http = value;
    }

    get io() {
        return this.#_io;
    }

    set io(value) {
        this.#_io = value;
    }

    get user() {
        return this.#_user;
    }

    set user(value) {
        this.#_user = value;
    }

    get normalChats() {
        return this.#_normalChats;
    }

    set normalChats(value) {
        this.#_normalChats = value;
    }

    get groupChats() {
        return this.#_groupChats;
    }

    set groupChats(value) {
        this.#_groupChats = value;
    }
}
class User2{
    constructor(username,isTyping) {
        this.username = username;
        this.isTyping = isTyping;
    }
}
exports.chat_server = ChatServer;