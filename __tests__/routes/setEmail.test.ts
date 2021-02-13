import {tokensStorage} from "../../src/__testHelpers__/tokensStorage";
import request, {Response} from "supertest";
import {app, closeServer, startServer} from "../../src/app";
import {mailStorage} from "../../src/verification/mailStorage";
import {instanceOfSimpleUser, UserInfoSelf} from "../../src/models/user";

const test_username = "test123456";
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
    it('create account/login', async () => {
        const res:Response = await request(app)
            .post('/auth/register')
            .send({
                username: test_username,
                password: "password"
            })
        expect(res.status).toEqual(200)

        if(res.body.success) {
            expect(res.body).toHaveProperty('tokens')
            tokensStorage.set(test_username,res.body.tokens);
        }else{
            if (res.body.username === "Username already taken"){
                const res = await request(app)
                    .post('/auth/login')
                    .send({
                        username: test_username,
                        password: "password"
                    })
                expect(res.status).toEqual(200)
                expect(res.body).toHaveProperty('tokens')
                tokensStorage.set(test_username,res.body.tokens);

            }else {
                fail('unknown error');
            }
        }
    });
    it("setEmail - wrong type",async () => {
        const res:Response = await request(app)
            .post('/user/setEmail')
            .set('Authorization',tokensStorage.get(test_username))
            .send({
                email: 1
            })
        expect(res.status).toEqual(400);
    });
    it("setEmail - invalid email",async () => {
        const res:Response = await request(app)
            .post('/user/setEmail')
            .set('Authorization',tokensStorage.get(test_username))
            .send({
                email: "@a.a"
            })
        expect(res.status).toEqual(400);
    });
    it("setEmail",async () => {
        const res:Response = await request(app)
            .post('/user/setEmail')
            .set('Authorization',tokensStorage.get(test_username))
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
            .set('Authorization',tokensStorage.get(test_username))
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
            .set('Authorization',tokensStorage.get(test_username))
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