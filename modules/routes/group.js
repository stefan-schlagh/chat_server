import express from 'express';
import {setUser,reqAuth} from "../authentication.js";
import {newGroupChat} from "../chatData/database/newChat.js";

const router = express.Router();

router.use(setUser);
router.use(reqAuth);
/*
    route for all groups of the specified user
 */
router.get('/all/:uid',(req,res) => {

});
/*
    route to receive all public groups
 */
router.get('/public',(req,res) => {

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

    newGroupChat(userFrom, data, users)
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
router.delete('/',(req,res) => {

});
/*
    route for getting the info of a groupChat
 */
router.get('/info/:gcid',(req,res) => {

});
/*
    route for adding a user to a groupChat
 */
router.put('/:gcid/member/:uid',(req,res) => {

});
/*
    route for removing a user from a groupChat
 */
router.delete('/:gcid/member/:uid',(req,res) => {

});

export default router;