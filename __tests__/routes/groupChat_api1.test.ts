import {app, closeServer, startServer} from "../../src/app";
// @ts-ignore
import names from "../../src/__testHelpers__/names/names.json";
import {AccountInfo, findUserName, initAccount} from "../../src/__testHelpers__/userHelpers";
import request, {Response} from "supertest";
import {
    GroupChatData,
    GroupChatInfo,
    GroupChatMemberData
} from "../../src/models/chat";
import {instanceOfSimpleUser, SimpleUser} from "../../src/models/user";
import {groupChatErrors} from "../../src/routes/group";

describe('test API /group 1', () => {

    describe('test without socket', () => {

        const accountsNumber = 20;
        const accounts: AccountInfo[] = new Array(accountsNumber);
        const groupName1 = 'TestGroup1';
        const groupName2 = 'TestGroup1-2';
        const groupDescription1 = 'this is a group';
        const groupDescription2 = 'this is a good group';

        let chatId: number;

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
                accounts[i] = await initAccount(names[i]);
            }
        });
        it('create groups with corrupted groupData', async () => {
            const groupData = 'data';
            const members: GroupChatMemberData[] = [];
            const res: Response = await request(app)
                .put('/group/')
                .set('Authorization', accounts[0].tokens)
                .send({
                    data: groupData,
                    users: members
                });
            // response should be bad request
            expect(res.status).toEqual(400);
        });
        it('create groups with corrupted memberData', async () => {
            const groupData: GroupChatData = {
                name: groupName1,
                description: groupDescription1,
                isPublic: false
            };
            const members: any =
                [{
                    uid: 1,
                    username: 'abc'
                }];
            const res: Response = await request(app)
                .put('/group/')
                .set('Authorization', accounts[0].tokens)
                .send({
                    data: groupData,
                    users: members
                });
            expect(res.status).toEqual(400);
        });
        it('create groups with success', async () => {
            const groupData: GroupChatData = {
                name: groupName1,
                description: groupDescription1,
                isPublic: false
            };
            // accounts 1-9 will be added
            const members: GroupChatMemberData[] = [];
            for (let i: number = 1; i < 10; i++) {
                members.push({
                    uid: accounts[i].uid,
                    username: accounts[i].username,
                    isAdmin: false
                });
            }
            const res: Response = await request(app)
                .put('/group/')
                .set('Authorization', accounts[0].tokens)
                .send({
                    data: groupData,
                    users: members
                });
            expect(res.status).toEqual(200);
            expect(res.body.chatId).toBeGreaterThan(0);
            chatId = res.body.chatId;
        });
        it('test groupChatInfo', async () => {
            const res: Response = await request(app)
                .get('/group/' + chatId)
                .set('Authorization', accounts[0].tokens)
                .send();
            expect(res.status).toEqual(200);

            const groupChatInfo: GroupChatInfo = res.body;
            expect(groupChatInfo.type).toEqual('groupChat');
            expect(groupChatInfo.id).toEqual(chatId);
            expect(groupChatInfo.chatName).toEqual(groupName1);
            expect(groupChatInfo.description).toEqual(groupDescription1);
            expect(groupChatInfo.memberSelf.isAdmin).toEqual(true);

            for (let i = 1; i < 10; i++) {
                expect(findUserName(accounts[i].uid, groupChatInfo.members)).toEqual(accounts[i].username);
            }
        });
        it('test groupChatInfo not member', async () => {
            const res: Response = await request(app)
                .get('/group/' + chatId)
                .set('Authorization', accounts[15].tokens)
                .send();
            expect(res.status).not.toEqual(200);
        });
        it('add additional members empty data', async () => {
            const res: Response = await request(app)
                .put('/group/' + chatId + '/members/')
                .set('Authorization', accounts[0].tokens)
                .send({
                    users: []
                });
            expect(res.status).toEqual(400);
        });
        it('add additional members invalid data', async () => {
            const members: any =
                [{
                    uid: '1',
                    username: 'abc'
                }];
            const res: Response = await request(app)
                .put('/group/' + chatId + '/members/')
                .set('Authorization', accounts[0].tokens)
                .send({
                    users: members
                });
            expect(res.status).toEqual(400);
        });
        it('add additional members not admin', async () => {
            const members: any =
                [{
                    uid: 1,
                    username: 'abc'
                }];
            const res: Response = await request(app)
                .put('/group/' + chatId + '/members/')
                .set('Authorization', accounts[1].tokens)
                .send({
                    users: members
                });
            expect(res.status).toEqual(403);
        });
        it('add additional members', async () => {
            // accounts 10-14 will be added
            const members: SimpleUser[] = [];
            for (let i: number = 10; i < 15; i++) {
                members.push({
                    uid: accounts[i].uid,
                    username: accounts[i].username
                });
            }
            const res: Response = await request(app)
                .put('/group/' + chatId + '/members/')
                .set('Authorization', accounts[0].tokens)
                .send({
                    users: members
                });
            expect(res.status).toEqual(200);
        });
        it('expect additional members to be in chat', async () => {
            const res: Response = await request(app)
                .get('/group/' + chatId)
                .set('Authorization', accounts[0].tokens)
                .send();
            expect(res.status).toEqual(200);

            const groupChatInfo: GroupChatInfo = res.body;

            for (let i = 10; i < 15; i++) {
                expect(findUserName(accounts[i].uid, groupChatInfo.members)).toEqual(accounts[i].username);
            }
        });
        it('add a single member', async () => {

            const uid = accounts[15].uid;
            const res: Response = await request(app)
                .put('/group/' + chatId + '/member/' + uid)
                .set('Authorization', accounts[0].tokens)
                .send();
            expect(res.status).toEqual(200);
        });
        it('expect member to be in chat', async () => {
            const res: Response = await request(app)
                .get('/group/' + chatId)
                .set('Authorization', accounts[0].tokens)
                .send();
            expect(res.status).toEqual(200);

            const groupChatInfo: GroupChatInfo = res.body;

            expect(findUserName(accounts[15].uid, groupChatInfo.members)).toEqual(accounts[15].username);
        });
        it('remove member', async () => {
            const uid = accounts[15].uid;
            const res: Response = await request(app)
                .delete('/group/' + chatId + '/member/' + uid)
                .set('Authorization', accounts[0].tokens)
                .send();
            expect(res.status).toEqual(200);
        });
        it('expect member not to be in chat', async () => {
            const res: Response = await request(app)
                .get('/group/' + chatId)
                .set('Authorization', accounts[0].tokens)
                .send();
            expect(res.status).toEqual(200);

            const groupChatInfo: GroupChatInfo = res.body;

            expect(findUserName(accounts[15].uid, groupChatInfo.members)).toEqual('');
        });
        it('make members admin', async () => {
            const uid1 = accounts[1].uid;
            const res1: Response = await request(app)
                .post('/group/' + chatId + '/member/' + uid1 + '/giveAdmin/')
                .set('Authorization', accounts[0].tokens)
                .send();
            expect(res1.status).toEqual(200);

            const uid2 = accounts[2].uid;
            const res2: Response = await request(app)
                .post('/group/' + chatId + '/member/' + uid2 + '/giveAdmin/')
                .set('Authorization', accounts[1].tokens)
                .send();
            expect(res2.status).toEqual(200);
        });
        it('take admins away from members', async () => {
            const uid = accounts[0].uid;
            const res: Response = await request(app)
                .post('/group/' + chatId + '/member/' + uid + '/removeAdmin/')
                .set('Authorization', accounts[2].tokens)
                .send();
            expect(res.status).toEqual(200);
        });
        it('change chat name not admin', async () => {
            const res: Response = await request(app)
                .put('/group/' + chatId + '/chatName/')
                .set('Authorization', accounts[0].tokens)
                .send({
                    chatName: groupName2
                });
            expect(res.status).toEqual(403);
        });
        it('change chat name', async () => {
            const res: Response = await request(app)
                .put('/group/' + chatId + '/chatName/')
                .set('Authorization', accounts[1].tokens)
                .send({
                    chatName: groupName2
                });
            expect(res.status).toEqual(200);
        });
        it('change chat description', async () => {
            const res: Response = await request(app)
                .put('/group/' + chatId + '/description/')
                .set('Authorization', accounts[1].tokens)
                .send({
                    description: groupDescription2
                });
            expect(res.status).toEqual(200);
        });
        it('chat name and description to be changed', async () => {
            const res: Response = await request(app)
                .get('/group/' + chatId)
                .set('Authorization', accounts[0].tokens)
                .send();
            expect(res.status).toEqual(200);

            const groupChatInfo: GroupChatInfo = res.body;
            expect(groupChatInfo.chatName).toEqual(groupName2);
            expect(groupChatInfo.description).toEqual(groupDescription2);
        });
        /*
            admins before: 1,2
            admins after: 2
         */
        it('remove admin self', async () => {
            const res: Response = await request(app)
                .post('/group/' + chatId + '/removeAdmin/')
                .set('Authorization', accounts[1].tokens)
                .send();
            expect(res.status).toEqual(200);
        });
        it('leave chat - no admin left', async () => {
            const res: Response = await request(app)
                .post('/group/' + chatId + '/leave/')
                .set('Authorization', accounts[2].tokens)
                .send();
            expect(res.status).toEqual(400);
            expect(res.body.errorCode).toEqual(groupChatErrors.noAdminLeft);
        });
        it('leave chat', async () => {
            const res: Response = await request(app)
                .post('/group/' + chatId + '/leave/')
                .set('Authorization', accounts[1].tokens)
                .send();
            expect(res.status).toEqual(200);
        });
        // user 2 is in chat --> nothing should be returned
        it('search user not in group - return nothing', async () => {
            const res: Response = await request(app)
                .post('/user/notInGroup/' + chatId)
                .set('Authorization', accounts[4].tokens)
                .send({
                    search: accounts[2].username,
                    limit: 10,
                    start: 0
                });
            expect(res.status).toEqual(200);
            expect(res.body.length).toEqual(0);
        });
        // there should be at least 6 users not in the chat
        it('search user not in group - return all', async () => {
            const res: Response = await request(app)
                .post('/user/notInGroup/' + chatId)
                .set('Authorization', accounts[2].tokens)
                .send({
                    search: '',
                    limit: 10,
                    start: 0
                });
            expect(res.status).toEqual(200);
            expect(res.body.length).toBeGreaterThanOrEqual(6);
        });
        // user 19 should not be in group
        it('search user not in group - return one', async () => {
            const res: Response = await request(app)
                .post('/user/notInGroup/' + chatId)
                .set('Authorization', accounts[3].tokens)
                .send({
                    search: accounts[19].username,
                    limit: 10,
                    start: 0
                });
            expect(res.status).toEqual(200);
            expect(res.body.length).toEqual(1);
            const user: SimpleUser = res.body[0];
            expect(instanceOfSimpleUser(user)).toEqual(true);
            expect(user.uid).toEqual(accounts[19].uid);
            expect(user.username).toEqual(accounts[19].username);
        });
    });
});