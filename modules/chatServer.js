import * as socket from 'socket.io';
import {chatData} from "./chatData/data.js";
import {verifyToken} from "./authentication/jwt.js";

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

        this.io = new socket.Server(server);

        /*
            gets called when a connection is established
         */
        this.io.on('connection', socket => {
            /*
                the user who uses this connection
             */
            let user;

            socket.on('auth',async (authTokens) => {
                /*
                    authentication with jwt
                 */
                try {
                    const data = await verifyToken(authTokens);
                    /*
                        data is extracted from token
                     */
                    const {uid,username} = data;
                    /*
                        socket is initialized
                     */
                    user = await chatData.initUserSocket(uid,username,socket);
                    /*
                        info that user is initialized is emitted to client
                     */
                    socket.emit('initialized');

                }catch (err) {
                    console.error(err);
                    socket.disconnect();
                }
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