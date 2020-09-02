import request from 'supertest';
import app from '../app.js';

let tokens;

describe('test API', () => {
    it('create account/login', async () => {
        const res = await request(app)
            .post('/auth/register')
            .send({
                username: "stefan",
                password: "password"
            })
        expect(res.statusCode).toEqual(200)

        if(res.body.success) {
            expect(res.body).toHaveProperty('tokens')
        }else{
            if (res.body.username === "Username already taken"){
                const res = await request(app)
                    .post('/auth/login')
                    .send({
                        username: "stefan",
                        password: "password"
                    })
                expect(res.statusCode).toEqual(200)
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
        expect(res.statusCode).toEqual(403)
    })
    it("login and get jsonwebtoken",async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({
                username: "stefan",
                password: "password"
            })
        expect(res.statusCode).toEqual(200)
        expect(res.body).toHaveProperty('tokens')

        tokens = res.body.tokens;
    })
    it("access protected path",async () => {
        const res = await request(app)
            .post('/user/noChat')
            .set('Authorization',tokens)
            .send({
                search: "",
                limit: 10,
                start: 0
            })
        expect(res.statusCode).toEqual(200);
    })
})




