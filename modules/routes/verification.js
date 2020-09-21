import express from 'express';

const router = express.Router();

router.get("/:code",(req,res) => {

    const code = req.params.code;
});
/*
    verification code is sent again
 */
router.get("/sendMail",(req, res) => {

})

export default router;