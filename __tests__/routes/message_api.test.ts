import {AccountInfo, initAccount} from "../../src/__testHelpers__/userHelpers";
import {app, closeServer, startServer} from "../../src/app";
// @ts-ignore
import names from "../../src/__testHelpers__/names/names.json";
import {instanceOfSimpleUser, SimpleUser, UserBlockInfo} from "../../src/models/user";
import request, {Response} from "supertest";
import {ChatInfo, instanceOfChatInfo, instanceOfNewNormalChatData, NewNormalChatData} from "../../src/models/chat";
import {
    instanceOfLoadedMessages,
    instanceOfNewMessageReturn,
    LoadedMessages,
    messageTypes,
    NewMessageReturn
} from "../../src/models/message";
import {findMessage} from "../../src/__testHelpers__/messageHelpers";
import {getUserBlockInfo} from "../../src/database/user/user";
import {findChatChatName} from "../../src/__testHelpers__/chatHelpers";

describe('test API /message',() => {

    const accountsNumber = 10;
    const accounts: AccountInfo[] = new Array(accountsNumber);
    let user:SimpleUser;
    let normalChatId:number;
    let lastMsgId:number;

    const messages = [
        'first message',
        'second message',
        'message by other user',
        'blockMessage1',
        'blockMessage2'
    ]

    beforeAll((done) => {
        startServer();
        done();
    });
    afterAll(async (done) => {
        await closeServer();
        done();
    });
    it('init accounts', async () => {
        /*
            create accounts/ login
         */
        for (let i: number = 0; i < accountsNumber; i++) {
            accounts[i] = await initAccount(names[i + 40]);
        }
    });
    it('create normalChat if it does not exist',async () => {
        /*
            does chat already exist?
         */
        const res1:Response = await request(app)
            .post('/user/noChat')
            .set('Authorization',accounts[0].tokens)
            .send({
                search: accounts[1].username,
                limit: 10,
                start: 0
            });
        expect(res1.status).toEqual(200);
        /*
            if other user is found, create new chat
            otherwise, chat does already exist
         */
        if(res1.body.length > 0) {
            const user1: SimpleUser = res1.body[0];
            expect(instanceOfSimpleUser(user1)).toEqual(true);

            user = user1;

            const res2:Response = await request(app)
                .put('/user/chat')
                .set('Authorization',accounts[0].tokens)
                .send({
                    uid: user.uid,
                    username: user.username,
                    message: {
                        type: messageTypes.normalMessage.valueOf(),
                        content: {
                            media: [],
                            mentions: [],
                            text: messages[0]
                        }
                    }
                });
            expect(res2.status).toEqual(200);
            const data:NewNormalChatData = res2.body;
            expect(instanceOfNewNormalChatData(data)).toEqual(true);
            normalChatId = data.ncid;
        }
        /*
            get chat
         */
        else{
            const res2:Response = await request(app)
                .get('/chats/')
                .set('Authorization',accounts[0].tokens)
                .send();
            expect(res2.status).toEqual(200);
            const data:ChatInfo[] = res2.body;
            expect(data.length).toBeGreaterThanOrEqual(1);
            expect(instanceOfChatInfo(data[0])).toEqual(true);
            /*
                search for the wanted chat
             */
            const searchForChat = (chatName:string) => {
                for(let i = 0;i < data.length;i++){
                    if(data[i].chatName === chatName)
                        return data[i].id;
                }
                return -1;
            }
            normalChatId = searchForChat(accounts[1].username)
            expect(normalChatId).toBeGreaterThanOrEqual(0);
        }
    });
    /*
        does not work without sockets
     */
    it('send message 1',async () => {
        const res:Response = await request(app)
            .put('/message/')
            .set('Authorization',accounts[0].tokens)
            .send({
                type: messageTypes.normalMessage.valueOf(),
                content: {
                    media: [],
                    mentions: [],
                    text: messages[1]
                }
            });
        expect(res.status).toEqual(500);
    });
    it('send message 1 - invalid data',async () => {
        const res:Response = await request(app)
            .put('/message/')
            .set('Authorization',accounts[0].tokens)
            .send({
                type: messageTypes.normalMessage.valueOf()
            });
        expect(res.status).toEqual(400);
    });
    /*
        this works
     */
    it('send message 2',async () => {
        const res:Response = await request(app)
            .put('/message/add')
            .set('Authorization',accounts[0].tokens)
            .send({
                chatType: 'normalChat',
                chatId: normalChatId,
                message: {
                    type: messageTypes.normalMessage.valueOf(),
                    content: {
                        media: [],
                        mentions: [],
                        text: messages[1]
                    }
                }
            });
        expect(res.status).toEqual(200);
        const data:NewMessageReturn = res.body;
        expect(instanceOfNewMessageReturn(data)).toEqual(true);
    });
    it('send message 2 - invalid data',async () => {
        const res:Response = await request(app)
            .put('/message/add')
            .set('Authorization',accounts[0].tokens)
            .send({
                chatType: 'normalChat',
                chatId: normalChatId,
                message: {
                    type: messageTypes.normalMessage.valueOf().toString(),
                    content: {
                        media: [],
                        mentions: [],
                        text: messages[1]
                    }
                }
            });
        expect(res.status).toEqual(400);
    });
    it('send message - other user',async () => {
        const res:Response = await request(app)
            .put('/message/add')
            .set('Authorization',accounts[1].tokens)
            .send({
                chatType: 'normalChat',
                chatId: normalChatId,
                message: {
                    type: messageTypes.normalMessage.valueOf(),
                    content: {
                        media: [],
                        mentions: [],
                        text: messages[2]
                    }
                }
            });
        expect(res.status).toEqual(200);
        const data:NewMessageReturn = res.body;
        expect(instanceOfNewMessageReturn(data)).toEqual(true);
        lastMsgId = data.mid;
    });
    it('load messages',async () => {
        const res:Response = await request(app)
            .post('/message/load')
            .set('Authorization',accounts[1].tokens)
            .send({
                chatType: 'normalChat',
                chatId: normalChatId,
                lastMsgId: lastMsgId,
                num: 10
            });
        expect(res.status).toEqual(200);
        const data:LoadedMessages = res.body;
        expect(instanceOfLoadedMessages(data)).toEqual(true);
        // 2 --> the message with lastMsgId is already loaded
        expect(data.messages.length).toBeGreaterThanOrEqual(2);

        expect(findMessage(messages[1],data)).toEqual(true);
    });
    it('load messages - invalid data',async () => {
        const res:Response = await request(app)
            .post('/message/load')
            .set('Authorization',accounts[1].tokens)
            .send({
                chatType: 0,
                chatId: normalChatId,
                lastMsgId: lastMsgId.toString(),
                num: '10'
            });
        expect(res.status).toEqual(400);
    });
    it('block user', async () => {
        const res1:Response = await request(app)
            .get('/user/block/' + accounts[1].uid)
            .set('Authorization',accounts[0].tokens)
            .send();
        expect(res1.status).toEqual(200);
        // check the block info of the user blocking
        const blockInfo: UserBlockInfo = await getUserBlockInfo(accounts[0].uid, accounts[1].uid);
        expect(blockInfo.blockedByOther).toEqual(false);
        expect(blockInfo.blockedBySelf).toEqual(true);
    });
    it('send message - blocked user',async () => {
        const res2:Response = await request(app)
            .put('/message/add')
            .set('Authorization',accounts[1].tokens)
            .send({
                chatType: 'normalChat',
                chatId: normalChatId,
                message: {
                    type: messageTypes.normalMessage.valueOf(),
                    content: {
                        media: [],
                        mentions: [],
                        text: messages[3]
                    }
                }
            });
        expect(res2.status).toEqual(403);
    });
    it('send message - to blocked user',async () => {
        const res2:Response = await request(app)
            .put('/message/add')
            .set('Authorization',accounts[0].tokens)
            .send({
                chatType: 'normalChat',
                chatId: normalChatId,
                message: {
                    type: messageTypes.normalMessage.valueOf(),
                    content: {
                        media: [],
                        mentions: [],
                        text: messages[4]
                    }
                }
            });
        expect(res2.status).toEqual(403);
    });
    it('get chat - blocked user',async () => {
        const res:Response = await request(app)
            .get('/chats/')
            .set('Authorization',accounts[1].tokens)
            .send();
        expect(res.status).toEqual(200);
        const data:ChatInfo[] = res.body;
        expect(data.length).toBeGreaterThanOrEqual(1);
        expect(instanceOfChatInfo(data[0])).toEqual(true);
        // find chat
        const chatInfo:ChatInfo = findChatChatName(data,accounts[0].username);
        expect(normalChatId).toEqual(chatInfo.id);
        expect(chatInfo.blockedBySelf).toEqual(false);
        expect(chatInfo.blockedByOther).toEqual(true);
    });
    it('send message - unblocked user',async () => {
        const res1:Response = await request(app)
            .get('/user/unblock/' + accounts[1].uid)
            .set('Authorization',accounts[0].tokens)
            .send();
        expect(res1.status).toEqual(200);
        const res2:Response = await request(app)
            .put('/message/add')
            .set('Authorization',accounts[1].tokens)
            .send({
                chatType: 'normalChat',
                chatId: normalChatId,
                message: {
                    type: messageTypes.normalMessage.valueOf(),
                    content: {
                        media: [],
                        mentions: [],
                        text: messages[3]
                    }
                }
            });
        expect(res2.status).toEqual(200);
        const data:NewMessageReturn = res2.body;
        expect(instanceOfNewMessageReturn(data)).toEqual(true);
    });
    it('send message - to unblocked user',async () => {
        const res2:Response = await request(app)
            .put('/message/add')
            .set('Authorization',accounts[0].tokens)
            .send({
                chatType: 'normalChat',
                chatId: normalChatId,
                message: {
                    type: messageTypes.normalMessage.valueOf(),
                    content: {
                        media: [],
                        mentions: [],
                        text: messages[4]
                    }
                }
            });
        expect(res2.status).toEqual(200);
        const data:NewMessageReturn = res2.body;
        expect(instanceOfNewMessageReturn(data)).toEqual(true);
    });
});