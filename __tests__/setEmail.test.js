import {tokensStorage} from "../__testHelpers/tokensStorage.js";
import request from "supertest";
import {app, closeServer, startServer} from "../modules/app";
import {mailStorage} from "../__testHelpers/mailStorage";

const test_username = "test123456";

describe('setEmail Test', () => {
    beforeAll((done) => {
        startServer();
        done();
    });
    beforeEach(() => {
        //console.log('mockedError', console.error.mock.calls);
        global.console = {
            warn: jest.fn(),
            log: jest.fn()
        }
    });
    afterAll((done) => {
        closeServer();
        done();
    });
    it('create account/login', async () => {
        const res = await request(app)
            .post('/auth/register')
            .send({
                username: test_username,
                password: "password"
            })
        expect(res.statusCode).toEqual(200)

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
                expect(res.statusCode).toEqual(200)
                expect(res.body).toHaveProperty('tokens')
                tokensStorage.set(test_username,res.body.tokens);

            }else {
                fail('unknown error');
            }
        }
    });
    it("setEmail",async () => {
        const res = await request(app)
            .post('/user/setEmail')
            .set('Authorization',tokensStorage.get(test_username))
            .send({
                email: "stefanjkf.test@gmail.com"
            })
        expect(res.statusCode).toEqual(200);
        expect(typeof mailStorage.get("Chat App: email verification")).toEqual("string");
    });
    it("verifyEmail",async () => {
        const res = await request(app)
            .post('/user/verifyEmail')
            .set('Authorization',tokensStorage.get(test_username))
            .send({
                code: mailStorage.get("Chat App: email verification")
            })
        expect(res.statusCode).toEqual(200);
    });
    it("fail verify",async () => {
        const res1 = await request(app)
            .post('/user/setEmail')
            .set('Authorization',tokensStorage.get(test_username))
            .send({
                email: "stefanjkf.test@gmail.com"
            })
        expect(res1.statusCode).toEqual(200);
        expect(typeof mailStorage.get("Chat App: email verification")).toEqual("string");

        const res2 = await request(app)
            .post('/user/verifyEmail')
            .set('Authorization',tokensStorage.get(test_username))
            .send({
                code: mailStorage.get("Chat App: email verification") + "jkljl"
            })
        expect(res2.statusCode).toEqual(403);
    });
});