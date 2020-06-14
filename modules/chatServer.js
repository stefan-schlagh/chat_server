import socket from 'socket.io';
import {newNormalChat} from "./chatData/database/newChat.js";
import chatData from "./chatData/chatData.js";

export let chatServer;
export function createChatServer(server,con,app){
    chatServer = new ChatServer(server,con,app);
}
/*
    The socket that is communicating with the server
 */
class ChatServer{

    #_server;
    #_con;
    #_app;
    #_io;

    constructor(server,con,app) {

        this.server = server;
        this.con = con;
        this.app = app;

        this.io = socket(server);

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
                chatData.initUserSocket(uid,username,socket)
                    .then(_user => {
                        user = _user;
                        /*
                            info that user is initialized is emitted to client
                         */
                        socket.emit('initialized');
                    })
                    .catch(err => {
                        console.error(err);
                    });
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
                Wird aufgerufen, wenn einem chat beigetreten wird
             */
            socket.on('join chat', chat => {

            });
            /*
                wird aufgerufen, wenn ein chat verlassen wird
             */
            socket.on('leave chat', chat => {

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

    get server() {
        return this._server;
    }

    set server(value) {
        this._server = value;
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