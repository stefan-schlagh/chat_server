import {tokensStorage} from "../src/__testHelpers__/tokensStorage";
import request, {Response} from "supertest";
import {app, closeServer, startServer} from "../src/app";
import {mailStorage} from "../src/__testHelpers__/mailStorage";

const test_username = "test345678";
let newpassword = "password2";

describe("setPassword Test",() => {
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
                if(!res.body.success){
                    const res = await request(app)
                        .post('/auth/login')
                        .send({
                            username: test_username,
                            password: "password2"
                        });
                    newpassword = "password";
                    expect(res.status).toEqual(200);
                    expect(res.body).toHaveProperty('tokens')
                    tokensStorage.set(test_username,res.body.tokens);
                }else{
                    expect(res.status).toEqual(200);
                    expect(res.body).toHaveProperty('tokens')
                    tokensStorage.set(test_username,res.body.tokens);
                }
            }else {
                fail('unknown error');
            }
        }
    });
    it("setEmail",async () => {
        const res:Response = await request(app)
            .post('/user/setEmail')
            .set('Authorization',tokensStorage.get(test_username))
            .send({
                email: "stefanjkf.test@gmail.com"
            })
        expect(res.status).toEqual(200);
        expect(typeof mailStorage.get("Chat App: email verification")).toEqual("string");
    });
    it("verifyEmail",async () => {
        const res:Response = await request(app)
            .post('/user/verifyEmail')
            .set('Authorization',tokensStorage.get(test_username))
            .send({
                code: mailStorage.get("Chat App: email verification")
            })
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
    it("verify password reset",async () => {
        const res:Response = await request(app)
            .get('/pwReset/isValid/' + mailStorage.get("Chat App: password reset"))
            .send()
        expect(res.status).toEqual(200);
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
});