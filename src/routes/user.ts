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

const router = express.Router();

router.use(isAuthenticated);
router.use(setUser);

/*
    all users are returned
 */
router.post('/',(req:any,res:any) => {

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
router.post('/noChat',(req:any,res:any) => {

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
    all users who are not in the chat are returned
 */
router.post('/notInGroup/:gcid',(req:any,res:any) => {
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
            console.error(err);
            res.status(500);
            res.send();
        });
});
/*
    a new normalCHat is created
 */
router.put('/chat',(req:any,res:any) => {

    const userSelf = req.user;
    const uidOther = req.body.uid;
    const usernameOther = req.body.username;
    const message = req.body.message;

    chatData.newNormalChat(userSelf,uidOther,usernameOther,message)
        .then((result:any) => {
            res.send(result)
        })
        .catch((err:Error) => {
            console.error(err);
            res.status(500);
            res.send();
        });
});
/*
    the email of the user is changed
 */
router.post('/setEmail',async (req:any, res:any) => {
    try {
        const user = req.user;
        const email = req.body.email;

        await user.setEmail(email)

        res.send();
    }catch (e){
        console.error(e);
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

    }catch (e){
        console.error(e);
        res.status(400);
        res.send();
    }
})

export default router;