import express from 'express';
import {isAuthenticated} from "../authentication/jwt";
import {setUser} from "../chatData/setUser";
import {logger} from "../util/logger";
import {ChatInfo} from "../models/chat";

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
    user.getChats()
        .then((chats:ChatInfo[]) => {
            res.send(chats);
        })
        .catch((err:Error) => {
            logger.error(err);
            res.status(500);
            res.send();
        });
});

export default router;