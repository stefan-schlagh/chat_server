import express from 'express';
import {setUser,reqAuth} from "../authentication.js";
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
            if(result.success){
                //cookie is set
                let sess = req.session;
                sess.uid = result.uid;
                sess.username = username;
                sess.save(function(err) {
                    // session saved
                    if(err)
                        console.error(err);
                });
                //chatData.addNewUser(sess.uid,sess.username);
            }
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

    register(username,password,con)
        .then(result => {
            if(result.success){
                //cookie is set
                const sess = req.session;
                sess.uid = result.uid;
                sess.username = username;
                sess.save(function(err) {
                    // session saved
                    if(err)
                        console.error(err);
                })
            }
            res.send(result);
        })
        .catch(err => {
            console.error(err);
            res.status(500);
            res.send();
        });
});
/*
    user logs out
 */
router.get('/logout',setUser,reqAuth,(req,res) => {

    const sess = req.session;
    sess.uid = undefined;
    sess.username = undefined;
    res.send({
        success: true
    });

});

export default router;