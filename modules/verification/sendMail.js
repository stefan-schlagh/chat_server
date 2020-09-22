import nodemailer from 'nodemailer';

async function sendMail(receiver,title,content){
    const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    const mailOptions = {
        from: process.env.EMAIL,
        to: receiver,
        subject: title,
        text: content
    };

    await new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, function(err, info){
            if (err) {
                reject();
            }
            resolve();
        });
    })
}