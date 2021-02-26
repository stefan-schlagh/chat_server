import {app, closeServer, startServer} from "../../src/app";
// @ts-ignore
import names from "../../src/__testHelpers__/names/names.json";
import {AccountInfo, initAccount} from "../../src/__testHelpers__/userHelpers";
import {ChatInfo, GroupChatData, GroupChatMemberData, instanceOfChatInfo} from "../../src/models/chat";
import request, {Response} from "supertest";

describe('test API /group 3', () => {

    describe('test without socket', () => {

        const accountsNumber = 10;
        const accounts: AccountInfo[] = new Array(accountsNumber);
        const groupName = 'TestGroup3';

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
                accounts[i] = await initAccount(names[i + 20]);
            }
        });
        it('create groups with success',async () => {
            const groupData:GroupChatData = {
                name: groupName,
                description: '',
                isPublic: false
            };
            // accounts 1-9 will be added
            const members:GroupChatMemberData[] = [];
            for(let i:number = 1;i < accountsNumber;i++){
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
        it('remove member',async () => {
            const uid = accounts[9].uid;
            const res:Response = await request(app)
                .delete('/group/' + chatId + '/member/' + uid)
                .set('Authorization',accounts[0].tokens)
                .send();
            expect(res.status).toEqual(200);
        });
        it('get chat - admin', async () => {
            const res:Response = await request(app)
                .get('/chats/')
                .set('Authorization',accounts[0].tokens)
                .send();
            expect(res.status).toEqual(200);
            const data:ChatInfo[] = res.body;
            expect(data.length).toBeGreaterThanOrEqual(1);
            expect(instanceOfChatInfo(data[0])).toEqual(true);
            /*
                search for the wanted chat
             */
            const searchForChat = ():boolean => {
                for(let i = 0;i < data.length;i++){
                    if(data[i].type === 'groupChat' && data[i].id == chatId)
                        return true;
                }
                return false;
            }
            expect(searchForChat()).toEqual(true);
        });
        it('get chat - deleted user', async () => {
            const res:Response = await request(app)
                .get('/chats/')
                .set('Authorization',accounts[9].tokens)
                .send();
            expect(res.status).toEqual(200);
            const data:ChatInfo[] = res.body;
            expect(data.length).toBeGreaterThanOrEqual(1);
            expect(instanceOfChatInfo(data[0])).toEqual(true);
            /*
                search for the wanted chat
             */
            const searchForChat = ():ChatInfo => {
                for(let i = 0;i < data.length;i++){
                    if(data[i].type === 'groupChat' && data[i].id == chatId)
                        return data[i];
                }
                return null;
            }
            const chatInfo:ChatInfo = searchForChat();
            expect(chatInfo).not.toEqual(null);
            expect(chatInfo.isStillMember).toEqual(false);
        });
    });
});