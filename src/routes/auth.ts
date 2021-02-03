import express from 'express';
import {login,register} from "../authentication/authentication";
import {logger} from "../util/logger";
import {pool} from "../app";

const router = express.Router();

/*
    user logs in
 */
router.post('/login',(req,res) => {

    let username = req.body.username;
    let password = req.body.password;

    login(username,password,pool)
        .then(result => {
            res.send(result);
        })
        .catch(err => {
            logger.error(err);
            res.status(500);
            res.send();
        });
});
/*
    user registers
 */
router.post('/register',(req,res) => {

    let username = req.body.username;
    let password = req.body.password;

    register(username,password,pool)
        .then(result => {
            res.send(result);
        })
        .catch(err => {
            logger.error(err);
            res.status(500);
            res.send();
        });
});

export default router;