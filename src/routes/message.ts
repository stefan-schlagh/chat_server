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
import {saveTempMessageFile} from "../files/messageFile";
import bodyParser from "body-parser";

const router = express.Router();

router.use(isAuthenticated);
router.use(setUser);

//TODO: timeout
/*
    a new message is put on the server
 */
router.put('/',bodyParser.json(),(req:any,res) => {

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
                // cannot send message because blocked the chat
                if(err.message === 'block')
                    res.sendStatus(403);
                else {
                    logger.error(err);
                    res.status(500);
                    res.send();
                }
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
router.put('/add',bodyParser.json(),async (req:any,res) => {

    try {
        const user:User = req.user;
        const data: NewMessageData = req.body;
        instanceOfNewMessageData(data);

        try {
            const chatsLoadedBefore = user.chatsLoaded || user.chatsLoading;
            if(!chatsLoadedBefore) {
                await user.loadChatsIfNotLoaded();
            }
            chatData.changeChat(user, data.chatType, data.chatId);
            /*
                message is sent
             */
            const mid = await chatData.sendMessage(user, data.message);

            if(!chatsLoadedBefore) {
                await user.saveAndDeleteChats();
            }

            res.send({
                mid: mid
            });
        }catch(err) {
            // cannot send message because blocked the chat
            if(err.message === 'block')
                res.sendStatus(403);
            else {
                logger.error(err);
                res.status(500);
                res.send();
            }
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
router.post('/load',bodyParser.json(),(req:any,res) => {

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
/*
    add a file
 */
router.put('/file/:fileName',async (req:any, res) => {
    const contentType = req.headers['content-type'];
    const user:User = req.user;
    const fileName = req.params.fileName;
    // if type != string, bad request
    if(typeof fileName !== "string"){
        res.sendStatus(400)
    } else {
        try {
            const fileId = await saveTempMessageFile(user.uid, contentType, fileName, req)
            res.send({fid: fileId})
        } catch (err) {
            logger.error(err)
            res.sendStatus(500)
        }
    }
})

export default router;