import {Server, Socket} from 'socket.io';
import {chatData} from "./chatData/data";
import {verifyToken} from "./authentication/jwt";
import {logger} from "./util/logger";
import User from "./chatData/user";
import {ChangeChatData, instanceOfChangeChatData} from "./models/chat";

export let socketServer:SocketServer;
export function createSocketServer(server:any){
    socketServer = new SocketServer(server);
}
/*
    The socket that is communicating with the server
 */
class SocketServer{

    private _server:any;
    private _io:Server;
    private _clients = new Map<number,Socket>();

    constructor(server:any) {

        this.server = server;
        //create socket server
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
                        add socket to list
                    */
                    this.clients.set(uid,socket);
                    /*
                        socket is initialized
                     */
                    user = await chatData.initUser(uid, username);

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
                        this.clients.delete(user.uid);
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

    getSocket(uid:number):Socket {
        if(!this.clients.has(uid))
            throw new Error('client does not exist!')
        return this.clients.get(uid);
    }

    get server(): Server {
        return this._server;
    }

    set server(value: Server) {
        this._server = value;
    }

    get io(): Server {
        return this._io;
    }

    set io(value: Server) {
        this._io = value;
    }

    get clients(): Map<number, Socket> {
        return this._clients;
    }

    set clients(value: Map<number, Socket>) {
        this._clients = value;
    }
}