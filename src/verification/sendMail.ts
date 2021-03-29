import nodemailer, {SentMessageInfo} from 'nodemailer';
import {mailStorage} from "./mailStorage";
import {logger} from "../util/logger";

export async function sendEmailVerificationMail(receiver:string,sCode:string):Promise<void> {

    const title = "Chat App: email verification";

    if(process.env.NODE_ENV === "test")
        mailStorage.set(title, sCode);

    const content = "https://" + process.env.APP_DOMAIN + "/verifyEmail/" + sCode;

    await sendMail(receiver,title,content);
}
export async function sendPasswordResetMail(receiver:string,sCode:string):Promise<void> {

    const title = "Chat App: password reset";

    if(process.env.NODE_ENV === "test")
        mailStorage.set(title, sCode);

    const content = "https://" + process.env.APP_DOMAIN + "/resetPassword/" + sCode;

    await sendMail(receiver,title,content);
}
export async function sendMail(receiver:string,title:string,content:string):Promise<void> {

    let mailConfig;

    if(process.env.NODE_ENV === "test"){
        mailConfig = {
            host: 'smtp.ethereal.email',
            port: 587,
            auth: {
                user: process.env.EMAIL_TEST_USER, // generated ethereal user
                pass: process.env.EMAIL_TEST_PASSWORD  // generated ethereal password
            }
        };
        /*
            TODO:
                do only when NODE_ENV = production
         */
    }else{
        mailConfig = {
            host: 'mail.gmx.net',
            port: 587,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD
            }
        };
    }
    const transporter = nodemailer.createTransport(mailConfig);
    const mailOptions = {
        from: process.env.EMAIL,
        to: receiver,
        subject: title,
        text: content
    };

    await new Promise<void>((resolve, reject) => {
        transporter.sendMail(mailOptions, function(err:Error | null, info:SentMessageInfo){
            if (err) {
                if(process.env.NODE_ENV === "test"){
                    logger.error(err);
                    resolve();
                }
                else
                    reject(err);
            }
            resolve();
        });
    });
}