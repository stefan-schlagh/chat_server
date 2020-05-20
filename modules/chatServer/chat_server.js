import User from "./user.js";
import socket from 'socket.io';
import BinSearchArray from "../util/BinSearch.js";
import {getUser,selectUsersNoChat,selectAllUsers,getUserInfo} from "./database/selectUsers.js";
import {newNormalChat} from "./database/newChat.js";

export let chatServer;
let app;

export default function createChatServer (http,con,app1){
    app = app1;
    chatServer = new ChatServer(http,con);
    return chatServer;
}
//const require = createChatServer(import.meta.url);

class ChatServer{
    #_http;
    #_io;
    #_con;
    #_user = new BinSearchArray();//user werden an der Stelle ihrer uid gespeichert
    #_normalChats = new BinSearchArray();//chats werden an der Stelle ihrer chatid gespeichert
    #_groupChats = new BinSearchArray();

    constructor(http,con) {

        this.io = socket(http);
        this.http = http;

        let port = 3002;
        this.io.listen(port);
        console.log('listening on port ', port);

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
                if(chatInfo === null){
                    //currentChat gets set to null
                    newChat = null;
                }else if(chatInfo.type === 'normalChat'){
                    newChat = this.normalChats.get(chatInfo.id);
                }else if(chatInfo.type === 'groupChat'){
                    newChat = this.groupChats.get(chatInfo.id);
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
                /*
                    id cannot be 0
                 */
                if(data.chatId !== 0) {
                    let chat;
                    if (data.chatType === 'normalChat')
                        chat = this.normalChats.get(data.chatId);
                    else if (data.chatType === 'groupChat')
                        chat = this.groupChats.get(data.chatId);
                    chat.getMessages(data.lastMsgId, data.num, data => {
                        /*
                            Daten werden zu client gesendet
                         */
                        socket.emit('messages', data);
                    });
                }
            });
            socket.on('started typing',() => {
                user.startedTyping();
            });
            socket.on('stopped typing',() => {
                user.stoppedTyping();
            });
            /*
                userinfo gets requested for a specific user
             */
            socket.on('getUserInfo',(uid,callback) => {

                getUser(user.uid,uid)
                    .then(res => callback(res,false))
                    .catch(err => callback(err,true))
            });
            /*
                a new normal chat gets created
             */
            socket.on('new normalChat',(data,callback) => {

                newNormalChat(user.uid,data.uid,data.username,data.message)
                    .then(res => callback(res))
                    .catch(err => console.log(err));
            });
            /*
                wird aufgerufen, wenn client disconnected
             */
            socket.on('disconnect',() => {
                if(user !== undefined) {
                    /*
                        user wird gelöscht, sowie alle Referenzen,
                        die nicht mehr gebraucht werden (chats etc...)
                    */
                    this.unloadUser(user);
                    user = null;
                }
            });
        });
        /*
            normalchats wher the user is not in get selected
         */
        app.post('/getUsers-noChat',(req,res) => {

            const uidFrom = req.session.uid;
            const search = req.body.search;
            const limit = req.body.limit;
            const start = req.body.start;

            selectUsersNoChat(uidFrom,search,limit,start).then(data => {
                res.send(data);
            }).catch(err => {
                console.log(err);
            })
        });
        /*
            all users are searched
         */
        app.post('/getAllUsers',(req,res) => {

            const uidFrom = req.session.uid;
            const search = req.body.search;
            const limit = req.body.limit;
            const start = req.body.start;

            selectAllUsers(uidFrom,search,limit,start).then(data => {
                res.send(data);
            }).catch(err => {
                console.log(err);
            })
        });
        /*
            userInfo is selected
         */
        app.post('/getUserInfo',(req,res) => {

            const uidFrom = req.session.uid;
            const uidReq = req.body.uid;

            getUserInfo(uidFrom,uidReq)
                .then(result => res.send(result));
        });

        this._con = con;
    }
    /*
        nach user joined event
     */
    initUserSocket(userInfo,socket){
        const uid = userInfo.uid;
        /*
            wenn user noch nicht existiert, wird er komplett neu angelegt
         */
        if(this.user.getIndex(uid) === -1) {
            const user = new User(this.con, userInfo.uid, userInfo.username, socket, true);
            user.loadChats();
            this.user.add(user.uid,user);
        }
        /*
            wenn er bereits existiert, wird socket gespeichert, und online auf true gesetzt
         */
        else{
            const user = this.user.get(uid);
            user.socket = socket;
            user.online = true;
            user.loadChats();
        }
        return this.user.get(uid);
    }
    /*
        es wird nur username und uid hinzugefügt
    */
    addUser(userInfo){
        this.user.add(userInfo.uid,new User(this.con,userInfo.uid,userInfo.username));
    }
    isUserOnline(uid){
        if(this.user.getIndex(uid) === -1) return false;
        return this.user.get(uid).online;
    }
    /*
        User wird offline gesetzt
     */
    unloadUser(user){
        user.online = false;
        /*
            user wird gelöscht, sowie alle Referenzen,
            die nicht mehr gebraucht werden (chats etc...)
        */
        let userInfoNeeded = user.saveAndDeleteChats();
        if(!userInfoNeeded) {
            /*
                wenn userinfo in keinem chat mehr gebraucht wird, wird sie ganz gelöscht
             */
            this.user.remove(user.uid);
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

    get con() {
        return this._con;
    }

    set con(value) {
        this._con = value;
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