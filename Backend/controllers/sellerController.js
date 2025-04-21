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
        console.log("Incoming request data:", req.body);
        // Check if email already exists
        const nameParts = owner_name.split(" ");
        const first_name = nameParts[0];
        const last_name = nameParts.slice(1).join(" ") || "";
        db.query(
          `SELECT * FROM users WHERE LOWER(email) = LOWER(?)`,
          [email],
          async (err, userResult) => {
            if (err) return res.status(500).json({ msg: "DB error on users check" });
      
            let hashedPassword;
      
            if (userResult.length > 0) {
              const user = userResult[0];
              const isMatch = await bcrypt.compare(password, user.password);
              if (!isMatch) {
                return res.status(400).json({
                  msg: "Password does not match your existing user account",
                });
              }
              hashedPassword = user.password;
            } else {
              hashedPassword = await bcrypt.hash(password, 10);
              const insertUserQuery = `INSERT INTO users (first_name, last_name, address, email, phone_number, password, isVerified, activity_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
              db.query(
                insertUserQuery,
                [first_name, last_name, store_address, email, phone_number, hashedPassword, 1, "active"],
                (err) => {
                  if (err)
                    return res.status(500).json({ msg: "Error inserting into users table" });
                }
              );
            }
      
            // Check if seller already exists
            db.query(
              `SELECT * FROM sellers WHERE LOWER(email) = LOWER(?)`,
              [email],
              (err, result) => {
                if (result && result.length) {
                  return res.status(409).send({ msg: "This email is already in use!" });
                }
      
                const verificationCode = randomstring.generate({ length: 6, charset: "numeric" });
                const verificationCodeExpiryAT = new Date(Date.now() + 60 * 10000);

                            // Insert seller into the database
                            // Insert seller
              db.query(
                `INSERT INTO sellers (shop_name, owner_name, store_address, email, phone_number, password, verificationCode, verificationCodeExpiryAT) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  shop_name,
                  owner_name,
                  store_address,
                  email,
                  phone_number,
                  hashedPassword,
                  verificationCode,
                  verificationCodeExpiryAT,
                ],
                (err) => {
                  if (err)
                    return res.status(500).send({ msg: "Error saving seller to database" });

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
                );
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
    const sellerId = req.user.seller_id; // Ensure we use seller_id, not user.id

    if (!sellerId) {
      return res.status(404).send({ message: "Seller profile not found." });
    }

    db.query(
      `SELECT shop_name, owner_name, store_address, email, phone_number, image 
       FROM sellers WHERE id = ?`,
      [sellerId],
      (error, result) => {
        if (error) {
          console.error("Database Error:", error);
          return res.status(500).send({ message: "Internal server error." });
        }

        if (result.length === 0) {
          return res.status(404).send({ message: "Seller not found." });
        }

        const seller = result[0];
        if (seller.image) {
          seller.image = `http://localhost:3000/uploads/sellers/${seller.image.split('/').pop()}`;
        }

        res.status(200).json({
          success: true,
          data: seller,
          message: "Seller data fetched successfully",
        });
      }
    );
  } catch (err) {
    console.error("Unexpected Error:", err);
    res.status(500).send({ message: "Internal server error." });
  }
};

const updateSeller = (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Unauthorized: Missing or malformed token." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
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

    // Find the seller's ID and current profile data using the user ID from the token
    db.query(
      `SELECT id, shop_name, owner_name, store_address, email, phone_number, image FROM sellers WHERE email = (SELECT email FROM users WHERE id = ?)`,
      [decoded.id],
      (err, sellerResults) => {
        if (err) {
          console.error("Database Error:", err);
          return res.status(500).json({ message: "Internal server error" });
        }

        if (sellerResults.length === 0) {
          return res.status(404).json({ message: "Seller not found." });
        }

        const sellerId = sellerResults[0].id;
        const currentProfile = sellerResults[0]; // Current seller data
        const currentEmail = currentProfile.email;

        // Prepare response data with current values as defaults
        const updatedData = {
          shop_name: shop_name !== undefined ? shop_name : currentProfile.shop_name,
          owner_name: owner_name !== undefined ? owner_name : currentProfile.owner_name,
          store_address: store_address !== undefined ? store_address : currentProfile.store_address,
          email: email !== undefined ? email : currentProfile.email,
          phone_number: phone_number !== undefined ? phone_number : currentProfile.phone_number,
          image: imagePath ? `http://localhost:3000/${imagePath}` : currentProfile.image
        };

        // Step 1: If email is provided and changed, check for uniqueness
        if (email !== undefined && email !== currentEmail) {
          const checkEmailQuery = `
            SELECT 'users' AS source, id FROM users WHERE email = ? AND id != ?
            UNION
            SELECT 'chefs' AS source, id FROM chefs WHERE email = ?
            UNION
            SELECT 'sellers' AS source, id FROM sellers WHERE email = ? AND id != ?
          `;
          const checkEmailData = [email, decoded.id, email, email, sellerId];

          db.query(checkEmailQuery, checkEmailData, (err, emailResults) => {
            if (err) {
              console.error("Database Error:", err);
              return res.status(500).json({ message: "Internal server error" });
            }

            if (emailResults.length > 0) {
              return res.status(409).json({ message: "Email already in use" });
            }

            // Proceed with update if email is unique
            updateSellerProfile();
          });
        } else {
          // Proceed with update if email is not changed or not provided
          updateSellerProfile();
        }

        function updateSellerProfile() {
          // Step 2: Build dynamic SQL query for fields to update
          const fieldsToUpdate = [];
          const queryData = [];

          if (shop_name !== undefined) {
            fieldsToUpdate.push('shop_name = ?');
            queryData.push(shop_name);
          }
          if (owner_name !== undefined) {
            fieldsToUpdate.push('owner_name = ?');
            queryData.push(owner_name);
          }
          if (store_address !== undefined) {
            fieldsToUpdate.push('store_address = ?');
            queryData.push(store_address);
          }
          if (email !== undefined) {
            fieldsToUpdate.push('email = ?');
            queryData.push(email);
          }
          if (phone_number !== undefined) {
            fieldsToUpdate.push('phone_number = ?');
            queryData.push(phone_number);
          }
          if (imagePath) {
            fieldsToUpdate.push('image = ?');
            queryData.push(imagePath);
          }

          // If no fields to update, return current profile
          if (fieldsToUpdate.length === 0) {
            return res.status(200).json({
              success: true,
              message: "No changes provided to update",
              data: updatedData
            });
          }

          let sellerQuery = `UPDATE sellers SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
          queryData.push(sellerId);

          db.query(sellerQuery, queryData, (error, sellerResult) => {
            if (error) {
              console.error("Update Error:", error);
              return res.status(500).json({ message: "Failed to update seller profile" });
            }

            if (sellerResult.affectedRows === 0) {
              return res.status(404).json({ message: "Seller not found." });
            }

            // Step 3: If email was updated, update users and chefs tables
            if (email !== undefined && email !== currentEmail) {
              // Update users table
              const updateUserQuery = `
                UPDATE users 
                SET email = ? 
                WHERE email = ?
              `;
              db.query(updateUserQuery, [email, currentEmail], (err, userResult) => {
                if (err) {
                  console.error("Error updating user email:", err);
                  // Log error but continue
                }

                // Update chefs table
                const updateChefQuery = `
                  UPDATE chefs 
                  SET email = ? 
                  WHERE email = ?
                `;
                db.query(updateChefQuery, [email, currentEmail], (err, chefResult) => {
                  if (err) {
                    console.error("Error updating chef email:", err);
                    // Log error but continue
                  }

                  // Step 4: Respond with success
                  sendSuccessResponse();
                });
              });
            } else {
              // Step 4: Respond with success if no email update
              sendSuccessResponse();
            }
          });
        }

        function sendSuccessResponse() {
          res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: updatedData
          });
        }
      }
    );
  } catch (err) {
    console.error("Unexpected Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const uploadImage = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Unauthorized: Missing or malformed token." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const imagePath = `uploads/sellers/${req.file.filename}`;
    const fullImageUrl = `http://localhost:3000/${imagePath}`;

    // Find seller ID by user's email
    db.query(
      `SELECT id FROM sellers WHERE email = (SELECT email FROM users WHERE id = ?)`,
      [decoded.id],
      (err, sellerResults) => {
        if (err) {
          console.error("Database Error:", err);
          return res.status(500).json({ message: "Internal server error" });
        }

        if (sellerResults.length === 0) {
          return res.status(404).json({ message: "Seller not found." });
        }

        const sellerId = sellerResults[0].id;

        // Update seller image
        db.query(
          `UPDATE sellers SET image = ? WHERE id = ?`,
          [imagePath, sellerId],
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
      }
    );
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const removeImage = (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Unauthorized: Missing or malformed token." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find seller ID by user's email
    db.query(
      `SELECT id FROM sellers WHERE email = (SELECT email FROM users WHERE id = ?)`,
      [decoded.id],
      (err, sellerResults) => {
        if (err) {
          console.error("Database Error:", err);
          return res.status(500).json({ message: "Internal server error" });
        }

        if (sellerResults.length === 0) {
          return res.status(404).json({ message: "Seller not found." });
        }

        const sellerId = sellerResults[0].id;

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
              message: "Image removed successfully",
            });
          }
        );
      }
    );
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


// Add New products

const addproducts = (req, res) => {
    // ✅ 1. Validate input fields
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // ✅ 2. Extract product details from request
    const { name, category, price, in_stock, description } = req.body;
    const image = req.file ? `uploads/products/${req.file.filename}` : null;

    // ✅ 3. Extract and verify the token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ msg: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const sellerId = decoded.seller_id; // ✅ Use seller_id, not user_id

        if (!sellerId) {
            return res.status(403).json({ msg: "Access denied: Not a seller" });
        }

        // ✅ 4. Check if the seller exists in `sellers` table
        db.query(`SELECT id FROM sellers WHERE id = ?`, [sellerId], (err, sellerResult) => {
            if (err) {
                console.error("Database Error:", err);
                return res.status(500).json({ msg: "Database error", details: err });
            }
            
            if (sellerResult.length === 0) {
                return res.status(404).json({ msg: "Seller profile not found" });
            }

            
            db.query(`SELECT id FROM products WHERE LOWER(name) = LOWER(?)`, [name], (err, productResult) => {
                if (err) return res.status(500).json({ msg: "Database error" });

                if (productResult.length > 0) {
                    const productId = productResult[0].id;

                    
                    db.query(
                        `SELECT * FROM productdetails WHERE product_id = ? AND seller_id = ?`,
                        [productId, sellerId],
                        (err, detailResult) => {
                            if (err) return res.status(500).json({ msg: "Database error" });

                            if (detailResult.length > 0) {
                                return res.status(409).json({ msg: "You have already listed this product!" });
                            }

                            // ✅ 7. Add product under seller's listing
                            db.query(
                                `INSERT INTO productdetails (product_id, seller_id, price, in_stock, image, description) 
                                 VALUES (?, ?, ?, ?, ?, ?)`,
                                [productId, sellerId, price, in_stock, image, description],
                                (err) => {
                                    if (err) return res.status(500).json({ msg: "Error saving product details" });

                                    return res.status(201).json({ msg: "Product added successfully!" });
                                }
                            );
                        }
                    );
                } else {
                    // ✅ 8. If product doesn't exist, add new product
                    db.query(
                        `INSERT INTO products (name, category) VALUES (?, ?)`,
                        [name, category],
                        (err, productInsertResult) => {
                            if (err) return res.status(500).json({ msg: "Error saving product" });

                            const productId = productInsertResult.insertId;

                            // ✅ 9. Link the newly created product to the seller
                            db.query(
                                `INSERT INTO productdetails (product_id, seller_id, price, in_stock, image, description) 
                                 VALUES (?, ?, ?, ?, ?, ?)`,
                                [productId, sellerId, price, in_stock, image, description],
                                (err) => {
                                    if (err) return res.status(500).json({ msg: "Error saving product details" });

                                    return res.status(201).json({ msg: "Product added successfully!" });
                                }
                            );
                        }
                    );
                }
            });
        });
    } catch (error) {
        console.error("Token Verification Error:", error);
        return res.status(401).json({ msg: "Unauthorized: Invalid token" });
    }
};


const getproducts = (req, res) => {
    // ✅ 1. Extract and verify token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ msg: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const sellerId = decoded.seller_id; // ✅ Use seller_id, not user_id

        if (!sellerId) {
            return res.status(403).json({ msg: "Access denied: Not a seller" });
        }

        // ✅ 2. Check if the seller exists in `sellers` table
        db.query(`SELECT id FROM sellers WHERE id = ?`, [sellerId], (err, sellerResult) => {
            if (err) {
                console.error("Database Error:", err);
                return res.status(500).json({ msg: "Database error", details: err });
            }
            
            if (sellerResult.length === 0) {
                return res.status(404).json({ msg: "Seller profile not found" });
            }

            // ✅ 3. Fetch all products for the seller
            let sqlQuery = `
                SELECT p.id AS product_id, p.name AS product_name, p.category, pd.description, pd.price, pd.in_stock, 
                CONCAT('http://localhost:3000/', COALESCE(pd.image, 'default-image.jpg')) AS image
                FROM products p
                JOIN productdetails pd ON p.id = pd.product_id
                WHERE pd.seller_id = ?
            `;

            db.query(sqlQuery, [sellerId], (err, result) => {
                if (err) return res.status(500).json({ msg: "Database error", details: err });
                if (!result.length) return res.status(404).json({ msg: "No products found" });

                res.json({ success: true, products: result });
            });
        });

    } catch (error) {
        console.error("Token Verification Error:", error);
        return res.status(401).json({ msg: "Unauthorized: Invalid token" });
    }
};

const getSellerId = (email, callback) => {
  db.query(`SELECT id FROM sellers WHERE email = ?`, [email], (err, result) => {
    if (err) return callback(err, null);
    if (result.length === 0) return callback(null, null);
    return callback(null, result[0].id);
  });
};
;

const updateproducts = (req, res) => {
  const { id, price, in_stock, description } = req.body;
  const newImage = req.file ? `uploads/products/${req.file.filename}` : null;

  if (!id) {
    return res.status(400).json({ msg: "Product ID is required" });
  }

  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const sellerId = decoded.seller_id;

  if (!sellerId) return res.status(403).json({ msg: "Unauthorized: Seller ID missing" });

  // Fetch the existing image from the database
  db.query(`SELECT image FROM productdetails WHERE product_id = ? AND seller_id = ?`, [id, sellerId], (err, result) => {
    if (err) return res.status(500).json({ msg: "Database error", details: err });

    if (result.length === 0) return res.status(404).json({ msg: "Product not found" });

    const existingImage = result[0].image;
    const finalImage = newImage || existingImage; // ✅ Preserve the existing image if no new image is uploaded

    // Update product details
    db.query(
      `UPDATE productdetails SET price = ?, in_stock = ?, image = ?, description = ? WHERE product_id = ? AND seller_id = ?`,
      [price, in_stock, finalImage, description, id, sellerId],
      (err) => {
        if (err) return res.status(500).json({ msg: "Failed to update product details" });

        res.status(200).json({ msg: "Product updated successfully", image: finalImage });
      }
    );
  });
};


const uploadproductsImage = (req, res) => {
  try {
      if (!req.file) {
          return res.status(400).json({ msg: "No file uploaded." });
      }

      const productId = req.body.id;
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      getSellerId(decoded.id, (err, sellerId) => {
          if (err) return res.status(500).json({ msg: "Database error", details: err });
          if (!sellerId) return res.status(404).json({ msg: "Seller not found" });

          const imagePath = `uploads/products/${req.file.filename}`;

          db.query(
              `SELECT * FROM productdetails WHERE product_id = ? AND seller_id = ?`,
              [productId, sellerId],
              (err, result) => {
                  if (err) return res.status(500).json({ msg: "Database error", details: err });

                  if (!result.length) {
                      return res.status(404).json({ msg: "Product not found for this seller" });
                  }

                  // Update image in database
                  db.query(
                      `UPDATE productdetails SET image = ? WHERE product_id = ? AND seller_id = ?`,
                      [imagePath, productId, sellerId],
                      (err) => {
                          if (err) return res.status(500).json({ msg: "Failed to save image in database." });
                          return res.status(200).json({ msg: "Image uploaded successfully.", image: imagePath });
                      }
                  );
              }
          );
      });
  } catch (err) {
      res.status(500).json({ msg: "Internal server error" });
  }
};
const removeproductsImage = (req, res) => {
  const { id } = req.body; // Product ID
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  getSellerId(decoded.id, (err, sellerId) => {
      if (err) return res.status(500).json({ msg: "Database error", details: err });
      if (!sellerId) return res.status(404).json({ msg: "Seller not found" });

      db.query(
          `SELECT * FROM productdetails WHERE product_id = ? AND seller_id = ?`,
          [id, sellerId],
          (err, result) => {
              if (err) return res.status(500).json({ msg: "Database error", details: err });
              if (!result.length) return res.status(404).json({ msg: "Product not found for this seller" });

              db.query(
                  `UPDATE productdetails SET image = NULL WHERE product_id = ? AND seller_id = ?`,
                  [id, sellerId],
                  (err) => {
                      if (err) return res.status(500).json({ msg: "Failed to remove image" });
                      res.status(200).json({ msg: "Image removed successfully" });
                  }
              );
          }
      );
  });
};
const deleteproducts = (req, res) => {
  const { id } = req.body; // Product ID
  if (!id) return res.status(400).json({ msg: "Product ID is required" });

  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const sellerId = decoded.seller_id; // ✅ Ensure seller ID is used, not user ID

    if (!sellerId) return res.status(403).json({ msg: "Unauthorized: Seller ID missing" });

    // **1️⃣ Check if the seller owns this product**
    db.query(
      `SELECT * FROM productdetails WHERE product_id = ? AND seller_id = ?`,
      [id, sellerId],
      (err, result) => {
        if (err) return res.status(500).json({ msg: "Database error", details: err });
        if (!result.length) return res.status(404).json({ msg: "Product not found for this seller" });

        // **2️⃣ Delete product from seller's listings (productdetails)**
        db.query(
          `DELETE FROM productdetails WHERE product_id = ? AND seller_id = ?`,
          [id, sellerId],
          (err) => {
            if (err) return res.status(500).json({ msg: "Failed to delete product details" });

            // **3️⃣ Check if other sellers are still selling the product**
            db.query(`SELECT * FROM productdetails WHERE product_id = ?`, [id], (err, remainingSellers) => {
              if (err) return res.status(500).json({ msg: "Database error" });

              if (remainingSellers.length === 0) {
                // **4️⃣ If no other sellers have listed this product, delete the product itself**
                db.query(`DELETE FROM products WHERE id = ?`, [id], (err) => {
                  if (err) return res.status(500).json({ msg: "Failed to delete product" });

                  return res.status(200).json({
                    msg: "Product deleted successfully from all records",
                  });
                });
              } else {
                return res.status(200).json({
                  msg: "Product removed from seller's listing, but still available from other sellers",
                });
              }
            });
          }
        );
      }
    );
  } catch (error) {
    return res.status(500).json({ msg: "Internal server error", error: error.message });
  }
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
          `SELECT pd.id AS productdetails_id,p.id AS product_id, p.name AS product_name, p.category, pd.price, pd.in_stock, pd.image, pd.seller_id 
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
                ? product.image.startsWith("uploads/products/")
                  ? `http://localhost:3000/${product.image}`
                  : `http://localhost:3000/uploads/products/${product.image}`
                : "http://localhost:3000/uploads/default-product.png", // Fallback image
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

const getProductById = (req, res) => {
  const productId = req.params.id;
  const sellerId = req.query.seller_id;

  if (!productId || !sellerId) {
    return res.status(400).json({ 
      success: false, 
      message: 'Both product ID and seller ID are required.' 
    });
  }

  db.query(
    `SELECT pd.id AS productdetails_id, p.id AS product_id, p.name AS product_name, p.category, 
            pd.description, pd.price, pd.in_stock, pd.image, pd.seller_id AS store_id
     FROM products p
     JOIN productdetails pd ON p.id = pd.product_id
     WHERE p.id = ? AND pd.seller_id = ?`,
    [productId, sellerId],
    (error, result) => {
      if (error) {
        console.error("Database Error:", error);
        return res.status(500).json({ 
          success: false, 
          message: "Internal server error." 
        });
      }

      if (result.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: "Product not found for this seller." 
        });
      }

      const product = result[0];

      // ✅ Ensure correct image path formatting
      product.image = product.image
        ? product.image.startsWith("uploads/products/")  // If it's already in the correct folder
          ? `http://localhost:3000/${product.image}`  // Append base URL
          : `http://localhost:3000/uploads/products/${product.image}`  // Add folder path manually
        : "http://localhost:3000/uploads/default-product.png"; // Fallback if im

      res.status(200).json({
        success: true,
        data: product,
        message: "Product details fetched successfully.",
      });
    }
  );
};

const getPublicProducts = (req, res) => {
  const { storeId } = req.params; // Store ID from URL

  let query = `
  SELECT 
  pd.id AS productdetails_id,
    p.id AS product_id, 
    p.name AS product_name, 
    p.category, 
    pd.description, 
    pd.price, 
    pd.in_stock, 
    pd.image, 
    pd.seller_id AS store_id 
  FROM products p
  JOIN productdetails pd ON p.id = pd.product_id
`;

const params = [];

if (storeId) {
  query += " WHERE pd.seller_id = ?";
  params.push(storeId);
}


  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, msg: "Database error", details: err });
    }

    if (!result.length) {
      return res.status(404).json({ success: false, msg: "No products found" });
    }

    // Format image URLs
    const products = result.map((product) => ({
      ...product,
      image: product.image
        ? product.image.startsWith("uploads/products/")  // If already has the path
          ? `http://localhost:3000/${product.image}`  // Just add base URL
          : `http://localhost:3000/uploads/products/${product.image}`  // Otherwise, prepend folder path
        : "http://localhost:3000/uploads/default-product.png", // Fallback if null
    }));

    res.json({ success: true, data: products, message: "Products fetched successfully." });
  });
};

const getRelatedProducts = (req, res) => {
  try {
      const { sellerId, productId } = req.params;

      db.query(
          `SELECT p.id AS product_id, p.name AS product_name, p.category, pd.price, pd.image, pd.seller_id 
           FROM products p
           JOIN productdetails pd ON p.id = pd.product_id
           WHERE pd.seller_id = ? AND p.id != ? 
           LIMIT 5`,  
          [sellerId, productId],
          (error, results) => {
              if (error) {
                  console.error("Database Error:", error);
                  return res.status(500).json({ success: false, message: "Internal server error." });
              }

              res.status(200).json({ success: true, data: results });
          }
      );
  } catch (err) {
      console.error(" Unexpected Error:", err);
      res.status(500).json({ success: false, message: "Internal server error." });
  }
};

const forgetSellerPassword = (req, res) => {
  const { email } = req.body;

  // Check if the email exists in the database
  db.query("SELECT id FROM sellers WHERE email = ?", [email], (err, results) => {
    if (err) {
      console.error("Database Error:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Email not found" });
    }

    const sellerId = results[0].id;

    // Generate a reset token
    const resetToken = jwt.sign({ id: sellerId }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // Save reset token to the database
    db.query("UPDATE sellers SET token = ? WHERE id = ?", [resetToken, sellerId], (err) => {
      if (err) {
        console.error("Database Error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
      }

      // Send reset email
      const resetLink = `http://localhost:5173/NewSellerPass?token=${resetToken}`;
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
          console.error("Email Sending Error:", err);
          res.status(500).json({ message: "Failed to send reset email" });
        });
    });
  });
};

const resetSellerPassword = (req, res) => {
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

    const sellerId = decoded.id;

    // Hash the new password
    bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
      if (err) {
        console.error("Hashing Error:", err);
        return res.status(500).json({ message: "Error hashing the password" });
      }

      // Update the seller's password in the database
      db.query("UPDATE sellers SET password = ?, token = NULL WHERE id = ?", [hashedPassword, sellerId], (err) => {
        if (err) {
          console.error("Database Update Error:", err);
          return res.status(500).json({ message: "Internal Server Error" });
        }

        // Fetch seller email
        db.query("SELECT email FROM sellers WHERE id = ?", [sellerId], async (err, results) => {
          if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ message: "Error fetching seller email" });
          }

          const sellerEmail = results[0]?.email;
          if (sellerEmail) {
            const mailContent = `
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; text-align: center; border-radius: 8px; max-width: 600px; margin: auto;">
              <h1 style="color: #4CAF50; margin-bottom: 20px;">Password Reset Successful</h1>
              <p style="font-size: 16px; color: #333;">Hello,</p>
              <p style="font-size: 14px; color: #555;">Your password has been successfully reset. You can now use your new password to log in to your seller account.</p>
              <div style="margin-top: 30px;">
                <a href="http://localhost:5173/login" style="display: inline-block; padding: 10px 20px; color: white; background-color: #4CAF50; text-decoration: none; border-radius: 5px; font-size: 16px;">
                  Go to Login
                </a>
              </div>
              <p style="font-size: 12px; color: #888; margin-top: 20px;">If you did not request this password reset, please contact our support team immediately.</p>
            </div>
          `;
            await sendMail(sellerEmail, 'Password Reset Confirmation', mailContent);
          }
        });

        res.status(200).json({ message: "Password reset successfully" });
      });
    });
  });
};

const createOrder = (req, res) => {
  const { user_id, totalAmount, email } = req.body;

  if (!user_id || !totalAmount) {
      return res.status(400).json({ message: "User ID and Total Amount are required" });
  }

  // Insert the order into the database
  db.query(
      "INSERT INTO orders (user_id, total_amount, status, order_date) VALUES (?, ?, ?, NOW())",
      [user_id, totalAmount, "Processing"],
      (err, result) => {
          if (err) {
              console.error("Database Insert Error:", err);
              return res.status(500).json({ message: "Failed to create order" });
          }

          const orderId = result.insertId; // Retrieve the new order ID

          // Respond with the created order ID
          res.status(200).json({ success: true, message: "Order created successfully", orderId });
      }
  );
};

const saveOrderItems = (req, res) => {
  const { order_id, items } = req.body; // items is an array of products in the order

  if (!order_id || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Order ID and Items are required." });
  }

  // Loop through the items and insert each one into the order_items table
  items.forEach(item => {
      const { productdetails_id, quantity, price } = item;

      if (!productdetails_id || !quantity || !price) {
          return res.status(400).json({ success: false, message: "Product details, quantity, and price are required." });
      }

      // Insert item into the order_items table
      db.query(
          "INSERT INTO order_items (order_id, productdetails_id, quantity, price) VALUES (?, ?, ?, ?)",
          [order_id, productdetails_id, quantity, price],
          (err, result) => {
              if (err) {
                  console.error("Error inserting order item:", err);
                  return res.status(500).json({ success: false, message: "Failed to save order items." });
              }

              console.log("Order item added with ID:", result.insertId);
          }
      );
  });

  // Respond with success after processing all items
  res.json({ success: true, message: "Order items added successfully." });
};
const getOrders = (req, res) => {

  const { vendorId } = req.params;
    const query = `
        SELECT o.order_id, 
              o.user_id,
              p.name AS product_name, 
              u.first_name, u.last_name, 
              oi.price, oi.quantity, 
              o.total_amount, 
              o.order_date, 
              o.status,
              pd.image AS product_image,
              pd.seller_id AS vendor_id
        FROM orders o
        JOIN order_items oi ON o.order_id = oi.order_id
        JOIN productdetails pd ON oi.productdetails_id = pd.id
        JOIN products p ON pd.product_id = p.id
        JOIN users u ON o.user_id = u.id
        WHERE pd.seller_id = ?; 
   `;

   db.query(query, [vendorId], (err, results) => {  //  Pass vendorId into query
    if (err) {
      console.error("Database Error:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
    res.status(200).json({ success: true, orders: results });
  });
};

const updateStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body; 

  if (!status) {
    return res.status(400).json({ message: "Order status is required" });
  }

  if (!["Processing", "Shipped", "Delivered", "Cancelled"].includes(status)) {
    return res.status(400).json({ message: "Invalid status update" });
  }

  // Fetch user ID & all product names before updating order
  const getOrderQuery = `
    SELECT o.user_id, u.email, u.first_name, GROUP_CONCAT(p.name SEPARATOR ', ') AS product_names 
    FROM orders o
    JOIN users u ON o.user_id = u.id
    JOIN order_items oi ON o.order_id = oi.order_id
    JOIN productdetails pd ON oi.productdetails_id = pd.id
    JOIN products p ON pd.product_id = p.id
    WHERE o.order_id = ?
    GROUP BY o.order_id;
  `;

  db.query(getOrderQuery, [id], (err, orderResult) => {
    if (err) {
      console.error("Database Error:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    if (!orderResult.length) {
      return res.status(404).json({ message: "Order not found" });
    }

    const { user_id, email, first_name, product_names } = orderResult[0];

    // Update order status
    const updateQuery = "UPDATE orders SET status = ? WHERE order_id = ?";
    db.query(updateQuery, [status, id], (err, result) => {
      if (err) {
        console.error("Database Error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Order not found" });
      }

      // If order is marked as "Shipped"
      if (status === "Shipped") {
        const notificationMessage = `Your order of ${product_names} has been shipped! Please confirm when you receive it.`;
        const insertNotificationQuery = `
          INSERT INTO notifications (user_id, message, read_status, order_id) 
          VALUES (?, ?, false, ?);
        `;

        db.query(insertNotificationQuery, [user_id, notificationMessage, id], (err) => {
          if (err) console.error("Error inserting notification:", err);
        });
      }

      // If order is marked as "Delivered"
      if (status === "Delivered") {
        // Delete the old "shipped" notification
        db.query("DELETE FROM notifications WHERE order_id = ?", [id], (err) => {
          if (err) console.error("❌Error deleting old notification:", err);
        });

        // Insert new "Thank You" notification
        const thankYouMessage = `You have received your order of ${product_names}. Thank you for shopping with us!`;
        db.query(
          "INSERT INTO notifications (user_id, message, read_status, order_id) VALUES (?, ?, false, ?)",
          [user_id, thankYouMessage, id],
          (err) => {
            if (err) console.error("❌ Error inserting thank-you notification:", err);
          }
        );

        // Send "Thank You" Email
        const mailSubject = "Thank You for Your Order!";
        const mailContent = `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; text-align: center;">
            <h1 style="color: #4CAF50;">Thank You, ${first_name}!</h1>
            <p style="font-size: 16px;">Your order of <strong>${product_names}</strong> has been delivered.</p>
            <p style="font-size: 14px;">We appreciate your business and hope you enjoy your purchase!</p>
            <p style="font-size: 12px; color: #888;">Thank you for shopping with us!</p>
          </div>
        `;

        sendMail(email, mailSubject, mailContent)
          .then(() => console.log(`Thank-you email sent to: ${email}`))
          .catch((error) => console.error("Error sending email:", error));
      }

      res.status(200).json({
        success: true,
        message: `Order marked as ${status}`,
        status,
      });
    });
  });
};


module.exports = {
  registerSeller,
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
  getStoreById,
  getProductById,
  getPublicProducts,
  getRelatedProducts,
  forgetSellerPassword,
  resetSellerPassword,
  createOrder,
  saveOrderItems,
  getOrders,
  updateStatus,
};
