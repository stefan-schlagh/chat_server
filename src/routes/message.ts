import express from 'express';
import chatData from "../chatData/chatData";
import {isAuthenticated} from "../authentication/jwt";
import {setUser} from "../chatData/setUser";

const router = express.Router();

router.use(isAuthenticated);
router.use(setUser);

/*
    a new message is put on the server
 */
router.put('/',(req:any,res) => {

    const user = req.user;
    const data = req.body;
    /*
        message is sent
     */
    chatData.sendMessage(user,data)
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
router.post('/load',(req:any,res) => {

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