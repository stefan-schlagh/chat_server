import {AccountInfo, initAccount} from "../../src/__testHelpers__/userHelpers";
import {app, closeServer, startServer} from "../../src/app";
// @ts-ignore
import names from "../../src/__testHelpers__/names/names.json";
import io from "socket.io-client";
import {ChangeChatData, GroupChatData, instanceOfNewChatData, NewChatData} from "../../src/models/chat";
import request, {Response} from "supertest";
import {instanceOfNewMessageReturn, messageTypes, NewMessageReturn} from "../../src/models/message";

// second group will be with 3 members
describe('\'test API /group 2',() => {

    describe('test with socket', () => {

        const accountsNumber = 3;
        const accounts: AccountInfo[] = new Array(accountsNumber);
        const sockets: any = new Array(accountsNumber);
        const groupName1 = 'TestGroup2';
        const groupDescription1 = 'this is a group';

        let chatId: number;

        beforeAll((done) => {
            startServer();
            done();
        });
        afterAll(async (done) => {
            //close sockets
            for (let i = 0; i < sockets.length; i++) {
                sockets[i].close();
            }
            await closeServer();
            done();
        });
        it('init accounts', async () => {
            /*
                create accounts/ login
             */
            for (let i: number = 0; i < accountsNumber; i++) {
                accounts[i] = await initAccount(names[i + 20]);
            }
        });
        it('init sockets', async () => {
            //establish connection, authenticate
            const initSocket = async (account: AccountInfo) => {

                let socket: any;
                const res = await new Promise((resolve, reject) => {
                    socket = io.connect(
                        'http://localhost:' + process.env.NODE_HTTP_PORT,
                        {
                            transports: ['websocket']
                        }
                    );
                    socket.on('connect', () => {
                        resolve('socket connected');
                    });
                });
                expect(res).toEqual('socket connected');

                const success = await new Promise((resolve, reject) => {
                    socket.emit('auth', account.tokens);
                    socket.on('initialized', () => {
                        resolve(true);
                    });
                    socket.on('disconnect', () => {
                        resolve(false);
                    });
                });
                expect(success).toEqual(true);

                return socket;
            };

            for (let i = 0; i < accounts.length; i++) {
                sockets[i] = await initSocket(accounts[i]);
            }

        });
        it('create chat, expect socket event', async () => {

            const data: NewChatData = await new Promise<NewChatData>((resolve, reject) => {
                const groupData: GroupChatData = {
                    name: groupName1,
                    description: groupDescription1,
                    isPublic: false
                };
                sockets[1].on('new chat', (data: NewChatData) => {
                    resolve(data);
                });
                request(app)
                    .put('/group/')
                    .set('Authorization', accounts[0].tokens)
                    .send({
                        data: groupData,
                        users: [
                            {
                                uid: accounts[1].uid,
                                username: accounts[1].username,
                                isAdmin: false
                            }, {
                                uid: accounts[2].uid,
                                username: accounts[2].username,
                                isAdmin: false
                            }
                        ]
                    })
                    .then((res: Response) => {
                        if (res.status !== 200)
                            reject();
                    });
            });
            expect(instanceOfNewChatData(data)).toEqual(true);
            expect(data.type).toEqual('groupChat');
            expect(data.chatName).toEqual(groupName1);
            chatId = data.id;
        });
        it('change chat to new group', async () => {

            for (let i = 0; i < sockets.length; i++) {
                const data: ChangeChatData = {
                    type: 'groupChat',
                    id: chatId
                };
                sockets[i].emit('change chat', data);
            }
        });
        it('send message', async () => {
            const res: Response = await request(app)
                .put('/message/')
                .set('Authorization', accounts[0].tokens)
                .send({
                    type: messageTypes.normalMessage.valueOf(),
                    content: {
                        media: [],
                        mentions: [],
                        text: 'message 1'
                    }
                });
            expect(res.status).toEqual(200);
            const data: NewMessageReturn = res.body;
            expect(instanceOfNewMessageReturn(data)).toEqual(true);
        });
        it('started typing', async () => {

            const user_typing = 2;

            await new Promise<void>((resolve, reject) => {

                let started_typing = 0;

                for (let i = 0; i < sockets.length; i++) {
                    sockets[i].on('started typing', (data: any) => {
                        expect(data.uid).toEqual(accounts[user_typing].uid);
                        started_typing++;
                        if (started_typing === accountsNumber - 1)
                            resolve();
                    });
                }
                sockets[user_typing].emit('started typing');
            });
        });
        it('stopped typing', async () => {

            const user_typing = 1;

            await new Promise<void>((resolve, reject) => {

                let stopped_typing = 0;

                for (let i = 0; i < sockets.length; i++) {
                    sockets[i].on('stopped typing', (data: any) => {
                        expect(data.uid).toEqual(accounts[user_typing].uid);
                        stopped_typing++;
                        if (stopped_typing === accountsNumber - 1)
                            resolve();
                    });
                }
                sockets[user_typing].emit('stopped typing');
            });
        });
    });
});