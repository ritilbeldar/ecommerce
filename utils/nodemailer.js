const nodemailer = require("nodemailer");
const ErrorHandler = require("./ErrorHandler");

const sendmail = (email, fullname, verificationToken,req, res, next) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: process.env.MAIL_EMAIL_ADDRESS,
            pass: process.env.MAIL_PASSWORD,
        },
    });
    const mailOptions = {
        from: "Clothes Pvt Limt",
        to: email,
        subject: "Verify Your Account",
        html: `<p>Dear ${fullname},</p>
        <p>Thank you for registering with us. Please click the following link to verify your account:</p>
        <a href="${process.env.BASE_URL}/admin/verify/${verificationToken}">Verify Account</a>
        <p>If you didn't register with us, please ignore this email.</p>
        <p>Best regards,<br>Clothes</p>`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) return next(new ErrorHandler(err, 500));
        console.log(info);
        return res.redirect("/admin/singup");
    });
};
module.exports = { sendmail };

