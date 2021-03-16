import {AccountInfo, findUserName, initAccount} from "../../src/__testHelpers__/userHelpers";
import {app, closeServer, startServer} from "../../src/app";
// @ts-ignore
import names from "../../src/__testHelpers__/names/names.json";
import {GroupChatData, GroupChatInfo, GroupChatMemberData, instanceOfGroupChatDataOut} from "../../src/models/chat";
import request, {Response} from "supertest";
import {findPublicGroupChat} from "../../src/__testHelpers__/chatHelpers";

describe('test API /group public', () => {

    const accountsNumber = 9;
    const accounts: AccountInfo[] = new Array(accountsNumber);
    const groupName = 'Public group Test';

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
            accounts[i] = await initAccount(names[i + 61]);
        }
    });
    it('create group with success',async () => {
        const groupData:GroupChatData = {
            name: groupName,
            description: '',
            isPublic: true
        };
        // accounts 1-9 will be added
        const members:GroupChatMemberData[] = [];
        for(let i:number = 1;i < accountsNumber - 1;i++){
            members.push({
                uid: accounts[i].uid,
                username: accounts[i].username,
                isAdmin: false
            });
        }
        const res:Response = await request(app)
            .put('/group/')
            .set('Authorization',accounts[0].tokens)
            .send({
                data: groupData,
                users: members
            });
        expect(res.status).toEqual(200);
        expect(res.body.chatId).toBeGreaterThan(0);
        chatId = res.body.chatId;
    });
    it('get group chat - show all',async () => {
        const res:Response = await request(app)
            .post('/group/public/')
            .set('Authorization',accounts[0].tokens)
            .send({
                search: groupName,
                limit: 10,
                start: 0,
                isNotPart: false
            })
        expect(res.status).toEqual(200)
        expect(res.body.length).toBeGreaterThanOrEqual(1)
        expect(instanceOfGroupChatDataOut(res.body[0])).toEqual(true)
        expect(res.body[0].name).toEqual(groupName)
    })
    /*
        get group chat, accountsNumber - 1 should not be in it already
     */
    it('get group chat - show only where not part',async () => {
        const res:Response = await request(app)
            .post('/group/public/')
            .set('Authorization',accounts[accountsNumber - 1].tokens)
            .send({
                search: groupName,
                limit: 10,
                start: 0,
                isNotPart: true
            })
        expect(res.status).toEqual(200)
        expect(res.body.length).toBeGreaterThanOrEqual(1)
        expect(instanceOfGroupChatDataOut(res.body[0])).toEqual(true)

        const groupData = findPublicGroupChat(res.body,chatId);
        expect(groupData).not.toEqual(null);
        expect(instanceOfGroupChatDataOut(groupData)).toEqual(true)
        expect(groupData.name).toEqual(groupName)
        expect(groupData.isPublic).toEqual(true)
    })
    /*
        join chat, accountsNumber - 1 should not be in it already
     */
    it('join chat',async () => {
        const res:Response = await request(app)
            .post('/group/' + chatId + '/join')
            .set('Authorization',accounts[accountsNumber - 1].tokens)
            .send()
        expect(res.status).toEqual(200)
    })
    it('expect new member to be in chat', async () => {
        const res: Response = await request(app)
            .get('/group/' + chatId)
            .set('Authorization', accounts[0].tokens)
            .send();
        expect(res.status).toEqual(200);

        const groupChatInfo: GroupChatInfo = res.body;
        expect(findUserName(
            accounts[accountsNumber - 1].uid,
            groupChatInfo.members)
        ).toEqual(accounts[accountsNumber - 1].username);
    })
});