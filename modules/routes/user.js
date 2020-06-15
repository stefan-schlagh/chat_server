import express from 'express';
import {setUser,reqAuth} from "../authentication.js";
import {selectUsersNoChat} from "../chatData/database/selectUsers.js";
import {getUserInfo, selectAllUsers} from "../chatData/database/selectUsers.js";
import {newNormalChat} from "../chatData/database/newChat.js";

const router = express.Router();

router.use(setUser);
router.use(reqAuth);

/*
    all users are returned
 */
router.post('/',(req,res) => {

    const uidFrom = req.user.uid;

    const search = req.body.search;
    const limit = req.body.limit;
    const start = req.body.start;

    selectAllUsers(uidFrom,search,limit,start).then(data => {
        res.send(data);
    }).catch(err => {
        console.error(err);
        res.status(500);
        res.send();
    })
});
/*
    all users where the user self has no chat with get returned
 */
router.post('/noChat',(req,res) => {

    const uidFrom = req.user.uid;

    const search = req.body.search;
    const limit = req.body.limit;
    const start = req.body.start;

    selectUsersNoChat(uidFrom,search,limit,start).then(data => {
        res.send(data);
    }).catch(err => {
        console.error(err);
        res.status(500);
        res.send();
    })

});
/*
    the userInfo from the user self is returned
    TODO: more info
 */
router.get('/self',(req,res) => {

    const user = req.user;
    res.send({
        uid: user.uid,
        username:user.username
    });
});
/*
    the userInfo from the specified user is returned
 */
router.get('/:uid',(req,res) => {

    const uidFrom = req.user.uid;
    const uidReq = req.params.uid;

    getUserInfo(uidFrom,uidReq)
        .then(result => res.send(result))
        .catch(err => {
            console.error(err);
            res.status(500);
            res.send();
        });
});
/*
    a new normalCHat is created
 */
router.put('/chat',(req,res) => {

    const uidSelf = req.user.uid;
    const uidOther = req.body.uid;
    const usernameOther = req.body.username;
    const message = req.body.message;

    newNormalChat(uidSelf,uidOther,usernameOther,message)
        .then(result => {
            res.send(result)
        })
        .catch(err => {
            console.error(err);
            res.status(500);
            res.send();
        });
});

export default router;