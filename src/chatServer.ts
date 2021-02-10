import {Server, Socket} from 'socket.io';
import {chatData} from "./chatData/data";
import {verifyToken} from "./authentication/jwt";
import {Express} from "express";
import {Pool} from "mysql2";
import {logger} from "./util/logger";
import User from "./chatData/user";
import {ChangeChatData, instanceOfChangeChatData} from "./models/chat";

export let chatServer:ChatServer;
export function createChatServer(server:any,con:any,app:any){
    chatServer = new ChatServer(server,con,app);
}
/*
    The socket that is communicating with the server
 */
class ChatServer{

    private _server:any;
    private _pool:Pool;
    private _app:Express;
    private _io:Server;

    constructor(server:any,pool:Pool,app:Express) {

        this.server = server;
        this.pool = pool;
        this.app = app;

        //@ts-ignore
        this.io = new Server(server);
        /*
            gets called when a connection is established
         */
        this.io.on('connection', (socket:Socket) => {

            logger.info(socket.id);
            logger.info('Socket(id: %s): %s',socket.id,' new connection initialized');
            /*
                the user who uses this connection
             */
            let user:User;
            let authenticated:boolean = false;

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

                    authenticated = true;
                    /*
                        info that user is initialized is emitted to client
                     */
                    socket.emit('initialized');
                    // info is logged
                    logger.log('info','Socket(id: %s): %s %s ',socket.id,'connection established: ',user.uid);
                } catch (err) {
                    logger.log('error','Socket(id: %s): %s %s ',socket.id,'error',err);
                    socket.disconnect();
                }
            });
            /*
                gets called when chat is changed
             */
            socket.on('change chat', (data:ChangeChatData) => {

                if(authenticated) {
                    /*
                        if data is null, no chat should be selected
                     */
                    if(!instanceOfChangeChatData(data))
                        chatData.changeChat(user, '', 0);
                    else
                        chatData.changeChat(user, data.type, data.id);
                    // info is logged
                    logger.log('info', 'Socket(id: %s): %s %s ', socket.id, 'chat changed: ', user.uid);
                }else
                    socket.disconnect();
            });
            socket.on('started typing', () => {
                if(authenticated) {
                    /*
                        user started typing
                     */
                    user.startedTyping();
                    // info is logged
                    logger.log('info', 'Socket(id: %s): %s %s ', socket.id, 'user started typing: ', user.uid);
                }else
                    socket.disconnect();
            });
            socket.on('stopped typing', () => {
                if(authenticated) {
                    /*
                        user stopped typing
                     */
                    user.stoppedTyping();
                    // info is logged
                    logger.log('info', 'Socket(id: %s): %s %s ', socket.id, 'user stopped typing: ', user.uid);
                }else
                    socket.disconnect();
            });
            /*
                is called after client disconnected
             */
            socket.on('disconnect', async () => {
                if(authenticated) {
                    /*
                        userData is saved and deleted
                     */
                    try {
                        await chatData.unloadUser(user);
                    } catch (err) {
                        logger.error(err);
                    }

                    logger.log('info', 'Socket(id: %s): %s ', socket.id, 'disconnected');
                }else
                    socket.disconnect();
            });
        });

        logger.info('chatServer created');
    }
    /*
        returns if the user is online
     */
    isUserOnline(uid:number):boolean {
        return chatData.isUserOnline(uid);
    }

    get server(): Server {
        return this._server;
    }

    set server(value: Server) {
        this._server = value;
    }

    get pool(): Pool {
        return this._pool;
    }

    set pool(value: Pool) {
        this._pool = value;
    }

    get app(): Express {
        return this._app;
    }

    set app(value: Express) {
        this._app = value;
    }

    get io(): Server {
        return this._io;
    }

    set io(value: Server) {
        this._io = value;
    }
}