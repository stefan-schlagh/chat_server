import express, {NextFunction} from 'express';
import {chatData} from "../chatData/data";
import {isAuthenticated} from "../authentication/jwt";
import {setUser} from "../chatData/setUser";
import {logger} from "../util/logger";
import {
    GroupChatData,
    GroupChatDataOut,
    GroupChatInfo,
    GroupChatMemberData,
    instanceOfGroupChatData,
    instanceOfGroupChatMemberData
} from "../models/chat";
import {Chat} from "../chatData/chat/chat";
import {instanceOfSimpleUser} from "../models/user";
import User from "../chatData/user";
import GroupChatMember from "../chatData/chat/groupChatMember";
import {instanceOfSearchData, SearchData} from "../models/search";
import {getPublicGroups} from "../database/chat/groupChat";
import {GroupChat} from "../chatData/chat/groupChat";
import {statusMessageTypes} from "../models/message";

export const groupChatErrors =  {
    noAdminLeft: 0,
    notMemberOfChat: 1
}

const router = express.Router();

router.use(isAuthenticated);
router.use(setUser);

export interface SearchPublicGroup extends SearchData {
    // if true: show only chats where user is not part of
    isNotPart: boolean
}
// type check
export function instanceOfSearchPublicGroup(object: any): object is SearchPublicGroup {
    if(!(
        typeof object === 'object'
        && 'isNotPart' in object && typeof object.isNotPart === 'boolean'
        && instanceOfSearchData(object)
    ))
        throw new TypeError('invalid SearchPublicGroup');
    return true;
}
/*
    route to receive all public groups
 */
router.post('/public',async (req:any,res:any) => {
    try {
        const uidFrom = req.user.uid;

        const search:SearchPublicGroup = req.body;
        instanceOfSearchPublicGroup(search);

        const data:GroupChatDataOut[] = await getPublicGroups(uidFrom,search);

        res.send(data);
    }catch (err) {
        logger.error(err);
        if(err instanceof TypeError)
            res.status(400);
        else
            res.status(500);
        res.send();
    }
});
/*
    route for creating a groupChat
 */
router.put('/',async (req:any,res:any) => {

    try {
        const userFrom: GroupChatMemberData = {
            uid: req.user.uid,
            username: req.user.username,
            isAdmin: true
        };

        const data: GroupChatData = req.body.data;
        instanceOfGroupChatData(data);

        const users: GroupChatMemberData[] = req.body.users;
        if(users.length > 0)
            instanceOfGroupChatMemberData(users[0]);

        const chatId = await chatData.newGroupChat(userFrom, data, users)

        res.send({
            chatId: chatId
        });
    }catch (err) {
        logger.error(err);
        if (err instanceof TypeError)
            res.status(400)
        else
            res.status(500);
        res.send();
    }
});
/*
    route for changing the chatName of a groupChat
 */
router.put(
    '/:gcid/chatName',
    getChat,
    getGroupChatMemberSelf,
    authAdminSelf,
    async (req:any,res:any) => {

        try {
            const user:User = req.user;
            const chat = req.chat;
            const chatName = req.body.chatName;

            if (!chatName || typeof chatName !== "string"){
                logger.error(new TypeError("invalid chatName"));
                res.status(400);
                res.send();
            }else {
                // did anything change?
                if(chat.chatName !== chatName) {
                    chat.chatName = chatName;
                    // update chat
                    await chat.update();
                    // add a statusMessage
                    await chat.addStatusMessage(statusMessageTypes.chatNameChanged, user,[])
                }
                res.send();
            }
        } catch(err) {
            logger.error(err);
            res.status(500);
            res.send();
        }
    });
/*
    route for changing the description of a groupChat
 */
router.put(
    '/:gcid/description',
    getChat,
    getGroupChatMemberSelf,
    authAdminSelf,
    async (req:any,res:any) => {

        try {
            const user:User = req.user;
            const chat = req.chat;
            const description = req.body.description;

            if (!description || typeof description !== "string"){
                logger.error(new TypeError("invalid description"));
                res.status(400);
                res.send();
            }else {
                // did anything change?
                if(chat.description !== description) {
                    chat.description = description;
                    // update chat
                    await chat.update();
                    // add a statusMessage
                    await chat.addStatusMessage(statusMessageTypes.descriptionChanged, user,[])
                }
                res.send();
            }
        } catch(err) {
            logger.error(err);
            res.status(500);
            res.send();
        }
});
/*
    route for changing the chats public state
 */
router.put(
    '/:gcid/public',
    getChat,
    getGroupChatMemberSelf,
    authAdminSelf,
    async (req:any,res:any) => {

        try {
            const user:User = req.user;
            const chat:GroupChat = req.chat;
            const isPublic = req.body.isPublic;

            if (!isPublic || typeof isPublic !== "boolean") {
                logger.error(new TypeError("invalid isPublic"));
                res.status(400);
                res.send();
            }else {
                // did anything change?
                if(chat.isPublic !== isPublic) {
                    chat.isPublic = isPublic;
                    // update chat
                    await chat.update();
                    // add a statusMessage
                    await chat.addStatusMessage(statusMessageTypes.isPublicChanged, user,[])
                }
                res.send();
            }
        } catch(err) {
        logger.error(err);
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
    getChat,
    getGroupChatMemberSelf,
    async (req:any,res:any) => {

        const chat = req.chat;
        const groupChatInfo:GroupChatInfo = await chat.getGroupChatInfo(req.memberSelf);
        /*
            chatInfo is sent
         */
        res.send(groupChatInfo);
});
/*
    route for adding a user to a groupChat
        to perfrom this action, the requesting user has to be an admin
 */
router.put(
    '/:gcid/member/:uid',
    getChat,
    getOtherUser(true),
    getGroupChatMemberSelf,
    authAdminSelf,
    (req:any,res:any) => {

        const chat = req.chat;
        const memberSelf = req.memberSelf;
        const otherUser = req.otherUser;

        chat.addMember(memberSelf,otherUser)
            .then(() => {
                res.send();
            })
            .catch((err:Error) => {
                logger.error(err);
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
    getChat,
    getOtherUsers(true),
    getGroupChatMemberSelf,
    authAdminSelf,
    (req:any,res:any) => {

        const users = req.otherUsers;
        const chat = req.chat;
        const memberSelf = req.memberSelf;

        chat.addMembers(memberSelf,users)
            .then(() => {
                res.send();
            })
            .catch((err:Error) => {
                logger.error(err);
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
    getChat,
    getOtherUser(false),
    getGroupChatMemberSelf,
    getGroupChatMemberOther,
    authAdminSelf,
    (req:any,res:any) => {

        const chat = req.chat;
        const memberSelf = req.memberSelf;
        const memberOther = req.memberOther;

        chat.removeMember(memberSelf,memberOther)
            .then(() => {
                res.send();
            })
            .catch((err:Error) => {
                logger.error(err);
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
    getChat,
    getOtherUser(false),
    getGroupChatMemberSelf,
    getGroupChatMemberOther,
    authAdminSelf,
    (req:any,res) => {

        const user = req.user;
        const memberOther:GroupChatMember = req.memberOther;

        memberOther.setAdmin(user,true)
            .then(() => {
                memberOther.chat.emitChatUpdated();
                res.send();
            })
            .catch((err:Error) => {
                logger.error(err);
                res.status(500);
                res.send();
            });
});
/*
    route to take a users admin rights away
        to perform this action, the requesting user has to be an admin
        any admin can remove any other
 */
router.post(
    '/:gcid/member/:uid/removeAdmin',
    getChat,
    getOtherUser(false),
    getGroupChatMemberSelf,
    getGroupChatMemberOther,
    authAdminSelf,
    authAdminOther,
    (req:any,res) => {

        const user = req.user;
        const memberOther:GroupChatMember = req.memberOther;

        memberOther.setAdmin(user,false)
            .then(() => {
                memberOther.chat.emitChatUpdated();
                res.send();
            })
            .catch((err:Error) => {
                logger.error(err);
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
    (req:any,res) => {

        const chat = req.chat;
        const user = req.user;

        chat.joinChat(user)
            .then(() => {
                res.send();
            })
            .catch((err:Error) => {
                logger.error(err);
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
    isAdminLeft,
    (req:any,res) => {

        const chat = req.chat;
        const member = req.memberSelf;

        chat.leaveChat(member)
            .then(() => {
                res.send();
            })
            .catch((err:Error) => {
                logger.error(err);
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
    isAdminLeft,
    (req:any,res) => {

        const member:GroupChatMember = req.memberSelf;

        member.setAdmin(member.user,false)
            .then(() => {
                member.chat.emitChatUpdated();
                res.send();
            })
            .catch((err:Error) => {
                logger.error(err);
                res.status(500);
                res.send();
            });
});
/*
    chat with the chatId in params is returned
 */
function getChat(req:any,res:any,next:any){
    try {
        const gcid = parseInt(req.params.gcid);
        if(typeof gcid !== 'number' || isNaN(gcid))
            throw new TypeError('wrong type of gcid!')
        chatData.chats.getGroupChat(gcid)
            .then((chat:Chat) => {
                /*
                   if chat does not exist
                       --> 404 (not found)
                */
                if (!chat) {
                    res.status(404);
                    res.send();
                } else {
                    chatData.chats.addChat(chat);
                    req.chat = chat;
                    next();
                }
            }).catch((err:Error) => {
                logger.error(err);
                res.status(500);
                res.send();
        });
    }catch(err){
        /*
            400 -> bad request
        */
        logger.error(err);
        res.status(400);
        res.send();
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
    return function(req:any,res:any,next:NextFunction){

        try {
            const uid = parseInt(req.params.uid);
            if(typeof uid !== 'number')
                throw new TypeError('wrong type of uid!')
            chatData.getUser(uid, createNew)
                .then((user:User) => {
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
            logger.error(err);
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
            // type check
            if(usersBody.length > 0)
                instanceOfSimpleUser(usersBody[0]);
            else {
                throw new Error('no users!');
            }
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
            logger.error(err);
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
function getGroupChatMemberSelf(req:any,res:any,next:any) {
    try {
        const chat:GroupChat = req.chat;
        /*
            groupChatMember is searched
                if chat is public, ignore if chat not found
         */
        req.memberSelf =
            chat.getMember(
                req.user.uid,
                chat.isPublic
            );
        next();
    } catch (err) {
        /*
            error is thrown if user is not member in the chat
            400 -> bad request,
            user should be member of this chat when making the request
        */
        res.status(403);
        res.send({
            errorCode: groupChatErrors.notMemberOfChat
        });
    }
}
/*
    the groupChatMember of the requesting user is returned
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
        logger.error(err);
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
    req.chat.getAdminCount()
        .then((adminCount:number) => {
            if(adminCount > 1)
                next();
            /*
                if not, it is checked if the user is no admin
             */
            else if(!req.memberSelf.isAdmin)
                next();
            else
                res.status(400);
                res.send({
                    errorCode: groupChatErrors.noAdminLeft
                });
        })
        .catch((err:Error) => {
            logger.error(err);
        });
}

export default router;