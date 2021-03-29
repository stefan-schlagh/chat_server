import express from 'express';
import {login, LoginReturn, register} from "../authentication/authentication";
import {logger} from "../util/logger";
import {AuthError, errorTypes} from "../authentication/authError";
import {instanceOfLoginData, instanceOfRegisterData, LoginData, RegisterData, RegisterReturn} from "../models/auth";
import {isEmailUsed} from "../database/email/email";
import chatData from "../chatData/chatData";
import User from "../chatData/user";
import {setEmail} from "../database/user/user";

const router = express.Router();

/*
    user logs in
 */
router.post('/login',async (req:any,res:any) => {

    const body:LoginData = req.body;

    try {
        // type check
        instanceOfLoginData(body);

        const {username,password} = body
        const data:LoginReturn = await login(username, password);

        res.send(data);

    }catch (err) {

        if(err instanceof AuthError){
            // user not found
            if(err.type === errorTypes.userNotExisting) {
                logger.info(err);
                res.sendStatus(404);
            }
            // wrong password
            else if(err.type === errorTypes.wrongPassword) {
                logger.info(err);
                res.sendStatus(403);
            }
        // bad request
        }else if(err instanceof TypeError) {
            logger.info(err);
            res.sendStatus(400);
        // internal server error
        }else{
            logger.error(err);
            res.sendStatus(500);
        }
    }
});
/*
    user registers
 */
router.post('/register',async (req,res) => {

    const body:RegisterData = req.body;

    try {
        // type check
        instanceOfRegisterData(body);
        const {username,password} = body;
        // is email in body?
        if('email' in body)
            // if email used --> do not register
            if(await isEmailUsed(body.email)) {
                const data:RegisterReturn = {
                    usernameTaken: null,
                    emailTaken: true,
                    uid: -1,
                    tokens: null
                };
                res.send(data);
                //ignore the rest
                return;
            }
        // register
        const data:RegisterReturn = await register(username, password);
        // set email if register worked
        if(!(data.usernameTaken || data.uid == -1) && 'email' in body) {
            // get user
            const user: User = chatData.addNewUser(data.uid, username);
            // set email
            await setEmail(user.uid,body.email);
        }

        res.send(data);
    }catch (err) {
        // bad request
        if(err instanceof TypeError) {
            logger.info(err);
            res.sendStatus(400);
        // internal server error
        }else{
            logger.error(err);
            res.sendStatus(500);
        }
    }
});

export default router;