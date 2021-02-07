import express from 'express';
import {
    getUserInfo,
    selectAllUsers,
    selectUsersNoChat,
    selectUsersNotInGroup
} from "../chatData/database/selectUsers";
import {chatData} from "../chatData/data";
import {isAuthenticated} from "../authentication/jwt";
import {setUser} from "../chatData/setUser";
import {extractParts, Parts} from "../verification/code";
import {logger} from "../util/logger";
import {MessageData} from "../models/message";
import {NewNormalChatData} from "../models/chat";

const router = express.Router();

router.use(isAuthenticated);
router.use(setUser);

export interface SearchUser {
    search: string,
    limit: number,
    start: number
}
// type check
export function instanceOfSearchUser(object: any): object is SearchUser {
    if(!(
        typeof object === 'object'
        && 'search' in object && typeof object.search === 'string'
        && 'limit' in object && typeof object.limit === 'number'
        && 'start' in object && typeof object.start === 'number'
    ))
        throw new TypeError('invalid SearchUser');
    return true;
}
export interface NewNormalChat {
    uid: number,
    username: string,
    message: MessageData
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
router.post('/',(req:any,res:any) => {

    try {
        const uidFrom = req.user.uid;

        const data:SearchUser = req.body;
        instanceOfSearchUser(data);

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
router.post('/noChat',(req:any,res:any) => {

    try{
        const uidFrom = req.user.uid;

        const data:SearchUser = req.body;
        instanceOfSearchUser(data);

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
router.post('/notInGroup/:gcid',(req:any,res:any) => {
    try {
        const gcid = parseInt(req.params.gcid);

        const data:SearchUser = req.body;
        instanceOfSearchUser(data);

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
    TODO: more info
 */
router.get('/self',(req:any,res:any) => {

    const user = req.user;
    res.send({
        uid: user.uid,
        username:user.username
    });
});
/*
    the userInfo from the specified user is returned
 */
router.get('/:uid',(req:any,res:any) => {

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
    a new normalCHat is created
 */
router.put('/chat',(req:any,res:any) => {

    try {
        const userSelf = req.user;

        const data: NewNormalChat = req.body;
        instanceOfNewNormalChat(data);

        chatData.newNormalChat(userSelf, data.uid, data.username, data.message)
            .then((result:NewNormalChatData) => {
                res.send(result)
            })
            .catch((err: Error) => {
                logger.error(err);
                res.status(500);
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
});
/*
    the email of the user is changed
 */
router.post('/setEmail',async (req:any, res:any) => {
    try {
        const user = req.user;

        const email = req.body.email;
        if(typeof email !== "string")
            throw new TypeError('invalid email');

        await user.setEmail(email)

        res.send();
    }catch (err){
        logger.error(err);
        res.status(400);
        res.send();
    }
});
/*
    email is verified
 */
router.post("/verifyEmail",async (req:any,res:any) => {
    try {
        const code = req.body.code;
        if(typeof code !== "string")
            throw new TypeError('invalid code');

        const parts:Parts = extractParts(code);
        //load user
        const user = await chatData.getUser(parts.uid,true);
        //verify code
        if(await user.verifyEmail(parts)){
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
})

export default router;