import express from 'express';
import {setUser,reqAuth} from "../authentication.js";
import {getGroupChatInfo} from "../chatData/chat/groupChatInfo.js";
import {chatData} from "../chatData/data.js";

const router = express.Router();

router.use(setUser);
router.use(reqAuth);
/*
    route for all groups of the specified user
 */
router.get('/all/:uid',(req,res) => {
    /*
        not yet implemented
     */
    res.status(501);
    res.send();
});
/*
    route to receive all public groups
 */
router.get('/public',(req,res) => {
    /*
        not yet implemented
     */
    res.status(501);
    res.send();
});
/*
    route for creating a groupChat
 */
router.put('/',(req,res) => {

    const userFrom = {
        uid: req.user.uid,
        username: req.user.username,
        isAdmin: true
    };

    const data = req.body.data;
    const users = req.body.users;

    chatData.newGroupChat(userFrom, data, users)
        .then(r  => res.send())
        .catch(err => {
            console.error(err);
            res.status(500);
            res.send();
        });
});
/*
    route for deleting a groupChat
 */
router.delete('/:gcid',(req,res) => {

});
/*
    route for getting the info of a groupChat
 */
router.get('/:gcid',(req,res) => {

    const gcid = req.params.gcid;
    const uidReq = req.user.uid;

    getGroupChatInfo(uidReq,gcid)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            console.error(err);
            res.status(500);
            res.send();
        });
});
/*
    route for adding a user to a groupChat
 */
router.put('/:gcid/member/:uid',(req,res) => {
    /*
        not yet implemented
     */
    res.status(501);
    res.send();
});
/*
    route for removing a user from a groupChat
 */
router.delete('/:gcid/member/:uid',(req,res) => {
    /*
        not yet implemented
     */
    res.status(501);
    res.send();
});

export default router;