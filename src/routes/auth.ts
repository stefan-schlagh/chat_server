import express from 'express';
import {login, LoginReturn, register, RegisterReturn} from "../authentication/authentication";
import {logger} from "../util/logger";
import {pool} from "../app";
import {AuthError, errorTypes} from "../authentication/authError";
import {instanceOfLoginData, instanceOfRegisterData, LoginData, RegisterData} from "../models/auth";

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
        const data:LoginReturn = await login(username, password, pool);

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

        const data:RegisterReturn = await register(username, password, pool);

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