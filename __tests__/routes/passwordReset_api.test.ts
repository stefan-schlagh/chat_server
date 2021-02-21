import request, {Response} from "supertest";
import {app, closeServer, startServer} from "../../src/app";
import {mailStorage} from "../../src/verification/mailStorage";
import {AccountInfo} from "../../src/__testHelpers__/userHelpers";

const test_username = "test345678";
let account:AccountInfo;
let newpassword = "password2";

describe("Test API /pwReset",() => {
    // start the server before the tests
    beforeAll((done) => {
        startServer();
        done();
    });
    // stop the server after the tests
    afterAll((done) => {
        closeServer();
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
    it("setEmail",async () => {
        const res:Response = await request(app)
            .post('/user/setEmail')
            .set('Authorization',account.tokens)
            .send({
                email: "stefanjkf.test@gmail.com"
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
                email: "stefanjkf.test@gmail.com"
            })
        expect(res.status).toEqual(200);
        expect(typeof mailStorage.get("Chat App: password reset")).toEqual("string");
    });
    it("request password reset link - user not existing",async () => {
        const res:Response = await request(app)
            .post('/pwReset/requestLink')
            .send({
                username: test_username + "abcd",
                email: "stefanjkf.test@gmail.com"
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
        expect(res.status).toEqual(400);
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
        expect(res.status).toEqual(400);
    });
});