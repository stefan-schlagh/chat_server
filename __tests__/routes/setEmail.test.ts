import request, {Response} from "supertest";
import {app, closeServer, startServer} from "../../src/app";
import {mailStorage} from "../../src/verification/mailStorage";
import {instanceOfSimpleUser, UserInfoSelf} from "../../src/models/user";
import {AccountInfo, initAccount} from "../../src/__testHelpers__/userHelpers";

const test_username = "test123456";
let account:AccountInfo;
const newEmail = "stefanjkf.test+setEmailTest@gmail.com";

describe('setEmail Test: API /user', () => {
    beforeAll((done) => {
        startServer();
        done();
    });
    afterAll((done) => {
        closeServer();
        done();
    });
    it('init account', async () => {

        account = await initAccount(test_username);
    });
    it("setEmail - wrong type",async () => {
        const res:Response = await request(app)
            .post('/user/setEmail')
            .set('Authorization',account.tokens)
            .send({
                email: 1
            })
        expect(res.status).toEqual(400);
    });
    it("setEmail - invalid email",async () => {
        const res:Response = await request(app)
            .post('/user/setEmail')
            .set('Authorization',account.tokens)
            .send({
                email: "@a.a"
            })
        expect(res.status).toEqual(400);
    });
    it("setEmail",async () => {
        const res:Response = await request(app)
            .post('/user/setEmail')
            .set('Authorization',account.tokens)
            .send({
                email: newEmail
            })
        expect(res.status).toEqual(200);
        expect(typeof mailStorage.get("Chat App: email verification")).toEqual("string");
    });
    it("verifyEmail - wrong type",async () => {
        const res:Response = await request(app)
            .get('/user/verifyEmail/true')
        expect(res.status).toEqual(400);
    });
    it("verifyEmail",async () => {
        const res:Response = await request(app)
            .get('/user/verifyEmail/' + mailStorage.get("Chat App: email verification"))
        expect(res.status).toEqual(200);
    });
    it("email to be changed",async () => {
        const res:Response = await request(app)
            .get('/user/self')
            .set('Authorization',account.tokens)
            .send();
        expect(res.status).toEqual(200);
        const user:UserInfoSelf = res.body;
        expect(instanceOfSimpleUser(user)).toEqual(true);

        expect(user.username).toEqual(test_username);
        expect(user.email).toEqual(newEmail);
    });
    it("fail verify",async () => {
        const res1:Response = await request(app)
            .post('/user/setEmail')
            .set('Authorization',account.tokens)
            .send({
                email: "stefanjkf.test@gmail.com"
            })
        expect(res1.status).toEqual(200);
        expect(typeof mailStorage.get("Chat App: email verification")).toEqual("string");

        const res2:Response = await request(app)
            .get('/user/verifyEmail/' + mailStorage.get("Chat App: email verification") + "jkljl")
        expect(res2.status).toEqual(403);
    });
});