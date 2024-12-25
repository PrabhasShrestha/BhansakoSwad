require('dotenv').config()
const nodemailer = require('nodemailer');
const { SMT_PASS, SMT_EMAIL } = process.env;

const sendMail = async (email, mailSubject, content) => {
  try {
    const transport = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: SMT_EMAIL,
        pass: SMT_PASS,
      },
    });

    const mailOptions = {
      from: SMT_EMAIL,
      to: email,
      subject: mailSubject,
      html: content,
    };

    const info = await transport.sendMail(mailOptions);
    console.log('Mail sent successfully:', info.response);
    return info;
  } catch (error) {
    console.error('Error while sending email:', error.message);
    throw error; // Throw error to caller
  }
};

module.exports = sendMail;
