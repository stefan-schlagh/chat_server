import express from 'express';
import chatData from "../chatData/chatData";
import {isAuthenticated} from "../authentication/jwt";
import {setUser} from "../chatData/setUser";
import {logger} from "../util/logger";
import {getChatType} from "../chatData/chat/chat";
import {
    instanceOfLoadMessages,
    instanceOfMessageDataIn,
    instanceOfNewMessageData,
    LoadedMessages, LoadMessages,
    MessageDataIn,
    NewMessageData
} from "../models/message";
import User from "../chatData/user";

const router = express.Router();

router.use(isAuthenticated);
router.use(setUser);

//TODO: timeout
/*
    a new message is put on the server
 */
router.put('/',(req:any,res) => {

    try {
        const user = req.user;
        const data: MessageDataIn = req.body;
        instanceOfMessageDataIn(data);
        /*
            message is sent
         */
        chatData.sendMessage(user, data)
            .then(mid => {
                res.send({
                    mid: mid
                });
            })
            .catch(err => {
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
    a new message is put on the server
 */
router.put('/add',async (req:any,res) => {

    try {
        const user:User = req.user;
        const data: NewMessageData = req.body;
        instanceOfNewMessageData(data);

        try {
            user.online = true;
            await user.loadChats();
            chatData.changeChat(user, data.chatType, data.chatId);
            /*
                message is sent
             */
            const mid = await chatData.sendMessage(user, data.message);

            await user.saveAndDeleteChats();
            user.online = false;

            res.send({
                mid: mid
            });
        }catch(err) {
            logger.error(err);
            res.status(500);
            res.send();
        }
    }catch (err) {
        logger.error(err);
        res.status(400);
        res.send();
    }
});
/*
    messages are loaded
 */
router.post('/load',(req:any,res) => {

    try{
        const user = req.user;

        const data:LoadMessages = req.body;
        instanceOfLoadMessages(data);

        chatData.loadMessages(
            user,
            getChatType(data.chatType),
            data.chatId,
            data.lastMsgId,
            data.num
        )
            .then((data:LoadedMessages) => {
                /*
                    data is sent to client
                */
                res.send(data);
            })
            .catch(err => {
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

export default router;