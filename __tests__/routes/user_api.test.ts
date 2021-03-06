import {app, closeServer, startServer} from "../../src/app";
import {AccountInfo, initAccount} from "../../src/__testHelpers__/userHelpers";
// @ts-ignore
import names from "../../src/__testHelpers__/names/names.json";
import request, {Response} from "supertest";
import {
    instanceOfSimpleUser,
    instanceOfUserInfo,
    SimpleUser,
    UserBlockInfo,
    UserInfo,
    UserInfoSelf
} from "../../src/models/user";
import {instanceOfNewNormalChatData, NewNormalChatData} from "../../src/models/chat";
import {instanceOfNewMessageReturn, messageTypes, NewMessageReturn} from "../../src/models/message";
import {getUserBlockInfo} from "../../src/chatData/database/user";

describe('test API /user',() => {

    const accountsNumber = 10;
    const accounts:AccountInfo[] = new Array(accountsNumber);
    /*
        test normalChats
            the first account at noChat is taken and a normalChat gets created
     */
    let user:SimpleUser;
    const messages:string[] =
        ['first message','second message'];
    let chatData:NewNormalChatData;

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
    it('search user not in chat - 400',async () => {
        const res:Response = await request(app)
            .post('/user/noChat')
            .set('Authorization',accounts[0].tokens)
            .send({
                search: accounts[2].username,
                limit: 'abc',
                start: 0
            });
        expect(res.status).toEqual(400);
    });
    it('search users not in group - 400', async ()  => {
        const res:Response = await request(app)
            .post('/user/notInGroup/gruppe1')
            .set('Authorization',accounts[0].tokens)
            .send({
                search: accounts[2].username,
                limit: 10,
                start: 0
            });
        expect(res.status).toEqual(400);
    });
    it('get userInfo self',async () => {
        const res:Response = await request(app)
            .get('/user/self')
            .set('Authorization',accounts[0].tokens)
            .send();
        expect(res.status).toEqual(200);
        const user:UserInfoSelf = res.body;
        expect(instanceOfSimpleUser(user)).toEqual(true);

        expect(user.uid).toEqual(accounts[0].uid);
        expect(user.username).toEqual(accounts[0].username);
        expect(user.email).toEqual('');
    });
    it('get userInfo of user - not existing',async () => {
        const res:Response = await request(app)
            .get('/user/0')
            .set('Authorization',accounts[2].tokens)
            .send();
        expect(res.status).toEqual(200);
        const userInfo:UserInfo = res.body;
        expect(instanceOfUserInfo(userInfo)).toEqual(true);
        expect(userInfo.blockedBySelf).toEqual(false);
        expect(userInfo.blockedByOther).toEqual(false);
        expect(userInfo.userExists).toEqual(false);
    });
    it('get userInfo of other user',async () => {
        const res:Response = await request(app)
            .get('/user/' + accounts[3].uid)
            .set('Authorization',accounts[2].tokens)
            .send();
        expect(res.status).toEqual(200);
        const userInfo:UserInfo = res.body;
        expect(instanceOfUserInfo(userInfo)).toEqual(true);
        expect(userInfo.username).toEqual(accounts[3].username);
        expect(userInfo.blockedBySelf).toEqual(false);
        expect(userInfo.blockedByOther).toEqual(false);
        expect(userInfo.userExists).toEqual(true);
    });
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
                        text: messages[0]
                    }
                }
            });
        expect(res.status).toEqual(200);
        const data:NewNormalChatData = res.body;
        expect(instanceOfNewNormalChatData(data)).toEqual(true);
        chatData = data;
    });
    it('block user - 400',async () => {
        const res:Response = await request(app)
            .get('/user/block/' + accounts[8])
            .set('Authorization',accounts[7].tokens)
            .send();
        expect(res.status).toEqual(400);
    });
    // user 7 blocks user 8
    it('block user',async () => {
        const res:Response = await request(app)
            .get('/user/block/' + accounts[8].uid)
            .set('Authorization',accounts[7].tokens)
            .send();
        expect(res.status).toEqual(200);
    });
    it('get block info - blocked',async () => {
        // check the block info of the user blocking
        const blockInfo7:UserBlockInfo = await getUserBlockInfo(accounts[7].uid,accounts[8].uid);
        expect(blockInfo7.blockedByOther).toEqual(false);
        expect(blockInfo7.blockedBySelf).toEqual(true);
        // check the block info of the other user
        const blockInfo8:UserBlockInfo = await getUserBlockInfo(accounts[8].uid,accounts[7].uid);
        expect(blockInfo8.blockedByOther).toEqual(true);
        expect(blockInfo8.blockedBySelf).toEqual(false);
        // request
        const res:Response = await request(app)
            .get('/user/' + accounts[7].uid)
            .set('Authorization',accounts[8].tokens)
            .send();
        expect(res.status).toEqual(200);
        const userInfo:UserInfo = res.body;
        expect(instanceOfUserInfo(userInfo)).toEqual(true);
        expect(userInfo.username).toEqual(accounts[7].username);
        expect(userInfo.blockedBySelf).toEqual(false);
        expect(userInfo.blockedByOther).toEqual(true);
        expect(userInfo.userExists).toEqual(true);
    });
    it('search user - expect to not find because blocked',async () => {
        const res:Response = await request(app)
            .post('/user/')
            .set('Authorization',accounts[7].tokens)
            .send({
                search: accounts[8].username,
                limit: 10,
                start: 0
            });
        expect(res.status).toEqual(200);
        expect(res.body.length).toEqual(0);
    });
    it('create new chat - 403',async () => {
        const res:Response = await request(app)
            .put('/user/chat')
            .set('Authorization',accounts[8].tokens)
            .send({
                uid: accounts[7].uid,
                username: accounts[7].username,
                message: {
                    type: messageTypes.normalMessage.valueOf(),
                    content: {
                        media: [],
                        mentions: [],
                        text: messages[0]
                    }
                }
            });
        expect(res.status).toEqual(403);
    });
    it('unblock user - 400',async () => {
        const res:Response = await request(app)
            .get('/user/unblock/' + accounts[8])
            .set('Authorization',accounts[7].tokens)
            .send();
        expect(res.status).toEqual(400);
    });
    // user 7 unblocks user 8
    it('unblock user',async () => {
        const res:Response = await request(app)
            .get('/user/unblock/' + accounts[8].uid)
            .set('Authorization',accounts[7].tokens)
            .send();
        expect(res.status).toEqual(200);
    });
    it('get block info - not blocked',async () => {
        // check the block info of the user blocking
        const blockInfo7: UserBlockInfo = await getUserBlockInfo(accounts[7].uid, accounts[8].uid);
        expect(blockInfo7.blockedByOther).toEqual(false);
        expect(blockInfo7.blockedBySelf).toEqual(false);
    });
    it('search user - not blocked',async () => {
        const res:Response = await request(app)
            .post('/user/')
            .set('Authorization',accounts[7].tokens)
            .send({
                search: accounts[8].username,
                limit: 10,
                start: 0
            });
        expect(res.status).toEqual(200);
        expect(res.body.length).toEqual(1);
        const user:SimpleUser = res.body[0];
        expect(instanceOfSimpleUser(user)).toEqual(true);
        expect(user.uid).toEqual(accounts[8].uid);
        expect(user.username).toEqual(accounts[8].username);
    });
});