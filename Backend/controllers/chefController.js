const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const db = require('../config/dbConnection');
const randomstring = require('randomstring');
const sendMail = require('../helpers/sendMail');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;

const registerChef = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, specialty, phone_number, password } = req.body;

    // Check if email already exists
    db.query(
        `SELECT * FROM chefs WHERE LOWER(email) = LOWER(${db.escape(email)});`,
        (err, result) => {
            if (result && result.length) {
                return res.status(409).send({ msg: 'This email is already in use!' });
            } else {
                // Hash the password
                bcrypt.hash(password, 10, (err, hash) => {
                    if (err) {
                        return res.status(500).send({ msg: 'Error hashing password' });
                    } else {
                        // Generate verification code
                        const verificationCode = randomstring.generate({ length: 6, charset: 'numeric' });
                        const verificationCodeExpiryAT = new Date(Date.now() + 60 * 10000); // Expires in 10 mins

                        // Insert chef into the database
                        db.query(
                            `INSERT INTO chefs (name, email, specialty, phone_number, password, verificationCode, verificationCodeExpiryAT) 
                             VALUES (${db.escape(name)}, ${db.escape(email)}, ${db.escape(specialty)}, 
                                     ${db.escape(phone_number)}, ${db.escape(hash)}, 
                                     ${db.escape(verificationCode)}, ${db.escape(verificationCodeExpiryAT)});`,
                            (err) => {
                                if (err) {
                                    return res.status(500).send({ msg: 'Error saving chef to database' });
                                }

                                // Send verification email
                                const mailSubject = 'Verify Your Chef Account';
                                const content = `
                                  <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f9f9f9;">
                                    <h1 style="color: #4CAF50;">Verify Your Email</h1>
                                    <p style="font-size: 16px;">Hello <strong>${name}</strong>,</p>
                                    <p style="font-size: 14px;">Thank you for registering. Use the code below to verify your chef account:</p>
                                    <div style="margin: 20px auto; padding: 10px; border: 1px solid #ddd; display: inline-block; background-color: #fff;">
                                      <h2 style="color: #333; font-size: 24px; margin: 0;">${verificationCode}</h2>
                                    </div>
                                    <p style="font-size: 12px; color: #888;">This code is valid for 10 minutes.</p>
                                  </div>`;
                                sendMail(req.body.email, mailSubject, content);
                                return res.status(200).send({
                                    msg: 'Chef registered successfully. Please verify your email.',
                                });
                            }
                        );
                    }
                });
            }
        }
    );
};

const loginChef = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if the chef exists
    db.query(
        `SELECT * FROM chefs WHERE email = ${db.escape(email)};`,
        (err, result) => {
            if (err) {
                return res.status(500).send({ msg: 'Database error' });
            }

            if (!result.length) {
                return res.status(404).send({ msg: 'Chef not found. Please check the email or register.' });
            }

            const chef = result[0];

            // Check if the chef is verified
            if (!chef.isVerified) {
                return res.status(403).send({ msg: 'Email is not verified. Please verify your email first.' });
            }

            // Compare password
            bcrypt.compare(password, chef.password, (err, isMatch) => {
                if (err || !isMatch) {
                    return res.status(401).send({ msg: 'Invalid password' });
                }

                // Generate JWT token
                const token = jwt.sign({ id: chef.id }, JWT_SECRET, { expiresIn: '1d' });

                // Save token in the database
                db.query(
                    `UPDATE chefs SET token = ${db.escape(token)} WHERE id = ${db.escape(chef.id)};`,
                    (err) => {
                        if (err) {
                            return res.status(500).send({ msg: 'Failed to save token' });
                        }

                        return res.status(200).send({
                            msg: 'Logged in successfully',
                            token,
                            chef: {
                                id: chef.id,
                                name: chef.name,
                                email: chef.email,
                                specialty: chef.specialty,
                            },
                        });
                    }
                );
            });
        }
    );
};

const verifyChefCode = (req, res) => {
    const { email, verificationCode } = req.body;

    // Check if the email and verification code exist in the chefs table
    db.query(
        `SELECT * FROM chefs WHERE email = ${db.escape(email)} AND verificationCode = ${db.escape(verificationCode)};`,
        (err, result) => {
            if (err) {
                return res.status(500).send({ msg: 'Database error' });
            }

            if (!result.length) {
                return res.status(400).send({ msg: 'Invalid verification code.' });
            }

            const chef = result[0];

            // Check if the verification code has expired
            if (new Date() > new Date(chef.verificationCodeExpiryAT)) {
                return res.status(400).send({ msg: 'Verification code has expired.' });
            }

            // Update chef status to verified
            db.query(
                `UPDATE chefs SET isVerified = 1 WHERE email = ${db.escape(email)};`,
                (err) => {
                  if (err) {
                    console.error("Error updating verification status:", err);
                    return res.status(500).send({ msg: "Internal Server Error" });
                  }
        
                  // Send email confirming verification
                  const mailSubject = "Email Successfully Verified";
                  const content = `
                    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; text-align: center; border-radius: 8px; max-width: 600px; margin: auto;">
                      <h1 style="color: #4CAF50; margin-bottom: 20px;">Email Verified Successfully!</h1>
                      <p style="font-size: 16px; color: #333;">Hello <strong>${chef.name}</strong>,</p>
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
        
                  sendMail(email, mailSubject, content)
                    .then(() => {
                      return res.status(200).send({
                        success: true,
                        msg: "Email successfully verified!",
                      });
                    })
                    .catch((error) => {
                      console.error("Error sending email:", error);
                      return res.status(500).send({
                        msg: "Email verified, but failed to send confirmation email. Please try again later.",
                      });
                    });
                }
              );
            }
          );
        }

const resendChefCode = (req, res) => {
    const { email } = req.body;

    db.query(
        `SELECT * FROM chefs WHERE email = ${db.escape(email)};`,
        (err, result) => {
            if (err) {
                return res.status(500).send({ msg: 'Database error' });
            }

            if (!result.length) {
                return res.status(404).send({ msg: 'Email not found.' });
            }

            const chef = result[0];

            if (chef.isVerified) {
                return res.status(400).send({ msg: 'Chef is already verified.' });
            }

            // Generate a new verification code
            const verificationCode = randomstring.generate({ length: 6, charset: 'numeric' });
            const verificationCodeExpiryAT = new Date(Date.now() + 60 * 10000);

            db.query(
                `UPDATE chefs SET verificationCode = ${db.escape(verificationCode)}, verificationCodeExpiryAT = ${db.escape(verificationCodeExpiryAT)} WHERE email = ${db.escape(email)};`,
                (err) => {
                    if (err) {
                        return res.status(500).send({ msg: 'Failed to generate new verification code.' });
                    }

                    const mailSubject = 'Your New Verification Code';
                    const content = `
                    <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f9f9f9;">
                      <h1 style="color: #4CAF50;">New Verification Code</h1>
                      <p style="font-size: 16px;">Hello <strong>${seller.owner_name}</strong>,</p>
                      <p style="font-size: 14px;">We noticed you requested a new verification code. Use the code below to verify your email:</p>
                      <div style="margin: 20px auto; padding: 10px; border: 1px solid #ddd; display: inline-block; background-color: #fff;">
                        <h2 style="color: #333; font-size: 24px; margin: 0;">${verificationCode}</h2>
                      </div>
                      <p style="font-size: 12px; color: #888;">This code is valid for 10 minutes.</p>
                    </div>`;
                    sendMail(email, mailSubject, content);
                    res.status(200).send({ msg: 'New verification code sent.' });
                }
            );
        }
    );
};

module.exports = {
    registerChef,
    loginChef,
    verifyChefCode,
    resendChefCode,
};
