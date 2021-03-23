import {
    generateToken,
    isAuthenticated,
    verifyToken
} from "../../src/authentication/jwt";

describe('jwt test',() => {
    describe('generateToken',() => {
        it('use it as intended',async () => {
            let token = null;
            let error = null;
            try{
                token = await generateToken({uid:1,username:'test'});
            }catch (err){
                error = err;
            }
            //token should have the type string and not be null, error should be null
            expect(token).not.toEqual(null);
            expect(typeof token).toEqual('string');
            expect(error).toEqual(null);
        })
        it('pass uid < 1',async () => {
            let token = null;
            let error;
            try{
                token = await generateToken({uid:-1,username:'test'});
            }catch (err){
                error = err;
            }
            //token should be null, there should be an error
            expect(token).toEqual(null);
            expect(typeof error).toEqual('object');
            expect(error.message).toEqual('user.uid cannot be smaller than 1');
        })
    })
    describe('isAuthenticated',() => {
        it('use it as intended',async () => {
            let res:any = {};
            let req:any;
            let error = null;
            try {
                //generate token
                let token = await generateToken({uid: 1, username: 'test'});
                req = {headers: {authorization: token}};
                await new Promise((resolve, reject) => {
                    res.send = () => {resolve()}
                    isAuthenticated(req,res,()=>{resolve()})
                });
            }catch (err){
                error = err;
            }
            /*
                 data should be: {uid: 1, username: 'test'}
                 error should be null
             */
            expect(typeof req.data).toEqual('object');
            expect(req.data).not.toEqual(null);
            expect(req.data.uid).toEqual(1);
            expect(req.data.username).toEqual('test');
            expect(error).toEqual(null);
        })
        it('pass wrong token',async () => {
            let res:any = {};
            let req:any;
            let status = 0;
            let error = null;
            try {
                req = {headers: {authorization: "hlhjkhlkj"}};
                await new Promise((resolve, reject) => {
                    res.send = () => {resolve()}
                    res.status = (s:any) => {status = s}
                    isAuthenticated(req,res,()=>{resolve()})
                });
            }catch (err){
                error = err;
            }
            /*
                 data should be undefined
                 res.status should have been called with 403
             */
            expect(req.data).toEqual(undefined);
            expect(status).toEqual(403);
        })
        it('pass no token #1',async () => {
            let res:any = {};
            let req:any;
            let status = 0;
            let error = null;
            try {
                req = {};
                await new Promise((resolve, reject) => {
                    res.send = () => {resolve()}
                    res.status = (s:any) => {status = s}
                    isAuthenticated(req,res,()=>{resolve()})
                });
            }catch (err){
                error = err;
            }
            /*
                 data should be undefined
                 res.status should have been called with 400
             */
            expect(req.data).toEqual(undefined);
            expect(status).toEqual(403);
        })
        it('pass no token #2',async () => {
            let res:any = {};
            let req:any;
            let status = 0;
            let error = null;
            try {
                req = {headers: {}};
                await new Promise((resolve, reject) => {
                    res.send = () => {resolve()}
                    res.status = (s:any) => {status = s}
                    isAuthenticated(req,res,()=>{resolve()})
                });
            }catch (err){
                error = err;
            }
            /*
                 data should be undefined
                 res.status should have been called with 400
             */
            expect(req.data).toEqual(undefined);
            expect(status).toEqual(403);
        })
        it('pass token with wrong type',async () => {
            let res:any = {};
            let req:any;
            let status = 0;
            let error = null;
            try {
                req = {headers: {authorization: 123}};
                await new Promise((resolve, reject) => {
                    res.send = () => {resolve()}
                    res.status = (s:any) => {status = s}
                    isAuthenticated(req,res,()=>{resolve()})
                });
            }catch (err){
                error = err;
            }
            /*
                 data should be undefined
                 res.status should have been called with 403
             */
            expect(req.data).toEqual(undefined);
            expect(status).toEqual(403);
        })
    })
    describe('verifyToken',() => {
        it('use it as intended',async () => {
           let data:any;
           let error = null;
           try {
               //generate token
               let token:string = await generateToken({uid: 1, username: 'test'});
               data = await verifyToken(token);
           }catch (err){
               error = err;
           }
           /*
                data should be: {uid: 1, username: 'test'}
                error should be null
            */
           expect(typeof data).toEqual('object');
           expect(data).not.toEqual(null);
           expect(data.uid).toEqual(1);
           expect(data.username).toEqual('test');
           expect(error).toEqual(null);
        })
        it('pass wrong token',async () => {
            let data = null;
            let error = null;
            try {
                data = await verifyToken("apifudaiopufd");
            }catch (err){
                error = err;
            }
            /*
                 data should be null
                 error should be defined
             */
            expect(data).toEqual(null);
            expect(error).not.toEqual(null);
            expect(error).toHaveProperty('message');
        })
        it('pass null token',async () => {
            let data = null;
            let error;
            try {
                data = await verifyToken(null);
            }catch (err){
                error = err;
            }
            /*
                 data should be null
                 error should be defined
             */
            expect(data).toEqual(null);
            expect(error).not.toEqual(null);
            expect(error).toHaveProperty('message');
            expect(error.message).toEqual('jwt must be provided');
        })
    })
})