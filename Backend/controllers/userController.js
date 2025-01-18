const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const db = require('../config/dbConnection');
const randomstring = require('randomstring');
const sendMail = require('../helpers/sendMail');
const jwt =require('jsonwebtoken');
const {JWT_SECRET} = process.env;

const register = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    db.query(
        `SELECT * FROM users WHERE LOWER(email) = LOWER(${db.escape(req.body.email)});`,
        (err, result) => {
            if (result && result.length) {
                return res.status(409).send({
                    msg: 'This email is already in use!!'
                });
            } else {
                bcrypt.hash(req.body.password, 10, (err, hash) => {
                    if (err) {
                        return res.status(400).send({ msg: err });
                    } else {
                        // Generate a random verification code
                        const verificationCode = randomstring.generate({ length: 6, charset: 'numeric' });
                        const verificationCodeExpiryAT = new Date(Date.now() + 60 * 10000); // Expires in 10 minutes

                        db.query(
                            `INSERT INTO users(first_name, last_name, address, email, phone_number, password, verificationCode, verificationCodeExpiryAT, isVerified) 
                            VALUES(${db.escape(req.body.first_name)}, ${db.escape(req.body.last_name)}, ${db.escape(req.body.address)}, 
                            ${db.escape(req.body.email)}, ${db.escape(req.body.phone_number)}, ${db.escape(hash)}, 
                            ${db.escape(verificationCode)}, ${db.escape(verificationCodeExpiryAT)}, 0);`, // isVerified is initially 0
                            (err, result) => {
                                if (err) {
                                    return res.status(400).send({ msg: err });
                                }

                                let mailSubject = 'Your Verification Code';
                                const content = `
                                  <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f9f9f9;">
                                    <h1 style="color: #4CAF50;">Verify Your Email</h1>
                                    <p style="font-size: 16px;">Hello <strong>${req.body.first_name} ${req.body.last_name}</strong>,</p>
                                    <p style="font-size: 14px;">Thank you for registering. Use the code below to verify your email address:</p>
                                    <div style="margin: 20px auto; padding: 10px; border: 1px solid #ddd; display: inline-block; background-color: #fff;">
                                      <h2 style="color: #333; font-size: 24px; margin: 0;">${verificationCode}</h2>
                                    </div>
                                    <p style="font-size: 12px; color: #888;">This code is valid for 10 minutes.</p>
                                  </div>`;
                                sendMail(req.body.email, mailSubject, content);

                                return res.status(200).send({
                                    msg: 'The user has been submitted. Please check your email for the verification code.'
                                });
                            }
                        );
                    }
                });
            }
        }
    );
};

const verifyCode = (req, res) => {
    const { email, verificationCode } = req.body;

    db.query(
        `SELECT * FROM users WHERE email = ${db.escape(email)} AND verificationCode = ${db.escape(verificationCode)};`,
        (err, result) => {
            if (err) {
                return res.status(400).send({ msg: err });
            }

            if (!result || result.length === 0) {
                return res.status(400).send({ msg: 'Invalid verification code.' });
            }

            const user = result[0];
            const currentTime = new Date();

            if (currentTime > new Date(user.verificationCodeExpiryAT)) {
                return res.status(400).send({ msg: 'Verification code has expired. Please enter a new code' });
            }

            // Update user status to verified
            db.query(
                `UPDATE users SET isVerified = 1 WHERE email = ${db.escape(email)};`,
                (err, result) => {
                    if (err) {
                        return res.status(400).send({ msg: err });
                    }

                    // Send email confirming verification
                    const mailSubject = 'Email Successfully Verified';
                    const content = `
                    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; text-align: center; border-radius: 8px; max-width: 600px; margin: auto;">
                      <h1 style="color: #4CAF50; margin-bottom: 20px;">Email Verified Successfully!</h1>
                      <p style="font-size: 16px; color: #333;">Hello <strong>${user.first_name} ${user.last_name}</strong>,</p>
                      <p style="font-size: 14px; color: #555;">Your email address has been successfully verified!</p>
                      <p style="font-size: 14px; color: #555;">Thank you for verifying your account with us. We're excited to have you on board!</p>
                      <div style="margin-top: 30px;">
                        <a href="http://localhost:5173/login" style="display: inline-block; padding: 10px 20px; color: white; background-color: #4CAF50; text-decoration: none; border-radius: 5px; font-size: 16px;">
                          Go to Login
                        </a>
                      </div>
                      <p style="font-size: 12px; color: #888; margin-top: 20px;">If you did not perform this action, please contact our support team immediately.</p>
                    </div>
                  `;
                  
                    sendMail(email, mailSubject, content);

                    return res.status(200).send({ success: true, msg: 'Email successfully verified!' });
                }
            );
        }
    );
};

const resendCode = (req, res) => {
  const { email } = req.body;

  // Check if the email exists in the database
  db.query(
      `SELECT * FROM users WHERE email = ${db.escape(email)};`,
      (err, result) => {
          if (err) {
              return res.status(500).send({ msg: "Internal Server Error" });
          }

          if (!result.length) {
              return res.status(404).send({ msg: "Email not found" });
          }

          const user = result[0];

          // Check if the user is already verified
          if (user.isVerified) {
              return res.status(400).send({ msg: "User is already verified." });
          }

          // Generate a new verification code
          const verificationCode = randomstring.generate({ length: 6, charset: "numeric" });
          const verificationCodeExpiryAT = new Date(Date.now() + 60 * 10000); // Expires in 10 minutes

          // Update the new code in the database
          db.query(
              `UPDATE users SET verificationCode = ${db.escape(verificationCode)}, verificationCodeExpiryAT = ${db.escape(
                  verificationCodeExpiryAT
              )} WHERE email = ${db.escape(email)};`,
              (err) => {
                  if (err) {
                      return res.status(500).send({ msg: "Internal Server Error" });
                  }

                  // Send the new verification code via email
                  const mailSubject = "Your New Verification Code";
                  const content = `
                  <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f9f9f9;">
                    <h1 style="color: #4CAF50;">New Verification Code</h1>
                    <p style="font-size: 16px;">Hello <strong>${user.first_name} ${user.last_name}</strong>,</p>
                    <p style="font-size: 14px;">We noticed you requested a new verification code. Use the code below to verify your email:</p>
                    <div style="margin: 20px auto; padding: 10px; border: 1px solid #ddd; display: inline-block; background-color: #fff;">
                      <h2 style="color: #333; font-size: 24px; margin: 0;">${verificationCode}</h2>
                    </div>
                    <p style="font-size: 12px; color: #888;">This code is valid for 10 minutes.</p>
                  </div>`;
                  
                  sendMail(email, mailSubject, content)
                      .then(() => {
                          return res.status(200).send({ success: true, msg: "New verification code sent successfully." });
                      })
                      .catch((error) => {
                          console.error("Error sending email:", error);
                          return res.status(500).send({ msg: "Failed to send email. Please try again later." });
                      });
              }
          );
      }
  );
};


const login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    db.query(
        `SELECT * FROM users WHERE email = ${db.escape(req.body.email)};`,
        (err, result) => {
            if (err) {
                return res.status(400).send({
                    msg: err
                });
            }

            if (!result.length) {
                return res.status(404).send({
                    msg: 'Email not found. Please check the email or sign up.'
                });
            }

            // Check if the user is verified
            if (result[0].isVerified === 0) {
                return res.status(403).send({
                    msg: 'Your email is not verified. Please check your inbox for the verification code.'
                });
            }

            bcrypt.compare(
                req.body.password,
                result[0]['password'],
                (bErr, Bresult) => {
                    if (bErr) {
                        return res.status(400).send({
                            msg: bErr
                        });
                    }
                    if (Bresult) {
                        const token = jwt.sign({ id: result[0]['id'] }, JWT_SECRET, { expiresIn: '1hr' });
                        return res.status(200).send({
                            msg: 'Logged In',
                            token,
                            user: result[0]
                        });
                    }
                    return res.status(401).send({
                        msg: 'Incorrect password. Please try again.'
                    });
                }
            );
        }
    );
};



const getUser = (req,res) =>{
    const token= req.headers.auth.split(' ')[1]; 
    const decode = jwt.verify(token, JWT_SECRET);
    db.query('SELECT * FROM users where id=?', decode.id,(error,result,fields)=> {
        if(error) throw error;
        return res.status(200).send({ success:true, data:result[0], message: 'Fetch Successfully!'});
    })
}

const forgetPassword = (req, res) => {
    const { email } = req.body;
  
    // Check if the email exists in the database
    const query = "SELECT id FROM users WHERE email = ?";
    db.query(query, [email], (err, results) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ message: "Internal Server Error" });
      }
  
      if (results.length === 0) {
        return res.status(404).json({ message: "Email not found" });
      }
  
      const userId = results[0].id;
  
      // Generate a reset token
      const resetToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
  
      // Save reset token to the database
      const updateQuery = "UPDATE users SET token = ? WHERE id = ?";
      db.query(updateQuery, [resetToken, userId], (err) => {
        if (err) {
          console.error(err.message);
          return res.status(500).json({ message: "Internal Server Error" });
        }
  
        // Send reset email
        const resetLink = `http://localhost:5173/NewPass?token=${resetToken}`;
        const emailContent = `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f9f9f9;">
          <h1 style="color: #4CAF50;">Password Reset Request</h1>
          <p style="font-size: 16px;">Hello,</p>
          <p style="font-size: 14px;">We received a request to reset your password. Click the button below to reset it:</p>
          <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; margin: 20px auto; color: white; background-color: #4CAF50; text-decoration: none; border-radius: 5px; font-size: 16px;">
            Click Here to Reset Password
          </a>
          <p style="font-size: 12px; color: #888;">If you did not request this, please ignore this email.</p>
        </div>
      `;
  
        sendMail(email, "Password Reset Request", emailContent)
          .then(() => {
            res.status(200).json({ message: "Reset email sent successfully" });
          })
          .catch((err) => {
            console.error(err.message);
            res.status(500).json({ message: "Failed to send reset email" });
          });
      });
    });
  };
  
const resetPassword = (req, res) => {
    const { token } = req.query; // Get the token from the query parameters
    const { newPassword } = req.body;
  
    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }
  
    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }
  
      const userId = decoded.id;
  
      // Hash the new password
      bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
        if (err) {
          console.error(err.message);
          return res.status(500).json({ message: "Error hashing the password" });
        }
  
        // Update the user's password in the database
        const updateQuery = "UPDATE users SET password = ?, reset_token = NULL WHERE id = ?";
        db.query(updateQuery, [hashedPassword, userId], (err) => {
          if (err) {
            console.error(err.message);
            return res.status(500).json({ message: "Internal Server Error" });
          }
          try {
            const userQuery = "SELECT email FROM users WHERE id = ?";
            db.query(userQuery, [userId], async (err, results) => {
              if (err) {
                console.error("Error fetching user email:", err.message);
                return res.status(500).json({ message: "Error fetching user email" });
              }
  
              const userEmail = results[0]?.email;
              if (userEmail) {
                const mailContent = `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; text-align: center; border-radius: 8px; max-width: 600px; margin: auto;">
                  <h1 style="color: #4CAF50; margin-bottom: 20px;">Password Reset Successful</h1>
                  <p style="font-size: 16px; color: #333;">Hello,</p>
                  <p style="font-size: 14px; color: #555;">Your password has been successfully reset. You can now use your new password to log in to your account.</p>
                  <div style="margin-top: 30px;">
                    <a href="http://localhost:5173/login" style="display: inline-block; padding: 10px 20px; color: white; background-color: #4CAF50; text-decoration: none; border-radius: 5px; font-size: 16px;">
                      Go to Login
                    </a>
                  </div>
                  <p style="font-size: 12px; color: #888; margin-top: 20px;">If you did not request this password reset, please contact our support team immediately.</p>
                </div>
              `;
                await sendMail(userEmail, 'Password Reset Confirmation', mailContent);
              } else {
                console.error("User email not found.");
              }
            });
          } catch (error) {
            console.error("Error sending email:", error.message);
          }
          res.status(200).json({ message: "Password reset successfully" });
        });
      });
    });
  };
  

module.exports = {
    register,
    verifyCode,
    login,
    getUser,
    forgetPassword,
    resendCode,
    resetPassword
};
