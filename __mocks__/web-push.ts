const webPush:any = {};
webPush.sendNotification = jest.fn()
    .mockImplementationOnce(async (subscription:string,payload:string) => {
        return new Promise(resolve => {
            resolve();
        })
    })
    .mockImplementationOnce(async (subscription:string,payload:string) => {
        throw new WebPushError('',410);
    });
webPush.setVapidDetails = jest.fn().mockImplementation(() => {})
export class WebPushError extends Error {

    statusCode:number;

    constructor(message:string,statusCode:number) {
        super(message);
        this.statusCode = statusCode;
    }
}
export default webPush;