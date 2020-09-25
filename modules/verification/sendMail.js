import nodemailer from 'nodemailer';
import {mailStorage} from "../../__testHelpers/mailStorage.js";

export async function sendMail(receiver,title,content){

    let mailConfig;

    if(process.env.NODE_ENV === "test"){
        mailStorage.set(title,content);
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