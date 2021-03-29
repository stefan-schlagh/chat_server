import {AccountInfo, initAccount} from "../../src/__testHelpers__/userHelpers";
import request, {Response} from "supertest";
// @ts-ignore
import names from "../../src/__testHelpers__/names/names.json";
import {app, closeServer, startServer} from "../../src/app";
import {getSubscriptions,sendNotification} from "../../src/database/push/push";

describe('test API /push',() => {

    let account:AccountInfo;

    beforeAll((done) => {
        startServer();
        done();
    });
    afterAll(async (done) => {
        await closeServer();
        done();
    });
    it('init account',async () => {
        const name = names[60];
        expect(typeof name).toEqual('string')
        account = await initAccount(name);
    })
    it('get public key',async () => {
        const res:Response = await request(app)
            .get('/push/vapidPublicKey')
            .set('Authorization',account.tokens)
            .send();
        expect(res.status).toEqual(200);
    })
    it('register subscription',async () => {
        const res:Response = await request(app)
            .post('/push/register')
            .set('Authorization',account.tokens)
            .send({
                subscription: {
                    endpoint:"https://updates.push.services.mozilla.com/wpush/v2/gAAAAABgRSQ3SYUwQvEgHIFUVIYbj1ZmskdvhvMGIMhMOMd9XvJHV2JJD",
                    keys:{
                        auth:"SGm9sTkh8h02hv7oGP6GgHQ",
                        p256dh:"BKmjnboojgH4SOmhfsIgG6YWOUDaWgZyMMg"
                    }
                }
            });
        expect(res.status).toEqual(201);
    });
    it('expect subscription to be saved',async () => {
        const subscriptions = await getSubscriptions(account.uid)
        expect(subscriptions.length).toEqual(1);
    });
    it('send notification',async () => {
        const res = await sendNotification(account.uid,'abc');
        expect(res).toEqual(false);
    });
    it('send notification - gone',async () => {
        const res = await sendNotification(account.uid,'abc');
        expect(res).toEqual(true);
    });
    it('expect subscription to be deleted',async () => {
        const subscriptions = await getSubscriptions(account.uid)
        expect(subscriptions.length).toEqual(0);
    });
});