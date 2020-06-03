import socket from 'socket.io';
import {getUser} from "./chatData/database/selectUsers.js";
import {newNormalChat} from "./chatData/database/newChat.js";
import User from "./chatData/user.js";
import chatData from "./chatData/chatData.js";

export let chatServer;
export function createChatServer(http,con,app){
    chatServer = new ChatServer(http,con,app);
}
/*
    The socket that is communicating with the server
 */
class ChatServer{

    #_http;
    #_con;
    #_app;
    #_io;

    constructor(http,con,app) {

        this.http = http;
        this.con = con;
        this.app = app;

        this.io = socket(http, {
            origins: '*:*',
            handlePreflightRequest: (req, res) => {
                const headers = {
                    "Access-Control-Allow-Headers": "Content-Type, Authorization",
                    "Access-Control-Allow-Origin": req.headers.origin, //or the specific origin you want to give access to,
                    "Access-Control-Allow-Credentials": true
                };
                res.writeHead(200, headers);
                res.end();
            }
        });


        let port = 3002;
        this.io.listen(port);
        console.log('listening on port ', port);

        /*
            gets called when a connection is established
         */
        this.io.on('connection', socket => {
            /*
                the user who uses this connection
             */
            let user;
            /*
                TODO: socket-auth
             */
            socket.on('auth',(uid,username) => {
                user = chatData.initUserSocket(uid,username,socket);
            });
            /*
                wird aufgerufen, wenn chat gewechselt wird
             */
            socket.on('change chat',data => {
                /*
                    if data is null, no chat should be selected
                 */
                if(data === null)
                    chatData.changeChat(user,'',0);
                else
                    chatData.changeChat(user,data.type,data.id);
            });
            /*
                Wird aufgerufen, wenn Nachricht gesendet wurde
             */
            socket.on('chat message', (msg,callback) => {
                /*
                    TODO: callback as async/await
                 */
                chatData.sendMessage(user,msg,callback);
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

                chatData.loadMessages(user,data.chatType,data.chatId,data.lastMsgId,data.num)
                    .then(data => {
                        /*
                            data is sent to client
                        */
                        socket.emit('messages', data);
                    })
                    .catch(err => console.log(err));
            });
            socket.on('started typing',() => {
                /*
                    user started typing
                 */
                user.startedTyping();
            });
            socket.on('stopped typing',() => {
                /*
                    user stopped typing
                 */
                user.stoppedTyping();
            });
            /*
                userInfo gets requested for a specific user
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
                is called after client disconnected
             */
            socket.on('disconnect',() => {
                /*
                    userData is saved and deleted
                 */
                chatData.unloadUser(user);
            });
        });
    }

    isUserOnline(uid){
        return chatData.isUserOnline(uid);
    }

    get http() {
        return this.#_http;
    }

    set http(value) {
        this.#_http = value;
    }

    get con() {
        return this.#_con;
    }

    set con(value) {
        this.#_con = value;
    }

    get app() {
        return this.#_app;
    }

    set app(value) {
        this.#_app = value;
    }

    get io() {
        return this._io;
    }

    set io(value) {
        this._io = value;
    }
}