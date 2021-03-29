import express, {Router} from "express";
import webPush, {WebPushError} from "web-push";
import {isAuthenticated} from "../authentication/jwt";
import {setUser} from "../chatData/setUser";
import {saveSubscription} from "../database/push/push";
import {logger} from "../util/logger";

const router:Router = express.Router();

if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.log("You must set the VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY "+
        "environment variables. You can use the following ones:");
    console.log(webPush.generateVAPIDKeys());
    process.exit(1);
}
// Set the keys used for encrypting the push messages.
webPush.setVapidDetails(
    'https://' + process.env.APP_DOMAIN + '/',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

router.use(isAuthenticated);
router.use(setUser);
/*
    send vapidPublicKey
 */
router.get('/vapidPublicKey', function (req, res) {
    res.send(process.env.VAPID_PUBLIC_KEY);
});

router.post('/register', function (req:any, res:any) {

    const uid:number = req.user.uid;

    const subscription:PushSubscription = req.body.subscription;
    // save subscription
    saveSubscription(uid,subscription)
        .then(() => {
            res.sendStatus(201);
        })
        .catch(err => {
            logger.error(err);
            res.sendStatus(500);
        });
});

export default router;