import {Server} from 'socket.io';
import {Server as httpsServer} from 'https';
import {chatData} from "./chatData/data";
import {verifyToken} from "./authentication/jwt";
import {Express} from "express";
import {Connection} from "mysql2";
import {logger} from "./util/logger";

export let chatServer:any;
export function createChatServer(server:any,con:any,app:any){
    chatServer = new ChatServer(server,con,app);
}
/*
    The socket that is communicating with the server
 */
class ChatServer{

    public server:httpsServer;
    public con:Connection;
    public app:Express;
    public io:Server;

    constructor(server:httpsServer,con:Connection,app:Express) {

        this.server = server;
        this.con = con;
        this.app = app;

        this.io = new Server(server);

        /*
            gets called when a connection is established
         */
        this.io.on('connection', (socket: { on: (arg0: string, arg1: (data:any) => void) => void; emit: (arg0: string) => void; disconnect: () => void; }) => {
            /*
                the user who uses this connection
             */
            let user:any;

            socket.on('auth', async (authTokens:string) => {
                /*
                    authentication with jwt
                 */
                try {
                    /*
                        data is extracted from token
                     */
                    const {uid, username} = await verifyToken(authTokens);
                    /*
                        socket is initialized
                     */
                    user = await chatData.initUserSocket(uid, username, socket);
                    /*
                        info that user is initialized is emitted to client
                     */
                    socket.emit('initialized');
                    // info is logged
                    logger.log('info','Socket: %s %s','connection established: ',user.uid);
                } catch (err) {
                    logger.log('error','Socket: %s at %s','error',err);
                    socket.disconnect();
                }
            });
            /*
                wird aufgerufen, wenn chat gewechselt wird
             */
            socket.on('change chat', data => {
                /*
                    if data is null, no chat should be selected
                 */
                if (data === null)
                    chatData.changeChat(user, '', 0);
                else
                    chatData.changeChat(user, data.type, data.id);
                // info is logged
                logger.log('info','Socket: %s %s ','chat changed: ',user.uid);
            });
            socket.on('started typing', () => {
                /*
                    user started typing
                 */
                user.startedTyping();
                // info is logged
                logger.log('info','Socket: %s %s ','user started typing: ',user.uid);
            });
            socket.on('stopped typing', () => {
                /*
                    user stopped typing
                 */
                user.stoppedTyping();
                // info is logged
                logger.log('info','Socket: %s %s ','user stopped typing: ',user.uid);
            });
            /*
                is called after client disconnected
             */
            socket.on('disconnect', () => {
                /*
                    userData is saved and deleted
                 */
                chatData.unloadUser(user);

                logger.log('info','disconnected');
            });
        });
    }
    /*
        returns if the user is online
     */
    isUserOnline(uid:number){
        return chatData.isUserOnline(uid);
    }
/*
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
    }*/
}