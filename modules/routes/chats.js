import express from 'express';
import {setUser,reqAuth} from "../authentication.js";

const router = express.Router();

router.use(setUser);
router.use(reqAuth);

/*
    all chats of the requested user are returned
 */
router.get('/',(req,res) => {
    /*
        not yet implemented
     */
    res.status(501);
    res.send();
});

export default router;