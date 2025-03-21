const bcrypt = require('bcryptjs');
const jwt =require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db = require('../config/dbConnection');
const multer = require("multer");
const path = require("path");
const sendMail = require('../helpers/sendMail');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./uploads/chefs"); // Save files in "uploads/chefs" directory
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
});

const upload = multer({ storage: storage }).single("certificate");

const registerChef = (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        console.error("File Upload Error:", err);
        return res.status(500).json({ msg: "Error uploading certificate" });
      }
  
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      const { name, email, nationality, phone_number, password, about_you } = req.body;
      const certificate = req.file ? req.file.filename : null;
  
      if (!password) {
        return res.status(400).json({ msg: "Password is required" });
      }
  
      const nameParts = name.split(" ");
      const first_name = nameParts[0];
      const last_name = nameParts.slice(1).join(" ") || "";
  
      db.query(`SELECT * FROM users WHERE LOWER(email) = LOWER(?)`, [email], async (err, userResult) => {
        if (err) {
          console.error("DB Error:", err);
          return res.status(500).json({ msg: "DB error on user check" });
        }
  
        let hashedPassword;
  
        if (userResult.length > 0) {
          const user = userResult[0];
          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
            return res.status(400).json({ msg: "Password does not match your existing user account" });
          }
          hashedPassword = user.password;
        } else {
          hashedPassword = await bcrypt.hash(password, 10);
          
          // ✅ FIX: Store `nationality` in `address` column
          const insertUserQuery = `INSERT INTO users (first_name, last_name, address, email, phone_number, password, isVerified, activity_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  
          db.query(
            insertUserQuery,
            [first_name, last_name, nationality, email, phone_number, hashedPassword, 0, "active"], // ✅ nationality stored in address
            (err) => {
              if (err) {
                console.error("Error inserting user:", err);
                return res.status(500).json({ msg: "Error inserting into users table" });
              }
            }
          );
        }
  
        // Check if chef already exists
        db.query("SELECT * FROM chefs WHERE LOWER(email) = LOWER(?)", [email], (err, result) => {
          if (err) {
            console.error("DB Error:", err);
            return res.status(500).json({ msg: "DB error in chef check" });
          }
  
          if (result.length > 0) {
            return res.status(409).json({ msg: "This email is already registered as a chef." });
          }
  
          const status = "pending";
          db.query(
            `INSERT INTO chefs (name, email, nationality, phone_number, password, certificate, about_you, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, email, nationality, phone_number, hashedPassword, certificate, about_you, status],
            (err) => {
              if (err) {
                console.error("Error inserting chef:", err);
                return res.status(500).json({ msg: "Error saving chef to database" });
              }
  
              return res.status(200).json({
                msg: "Chef registration submitted. Awaiting admin approval.",
                certificate: certificate,
              });
            }
          );
        });
      });
    });
  };
  
const getAllChefs = (req, res) => {
    db.query("SELECT * FROM chefs", (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ msg: "Database error" });
        }
        res.status(200).json(result);
    });
};

const updateChefStatus = (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!id || !status) {
        return res.status(400).json({ msg: "Missing required fields" });
    }

    db.query(
        "UPDATE chefs SET status = ? WHERE id = ?",
        [status, id],
        (err, result) => {
            if (err) {
                console.error("Error updating chef status:", err);
                return res.status(500).json({ msg: "Database error" });
            }

            // If chef is approved, send a confirmation email
            if (status === "approved") {
                db.query(
                    "SELECT name, email FROM chefs WHERE id = ?",
                    [id],
                    (err, chefResult) => {
                        if (err || chefResult.length === 0) {
                            console.error("Error fetching chef details:", err);
                            return res.status(500).json({ msg: "Database error while fetching chef details" });
                        }

                        const { name, email } = chefResult[0];

                        const mailSubject = "Account Approved - Welcome to Bhansako Swad!";
                        const content = `
                        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; text-align: center; border-radius: 8px; max-width: 600px; margin: auto;">
                            <h1 style="color: #4CAF50; margin-bottom: 20px;">Your Chef Account is Approved!</h1>
                            <p style="font-size: 16px; color: #333;">Hello <strong>${name}</strong>,</p>
                            <p style="font-size: 14px; color: #555;">Congratulations! Your chef account has been successfully approved.</p>
                            <p style="font-size: 14px; color: #555;">You can now log in and start using Bhansako Swad.</p>
                            <div style="margin-top: 30px;">
                                <a href="http://localhost:5173/login" style="display: inline-block; padding: 10px 20px; color: white; background-color: #4CAF50; text-decoration: none; border-radius: 5px; font-size: 16px;">
                                    Go to Login
                                </a>
                            </div>
                            <p style="font-size: 12px; color: #888; margin-top: 20px;">If you have any questions, feel free to contact our support team.</p>
                        </div>`;

                        sendMail(email, mailSubject, content);
                    }
                );
            }

            res.status(200).json({ msg: `Chef status updated to ${status}` });
        }
    );
};

// Verify Chef Documents
const verifyChefDocuments = (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ msg: "Missing chef ID" });
    }

    db.query(
        "UPDATE chefs SET documents = 'Verified' WHERE id = ?",
        [id],
        (err, result) => {
            if (err) {
                console.error("Error verifying documents:", err);
                return res.status(500).json({ msg: "Database error" });
            }
            res.status(200).json({ msg: "Chef documents verified" });
        }
    );
};

const loginChef = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ msg: "Email and password are required" });
    }

    db.query(
        "SELECT * FROM chefs WHERE email = ?",
        [email],
        (err, result) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ msg: "Database error" });
            }

            if (result.length === 0) {
                return res.status(404).json({ msg: "Chef account not found. Please register first." });
            }

            const chef = result[0];

            // Check if chef is approved
            if (chef.status !== "approved") {
                return res.status(403).json({ msg: "Your account is under verification. Please wait for admin approval." });
            }

            
            // Compare password
            bcrypt.compare(password, chef.password, (err, isMatch) => {
                if (err) {
                    console.error("Error comparing passwords:", err);
                    return res.status(500).json({ msg: "Server error" });
                }

                if (!isMatch) {
                    return res.status(401).json({ msg: "Invalid password. Please try again." });
                }

                // Generate JWT Token
                const token = jwt.sign(
                    { id: chef.id, email: chef.email, role: "chef" },
                    process.env.JWT_SECRET,
                    { expiresIn: "1d" }
                );

                res.status(200).json({
                    msg: "Login successful",
                    token,
                    chef: { id: chef.id, name: chef.name, email: chef.email }
                });
            });
        }
    );
};
module.exports = { 
    registerChef,
    getAllChefs,
    updateChefStatus,
    verifyChefDocuments,
    loginChef
 };
