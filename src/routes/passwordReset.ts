import express from 'express';
import {extractParts, Parts, verificationCodeTypes, verifyCode} from "../verification/code";
import {chatData} from "../chatData/data";
import {hashPassword} from "../authentication/bcryptWrappers";
import {sendPasswordResetMail} from "../verification/sendMail";
import {logger} from "../util/logger";
import {instanceOfSetPassword, instanceOfUsernameEmail, SetPassword, UsernameEmail} from "../models/code";

const router = express.Router();

router.get("/isValid/:code",async (req,res) => {
    try {
        const code = req.params.code;

        const parts:Parts = extractParts(code);

        if (await verifyCode(parts, verificationCodeTypes.pwReset) !== -1)
            res.sendStatus(200);
        else
            res.sendStatus(403);
    }catch (err){
        logger.error(err);
        res.status(400);
        res.send();
    }
});
/*
    new password is set
 */
router.post("/set",async (req, res) => {
    try {
        const data:SetPassword = req.body;
        instanceOfSetPassword(data);

        const parts:Parts = extractParts(data.code);
        if (await verifyCode(parts, verificationCodeTypes.pwReset) !== -1) {
            //load user
            const user = await chatData.getUser(parts.uid,true);
            //generate hash
            const hash = await hashPassword(data.password);
            //set Password at user
            await user.setPassword(hash,parts.code);

            res.send();
        }
        else
            res.sendStatus(403);
    }catch (err){
        logger.error(err);
        res.status(400);
        res.send();
    }
});
/*
    route to request reset link
 */
router.post("/requestLink",async (req,res) => {
    try {
        const data:UsernameEmail = req.body;
        instanceOfUsernameEmail(data);

        // user is searched/loaded from db
        const user = await chatData.getUserEmail(data.username, data.email);
        if(user === null){
            // user not found
            res.status(404);
            res.send();
        }else {
            // code is created
            const {sCode} = await user.createPasswordResetCode();
            // mail is sent
            await sendPasswordResetMail(data.email, sCode);

            res.send();
        }

    }catch (err){
        logger.error(err);
        res.status(400);
        res.send();
    }
});

export default router;