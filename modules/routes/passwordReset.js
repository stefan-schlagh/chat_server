import express from 'express';

const router = express.Router();

router.get("/:code",(req,res) => {

    const code = req.params.code;
});

router.post("/sendMail",(req,res) => {

});