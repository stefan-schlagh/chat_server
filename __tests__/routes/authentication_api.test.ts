import request, {Response} from 'supertest';
import {startServer, app, closeServer} from '../../src/app';
import {tokensStorage} from "../../src/__testHelpers__/tokensStorage";

const test_username = "test234567";

describe('test API', () => {
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
            }else {
                fail('unknown error');
            }
        }
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

        tokensStorage.set(test_username,res.body.tokens);
    })
    it("access protected path",async () => {
        const res = await request(app)
            .post('/user/noChat')
            .set('Authorization',tokensStorage.get(test_username))
            .send({
                search: "",
                limit: 10,
                start: 0
            })
        expect(res.status).toEqual(200);
    })
})



