import jwt from 'jsonwebtoken';
import fs from 'fs';

export async function generateToken(user) {

    let privateKey = await fs.promises.readFile(
        './cert/jwtPrivate.pem',
        'utf8'
    );

    const data = {
        ...user
    };

    return await new Promise((resolve, reject) => {

        jwt.sign(
            data,//data stored in jwt
            privateKey,//private key
            {
                algorithm: 'HS256'
            },
            function (err, token) {
                if (err)
                    reject(err);
                resolve(token);
            }
        )
    });
}
/*
    middleware for authenticating user
 */
export function isAuthenticated(req,res,next){

    let token = req.headers.authorization;

    verifyToken(token)
        .then(data => {
            /*
                data can be used in the succeeding middleware
             */
            req.data = data;
            next();
        })
        .catch(err => {
            /*
                authentication failed
             */
            res.status(403);
            res.send();
        })
}
/*
    token is verified
 */
export async function verifyToken(token){

    if(!token || token === 'undefined')
        throw new Error('token is undefined!');

    let privateKey = await fs.promises.readFile(
        './cert/jwtPrivate.pem',
        'utf8'
    );

    return new Promise((resolve, reject) => {

        jwt.verify(
            token,
            privateKey,//private key
            {
                algorithm: 'HS256'
            },
            function(err,data){
                if(err)
                    reject(err);
                resolve(data);
            }
        )
    })
}