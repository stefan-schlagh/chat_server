import jwt, {VerifyErrors} from 'jsonwebtoken';
import fs from 'fs';
import {SimpleUser} from "../models/user";
import {NextFunction} from "express";

/*
    A JSON web token is created
    params: user --> the data of the user the jwt is created for this user,
        should contain number:uid (userID) and string:username
 */
export async function generateToken(user:SimpleUser):Promise<string> {

    let privateKey = await fs.promises.readFile(
        './cert/jwtPrivate.pem',
        'utf8'
    );
    // user id cannot be smaller than 1
    if(user.uid < 1)
        throw new Error('user.uid cannot be smaller than 1')

    //TODO: add expiration date
    return await new Promise((resolve, reject) => {

        jwt.sign(
            user,//data stored in jwt
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
    express-middleware for authenticating user
    the field authorization in the http-header should contain the jwt
        this jwt is then verified and the data inside the token is stored in req.data for further use
        if the verification fails, the http request is closed with status 403 (forbidden)
 */
export function isAuthenticated(req:any,res:any,next:NextFunction){

    let token;
    //if headers is undefined --> error, wrong input
    try {
        token = req.headers.authorization;
    }catch (err){
        res.status(403);
        res.send();
    }

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
                authentication failed --> client side error
             */
            res.status(403);
            res.send();
        })
}
/*
    the JSON web token gets verified
    if the verification fails, an error is thrown
    if successfull, the data in the token is returned
 */
export async function verifyToken(token:string):Promise<SimpleUser>{

    let privateKey = await fs.promises.readFile(
        './cert/jwtPrivate.pem',
        'utf8'
    );

    return new Promise((resolve, reject) => {

        //TODO check
        jwt.verify(
            token,
            privateKey,//private key
            {
                algorithms: ['HS256']
            },
            function(err:VerifyErrors,data:SimpleUser){
                if(err)
                    reject(err);
                resolve(data);
            }
        )
    })
}