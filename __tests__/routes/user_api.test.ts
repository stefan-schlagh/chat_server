import {app, closeServer, startServer} from "../../src/app";
import {AccountInfo, initAccount} from "../../src/__testHelpers__/userHelpers";
// @ts-ignore
import names from "../../src/__testHelpers__/names/names.json";
import request, {Response} from "supertest";
import {instanceOfSimpleUser, instanceOfUserInfo, SimpleUser, UserInfo} from "../../src/models/user";
import {messageTypes} from "../../src/chatData/message/message";
import {instanceOfNewNormalChatData, NewNormalChatData} from "../../src/models/chat";

describe('test API /user',() => {

    const accountsNumber = 10;
    const accounts:AccountInfo[] = new Array(accountsNumber);

    beforeAll((done) => {
        startServer();
        done();
    });
    afterAll((done) => {
        closeServer();
        done();
    });
    it('init accounts',async () => {
        /*
            create accounts/ login
         */
        for(let i:number = 0;i < accountsNumber;i++){
            accounts[i] = await initAccount(names[i + 30]);
        }
    });
    it('search user - error',async () => {
        const res:Response = await request(app)
            .post('/user/')
            .set('Authorization',accounts[0].tokens)
            .send({
                search: 100,
                limit: 10,
                start: 0
            });
        expect(res.status).toEqual(400);
    });
    it('search user',async () => {
        const res:Response = await request(app)
            .post('/user/')
            .set('Authorization',accounts[0].tokens)
            .send({
                search: accounts[1].username,
                limit: 10,
                start: 0
            });
        expect(res.status).toEqual(200);
        expect(res.body.length).toEqual(1);
        const user:SimpleUser = res.body[0];
        expect(instanceOfSimpleUser(user)).toEqual(true);
        expect(user.uid).toEqual(accounts[1].uid);
        expect(user.username).toEqual(accounts[1].username);
    });
    it('search user not in chat',async () => {
        const res:Response = await request(app)
            .post('/user/noChat')
            .set('Authorization',accounts[0].tokens)
            .send({
                search: accounts[2].username,
                limit: 10,
                start: 0
            });
        expect(res.status).toEqual(200);
        expect(res.body.length).toEqual(1);
        const user:SimpleUser = res.body[0];
        expect(instanceOfSimpleUser(user)).toEqual(true);
        expect(user.uid).toEqual(accounts[2].uid);
        expect(user.username).toEqual(accounts[2].username);
    });
    it('get userInfo self',async () => {
        const res:Response = await request(app)
            .get('/user/self')
            .set('Authorization',accounts[0].tokens)
            .send();
        expect(res.status).toEqual(200);
        const user:SimpleUser = res.body;
        expect(instanceOfSimpleUser(user)).toEqual(true);
        expect(user.uid).toEqual(accounts[0].uid);
        expect(user.username).toEqual(accounts[0].username);
    });
    it('get userInfo of other user',async () => {
        const res:Response = await request(app)
            .get('/user/' + accounts[3].uid)
            .set('Authorization',accounts[2].tokens)
            .send();
        expect(res.status).toEqual(200);
        const userInfo:UserInfo = res.body;
        expect(instanceOfUserInfo(userInfo)).toEqual(true);
        expect(userInfo.uidSelf).toEqual(accounts[2].uid);
        expect(userInfo.username).toEqual(accounts[3].username);
        expect(userInfo.blocked).toEqual(false);
        expect(userInfo.userExists).toEqual(true);
    });
    /*
        test normalChats
            the first account at noChat is taken and a normalChat gets created
     */
    let user:SimpleUser;
    const message:string = 'first message';

    it('get user with no chat',async () => {
        const res:Response = await request(app)
            .post('/user/noChat')
            .set('Authorization',accounts[9].tokens)
            .send({
                search: '',
                limit: 10,
                start: 0
            });
        expect(res.status).toEqual(200);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
        const user1:SimpleUser = res.body[0];
        expect(instanceOfSimpleUser(user1)).toEqual(true);

        user = user1;
    });
    it('create the new chat - wrong type',async () => {
        const res:Response = await request(app)
            .put('/user/chat')
            .set('Authorization',accounts[9].tokens)
            .send({
                uid: 1,
                username: user.uid
            });
        expect(res.status).toEqual(400);
    });
    it('create the new chat',async () => {
        const res:Response = await request(app)
            .put('/user/chat')
            .set('Authorization',accounts[9].tokens)
            .send({
                uid: user.uid,
                username: user.username,
                message: {
                    type: messageTypes.normalMessage.valueOf(),
                    content: {
                        media: [],
                        mentions: [],
                        text: message
                    }
                }
            });
        expect(res.status).toEqual(200);
        const data:NewNormalChatData = res.body;
        expect(instanceOfNewNormalChatData(data)).toEqual(true);
    });
});