const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const db = require('../config/dbConnection');
const randomstring = require('randomstring');
const sendMail = require('../helpers/sendMail');
const jwt =require('jsonwebtoken');
const {JWT_SECRET} = process.env;
const axios = require("axios");

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
                      // Generate a token
                      const token = jwt.sign({ id: result[0]['id'] }, JWT_SECRET);

                      // Save the token to the database
                      db.query(
                          `UPDATE users SET token = ${db.escape(token)} WHERE id = ${db.escape(result[0].id)};`,
                          (updateErr) => {
                              if (updateErr) {
                                  return res.status(500).send({
                                      msg: 'Failed to update token in the database.',
                                      error: updateErr
                                  });
                              }

                              return res.status(200).send({
                                  msg: 'Logged In',
                                  token,
                                  user: result[0]
                              });
                          }
                      );
                  } else {
                      return res.status(401).send({
                          msg: 'Incorrect password. Please try again.'
                      });
                  }
              }
          );
      }
  );
};

const logout = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
      return res.status(401).send({
          msg: 'Unauthorized. No token provided.'
      });
  }

  db.query(
      `UPDATE users SET token = NULL WHERE token = ${db.escape(token)};`,
      (err) => {
          if (err) {
              return res.status(500).send({
                  msg: 'Failed to log out. Please try again.',
                  error: err
              });
          }

          return res.status(200).send({
              msg: 'Logged out successfully.'
          });
      }
  );
};

const getUser = (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).send({ message: 'Unauthorized: Missing or malformed token.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    db.query('SELECT * FROM users WHERE id = ?', [decoded.id], (error, result) => {
      if (error) {
        console.error('Database Error:', error);
        return res.status(500).send({ message: 'Internal server error.' });
      }

      if (result.length === 0) {
        return res.status(404).send({ message: 'User not found.' });
      }

      const user = { ...result[0] };

      // Correct the `image` URL construction
      if (user.image) {
        user.image = `http://localhost:3000/uploads/users/${user.image.split('/').pop()}`; // Extract the file name
      }

      return res.status(200).send({
        success: true,
        data: user,
        message: 'Fetch Successful!',
      });
    });
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).send({ message: 'Unauthorized: Invalid token.' });
    }
    console.error('Unexpected Error:', err);
    return res.status(500).send({ message: 'Internal server error.' });
  }
};

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

  const saveTestimonial = (req, res) => {
    const { text } = req.body;
    const userId = req.user.id; // Retrieved from the token middleware
  
    if (!text) {
      return res.status(400).json({ message: 'Review text is required.' });
    }
  
    // Fetch user's name from the database
    db.query(
      'SELECT CONCAT(first_name, " ", last_name) AS user_name FROM users WHERE id = ?',
      [userId],
      (err, results) => {
        if (err) {
          console.error('Error fetching user name:', err);
          return res.status(500).json({ message: 'Internal Server Error' });
        }
  
        if (results.length === 0) {
          return res.status(404).json({ message: 'User not found.' });
        }
  
        const userName = results[0].user_name;
  
        // Insert the review into the testimonials table
        const query = 'INSERT INTO testimonials (user_id, user_name, text) VALUES (?, ?, ?)';
        db.query(query, [userId, userName, text], (err) => {
          if (err) {
            console.error('Error saving review:', err);
            return res.status(500).json({ message: 'Internal Server Error' });
          }
  
          res.status(200).json({ message: 'Review submitted successfully.' });
        });
      }
    );
  };

  const getTestimonial = async (req, res) => {
    try {
      db.query(
        `
        SELECT t.id, t.text, u.first_name, u.last_name, u.image
        FROM testimonials t
        JOIN users u ON t.user_id = u.id
        `,
        (error, testimonials) => {
          if (error) {
            console.error('Database query error:', error);
            return res.status(500).json({ message: 'Failed to fetch testimonials' });
          }

  
          // Ensure testimonials is an array
          if (!Array.isArray(testimonials)) {
            console.error('Unexpected database result:', testimonials);
            return res.status(500).json({ message: 'Invalid data format from database' });
          }
  
          // Transform and send response
          res.status(200).json({
            testimonials: testimonials.map((testimonial) => ({
              id: testimonial.id,
              text: testimonial.text,
              user_name: `${testimonial.first_name} ${testimonial.last_name}`,
              user_image: testimonial.image,
            })),
          });
        }
      );
    } catch (error) {
      console.error('Unexpected error:', error);
      res.status(500).json({ message: 'Failed to fetch testimonials' });
    }
  };
  
  const updateProfile = (req, res) => {
    const errors = validationResult(req);

    // Handle validation errors
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id; // Retrieved from the token middleware
    const { first_name, last_name, address, email, phone_number } = req.body;

    let sql = '';
    let data = [];

    if (req.file) {
        // If an image is provided, include the `image` field
        const imagePath = `uploads/users/${req.file.filename}`; // Correct backend path
        sql = `UPDATE users 
               SET first_name = ?, last_name = ?, address = ?, email = ?, phone_number = ?, image = ? 
               WHERE id = ?`;
        data = [
            first_name,
            last_name,
            address,
            email,
            phone_number,
            imagePath,
            userId
        ];
    } else {
        // If no image is provided, update only other fields
        sql = `UPDATE users 
               SET first_name = ?, last_name = ?, address = ?, email = ?, phone_number = ? 
               WHERE id = ?`;
        data = [first_name, last_name, address, email, phone_number, userId];
    }

    // Execute the query
    db.query(sql, data, (err, result) => {
        if (err) {
            // Handle duplicate email entry error
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({
                    message: 'The email address is already in use. Please use a different email address.',
                });
            }

            // Log and return internal server error
            console.error('Error updating profile:', err.message);
            return res.status(500).json({ message: 'Internal Server Error' });
        }

        // Handle case where no rows are affected
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Respond with success message
        return res.status(200).json({
            message: 'Profile updated successfully.',
            data: {
                first_name,
                last_name,
                address,
                email,
                phone_number,
                image: req.file ? `http://localhost:3000/${imagePath}` : null, // Return the full image URL if updated
            },
        });
    });
};


const removeImage = (req, res) => {
  const userId = req.user.id; // Retrieved from the token middleware

  // Update the `image` field to NULL in the database
  const query = "UPDATE users SET image = NULL WHERE id = ?";

  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error("Error removing image:", err.message);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({ message: "Image removed successfully." });
  });
};

const uploadImage = (req, res) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const userId = req.user.id; // Retrieved from the authentication middleware
    const imagePath = `/uploads/users/${req.file.filename}`; // Relative path to the image

    // Update the image path in the database
    db.query(
      "UPDATE users SET image = ? WHERE id = ?",
      [imagePath, userId],
      (err) => {
        if (err) {
          console.error("Error updating database:", err.message);
          return res.status(500).json({ message: "Failed to save image in database." });
        }

        return res.status(200).json({ message: "Image uploaded successfully.", image: imagePath });
      }
    );
  } catch (err) {
    console.error("Error uploading image:", err.message);
    return res.status(500).json({ message: "Internal server error." });
  }
};


const changePassword = (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id; // Get the user ID from the token middleware

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: "All fields are required." });
  }

  // Fetch the current hashed password and user email from the database
  db.query(
    "SELECT password, email, first_name FROM users WHERE id = ?",
    [userId],
    (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Internal server error." });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "User not found." });
      }

      const currentHashedPassword = results[0].password;
      const userEmail = results[0].email;
      const firstName = results[0].first_name;

      // Compare the old password with the current hashed password
      bcrypt.compare(oldPassword, currentHashedPassword, (err, isMatch) => {
        if (err || !isMatch) {
          return res.status(400).json({ message: "Old password is incorrect." });
        }

        // Hash the new password
        bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
          if (err) {
            console.error("Hashing error:", err);
            return res.status(500).json({ message: "Error hashing the password." });
          }

          // Update the password in the database
          db.query(
            "UPDATE users SET password = ? WHERE id = ?",
            [hashedPassword, userId],
            (err) => {
              if (err) {
                console.error("Update error:", err);
                return res.status(500).json({ message: "Failed to update the password." });
              }

              // Prepare email content
              const mailSubject = "Password Changed Successfully";
              const content = `
                <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f9f9f9;">
                  <h1 style="color: #4CAF50;">Password Change Confirmation</h1>
                  <p style="font-size: 16px;">Hello <strong>${firstName}</strong>,</p>
                  <p style="font-size: 14px;">Your password has been successfully changed.</p>
                  <div style="margin: 20px auto; padding: 10px; border: 1px solid #ddd; display: inline-block; background-color: #fff;">
                    <p style="font-size: 14px; color: #333; margin: 0;">If you did not make this change, please contact our support team immediately.</p>
                  </div>
                  <p style="font-size: 12px; color: #888;">Thank you for using our service.</p>
                  <p style="font-size: 12px; color: #888;">The <strong>Your App Team</strong></p>
                </div>`;

              // Send email notification
              sendMail(userEmail, mailSubject, content);

              return res.status(200).json({
                message:
                  "Password updated successfully. A confirmation email has been sent to your email address.",
              });
            }
          );
        });
      });
    }
  );
};

const getStores = (req, res) => {
  try {
    db.query(
      `SELECT id, shop_name, owner_name, store_address, image FROM sellers`, 
      (error, result) => {
        if (error) {
          console.error("Database Error:", error);
          return res.status(500).send({ message: "Internal server error." });
        }

        if (result.length === 0) {
          return res.status(404).send({ message: "No stores found." });
        }

        // Format image URLs correctly
        const stores = result.map((store) => ({
          ...store,
          image: store.image
            ? `http://localhost:3000/uploads/sellers/${store.image.split("/").pop()}`
            : null,
        }));

        res.status(200).json({
          success: true,
          data: stores,
          message: "Stores fetched successfully.",
        });
      }
    );
  } catch (err) {
    console.error("Unexpected Error:", err);
    res.status(500).send({ message: "Internal server error." });
  }
};

const getNotification = (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: "userId is required." });
  }

  db.query(
    `SELECT n.id AS notification_id, n.message, n.read_status, n.created_at, n.order_id
      FROM notifications n
      WHERE n.user_id = ? 
      ORDER BY n.created_at DESC;
      `,
    [userId],
    (err, results) => {
      if (err) {
        console.error("❌ Database error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
      }
      res.status(200).json({ notifications: results });
    }
  );
};

const deleteNotification = (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: "❌ userId is required." });
  }

  // Fetch notifications to check which ones can be deleted
  db.query(
    `SELECT id, message FROM notifications WHERE user_id = ?`, 
    [userId],
    (err, results) => {
      if (err) {
        console.error("❌ Database error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "No notifications found." });
      }

      // Filter out notifications that CANNOT be deleted
      const deletableIds = results
        .filter(n => !n.message.includes("Confirm Delivery") && !n.message.includes("shipped"))
        .map(n => n.id);

      if (deletableIds.length === 0) {
        return res.status(403).json({ message: "❌ Cannot delete pending confirmations." });
      }

      // Delete only notifications that are allowed
      db.query(
        `DELETE FROM notifications WHERE id IN (?)`, 
        [deletableIds],
        (deleteErr, deleteResults) => {
          if (deleteErr) {
            console.error("❌ Delete error:", deleteErr);
            return res.status(500).json({ message: "Error deleting notifications" });
          }

          res.status(200).json({ 
            message: "✅ Some notifications deleted successfully.", 
            deletedIds: deletableIds 
          });
        }
      );
    }
  );
};

const sendContactEmail = async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

  const mailSubject = `New Contact Request: ${subject}`;
  
  const mailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #333; border-bottom: 2px solid #f4b400; padding-bottom: 10px;">New Contact Request</h2>
      
      <p><strong style="color: #f4b400;">Name:</strong> ${name}</p>
      <p><strong style="color: #f4b400;">Email:</strong> <a href="mailto:${email}" style="color: #1a73e8; text-decoration: none;">${email}</a></p>
      <p><strong style="color: #f4b400;">Subject:</strong> ${subject}</p>
      <p><strong style="color: #f4b400;">Message:</strong></p>
      <div style="background: #f9f9f9; padding: 10px; border-left: 4px solid #f4b400; font-style: italic;">${message}</div>

      <p style="margin-top: 20px; text-align: center;">
        <a href="mailto:${email}" style="background: #f4b400; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">Reply to ${name}</a>
      </p>
    </div>
  `;

  try {
    await sendMail(process.env.ADMIN_EMAIL || process.env.SMT_EMAIL, mailSubject, mailContent);
    return res.status(200).json({ success: true, message: "Email sent successfully!" });
  } catch (error) {
    console.error("Email sending error:", error);
    return res.status(500).json({ success: false, message: "Failed to send email.", error });
  }
};

const initiatePremiumPayment = async (req, res) => {
    try {
        const { totalAmount, userId, customerInfo } = req.body;

        // Step 1: Insert a pending subscription entry before payment
        db.query(
            "INSERT INTO premium_subscriptions (user_id, amount, status) VALUES (?, ?, 'pending')",
            [userId, totalAmount],
            async (err, result) => {
                if (err) {
                    console.error("Database Error:", err);
                    return res.status(500).json({ success: false, message: "Failed to insert pending subscription" });
                }

                // Step 2: Initiate Khalti Payment
                const response = await axios.post(
                    "https://a.khalti.com/api/v2/epayment/initiate/",
                    {
                        return_url: "http://localhost:5173/premiumsuccess",
                        website_url: "http://localhost:5173/",
                        amount: totalAmount * 100,
                        purchase_order_id: userId,  // Using user ID as reference
                        purchase_order_name: "Premium Subscription",
                        customer_info: customerInfo
                    },
                    {
                        headers: {
                            "Authorization": `Key ${process.env.KHALTI_SECRET_KEY}`,
                            "Content-Type": "application/json"
                        }
                    }
                );

                if (response.data.payment_url) {
                    res.json({ success: true, paymentUrl: response.data.payment_url });
                } else {
                    res.status(400).json({ success: false, message: "Payment initiation failed", error: response.data });
                }
            }
        );
    } catch (error) {
        console.error("Khalti Payment Error:", error.response?.data || error.message);
        res.status(500).json({ error: error.response?.data || "Internal Server Error" });
    }
};

// 🔹 Confirm Premium Payment & Activate Subscription
const confirmPremiumPayment = (req, res) => {
  console.log("Received Payment Confirmation Data:", req.body); // ✅ Log Request Data

  const { user_id, payment_date, amount, email } = req.body;

  if (!user_id || !amount || !payment_date) {
      return res.status(400).json({ success: false, message: "User ID, Amount, and Payment Date are required." });
  }

  if (!email) { 
      console.error("Error: Email is missing for user ID", user_id);
      return res.status(400).json({ success: false, message: "User email is required." });
  }

  const startDate = new Date(payment_date);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);  // 1-month premium subscription

  db.query(
      "UPDATE premium_subscriptions SET start_date = ?, end_date = ?, status = 'active' WHERE user_id = ? AND status = 'pending'",
      [startDate, endDate, user_id],
      (err, result) => {
          if (err) {
              console.error("Database Error:", err);
              return res.status(500).json({ success: false, message: "Failed to activate premium subscription" });
          }

          try {
              const mailSubject = "Premium Subscription Activated - Bhansako Swad";
              const content = `
                  <div style="font-family: Arial, sans-serif; background-color: #f8f8f8; padding: 20px;">
                      <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                          <h2 style="text-align: center; color: #4caf50;">Welcome to Premium Membership!</h2>
                          <p style="font-size: 16px; color: #333;">
                              <strong>Plan:</strong> Monthly<br>
                              <strong>Amount Paid:</strong> Rs ${amount}<br>
                              <strong>Start Date:</strong> ${startDate.toLocaleString()}<br>
                              <strong>End Date:</strong> ${endDate.toLocaleString()}
                          </p>
                          <p style="font-size: 16px; color: #333;">Enjoy exclusive premium content & features!</p>
                          <p style="font-size: 16px; color: #333;">Best regards,<br>Bhansako Swad Team</p>
                      </div>
                  </div>
              `;

              sendMail(email, mailSubject, content);
          } catch (emailError) {
              console.error("Error sending email:", emailError);
          }

          res.json({ success: true, message: "Premium subscription activated successfully" });
      }
  );
};



const expireSubscriptions = () => {
  db.query(
      "UPDATE premium_subscriptions SET status = 'expired' WHERE end_date < NOW() AND status = 'active'",
      (err, result) => {
          if (err) {
              console.error("Error expiring subscriptions:", err);
          } else {
              console.log(`Expired ${result.affectedRows} subscriptions.`);
          }
      }
  );
};
const PremiumStatus = async (req, res) => {
  try {
      const userId = req.user?.id; // Ensure user ID exists

      if (!userId) {
          return res.status(400).json({ success: false, message: "User ID is required" });
      }

      console.log(`Checking premium status for user: ${userId}`);

      db.query(
          "SELECT status FROM premium_subscriptions WHERE user_id = ? AND status = 'active' LIMIT 1",
          [userId],
          (error, results) => {
              if (error) {
                  console.error("Database query error:", error);
                  return res.status(500).json({ success: false, message: "Server error" });
              }

              if (results.length > 0) {
                  console.log(`User ${userId} is Premium`);
                  return res.json({ success: true, isPremium: true });
              } else {
                  console.log(`User ${userId} is NOT Premium`);
                  return res.json({ success: true, isPremium: false });
              }
          }
      );
  } catch (error) {
      console.error("Error checking premium status:", error);
      return res.status(500).json({ success: false, message: "Server error" });
  }
};




module.exports = {
  register,
  verifyCode,
  login,
  getUser,
  forgetPassword,
  resendCode,
  saveTestimonial,
  resetPassword,
  getTestimonial,
  updateProfile,
  removeImage,
  uploadImage,
  changePassword,
  logout,
  getStores,
  getNotification,
  deleteNotification,
  sendContactEmail,
  initiatePremiumPayment,
  confirmPremiumPayment,
  expireSubscriptions,
  PremiumStatus,
};
