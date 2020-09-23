import express from 'express';
import {extractParts} from "../verification/code";
import {chatData} from "../chatData/data";

const router = express.Router();

/*
    verification code is sent again
 */
router.get("/sendMail",(req, res) => {

})

export default router;