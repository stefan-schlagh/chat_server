import request, {Response} from 'supertest';
import {startServer, app, closeServer} from '../../src/app';
import {AccountInfo, initAccount} from "../../src/__testHelpers__/userHelpers";

const test_username = "test234567";
let account:AccountInfo;

describe('test API /authentication', () => {
    describe('success',() => {
        beforeAll((done) => {
            startServer();
            done();
        });
        afterAll(async (done) => {
            await closeServer();
            done();
        });
        it('init account', async () => {

            account = await initAccount(test_username);
        })
        it("access protected route, throw 403",async() => {
            const res = await request(app)
                .get('/chats')
                .send()
            expect(res.status).toEqual(403)
        })
        it("login and get jsonwebtoken",async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    username: test_username,
                    password: "password"
                })
            expect(res.status).toEqual(200)
            expect(res.body).toHaveProperty('tokens')
        })
        it("login - invalid body",async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    username: 1,
                    password: "pass"
                })
            expect(res.status).toEqual(400)
        })
        it("login - wrong password",async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    username: test_username,
                    password: "pass"
                })
            expect(res.status).toEqual(403)
        })
        it("login - user not existing",async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    username: "e3ppFDypNQKjl07MFd9K",
                    password: "password"
                })
            expect(res.status).toEqual(404)
        })
        it("register - invalid body",async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({
                    username: "1",
                    password: 123
                })
            expect(res.status).toEqual(400)
        })
        it("access protected path",async () => {
            const res = await request(app)
                .post('/user/noChat')
                .set('Authorization',account.tokens)
                .send({
                    search: "",
                    limit: 10,
                    start: 0
                })
            expect(res.status).toEqual(200);
        })
    })
    describe('internal server errors',() => {
        it("login - internal server error",async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    username: "user123",
                    password: "password"
                })
            expect(res.status).toEqual(500)
        })
        it("register - internal server error",async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({
                    username: "user123",
                    password: "password"
                })
            expect(res.status).toEqual(500)
        })
    })
})




