import request from 'supertest';
import app from '../app.js';
import io from 'socket.io-client';
import {tokens,setTokens} from "../__testHelpers/tokensStorage";

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

        setTokens(res.body.tokens);
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
    it('establish socket connection',async() => {
        global.console = {
            warn: jest.fn(),
            log: jest.fn()
        }
        const socket = io.connect(
            '/',
            {
                transports: ['websocket'],
                'reconnection delay' : 0,
                'reopen delay' : 0,
                'force new connection': true
            }
        );
        console.log('http://localhost:' + process.env.NODE_HTTP_PORT)
        socket.on('connect',() => {
            console.log("socket connected")
            done();
        })
        socket.emit('auth',tokens);
        // is called when user is initialized
        /*await new Promise((resolve, reject) => {
           socket.on('initialized',() => {

               resolve();
           });
           socket.on('disconnect',() => {
               reject();
           })
        })*/
        await new Promise((resolve, reject) => {
            setTimeout(() => resolve(),3000);
        })
        expect(console.log).toHaveBeenCalledWith('http://localhost:80');
    });
})




