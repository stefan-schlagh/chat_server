import express from 'express';
import {extractParts, verificationCodeTypes, verifyCode} from "../verification/code";
import {chatData} from "../chatData/data.js";
import {hashPassword} from "../authentication/bcryptWrappers";
import {sendMail} from "../verification/sendMail";

const router = express.Router();

router.get("/isValid/:code",async (req,res) => {
    try {
        const code = req.params.code;

        const parts = extractParts(code);

        if (await verifyCode(parts, verificationCodeTypes.pwReset))
            res.sendStatus(200);
        else
            res.sendStatus(403);
    }catch (e){
        console.error(e);
        res.status(500);
        res.send();
    }
});
/*
    new password is set
 */
router.post("/set",async (req, res) => {
    try {
        const {code,password} = req.body;

        const parts = extractParts(code);
        //load user
        const user = await chatData.getUser(parts.uid,true);
        //generate hash
        const hash = await hashPassword(password);
        //set Password at user
        await user.setPassword(hash,parts.code);

        res.send();
    }catch (e){
        console.error(e);
        res.status(400);
        res.send();
    }
});
/*
    route to request reset link
 */
router.post("/requestLink",async (req,res) => {
    try {
        const {username,email} = req.body;
        // user is searched/loaded from db
        const user = await chatData.getUserEmail(username,email);
        // code is created
        const {sCode} = await user.createPasswordResetCode();
        // mail is sent
        await sendMail(email,"Chat App: password reset",sCode);

        res.send();

    }catch (e){
        console.error(e);
        res.status(400);
        res.send();
    }
});

export default router;