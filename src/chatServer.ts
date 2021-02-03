import {Server, Socket} from 'socket.io';
import {chatData} from "./chatData/data";
import {verifyToken} from "./authentication/jwt";
import {Express} from "express";
import {Pool} from "mysql2";
import {logger} from "./util/logger";
import User from "./chatData/user";

export let chatServer:any;
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
        this.io = new Server(server);/*,{
            cors: {
                origin: '*:*'
            }
        });*/
        /*
            gets called when a connection is established
         */
        //TODO log socket id
        this.io.on('connection', (socket:Socket) => {

            logger.info('Socket: new connection initialized');
            /*
                the user who uses this connection
             */
            let user:User;

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
            socket.on('change chat', (data:any) => {
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

        logger.info('chatServer created');
    }
    /*
        returns if the user is online
     */
    isUserOnline(uid:number){
        return chatData.isUserOnline(uid);
    }

    get server(): any {
        return this._server;
    }

    set server(value: any) {
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