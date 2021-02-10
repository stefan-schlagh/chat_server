import {AccountInfo, initAccount} from "../../src/__testHelpers__/userHelpers";
import {app, closeServer, startServer} from "../../src/app";
// @ts-ignore
import names from "../../src/__testHelpers__/names/names.json";
import {instanceOfSimpleUser, SimpleUser} from "../../src/models/user";
import request, {Response} from "supertest";
import {ChatInfo, instanceOfChatInfo, instanceOfNewNormalChatData, NewNormalChatData} from "../../src/models/chat";
import {
    instanceOfLoadedMessages,
    instanceOfNewMessageReturn,
    LoadedMessages, MessageDataOut,
    messageTypes,
    NewMessageReturn
} from "../../src/models/message";
import {logger} from "../../src/util/logger";

describe('test API /user/message',() => {

    const accountsNumber = 10;
    const accounts: AccountInfo[] = new Array(accountsNumber);
    let user:SimpleUser;
    let normalChatId:number;
    let lastMsgId:number;

    const messages = [
        'first message',
        'second message',
        'message by other user'
    ]

    beforeAll((done) => {
        startServer();
        done();
    });
    afterAll((done) => {
        closeServer();
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

        const findMessage = (text:string):boolean => {
            for(let i = 0;i < data.messages.length;i++){
                const message:MessageDataOut = data.messages[i];
                if(message.type === messageTypes.normalMessage)
                    if (message.content.text === text)
                        return true;
            }
            return false;
        };
        expect(findMessage(messages[1])).toEqual(true);
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
});