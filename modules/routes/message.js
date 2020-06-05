import express from 'express';
import {setUser,reqAuth} from "../authentication.js";
import chatData from "../chatData/chatData.js";

const router = express.Router();

router.use(setUser);
router.use(reqAuth);

/*
    a new message is put on the server
 */
router.put('/',(req,res) => {

    const user = req.user;
    const msg = req.body.msg;

    /*
        message is sent
     */
    chatData.sendMessage(user,msg)
        .then(mid => {
            res.send({
                mid: mid
            });
        })
        .catch(err => {
            console.error(err);
            res.status(500);
            res.send();
        });
});
/*
    messages are loaded
 */
router.post('/load',(req,res) => {

    const user = req.user;

    const chatType = req.body.chatType;
    const chatId = req.body.chatId;
    const lastMsgId = req.body.lastMsgId;
    const num = req.body.num;

    chatData.loadMessages(user,chatType,chatId,lastMsgId,num)
        .then(data => {
            /*
                data is sent to client
            */
            res.send(data);
        })
        .catch(err => {
            console.error(err);
            res.status(500);
            res.send();
        });
});

export default router;