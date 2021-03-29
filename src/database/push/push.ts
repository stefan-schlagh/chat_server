import webPush, {WebPushError} from "web-push";
import {logger} from "../../util/logger";
import {isResultEmpty} from "../../util/sqlHelpers";
import {pool} from "../pool";

interface Subscription {
    psid: number,
    uid: number,
    subscription: string
}
export enum NotificationTypes {
    newMessage = 1
}
/*
    save a newly registered subscription
        uid: the id of the user who registered the subscription
        subscription: the PushSubscription
 */
export async function saveSubscription(uid:number,subscription:PushSubscription):Promise<void> {

    const subscriptionString:string = JSON.stringify(subscription);
    // if not already saved, save subscription
    if(!await isSubscriptionAlreadySaved(uid,subscriptionString)) {
        const query_str =
            "INSERT " +
            "INTO pushsubscription (uid,subscription) " +
            "VALUES (" + uid + ",'" + subscriptionString + "')";
        logger.verbose('SQL: %s', query_str);

        await new Promise<void>((resolve, reject) => {

            pool.query(query_str, (err: Error) => {
                if (err)
                    reject(err);
                resolve()
            });
        });
    }
}
/*
    returns if the subscription is already saved
        uid: the id of the user
        subscription: the subscription
 */
export async function isSubscriptionAlreadySaved(uid:number,subscription:string):Promise<boolean> {

    const query_str =
        "SELECT *  " +
        "FROM pushsubscription " +
        "WHERE uid = " + uid + " AND subscription = " + pool.escape(subscription) + ";";
    logger.verbose('SQL: %s',query_str);


    return await new Promise<boolean>((resolve, reject) => {

            pool.query(query_str,(err:Error,rows:any) => {
                if(err)
                    reject(err);
                resolve(!isResultEmpty(rows))
            });
    });
}
/*
    delete a subscription
        psid: the id of the subscription
 */
export async function deleteSubscription(psid:number):Promise<void> {

    const query_str =
        "DELETE " +
        "FROM pushsubscription " +
        "WHERE psid = " + psid + ";";
    logger.verbose('SQL: %s',query_str);

    await new Promise<void>((resolve, reject) => {

        pool.query(query_str,(err:Error) => {
            if(err)
                reject(err);
            resolve()
        });
    });
}
/*
    return all active subscriptions of a user
        uid: the id of the user
 */
export async function getSubscriptions(uid:number):Promise<Subscription[]> {

    const query_str =
        "SELECT *  " +
        "FROM pushsubscription " +
        "WHERE uid = " + uid + ";";
    logger.verbose('SQL: %s',query_str);

    return await new Promise((resolve, reject) => {

        pool.query(query_str,(err:Error,rows:any) => {
            if(err)
                reject(err);
            resolve(rows)
        });
    });
}
/*
    send a notification to the user
        uid: the id of the user
        payload: the content that will be sent
 */
export async function sendNotification(uid:number,payload:string):Promise<boolean> {

    const pushSubscriptions = await getSubscriptions(uid);
    let error:boolean = false;

    for(const pushSubscription of pushSubscriptions){

        try {
            await webPush.sendNotification(JSON.parse(pushSubscription.subscription), payload);
        }catch (err){
            if(err instanceof WebPushError)
                // resource gone
                if(err.statusCode === 410)
                    // delete subscription
                    await deleteSubscription(pushSubscription.psid);
                else {
                    logger.error(err);
                }
            else
                logger.error(err);
            error = true;
        }
    }
    return error;
}