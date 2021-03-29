import request, {Response} from "supertest";
import {app, closeServer, startServer} from "../../src/app";
import {mailStorage} from "../../src/verification/mailStorage";
import {AccountInfo} from "../../src/__testHelpers__/userHelpers";
import {instanceOfUserInfoSelf, UserInfoSelf} from "../../src/models/user";

const test_username = "test345678";
let account:AccountInfo;
let newpassword = "password2";

const email1 = "pwReset1@test.com";
const email2 = "pwReset2@test.com";

let oldEmail;
let newEmail = email1;

describe("Test API /pwReset",() => {
    // start the server before the tests
    beforeAll((done) => {
        startServer();
        done();
    });
    // stop the server after the tests
    afterAll(async (done) => {
        mailStorage.clear();
        await closeServer();
        done();
    });
    it('init account', async () => {
        const res:Response = await request(app)
            .post('/auth/register')
            .send({
                username: test_username,
                password: "password"
            })
        expect(res.status).toEqual(200)

        if(!res.body.usernameTaken) {
            expect(res.body).toHaveProperty('tokens')
            account =  {
                uid: res.body.uid,
                username: test_username,
                tokens: res.body.tokens
            }
        }else{
            let res:Response = await request(app)
                .post('/auth/login')
                .send({
                    username: test_username,
                    password: "password"
                })
            if(res.status === 403) {
                res = await request(app)
                    .post('/auth/login')
                    .send({
                        username: test_username,
                        password: "password2"
                    })
                newpassword = "password";
                expect(res.status).toEqual(200);
            }
            expect(res.body).toHaveProperty('tokens')
            account =  {
                uid: res.body.uid,
                username: test_username,
                tokens: res.body.tokens
            }
        }
    });
    it("get unused email",async () => {
        // get current email
        const res1:Response = await request(app)
            .get('/user/self')
            .set('Authorization',account.tokens)
            .send();
        expect(res1.status).toEqual(200);
        const user:UserInfoSelf = res1.body;
        expect(instanceOfUserInfoSelf(user)).toEqual(true);
        expect(user.username).toEqual(test_username);

        oldEmail = user.email;
        if(oldEmail === email1)
            newEmail = email2;
        else
            newEmail = email1;
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
    it("verifyEmail",async () => {
        expect(mailStorage.size).toBeGreaterThanOrEqual(1);
        const res:Response = await request(app)
            .get('/user/verifyEmail/' + mailStorage.get("Chat App: email verification"))
            .set('Authorization',account.tokens)
        expect(res.status).toEqual(200);
    });
    it("request password reset link",async () => {
        const res:Response = await request(app)
            .post('/pwReset/requestLink')
            .send({
                username: test_username,
                email: newEmail
            })
        expect(res.status).toEqual(200);
        expect(typeof mailStorage.get("Chat App: password reset")).toEqual("string");
    });
    it("request password reset link - user not existing",async () => {
        const res:Response = await request(app)
            .post('/pwReset/requestLink')
            .send({
                username: test_username + "abcd",
                email: newEmail
            })
        expect(res.status).toEqual(404);
    });
    it("request password reset link - invalid data",async () => {
        const res:Response = await request(app)
            .post('/pwReset/requestLink')
            .send({
                username: test_username
            })
        expect(res.status).toEqual(400);
    });
    it("verify password reset",async () => {
        expect(typeof mailStorage.get("Chat App: password reset")).toEqual("string");
        const res:Response = await request(app)
            .get('/pwReset/isValid/' + mailStorage.get("Chat App: password reset"))
            .send()
        expect(res.status).toEqual(200);
    });
    it("verify password reset - wrong code",async () => {
        expect(typeof mailStorage.get("Chat App: password reset")).toEqual("string");
        const res:Response = await request(app)
            .get('/pwReset/isValid/' + mailStorage.get("Chat App: password reset") + 'xx')
            .send()
        expect(res.status).toEqual(403);
    });
    it("verify password reset - wrong code and wrong uid",async () => {
        expect(typeof mailStorage.get("Chat App: password reset")).toEqual("string");
        const res:Response = await request(app)
            .get('/pwReset/isValid/000004efbghjgkjkaghfkjhagkhf')
            .send()
        expect(res.status).toEqual(403);
    });
    it("set new password",async () => {
        const res:Response = await request(app)
            .post('/pwReset/set')
            .send({
                code: mailStorage.get("Chat App: password reset"),
                password: newpassword
            })
        expect(res.status).toEqual(200);
    });
    it("set new password - invalid data",async () => {
        const res:Response = await request(app)
            .post('/pwReset/set')
            .send({
                code: 123,
                password: newpassword
            })
        expect(res.status).toEqual(400);
    });
    it("set new password - wrong code",async () => {
        const res:Response = await request(app)
            .post('/pwReset/set')
            .send({
                code: mailStorage.get("Chat App: password reset") + 'xx',
                password: newpassword
            })
        expect(res.status).toEqual(403);
    });
    it("set new password - wrong code and wrong uid",async () => {
        const res:Response = await request(app)
            .post('/pwReset/set')
            .send({
                code: '000004efbghjgkjkaghfkjhagkhf',
                password: newpassword
            })
        expect(res.status).toEqual(403);
    });
});