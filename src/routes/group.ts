import express from 'express';
import {chatData} from "../chatData/data";
import {isAuthenticated} from "../authentication/jwt";
import {setUser} from "../chatData/setUser";

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
router.put('/',(req:any,res:any) => {

    const userFrom = {
        uid: req.user.uid,
        username: req.user.username,
        isAdmin: true
    };

    const data = req.body.data;
    const users = req.body.users;

    chatData.newGroupChat(userFrom, data, users)
        .then((r:any)  => res.send())
        .catch((err:Error) => {
            console.error(err);
            res.status(500);
            res.send();
        });
});
/*
    route for changing the chatName of a groupChat
 */
router.put(
    '/:gcid/chatName',
    getChat(true),
    getGroupChatMemberSelf(true),
    authAdminSelf,
    async (req:any,res:any) => {

        try {
            const chat = req.chat;
            const chatName = req.body.chatName;

            if (!chatName){
                console.error("chatName cannot be undefined");
                //TODO other response, send status message
                res.status(500);
                res.send();
            }else {

                chat.chatName = chatName;

                await chat.update();

                res.send();
            }
        } catch(err) {
            console.error(err);
            res.status(500);
            res.send();
        }
    });
/*
    route for changing the description of a groupChat
 */
router.put(
    '/:gcid/description',
    getChat(true),
    getGroupChatMemberSelf(true),
    authAdminSelf,
    async (req:any,res:any) => {

        try {
            const chat = req.chat;
            const description = req.body.description;

            if (!description){
                console.error("description cannot be undefined");
                //TODO other response, send status message
                res.status(500);
                res.send();
            }else {

                chat.description = description;

                await chat.update();

                res.send();
            }
        } catch(err) {
            console.error(err);
            res.status(500);
            res.send();
        }
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
router.get(
    '/:gcid',
    getChat(false),
    getGroupChatMemberSelf(false),
    (req:any,res:any) => {

        const chat = req.chat;
        /*
            chatInfo is sent
         */
        res.send(
            chat.getGroupChatInfo(
                req.memberSelf
            )
        );
});
/*
    route for adding a user to a groupChat
        to perfrom this action, the requesting user has to be an admin
 */
router.put(
    '/:gcid/member/:uid',
    getChat(true),
    getOtherUser(true),
    getGroupChatMemberSelf(true),
    authAdminSelf,
    (req:any,res:any) => {

        const chat = req.chat;
        const memberSelf = req.memberSelf;
        const otherUser = req.otherUser;

        chat.addMember(memberSelf,otherUser)
            .then((data:any) => {
                res.send(data);
            })
            .catch((err:Error) => {
                console.error(err);
                res.status(500);
                res.send();
            });
});
/*
    route for adding multiple users to a groupChat
        to perfrom this action, the requesting user has to be an admin
 */
router.put(
    '/:gcid/members',
    getChat(true),
    getOtherUsers(true),
    getGroupChatMemberSelf(true),
    authAdminSelf,
    (req:any,res:any) => {

        const users = req.otherUsers;
        const chat = req.chat;
        const memberSelf = req.memberSelf;

        chat.addMembers(memberSelf,users)
            .then((data:any) => {
                res.send(data);
            })
            .catch((err:Error) => {
                console.error(err);
                res.status(500);
                res.send();
            });
});

/*
    route for removing a user from a groupChat
        to perform this action, the requesting user has to be an admin
 */
router.delete(
    '/:gcid/member/:uid',
    getChat(true),
    getOtherUser(false),
    getGroupChatMemberSelf(true),
    getGroupChatMemberOther,
    authAdminSelf,
    (req:any,res:any) => {

        const chat = req.chat;
        const memberSelf = req.memberSelf;
        const memberOther = req.memberOther;

        chat.removeMember(memberSelf,memberOther)
            .then((data:any) => {
                res.send(data);
            })
            .catch((err:Error) => {
                console.error(err);
                res.status(500);
                res.send();
            });
});
/*
    route to give a user admin rights
        to perfrom this action, the requesting user has to be an admin
 */
router.post(
    '/:gcid/member/:uid/giveAdmin',
    getChat(true),
    getOtherUser(false),
    getGroupChatMemberSelf(true),
    getGroupChatMemberOther,
    authAdminSelf,
    (req:any,res) => {

        const user = req.user;
        const memberOther = req.memberOther;

        memberOther.setAdmin(user,true)
            .then((data:any) => {
                res.send(data);
            })
            .catch((err:Error) => {
                console.error(err);
                res.status(500);
                res.send();
            });
});
/*
    route to take a users admin rights away
        to perfrom this action, the requesting user has to be an admin
 */
router.post(
    '/:gcid/member/:uid/removeAdmin',
    getChat(true),
    getOtherUser(false),
    getGroupChatMemberSelf(true),
    getGroupChatMemberOther,
    authAdminSelf,
    authAdminOther,
    (req:any,res) => {

        const user = req.user;
        const memberOther = req.memberOther;

        memberOther.setAdmin(user,false)
            .then((data:any) => {
                res.send(data);
            })
            .catch((err:Error) => {
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
    getChat(false),
    authChatPublic,
    (req:any,res) => {

        const chat = req.chat;
        const user = req.user;

        chat.joinChat(user)
            .then((data:any) => {
                res.send(data);
            })
            .catch((err:Error) => {
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
    getChat(false),
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
    getChat(true),
    getGroupChatMemberSelf(true),
    isAdminLeft,
    (req:any,res) => {

        const chat = req.chat;
        const member = req.memberSelf;

        chat.leaveChat(member)
            .then((data:any) => {
                res.send(data);
            })
            .catch((err:Error) => {
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
    getChat(true),
    getGroupChatMemberSelf(true),
    authAdminSelf,
    isAdminLeft,
    (req:any,res) => {

        const member = req.memberSelf;

        member.setAdmin(member.user,false)
            .then((data:any) => {
                res.send(data);
            })
            .catch((err:Error) => {
                console.error(err);
                res.status(500);
                res.send();
            });
});
/*
    chat with the chatId in params is returned
        shouldBeLoaded: should the chat already be loaded?
 */
function getChat(shouldBeLoaded:boolean){
    return function(req:any,res:any,next:any){

        if(shouldBeLoaded) {
            try {
                const gcid = parseInt(req.params.gcid);
                req.chat = chatData.getChat('groupChat', gcid);
                next();
            } catch (err) {
                /*
                    400 -> bad request
                */
                console.error(err);
                res.status(400);
                res.send();
            }
        }else{
            try {
                const gcid = parseInt(req.params.gcid);
                chatData.chats.getGroupChat(gcid)
                    .then((chat:any) => {
                        /*
                           if chat does not exist
                               --> 404 (not found)
                        */
                        if (!chat) {
                            res.status(404);
                            res.send();
                        } else {
                            req.chat = chat;
                            next();
                        }
                    }).catch((err:Error) => {
                    console.error(err);
                    res.status(500);
                    res.send();
                });
            }catch(err){
                /*
                    400 -> bad request
                */
                console.error(err);
                res.status(400);
                res.send();
            }
        }
    }
}
/*
    if the chat is not public, status 403 is sent
 */
function authChatPublic(req:any,res:any,next:any){

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
function getOtherUser(createNew:boolean){
    return function(req:any,res:any,next:any){

        try {
            const uid = parseInt(req.params.uid);
            chatData.getUser(uid, createNew)
                .then((user:any) => {
                    /*
                        otherUser in req is defined
                     */
                    req.otherUser = user;
                    next();
                })
                .catch((err:Error) => {
                    /*
                        400 -> bad request
                     */
                    console.error(err);
                    res.status(400);
                    res.send();
                });
        }catch (err) {
            /*
                400 -> bad request
             */
            console.error(err);
            res.status(400);
            res.send();
        }
    }
}
/*
    the users defined in the body of the chat are created
 */
function getOtherUsers(createNew:boolean){
    return async function(req:any,res:any,next:any){

        try {
            const usersBody = req.body.users;
            const users = new Array(usersBody.length);

            for(let i=0;i<usersBody.length;i++){

                users[i] = await chatData.getUser(usersBody[i].uid,createNew);
            }
            req.otherUsers = users;

            next();

        }catch (err) {
            /*
                400 -> bad request
             */
            console.error(err);
            res.status(400);
            res.send();
        }
    }
}
/*
    the groupChatmember of the requesting user is returned
        params:
            memberRequired: does the requesting user need to be a member in this chat?
        required:
            userSelf
            chat
 */
function getGroupChatMemberSelf(memberReqired:boolean = true){
    return function(req:any,res:any,next:any) {
        try {
            /*
                groupChatMembesr is searched
             */
            req.memberSelf =
                req.chat.getMember(
                    req.user.uid
                );
            next();
        } catch (err) {
            /*
                error is thrown if user is not member in the chat
             */
            if(memberReqired) {
                /*
                    400 -> bad request,
                    user should be member of this chat when making the request
                */
                res.status(400);
                res.send();
            }else{
                /*
                    if member is not reqired, the action is still not performed, but the messages give more detail
                    is err member does not exist?
                 */
                if(
                    err.message === 'member does not exist' ||
                    err.message === 'member not in chat anymore'
                ) {
                    const chat = req.chat;
                    if (chat.isPublic) {

                        res.send({
                            chatName: chat.chatName,
                            error: "not part of chat"
                        });
                    } else {
                        /*
                            chat not public and not member --> not authenticated
                         */
                        res.status(403);
                        res.send();
                    }
                }else{
                    /*
                        otherwise, status 400 is sent
                     */
                    res.status(400);
                    res.send();
                }
            }
        }
    }
}
/*
    the groupChatmember of the requesting user is returned
        required:
            otherUser
            chat
 */
function getGroupChatMemberOther(req:any,res:any,next:any){
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
function authAdminSelf(req:any,res:any,next:any){

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
function authAdminOther(req:any,res:any,next:any){

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
/*
    is there an admin left?
        --> if member leaves or removes admin, ther has to be an admin left
 */
function isAdminLeft(req:any,res:any,next:any){
    /*
        are there multiple admins?
     */
    if(req.chat.getAdminCount() > 1)
        next();
    /*
        if not, it is checked if the user is no admin
     */
    else if(!req.memberSelf.isAdmin)
        next();
    else
        res.send({
            error: "no admin left!"
        });
}

export default router;