import express from 'express';
import {getGroupChatInfo} from "../chatData/chat/groupChatInfo.js";
import {chatData} from "../chatData/data.js";
import {isAuthenticated} from "../authentication/jwt.js";
import {setUser} from "../chatData/setUser.js";

const router = express.Router();

router.use(isAuthenticated);
router.use(setUser);
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
    /*
        not yet implemented
     */
    res.status(501);
    res.send();
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
router.put(
    '/:gcid/member/:uid',
    getChat,
    getOtherUser(true),
    getGroupChatMemberSelf,
    authAdminSelf,
    (req,res) => {

        const chat = req.chat;
        const memberSelf = req.memberSelf;
        const otherUser = req.otherUser;

        chat.addMember(memberSelf,otherUser)
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
    route for removing a user from a groupChat
 */
router.delete(
    '/:gcid/member/:uid',
    getChat,
    getOtherUser(false),
    getGroupChatMemberSelf,
    getGroupChatMemberOther,
    authAdminSelf,
    (req,res) => {

        const chat = req.chat;
        const memberSelf = req.memberSelf;
        const memberOther = req.memberOther;

        chat.removeMember(memberSelf,memberOther)
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
    route to give a user admin rights
 */
router.post(
    '/:gcid/member/:uid/giveAdmin',
    getChat,
    getOtherUser(false),
    getGroupChatMemberSelf,
    getGroupChatMemberOther,
    authAdminSelf,
    (req,res) => {

        const memberOther = req.memberOther;

        memberOther.setAdmin(true)
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
    route to take a users admin rights away
 */
router.post(
    '/:gcid/member/:uid/removeAdmin',
    getChat,
    getOtherUser(false),
    getGroupChatMemberSelf,
    getGroupChatMemberOther,
    authAdminSelf,
    authAdminOther,
    (req,res) => {

        const memberOther = req.memberOther;

        memberOther.setAdmin(true)
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
    route for joining a group
 */
router.post(
    '/:gcid/join',
    getChat,
    authChatPublic,
    (req,res) => {

        const chat = req.chat;
        const user = req.user;

        chat.joinChat(user)
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
    route for joining a group with a link
 */
router.post(
    '/:gcid/joinWithLink',
    getChat,
    getGroupChatMemberSelf,
    (req,res) => {
        /*
            TODO
         */
    });
/*
    route for leaving a group
 */
router.post(
    '/:gcid/leave',
    getChat,
    getGroupChatMemberSelf,
    (req,res) => {

        const chat = req.chat;
        const member = req.memberSelf;

        chat.leaveChat(member)
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
    route for taking the admin rights away by the user self
 */
router.post(
    '/:gcid/removeAdmin',
    getChat,
    getGroupChatMemberSelf,
    authAdminSelf,
    (req,res) => {

        const member = req.memberSelf;

        member.setAdmin(member.user,false)
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
    chat with the chatId in params is returned
 */
function getChat(req,res,next){
    try {
        const gcid = req.params.gcid;
        req.chat = chatData.getChat('groupChat', gcid);
        next();
    }catch(err){
        /*
            400 -> bad request
        */
        console.error(err);
        res.status(400);
        res.send();
    }
}
/*
    if the chat is not public, status 403 is sent
 */
function authChatPublic(req,res,next){

    if(req.chat.isPublic){
        next();
    }else{
        /*
            403 -> forbidden
        */
        res.status(403);
        res.send();
    }
}
/*
    the other user with the uid in the params is returned
 */
function getOtherUser(createNew){
    return function(req,res,next){

        const uid = req.params.uid;
        chatData.getUser(uid,createNew)
            .then(user => {
                /*
                    otherUser in req is defined
                 */
                req.otherUser = user;
                next();
            })
            .catch(err => {
                /*
                    400 -> bad request
                 */
                console.error(err);
                res.status(400);
                res.send();
            });
    }
}
/*
    the groupChatmember of the requesting user is returned
        required:
            userSelf
            chat
 */
function getGroupChatMemberSelf(req,res,next) {
    try {
        /*
            groupChatMembesr is searched
         */
        req.memberSelf =
            req.chat.getMember(
                req.user.uid
            );
        next();
    }catch(err){
        /*
            400 -> bad request
        */
        console.error(err);
        res.status(400);
        res.send();
    }
}
/*
    the groupChatmember of the requesting user is returned
        required:
            otherUser
            chat
 */
function getGroupChatMemberOther(req,res,next){
    try {
        /*
            groupChatMembesr is searched
         */
        req.memberOther =
            req.chat.getMember(
                req.otherUser.uid
            );
        next();
    }catch(err){
        /*
            400 -> bad request
        */
        console.error(err);
        res.status(400);
        res.send();
    }
}
/*
    can be used if the groupChatMember doing this request has to be an admin in this chat
        if not --> 403 (forbidden)
 */
function authAdminSelf(req,res,next){

    if(req.memberSelf.isAdmin){
        next();
    }else{
        /*
            403 -> forbidden
        */
        res.status(403);
        res.send();
    }
}
/*
    is the memberOther admin?
 */
function authAdminOther(req,res,next){

    if(req.memberOther.isAdmin){
        next();
    }else{
        /*
            400 -> bad request
        */
        res.status(400);
        res.send();
    }
}

export default router;