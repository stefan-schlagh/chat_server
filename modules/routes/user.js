import express from 'express';
import {
    getUserInfo,
    selectAllUsers,
    selectUsersNoChat,
    selectUsersNotInGroup
} from "../chatData/database/selectUsers.js";
import {chatData} from "../chatData/data.js";
import {isAuthenticated} from "../authentication/jwt.js";
import {setUser} from "../chatData/setUser.js";

const router = express.Router();

router.use(isAuthenticated);
router.use(setUser);

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

    selectUsersNoChat(uidFrom,search,limit,start)
        .then(data => {
            res.send(data);
        }).catch(err => {
            console.error(err);
            res.status(500);
            res.send();
        })

});
/*
    all users who are not in the chat are retuned
 */
router.post('/notInGroup/:gcid',(req,res) => {
    try {
        const gcid = parseInt(req.params.gcid);

        const search = req.body.search;
        const limit = req.body.limit;
        const start = req.body.start;

        selectUsersNotInGroup(gcid,search,limit,start)
            .then(data => {
                res.send(data);
            }).catch(err => {
            console.error(err);
            res.status(500);
            res.send();
        })
    }catch (err) {
        /*
                400 -> bad request
             */
        console.error(err);
        res.status(400);
        res.send();
    }
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

    const userSelf = req.user;
    const uidOther = req.body.uid;
    const usernameOther = req.body.username;
    const message = req.body.message;

    chatData.newNormalChat(userSelf,uidOther,usernameOther,message)
        .then(result => {
            res.send(result)
        })
        .catch(err => {
            console.error(err);
            res.status(500);
            res.send();
        });
});
/*
    the email of the user is changed
 */
router.post('setEmail',(req, res) => {

})

export default router;