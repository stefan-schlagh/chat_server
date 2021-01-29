import express from 'express';
import {isAuthenticated} from "../authentication/jwt";
import {setUser} from "../chatData/setUser";
import {logger} from "../util/logger";

const router = express.Router();

router.use(isAuthenticated);
router.use(setUser);

/*
    all chats of the requested user are returned
 */
router.get('/',(req:any,res:any) => {

    const user = req.user;
    /*
        are the chats already loaded?
     */
    if(user.chatsLoaded){
        user.getChatJson()
            .then((chats:any) => {
                res.send(chats);
            })
            .catch((err:Error) => {
                logger.error(err);
                res.status(500);
                res.send();
            })
    }else{

        function chatsLoaded(chats:any){

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