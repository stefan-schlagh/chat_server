import nodemailer from 'nodemailer';
import {mailStorage} from "./mailStorage";

export async function sendEmailVerificationMail(receiver:string,sCode:string):Promise<void> {

    const title = "Chat App: email verification";

    if(process.env.NODE_ENV === "test")
        mailStorage.set(title, sCode);

    const content = "https://" + process.env.NODE_DOMAIN + "/verifyEmail/" + sCode;

    await sendMail(receiver,title,content);
}
export async function sendPasswordResetMail(receiver:string,sCode:string):Promise<void> {

    const title = "Chat App: password reset";

    if(process.env.NODE_ENV === "test")
        mailStorage.set(title, sCode);

    const content = "https://" + process.env.NODE_DOMAIN + "/resetPassword/" + sCode;

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
            service: process.env.EMAIL_SERVICE,
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

    await new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, function(err, info){
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
}