import {login,register,getUserInfo,getPasswordHash,saveUser} from "../../src/authentication/authentication";
import {hashPassword} from "../../src/authentication/bcryptWrappers";

describe('authentication test',() => {
    describe('login',() => {
        const escapeFunc = (str) => (str);
        it('success',async () => {
            const hash = await hashPassword('password')
            const connection = {
                escape: escapeFunc,
                query: jest.fn()
                    //getUserInfo
                    .mockImplementationOnce((queryStr, cb) => {
                        cb(null, [{uid: 1}])
                    })
                    //getPasswordHash
                    .mockImplementationOnce((queryStr, cb) => {
                        cb(null,[{password:hash}])
                    })
            }
            let error;
            let res;
            try{
                res = await login('user1','password', connection);
            }catch (e){
                error = e;
            }
            expect(typeof res).toEqual('object');
            expect(res.success).toEqual(true);
            expect(res).toHaveProperty('uid');
            expect(res.uid).toEqual(1);
            expect(res).toHaveProperty('tokens');
            expect(typeof res.tokens).toEqual('string');
        })
        it('username does not exist',async () => {
            const hash = await hashPassword('password')
            const connection = {
                escape: escapeFunc,
                query: jest.fn()
                    //getUserInfo
                    .mockImplementationOnce((queryStr, cb) => {
                        cb(null, [])
                    })
                    //getPasswordHash
                    .mockImplementationOnce((queryStr, cb) => {
                        cb(null,[{password:hash}])
                    })
            }
            let error;
            let res;
            try{
                res = await login('user1','password', connection);
            }catch (e){
                error = e;
            }
            expect(typeof res).toEqual('object');
            expect(res.success).toEqual(false);
            expect(res).toHaveProperty('username');
            expect(res.username).toEqual('Username does not exist');
        })
        it('wrong password',async () => {
            const hash = await hashPassword('password')
            const connection = {
                escape: escapeFunc,
                query: jest.fn()
                    //getUserInfo
                    .mockImplementationOnce((queryStr, cb) => {
                        cb(null, [{uid: 1}])
                    })
                    //getPasswordHash
                    .mockImplementationOnce((queryStr, cb) => {
                        cb(null,[{password:hash}])
                    })
            }
            let error;
            let res;
            try{
                res = await login('user1','passwort', connection);
            }catch (e){
                error = e;
            }
            expect(typeof res).toEqual('object');
            expect(res.success).toEqual(false);
            expect(res).toHaveProperty('password');
            expect(res.password).toEqual('Wrong password!');
        })
    })
    describe('register',() => {
        const escapeFunc = (str) => (str);
        const validConnection = {
            escape: escapeFunc,
            query: jest.fn()
                .mockImplementationOnce((queryStr,cb) => {
                    cb(null,[])
                })
                .mockImplementationOnce((queryStr,cb) => {
                    cb(null)
                })
                .mockImplementationOnce((queryStr,cb) => {
                    cb(null,[{uid: 1}])
                })
        }
        const connectionUsernameTaken = {
            escape: escapeFunc,
            query: jest.fn()
                .mockImplementationOnce((queryStr,cb) => {
                    cb(null,[{uid: 1}])
                })
                .mockImplementationOnce((queryStr,cb) => {
                    cb(null)
                })
                .mockImplementationOnce((queryStr,cb) => {
                    cb(null,[{uid: 1}])
                })
        }
        it('success',async () => {
            let error;
            let res;
            try{
                res = await register('user1','password', validConnection);
            }catch (e){
                error = e;
            }
            expect(typeof res).toEqual('object');
            expect(res.success).toEqual(true);
            expect(res).toHaveProperty('uid');
            expect(res.uid).toEqual(1);
            expect(res).toHaveProperty('tokens');
            expect(typeof res.tokens).toEqual('string');
        })
        it('username taken',async () => {
            let error;
            let res;
            try{
                res = await register('user1','password', connectionUsernameTaken);
            }catch (e){
                error = e;
            }
            expect(typeof res).toEqual('object');
            expect(res.success).toEqual(false);
            expect(res).toHaveProperty('username');
            expect(res.username).toEqual('Username already taken');
        })
    })
    describe('getUserInfo',() => {
        //con mock that returns a valid result
        const escapeFunc = (str) => (str);
        const validConnection = {
            escape: escapeFunc,
            query: (queryStr,cb) => {
                cb(null,[{uid: 1}])
            }
        }
        const errorThrowingConnection = {
            escape: escapeFunc,
            query: (queryStr,cb) => {
                cb(new Error('Error in query!'))
            }
        }
        const connectionTwoUsersReturned = {
            escape: escapeFunc,
            query: (queryStr,cb) => {
                cb(null,[{uid: 1},{uid: 2}])
            }
        }
        const connectionEmptyResult = {
            escape: escapeFunc,
            query: (queryStr,cb) => {
                cb(null,[])
            }
        }
        it('use as intended',async () => {
            let error = null;
            let res;
            try{
                res = await getUserInfo('test123',validConnection);
            }catch (e){
                error = e;
            }
            expect(error).toEqual(null);
            expect(typeof res).toEqual('object');
            expect(res).toHaveProperty('exists');
            expect(res).toHaveProperty('uid');
            expect(res.exists).toEqual(true);
            expect(res.uid).toEqual(1);
        })
        it('pass username of wrong type',async () => {
            let error;
            let res;
            try{
                res = await getUserInfo(123,validConnection);
            }catch (e){
                error = e;
            }
            expect(error).toHaveProperty('message');
            expect(error.message).toEqual('username should have the type string!');
        })
        it('connection throws error',async () => {
            let error;
            let res;
            try{
                res = await getUserInfo('test123',errorThrowingConnection);
            }catch (e){
                error = e;
            }
            expect(error).toHaveProperty('message');
            expect(error.message).toEqual('Error in query!');
        })
        it('query returns two users',async () => {
            let error;
            let res;
            const username = 'test123'
            try{
                res = await getUserInfo(username,connectionTwoUsersReturned);
            }catch (e){
                error = e;
            }
            expect(error).toHaveProperty('message');
            expect(error.message).toEqual('There are two entries in the database with username: ' + username);
        })
        it('query returns empty result',async () => {
            let error;
            let res;
            const username = 'test123'
            try{
                res = await getUserInfo(username,connectionEmptyResult);
            }catch (e){
                error = e;
            }
            expect(typeof res).toEqual('object');
            expect(res).toHaveProperty('exists');
            expect(res.exists).toEqual(false);
        })
    })
    describe('getPasswordHash',() => {
        //con mock that returns a valid result
        const validConnection = {
            query: (queryStr,cb) => {
                cb(null,[{password: 'hash1'}])
            }
        }
        const errorThrowingConnection = {
            query: (queryStr,cb) => {
                cb(new Error('Error in query!'))
            }
        }
        const connectionEmptyResult = {
            query: (queryStr,cb) => {
                cb(null,[])
            }
        }
        it('use as intended',async () => {
            let error;
            let res;
            try{
                res = await getPasswordHash(1,validConnection);
            }catch (e){
                error = e;
            }
            expect(typeof res).toEqual('string');
            expect(res).toEqual('hash1');
        })
        it('pass uid of wrong type',async () => {
            let error;
            let res;
            try{
                res = await getPasswordHash('user1',validConnection);
            }catch (e){
                error = e;
            }
            expect(error).toHaveProperty('message');
            expect(error.message).toEqual('uid should have the type number!');
        })
        it('connection throws error',async () => {
            let error;
            let res;
            try{
                res = await getPasswordHash(1,errorThrowingConnection);
            }catch (e){
                error = e;
            }
            expect(error).toHaveProperty('message');
            expect(error.message).toEqual('Error in query!');
        })
        it('query returns empty result',async () => {
            let error;
            let res;
            try{
                res = await getPasswordHash(1,connectionEmptyResult);
            }catch (e){
                error = e;
            }
            expect(typeof error).toEqual('object');
            expect(error).toHaveProperty('message');
            expect(error.message).toEqual('result is empty!');
        })
    })
    describe('saveUser',() => {
        const escapeFunc = (str) => (str);
        const validConnection = {
            escape: escapeFunc,
            query: (queryStr,cb) => {
                // called by saveUser
                if(queryStr.includes('INSERT')){
                    cb(null)
                }
                // called by getUserInfo
                else if(queryStr.includes('SELECT')){
                    cb(null,[{uid: 1}])
                }
            }
        }
        const connectionThrowErrorAtInsert = {
            escape: escapeFunc,
                query: (queryStr,cb) => {
                // called by saveUser
                if(queryStr.includes('INSERT')){
                    cb(cb(new Error('Error in query!')))
                }
                // called by getUserInfo
                else if(queryStr.includes('SELECT')){
                    cb(null,[{uid: 1}])
                }
            }
        }
        const connectionThrowErrorAtSelect = {
            escape: escapeFunc,
            query: (queryStr,cb) => {
                // called by saveUser
                if(queryStr.includes('INSERT')){
                    cb(null)
                }
                // called by getUserInfo
                else if(queryStr.includes('SELECT')){
                    cb(cb(new Error('Error in query!')))
                }
            }
        }
        it('use as intended',async () => {
            let error;
            let res;
            try{
                res = await saveUser('user1','hash1', validConnection);
            }catch (e){
                error = e;
            }
            expect(typeof res).toEqual('number');
            expect(res).toEqual(1);
        })
        it('fail at insert',async () => {
            let error;
            let res;
            try{
                res = await saveUser('user1','hash1', connectionThrowErrorAtInsert);
            }catch (e){
                error = e;
            }
            expect(error).toHaveProperty('message');
            expect(error.message).toEqual('Error in query!');
        })
        it('fail at select',async () => {
            let error;
            let res;
            try{
                res = await saveUser('user1','hash1', connectionThrowErrorAtSelect);
            }catch (e){
                error = e;
            }
            expect(error).toHaveProperty('message');
            expect(error.message).toEqual('Error in query!');
        })
        it('pass username of wrong type',async () => {
            let error;
            let res;
            try{
                res = await saveUser(1,'hash1', {});
            }catch (e){
                error = e;
            }
            expect(error).toHaveProperty('message');
            expect(error.message).toEqual('username should have the type string!');
        })
        it('pass hash of wrong type',async () => {
            let error;
            let res;
            try{
                res = await saveUser('user1',1, {});
            }catch (e){
                error = e;
            }
            expect(error).toHaveProperty('message');
            expect(error.message).toEqual('hash should have the type string!');
        })
    })
})