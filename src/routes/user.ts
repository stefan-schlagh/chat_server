import express from 'express';
import {
    selectAllUsers,
    selectUsersNoChat,
    selectUsersNotInGroup
} from "../database/user/selectUsers";
import {chatData} from "../chatData/data";
import {isAuthenticated} from "../authentication/jwt";
import {setUser} from "../chatData/setUser";
import {extractParts, Parts} from "../verification/code";
import {logger} from "../util/logger";
import {MessageDataIn} from "../models/message";
import {NewNormalChatData} from "../models/chat";
import User from "../chatData/user";
import {UserBlockInfo, UserInfoSelf} from "../models/user";
import {validateEmail} from "../util/validateEmail";
import {isEmailUsed} from "../database/email";
import {
    getUserInfo,
    getUserInfoSelf,
    blockUser,
    unblockUser,
    getUserBlockInfo,
    setEmail,
} from "../database/user/user";
import {verifyEmail} from "../database/user/verification";
import {instanceOfSearchData, SearchData} from "../models/search";

const router = express.Router();

export interface NewNormalChat {
    uid: number,
    username: string,
    message: MessageDataIn
}
// type check
export function instanceOfNewNormalChat(object: any): object is NewNormalChat {
    if(!(
        typeof object === 'object'
        && 'uid' in object && typeof object.uid === 'number'
        && 'username' in object && typeof object.username === 'string'
        && 'message' in object && typeof object.message === 'object'
    ))
        throw new TypeError('invalid NewNormalChat');
    return true;
}
/*
    all users are returned
 */
router.post('/',isAuthenticated,setUser,(req:any,res:any) => {

    try {
        const uidFrom = req.user.uid;

        const data:SearchData = req.body;
        instanceOfSearchData(data);

        selectAllUsers(uidFrom, data.search, data.limit, data.start)
            .then(data => {
                res.send(data);
            }).catch(err => {
                logger.error(err);
                res.status(500);
                res.send();
            });
    }catch (err) {
        logger.error(err);
        res.status(400);
        res.send();
    }
});
/*
    all users where the user self has no chat with get returned
 */
router.post('/noChat',isAuthenticated,setUser,(req:any,res:any) => {

    try{
        const uidFrom = req.user.uid;

        const data:SearchData = req.body;
        instanceOfSearchData(data);

        selectUsersNoChat(uidFrom, data.search, data.limit, data.start)
            .then(data => {
                res.send(data);
            }).catch(err => {
            logger.error(err);
                res.status(500);
                res.send();
            });
    }catch (err) {
        logger.error(err);
        res.status(400);
        res.send();
    }
});
/*
    all users who are not in the chat are returned
 */
router.post('/notInGroup/:gcid',isAuthenticated,setUser,(req:any,res:any) => {
    try {
        if(isNaN(req.params.gcid))
            throw new TypeError('gcid is nan!');
        const gcid = parseInt(req.params.gcid);

        const data:SearchData = req.body;
        instanceOfSearchData(data);

        selectUsersNotInGroup(gcid, data.search, data.limit, data.start)
            .then(data => {
                res.send(data);
            }).catch(err => {
                logger.error(err);
                res.status(500);
                res.send();
            })
    }catch (err) {
        /*
                400 -> bad request
             */
        logger.error(err);
        res.status(400);
        res.send();
    }
});
/*
    the userInfo from the user self is returned
 */
router.get('/self',isAuthenticated,setUser,async (req:any,res:any) => {

    try {
        const user:User = req.user;
        // get user info
        const data: UserInfoSelf = await getUserInfoSelf(user.uid);

        res.send(data);

    }catch(err) {
        logger.error(err);
        res.status(500);
        res.send();
    }
});
/*
    the userInfo from the specified user is returned
 */
router.get('/:uid',isAuthenticated,setUser,(req:any,res:any) => {

    const uidFrom = req.user.uid;
    const uidReq = req.params.uid;

    getUserInfo(uidFrom,uidReq)
        .then(result => res.send(result))
        .catch(err => {
            logger.error(err);
            res.status(500);
            res.send();
        });
});
/*
    a new normalChat is created
 */
router.put('/chat',isAuthenticated,setUser,async (req:any,res:any) => {

    try {
        const userSelf:User = req.user;

        const data: NewNormalChat = req.body;
        instanceOfNewNormalChat(data);

        try {
            // get blockInfo of the user
            const blockInfo:UserBlockInfo = await getUserBlockInfo(userSelf.uid,data.uid);
            /*
                if user blocked other user or the other way round, reject with 403
             */
            if(blockInfo.blockedBySelf || blockInfo.blockedByOther){
                res.sendStatus(403);
            }else {
                // create new normalChat
                const result: NewNormalChatData = await chatData.newNormalChat(userSelf, data.uid, data.username, data.message)
                res.send(result);
            }
        }catch(err){
            logger.error(err);
            res.status(500);
            res.send();
        }
    }catch (err) {
        /*
                400 -> bad request
             */
        logger.error(err);
        res.status(400);
        res.send();
    }
});
/*
    the email of the user is changed
 */
router.post('/setEmail',isAuthenticated,setUser,async (req:any, res:any) => {
    try {
        const user:User = req.user;

        const email = req.body.email;
        if(typeof email !== "string" || !validateEmail(email))
            throw new TypeError('invalid email');

        if(await isEmailUsed(email))
            res.send({
                emailTaken: true
            });
        else {
            await setEmail(user.uid,email);

            res.send({
                emailTaken: false
            })
        }
    }catch (err){
        logger.error(err);
        res.status(400);
        res.send();
    }
});
/*
    email is verified
 */
router.get('/verifyEmail/:code',async (req:any,res:any) => {
    try {
        const code = req.params.code;

        const parts:Parts = extractParts(code);
        //load user
        const user = await chatData.getUser(parts.uid,true);
        //verify code
        if(await verifyEmail(user.uid,parts)){
            res.send();
        }else{
            res.status(403);
            res.send();
        }

    }catch (err){
        logger.error(err);
        res.status(400);
        res.send();
    }
});
/*
    a user gets blocked
 */
router.get('/block/:uid',isAuthenticated,setUser,async (req:any,res:any) => {
    try{
        const uid:number = parseInt(req.params.uid);
        if(isNaN(uid))
            res.sendStatus(400);
        else {
            // block user
            const uidFrom = req.user.uid;
            await blockUser(uidFrom, uid);
            res.send();
        }
    }catch (err){
        logger.error(err);
        res.status(500);
        res.send();
    }
});
/*
    a user gets unblocked
 */
router.get('/unblock/:uid',isAuthenticated,setUser,async (req:any,res:any) => {
    try{
        const uid:number = parseInt(req.params.uid);
        if(isNaN(uid))
            res.sendStatus(400);
        else {
            // block user
            const uidFrom = req.user.uid;
            await unblockUser(uidFrom, uid);
            res.send();
        }
    }catch (err){
        logger.error(err);
        res.status(500);
        res.send();
    }
})

export default router;