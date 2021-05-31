import {closeServer, startServer} from "../src/app";
import io from 'socket.io-client';
import {AccountInfo, initAccount} from "../src/__testHelpers__/userHelpers";
// @ts-ignore
import names from '../src/__testHelpers__/names/names.json';
import {socketServer} from "../src/socketServer";

describe('test chatServer', () => {

    describe('socket test - success', () => {

        const accountsNumber = 10;
        const accounts: AccountInfo[] = new Array(accountsNumber);
        let socket:any;

        beforeAll((done) => {
            startServer();
            done();
        });
        afterAll((done) => {
            socket.close();
            closeServer();
            done();
        });
        it('init accounts', async () => {
            /*
                create accounts/ login
             */
            for (let i: number = 0; i < accountsNumber; i++) {
                accounts[i] = await initAccount(names[i + 50]);
            }
        });
        it('establish socket connection',async() => {

            const res = await new Promise((resolve, reject) => {
                socket = io(
                    'http://localhost:' + process.env.NODE_HTTP_PORT,
                    {
                        transports: ['websocket']
                    }
                );
                socket.on('connect',() => {
                    resolve('socket connected');
                });
            });
            expect(res).toEqual('socket connected');
        });
        it('authenticate socket of account 0 - success',async () => {

            const success = await new Promise((resolve, reject) => {
                socket.emit('auth',accounts[0].tokens);
                socket.on('initialized',() => {
                    resolve(true);
                });
                socket.on('disconnect',() => {
                    resolve(false);
                });
            });
            expect(success).toEqual(true);
        });
        it('change chat - should not disconnect',async () => {

            const success = await new Promise((resolve, reject) => {
                socket.emit('change chat');
                setTimeout(() => {
                    resolve(true);
                },1000);
                socket.on('disconnect',() => {
                    resolve(false);
                });
            });
            expect(success).toEqual(true);
        });
        it('account 0 should be online',() => {
            expect(socketServer.isUserOnline(accounts[0].uid)).toEqual(true);
        });
        it('account 0 should not be online',() => {
            expect(socketServer.isUserOnline(accounts[1].uid)).toEqual(false);
        });
    });
    describe('socket test - no authentication - fail',() => {

        let socket:any;

        beforeAll((done) => {
            startServer();
            done();
        });
        afterAll((done) => {
            closeServer();
            done();
        });
        beforeEach(async () => {
            // a new socket is needed
            const res = await new Promise((resolve, reject) => {
                socket = io(
                    'http://localhost:' + process.env.NODE_HTTP_PORT,
                    {
                        transports: ['websocket']
                    }
                );
                socket.on('connect',() => {
                    resolve('socket connected');
                });
            });
            expect(res).toEqual('socket connected');
        });
        afterEach(() => {
            socket.close();
        });
        it('authenticate socket - invalid token',async () => {

            const success = await new Promise((resolve, reject) => {
                socket.emit('auth','apifudaiopufd');
                socket.on('initialized',() => {
                    resolve(true);
                });
                socket.on('disconnect',() => {
                    resolve(false);
                });
            });
            expect(success).toEqual(false);
        });
        it('fail change chat',async () => {

            const success = await new Promise((resolve, reject) => {
                socket.emit('change chat');
                socket.on('disconnect',() => {
                    resolve(false);
                });
            });
            expect(success).toEqual(false);
        });
        it('fail started typing',async () => {

            const success = await new Promise((resolve, reject) => {
                socket.emit('started typing');
                socket.on('disconnect',() => {
                    resolve(false);
                });
            });
            expect(success).toEqual(false);
        });
        it('fail stopped typing',async () => {

            const success = await new Promise((resolve, reject) => {
                socket.emit('stopped typing');
                socket.on('disconnect',() => {
                    resolve(false);
                });
            });
            expect(success).toEqual(false);
        });
    });
});