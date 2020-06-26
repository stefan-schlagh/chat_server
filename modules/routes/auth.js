import express from 'express';
import {login} from "../authentication/authentication.js";
import {chatServer} from "../chatServer.js";
import {register} from "../authentication/authentication.js";

const router = express.Router();

/*
    user logs in
 */
router.post('/login',(req,res) => {

    let username = req.body.username;
    let password = req.body.password;

    login(username,password,chatServer.con,chatServer)
        .then(result => {
            res.send(result);
        })
        .catch(err => {
            console.error(err);
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

    const con = chatServer.con;
    register(username,password,con)
        .then(result => {
            res.send(result);
        })
        .catch(err => {
            console.error(err);
            res.status(500);
            res.send();
        });
});

export default router;