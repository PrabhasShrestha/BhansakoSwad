const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const db = require('../config/dbConnection');
const randomstring = require('randomstring');
const sendMail = require('../helpers/sendMail');
const jwt =require('jsonwebtoken');
const {JWT_SECRET} = process.env;

const registerSeller = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { shop_name, owner_name, store_address, email, phone_number, password } = req.body;

    // Check if email already exists
    db.query(
        `SELECT * FROM sellers WHERE LOWER(email) = LOWER(${db.escape(email)});`,
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

                        // Insert seller into the database
                        db.query(
                            `INSERT INTO sellers (shop_name, owner_name, store_address, email, phone_number, password, verificationCode, verificationCodeExpiryAT) 
                             VALUES (${db.escape(shop_name)}, ${db.escape(owner_name)}, ${db.escape(store_address)}, 
                                     ${db.escape(email)}, ${db.escape(phone_number)}, ${db.escape(hash)}, 
                                     ${db.escape(verificationCode)}, ${db.escape(verificationCodeExpiryAT)});`,
                            (err) => {
                                if (err) {
                                    return res.status(500).send({ msg: 'Error saving seller to database' });
                                }

                                // Send verification email
                                const mailSubject = 'Verify Your Seller Account';
                                const content = `
                                  <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f9f9f9;">
                                    <h1 style="color: #4CAF50;">Verify Your Email</h1>
                                    <p style="font-size: 16px;">Hello <strong>${owner_name}! of the shop ${shop_name}</strong>,</p>
                                    <p style="font-size: 14px;">Thank you for registering. Use the code below to verify your seller account:</p>
                                    <div style="margin: 20px auto; padding: 10px; border: 1px solid #ddd; display: inline-block; background-color: #fff;">
                                      <h2 style="color: #333; font-size: 24px; margin: 0;">${verificationCode}</h2>
                                    </div>
                                    <p style="font-size: 12px; color: #888;">This code is valid for 10 minutes.</p>
                                  </div>`;
                                sendMail(req.body.email, mailSubject, content);
                                return res.status(200).send({
                                    msg: 'Seller registered successfully. Please verify your email.',
                                });
                            }
                        );
                    }
                });
            }
        }
    );
};


const loginSeller = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if the seller exists
    db.query(
        `SELECT * FROM sellers WHERE email = ${db.escape(email)};`,
        (err, result) => {
            if (err) {
                return res.status(500).send({ msg: 'Database error' });
            }

            if (!result.length) {
                return res.status(404).send({ msg: 'Seller not found. Please check the email or register.' });
            }

            const seller = result[0];

            // Check if the seller is verified
            if (!seller.isVerified) {
                return res.status(403).send({ msg: 'Email is not verified. Please verify your email first.' });
            }

            // Compare password
            bcrypt.compare(password, seller.password, (err, isMatch) => {
                if (err || !isMatch) {
                    return res.status(401).send({ msg: 'Invalid password' });
                }

                // Generate JWT token
                const token = jwt.sign({ id: seller.id }, JWT_SECRET, { expiresIn: '1d' });

                // Save token in the database
                db.query(
                    `UPDATE sellers SET token = ${db.escape(token)} WHERE id = ${db.escape(seller.id)};`,
                    (err) => {
                        if (err) {
                            return res.status(500).send({ msg: 'Failed to save token' });
                        }

                        return res.status(200).send({
                            msg: 'Logged in successfully',
                            token,
                            seller: {
                                id: seller.id,
                                shop_name: seller.shop_name,
                                owner_name: seller.owner_name,
                                email: seller.email,
                                store_address: seller.store_address,
                                phone_number: seller.phone_number
                            },
                        });
                    }
                );
            });
        }
    );
};

const verifySellerCode = (req, res) => {
    const { email, verificationCode } = req.body;
  
    // Check if the email and verification code exist in the sellers table
    db.query(
      `SELECT * FROM sellers WHERE email = ${db.escape(email)} AND verificationCode = ${db.escape(verificationCode)};`,
      (err, result) => {
        if (err) {
          console.error("Database Error:", err);
          return res.status(500).send({ msg: "Internal Server Error" });
        }
  
        if (!result || result.length === 0) {
          return res.status(400).send({ msg: "Invalid verification code." });
        }
  
        const seller = result[0];
        const currentTime = new Date();
  
        // Check if the verification code has expired
        if (currentTime > new Date(seller.verificationCodeExpiryAT)) {
          return res.status(400).send({ msg: "Verification code has expired. Please request a new code." });
        }
  
        // Update seller status to verified
        db.query(
          `UPDATE sellers SET isVerified = 1 WHERE email = ${db.escape(email)};`,
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
                <p style="font-size: 16px; color: #333;">Hello <strong>${seller.owner_name}</strong>,</p>
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
  };
    
const resendSellerCode = (req, res) => {
  const { email } = req.body;

  // Check if the email exists in the sellers table
  db.query(
    `SELECT * FROM sellers WHERE email = ${db.escape(email)};`,
    (err, result) => {
      if (err) {
        console.error("Database Error:", err);
        return res.status(500).send({ msg: "Internal Server Error" });
      }

      if (!result.length) {
        return res.status(404).send({ msg: "Email not found" });
      }

      const seller = result[0];

      // Check if the seller is already verified
      if (seller.isVerified) {
        return res.status(400).send({ msg: "Seller is already verified." });
      }

      // Generate a new verification code
      const verificationCode = randomstring.generate({ length: 6, charset: "numeric" });
      const verificationCodeExpiryAT = new Date(Date.now() + 60 * 10000); // Code valid for 10 minutes

      // Update the new code and expiry time in the database
      db.query(
        `UPDATE sellers 
         SET verificationCode = ${db.escape(verificationCode)}, verificationCodeExpiryAT = ${db.escape(verificationCodeExpiryAT)} 
         WHERE email = ${db.escape(email)};`,
        (err) => {
          if (err) {
            console.error("Error updating verification code:", err);
            return res.status(500).send({ msg: "Internal Server Error" });
          }

          // Send the new verification code via email
          const mailSubject = "Your New Verification Code";
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

          sendMail(email, mailSubject, content)
            .then(() => {
              return res.status(200).send({
                success: true,
                msg: "New verification code sent successfully.",
              });
            })
            .catch((error) => {
              console.error("Error sending email:", error);
              return res.status(500).send({
                msg: "Failed to send email. Please try again later.",
              });
            });
        }
      );
    }
  );
};

const getSeller = (req, res) => {
  try {
    const sellerId = req.user.id;

    db.query(
      `SELECT shop_name, owner_name, store_address, email, phone_number, image 
       FROM sellers WHERE id = ?`,
      [sellerId],
      (error, result) => {
        if (error) {
          console.error('Database Error:', error);
          return res.status(500).send({ message: 'Internal server error.' });
        }

        if (result.length === 0) {
          return res.status(404).send({ message: 'Seller not found.' });
        }

        const seller = result[0];
        if (seller.image) {
          seller.image = `http://localhost:3000/uploads/sellers/${seller.image.split('/').pop()}`;
        }

        res.status(200).json({
          success: true,
          data: seller,
          message: 'Seller data fetched successfully'
        });
      }
    );
  } catch (err) {
    console.error('Unexpected Error:', err);
    res.status(500).send({ message: 'Internal server error.' });
  }
};
const updateSeller = (req, res) => {
  const sellerId = req.user.id;
  const { shop_name, owner_name, store_address, email, phone_number } = req.body;

  // Add validation check
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Check if an image is uploaded
  let imagePath = null;
  if (req.file) {
    imagePath = `uploads/sellers/${req.file.filename}`; // Ensure correct path
  }

  // Check if the email is already used by another seller
  db.query(
    `SELECT id FROM sellers WHERE email = ? AND id != ?`,
    [email, sellerId],
    (err, results) => {
      if (err) {
        console.error("Database Error:", err);
        return res.status(500).json({ message: "Internal server error" });
      }

      if (results.length > 0) {
        return res.status(409).json({ message: "Email already in use" });
      }

      // Dynamically update SQL query to include image if provided
      let query = `
        UPDATE sellers 
        SET shop_name = ?, owner_name = ?, store_address = ?, email = ?, phone_number = ?
      `;
      let data = [shop_name, owner_name, store_address, email, phone_number];

      if (imagePath) {
        query += `, image = ?`;
        data.push(imagePath);
      }

      query += ` WHERE id = ?`;
      data.push(sellerId);

      db.query(query, data, (error) => {
        if (error) {
          console.error("Update Error:", error);
          return res.status(500).json({ message: "Failed to update profile" });
        }

        res.status(200).json({
          success: true,
          message: "Profile updated successfully",
          data: {
            shop_name,
            owner_name,
            store_address,
            email,
            phone_number,
            image: imagePath ? `http://localhost:3000/${imagePath}` : null, // Return full URL
          },
        });
      });
    }
  );
};

const uploadImage = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const sellerId = req.user.id;
    const imagePath = `uploads/sellers/${req.file.filename}`; // Store only relative path
    const fullImageUrl = `http://localhost:3000/${imagePath}`; // Convert to full URL

    db.query(
      `UPDATE sellers SET image = ? WHERE id = ?`,
      [imagePath, sellerId], // Store only relative path
      (err) => {
        if (err) {
          console.error("Error updating database:", err.message);
          return res.status(500).json({ message: "Failed to save image in database." });
        }

        return res.status(200).json({
          message: "Image uploaded successfully.",
          image: fullImageUrl, // Send full URL to frontend
        });
      }
    );
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};


const removeImage = (req, res) => {
  const sellerId = req.user.id;

  db.query(
    `UPDATE sellers SET image = NULL WHERE id = ?`,
    [sellerId],
    (err) => {
      if (err) {
        console.error("Database Error:", err);
        return res.status(500).json({ message: "Failed to remove image" });
      }

      res.status(200).json({
        success: true,
        message: "Image removed successfully"
      });
    }
  );
};

// Add New products
const addproducts = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
  }

  const { name, category, price, in_stock } = req.body;
  const image = req.file ? req.file.filename : null;
  const sellerId = req.user.id;

  db.query(`SELECT * FROM products WHERE LOWER(name) = LOWER(?)`, [name], (err, result) => {
      if (err) return res.status(500).send({ msg: 'Database error' });

      if (result.length > 0) {
          // Product exists, check if it's already linked to the seller
          const productId = result[0].id;

          db.query(
              `SELECT * FROM productdetails WHERE product_id = ? AND seller_id = ?`,
              [productId, sellerId],
              (err, detailResult) => {
                  if (err) return res.status(500).send({ msg: 'Database error' });

                  if (detailResult.length > 0) {
                      return res.status(409).send({ msg: "You have already listed this product!" });
                  }

                  // Link existing product to the seller with a unique image
                  db.query(
                      `INSERT INTO productdetails (product_id, seller_id, price, in_stock, image) VALUES (?, ?, ?, ?, ?)`,
                      [productId, sellerId, price, in_stock, image],
                      (err) => {
                          if (err) return res.status(500).send({ msg: 'Error saving product details' });

                          return res.status(201).send({ msg: 'Product added successfully with unique image!' });
                      }
                  );
              }
          );
      } else {
          // Product does not exist, create a new entry
          db.query(
              `INSERT INTO products (name, category) VALUES (?, ?)`,
              [name, category],
              (err, productResult) => {
                  if (err) return res.status(500).send({ msg: 'Error saving product' });

                  const productId = productResult.insertId;

                  // Link the newly created product to the seller with an image
                  db.query(
                      `INSERT INTO productdetails (product_id, seller_id, price, in_stock, image) VALUES (?, ?, ?, ?, ?)`,
                      [productId, sellerId, price, in_stock, image],
                      (err) => {
                          if (err) return res.status(500).send({ msg: 'Error saving product details' });

                          return res.status(201).send({ msg: 'Product added successfully with unique image!' });
                      }
                  );
              }
          );
      }
  });
};


const getproducts = (req, res) => {
  const sellerId = req.user.id; // Get seller ID from token

  let sqlQuery = `
      SELECT p.id AS product_id, p.name, p.category, pd.price, pd.in_stock, pd.image 
      FROM products p 
      JOIN productdetails pd ON p.id = pd.product_id 
      WHERE pd.seller_id = ?
  `;

  db.query(sqlQuery, [sellerId], (err, result) => {
      if (err) return res.status(500).json({ msg: 'Database error', details: err });
      if (!result.length) return res.status(404).json({ msg: 'No products found' });
      
      res.json(result);
  });
};


// Update products
const updateproducts = (req, res) => {
  const { id, price, in_stock } = req.body; // Get ID from request body
  const image = req.file ? req.file.filename : null;
  const sellerId = req.user.id;

  if (!id) {
      return res.status(400).json({ msg: "Product ID is required" });
  }

  // Check if the product exists in productdetails for the seller
  db.query(
      `SELECT * FROM productdetails WHERE product_id = ? AND seller_id = ?;`,
      [id, sellerId],
      (err, results) => {
          if (err) {
              return res.status(500).json({ msg: "Database error" });
          }
          if (results.length === 0) {
              return res.status(404).json({ msg: "Product not found for this seller" });
          }

          // Update `productdetails` for the specific seller
          db.query(
              `UPDATE productdetails SET price = ?, in_stock = ?, image = ? WHERE product_id = ? AND seller_id = ?`,
              [price, in_stock, image, id, sellerId],
              (err) => {
                  if (err) {
                      return res.status(500).json({ msg: "Failed to update product details" });
                  }
                  res.status(200).json({ msg: "Product details updated successfully" });
              }
          );
      }
  );
};

// Delete products
const deleteproducts = (req, res) => {
  const { id } = req.body; // Get Product ID from request body
  const sellerId = req.user.id; // Get seller ID from authenticated user

  if (!id) {
    return res.status(400).json({ msg: "Product ID is required" });
  }

  // Check if the product exists for this specific seller in productdetails
  db.query(
    `SELECT * FROM productdetails WHERE product_id = ? AND seller_id = ?;`,
    [id, sellerId],
    (err, result) => {
      if (err) {
        return res.status(500).json({ msg: "Database error", details: err });
      }
      if (!result.length) {
        return res.status(404).json({ msg: "Product not found for this seller" });
      }

      // Delete the product from productdetails for this seller
      db.query(
        `DELETE FROM productdetails WHERE product_id = ? AND seller_id = ?;`,
        [id, sellerId],
        (err) => {
          if (err) {
            return res.status(500).json({ msg: "Failed to delete product details", details: err });
          }

          // Check if there are any remaining sellers for this product
          db.query(
            `SELECT * FROM productdetails WHERE product_id = ?;`,
            [id],
            (err, remainingSellers) => {
              if (err) {
                return res.status(500).json({ msg: "Database error", details: err });
              }

              // If no other sellers are selling this product, remove it from products
              if (remainingSellers.length === 0) {
                db.query(
                  `DELETE FROM products WHERE id = ?;`,
                  [id],
                  (err) => {
                    if (err) {
                      return res.status(500).json({ msg: "Failed to delete product from main table", details: err });
                    }
                    return res.status(200).json({ msg: "Product deleted successfully from all records" });
                  }
                );
              } else {
                // If other sellers still have this product, just remove the seller's entry
                return res.status(200).json({ msg: "Product deleted successfully for this seller" });
              }
            }
          );
        }
      );
    }
  );
};


// Upload Image for products
const uploadproductsImage = (req, res) => {
  try {
      if (!req.file) {
          return res.status(400).json({ msg: "No file uploaded." });
      }

      const productId = req.body.id;
      const sellerId = req.user.id; // Get seller ID from token
      const imagePath = req.file.filename;

      // Check if the seller owns this product
      db.query(
          `SELECT * FROM productdetails WHERE product_id = ? AND seller_id = ?;`,
          [productId, sellerId],
          (err, result) => {
              if (err) {
                  return res.status(500).json({ msg: "Database error", details: err });
              }
              if (!result.length) {
                  return res.status(404).json({ msg: "Product not found for this seller" });
              }

              // Update image for this seller's product
              db.query(
                  `UPDATE productdetails SET image = ? WHERE product_id = ? AND seller_id = ?;`,
                  [imagePath, productId, sellerId],
                  (err) => {
                      if (err) {
                          return res.status(500).json({ msg: "Failed to save image in database." });
                      }
                      return res.status(200).json({ msg: "Image uploaded successfully.", image: imagePath });
                  }
              );
          }
      );
  } catch (err) {
      res.status(500).json({ msg: "Internal server error" });
  }
};


// Remove Image from products
const removeproductsImage = (req, res) => {
  const { id } = req.body; // Product ID
  const sellerId = req.user.id; // Get seller ID from token

  // Check if the seller owns this product
  db.query(
      `SELECT * FROM productdetails WHERE product_id = ? AND seller_id = ?;`,
      [id, sellerId],
      (err, result) => {
          if (err) {
              return res.status(500).json({ msg: "Database error", details: err });
          }
          if (!result.length) {
              return res.status(404).json({ msg: "Product not found for this seller" });
          }

          // Remove only this seller's product image
          db.query(
              `UPDATE productdetails SET image = NULL WHERE product_id = ? AND seller_id = ?;`,
              [id, sellerId],
              (err) => {
                  if (err) {
                      return res.status(500).json({ msg: "Failed to remove image" });
                  }
                  res.status(200).json({ msg: "Image removed successfully" });
              }
          );
      }
  );
};

const sellerchangePassword = (req, res) => {

  const { oldPassword, newPassword } = req.body;
  const sellerId = req.user.id; 

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: "All fields are required." });
  }

  // Fetch the current hashed password and user email from the database
  db.query(
    "SELECT password, email, shop_name FROM sellers WHERE id = ?",
    [sellerId],
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
      const shop_name = results[0].shop_name;

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
            "UPDATE sellers SET password = ? WHERE id = ?",
            [hashedPassword, sellerId],
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
                  <p style="font-size: 16px;">Hello owner of <strong>${shop_name}</strong>,</p>
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

const getProductsByStore = (req, res) => {
  try {
    const storeId = req.params.id; // Get the Store ID from request parameters

    // Ensure the store exists before fetching products
    db.query(
      `SELECT id FROM sellers WHERE id = ?`,
      [storeId],
      (error, storeResult) => {
        if (error) {
          console.error("Database Error:", error);
          return res.status(500).json({ message: "Internal server error." });
        }

        if (storeResult.length === 0) {
          return res.status(404).json({ message: "Store not found." });
        }

        // Fetch products linked to the store
        db.query(
          `SELECT p.id AS product_id, p.name AS product_name, p.category, pd.price, pd.in_stock, pd.image 
          FROM products p
          JOIN productdetails pd ON p.id = pd.product_id
          WHERE pd.seller_id = ?`,
          [storeId],
          (error, productResult) => {
            if (error) {
              console.error("Database Error:", error);
              return res.status(500).json({ message: "Internal server error." });
            }

            if (productResult.length === 0) {
              return res.status(404).json({ message: "No products found for this store." });
            }

            // Format product image URLs correctly
            const products = productResult.map((product) => ({
              ...product,
              image: product.image
                ? `http://localhost:3000/uploads/products/${product.image}`
                : null,
            }));

            res.status(200).json({
              success: true,
              data: products,
              message: "Products fetched successfully.",
            });
          }
        );
      }
    );
  } catch (err) {
    console.error("Unexpected Error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

const getStoreById = (req, res) => {
  const storeId = req.params.id;

  db.query(
      `SELECT shop_name, owner_name, store_address, email, phone_number, image 
       FROM sellers WHERE id = ?`,
      [storeId],
      (error, result) => {
          if (error) {
              console.error("Database Error:", error);
              return res.status(500).json({ message: "Internal server error." });
          }

          if (result.length === 0) {
              return res.status(404).json({ message: "Store not found." });
          }

          const store = result[0];
          if (store.image) {
              store.image = `http://localhost:3000/uploads/sellers/${store.image.split('/').pop()}`;
          }

          res.status(200).json({
              success: true,
              data: store,
              message: "Store details fetched successfully"
          });
      }
  );
};


// Add these to module.exports
module.exports = {
  registerSeller,
  loginSeller,
  verifySellerCode,
  resendSellerCode,
  getSeller,
  updateSeller,
  uploadImage,
  removeImage,
  addproducts,
  getproducts,
  updateproducts,
  deleteproducts,
  uploadproductsImage,
  removeproductsImage,
  sellerchangePassword,
  getProductsByStore,
  getStoreById
};
