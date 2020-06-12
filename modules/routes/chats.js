import express from 'express';
import {setUser,reqAuth} from "../authentication.js";

const router = express.Router();

router.use(setUser);
router.use(reqAuth);

/*
    all chats of the requested user are returned
 */
router.get('/',(req,res) => {

    const user = req.user;
    /*
        are the chats already loaded?
     */
    if(user.chatsLoaded){
        res.send(user.getChatJson())
    }else{

        function chatsLoaded(chats){
            res.send(chats);
        }

        user.eventEmitter.on('chats loaded',chatsLoaded);

        /*
            after 10 seconds, the request gets rejected
         */
        setTimeout(() => {
            user.eventEmitter.removeListener('chats loaded',chatsLoaded);
            res.status(400);
            res.send();
        },10000);
    }
});

export default router;