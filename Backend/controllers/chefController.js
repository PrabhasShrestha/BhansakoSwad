const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db = require('../config/dbConnection');
const multer = require("multer");
const path = require("path");
const sendMail = require('../helpers/sendMail');

// Configure multer for certificate uploads
const certificateStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./uploads/chefs"); // Save files in "uploads/chefs" directory
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
});

const uploadCertificate = multer({ storage: certificateStorage }).single("certificate");

// Configure multer for profile photo uploads
const photoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./uploads/chefs"); // Save photos in "uploads/chefs" directory
    },
    filename: function (req, file, cb) {
        cb(null, `photo-${Date.now()}${path.extname(file.originalname)}`); // Unique filename
    }
});

const uploadPhotoMulter = multer({ storage: photoStorage }).single("photo");

const registerChef = (req, res) => {
    uploadCertificate(req, res, async (err) => {
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
          
          const insertUserQuery = `INSERT INTO users (first_name, last_name, address, email, phone_number, password, isVerified, activity_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  
          db.query(
            insertUserQuery,
            [first_name, last_name, nationality, email, phone_number, hashedPassword, 0, "active"],
            (err) => {
              if (err) {
                console.error("Error inserting user:", err);
                return res.status(500).json({ msg: "Error inserting into users table" });
              }
            }
          );
        }
  
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

const getChefById = (req, res) => {
  const { id } = req.params;
  db.query(
    'SELECT id, name, email, phone_number, nationality, about_you, image, photo FROM chefs WHERE id = ? AND status = ?',
    [id, 'approved'],
    (err, rows) => {
      if (err) {
        console.error('Error fetching chef:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Chef not found' });
      }
      res.json({ success: true, data: rows[0] });
    }
  );
};

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

            if (chef.status !== "approved") {
                return res.status(403).json({ msg: "Your account is under verification. Please wait for admin approval." });
            }

            bcrypt.compare(password, chef.password, (err, isMatch) => {
                if (err) {
                    console.error("Error comparing passwords:", err);
                    return res.status(500).json({ msg: "Server error" });
                }

                if (!isMatch) {
                    return res.status(401).json({ msg: "Invalid password. Please try again." });
                }

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

const getChefRecipe = (req, res) => {
  const { id } = req.params;
  db.query(
    `SELECT r.id, r.title, r.image_url, r.cooking_time, r.difficulty, r.cuisine,
            COALESCE(AVG(rt.rating), 0) AS rating
     FROM recipes r
     JOIN users u ON r.user_id = u.id
     JOIN chefs c ON c.email = u.email
     LEFT JOIN ratings rt ON r.id = rt.recipe_id
     WHERE c.id = ? AND r.approval_status = ?
     GROUP BY r.id, r.title, r.image_url, r.cooking_time, r.difficulty, r.cuisine`,
    [id, 'approved'],
    (err, rows) => {
      if (err) {
        console.error('Error fetching recipes:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
      res.json({ success: true, data: rows });
    }
  );
};

const getCurrentChef = (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'Access denied' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return res.status(403).json({ msg: 'Invalid token' });

      db.query(
          "SELECT * FROM chefs WHERE email = ?",
          [decoded.email],
          (err, result) => {
              if (err) {
                  console.error("Database error:", err);
                  return res.status(500).json({ msg: "Database error" });
              }
              if (result.length === 0) {
                  return res.status(404).json({ msg: "Chef not found" });
              }
              res.json(result[0]);
          }
      );
  });
};

// Get recipes for the current chef
const getChefRecipes = (req, res) => {
    const token = req.headers.authorization?.split(' ')[1]; 
    if (!token) return res.status(401).json({ msg: 'Access denied' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ msg: 'Invalid token' });

        db.query(
            "SELECT id FROM users WHERE email = ?",
            [decoded.email],
            (err, userResult) => {
                if (err || userResult.length === 0) {
                    console.error("Error fetching user:", err);
                    return res.status(404).json({ msg: "User not found" });
                }
                const userId = userResult[0].id;

                db.query(
                    "SELECT * FROM recipes WHERE user_id = ? AND approval_status = ?",
                    [userId, 'approved'],
                    (err, recipes) => {
                        if (err) {
                            console.error("Error fetching recipes:", err);
                            return res.status(500).json({ msg: "Database error" });
                        }
                        res.json(recipes);
                    }
                );
            }
        );
    });
};

// Get ratings for the current chef's recipes
const getChefRatings = (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ msg: 'Access denied' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ msg: 'Invalid token' });

        db.query(
            "SELECT id FROM users WHERE email = ?",
            [decoded.email],
            (err, userResult) => {
                if (err || userResult.length === 0) {
                    console.error("Error fetching user:", err);
                    return res.status(404).json({ msg: "User not found" });
                }
                const userId = userResult[0].id;

                db.query(
                    "SELECT id FROM recipes WHERE user_id = ? AND approval_status = ?",
                    [userId, 'approved'],
                    (err, recipes) => {
                        if (err) {
                            console.error("Error fetching recipes:", err);
                            return res.status(500).json({ msg: "Database error" });
                        }
                        const recipeIds = recipes.map(recipe => recipe.id);

                        if (recipeIds.length === 0) return res.json([]);

                        db.query(
                            "SELECT * FROM ratings WHERE recipe_id IN (?)",
                            [recipeIds],
                            (err, ratings) => {
                                if (err) {
                                    console.error("Error fetching ratings:", err);
                                    return res.status(500).json({ msg: "Database error" });
                                }
                                res.json(ratings);
                            }
                        );
                    }
                );
            }
        );
    });
};

const getActivities = (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ msg: 'Access denied' });
  
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return res.status(403).json({ msg: 'Invalid token' });
  
      // Step 1: Fetch the chef's ID
      db.query(
        "SELECT id FROM chefs WHERE email = ? AND status = 'approved'",
        [decoded.email],
        (err, chefResult) => {
          if (err || chefResult.length === 0) {
            console.error("Error fetching chef:", err);
            return res.status(404).json({ msg: "Chef not found" });
          }
          const chefId = chefResult[0].id;
  
          // Step 2: Fetch recent activities (recipe added and ratings received)
          db.query(
            `
            SELECT 'recipe_added' AS type, r.title AS recipe_title, r.created_at, NULL AS rating
            FROM recipes r
            WHERE r.user_id = ? AND r.approval_status = 'approved'
            UNION
            SELECT 'rating_received' AS type, r.title AS recipe_title, rt.created_at, rt.rating
            FROM ratings rt
            JOIN recipes r ON rt.recipe_id = r.id
            WHERE r.user_id = ? AND r.approval_status = 'approved'
            ORDER BY created_at DESC
            LIMIT 5
          `,
            [chefId, chefId],
            (err, activities) => {
              if (err) {
                console.error("Error fetching activities:", err);
                return res.status(500).json({ msg: "Error fetching activities" });
              }
              res.json(activities);
            }
          );
        }
      );
    });
  };
// Upload chef profile photo
const uploadPhoto = (req, res) => {
  uploadPhotoMulter(req, res, (err) => {
    if (err) {
      console.error("Error uploading photo:", err);
      return res.status(500).json({ msg: "Error uploading photo" });
    }

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ msg: 'Access denied' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return res.status(403).json({ msg: 'Invalid token' });

      // Get chef ID from email
      db.query(
        "SELECT id FROM chefs WHERE email = ? AND status = 'approved'",
        [decoded.email],
        (err, chefResult) => {
          if (err || chefResult.length === 0) {
            console.error("Error fetching chef:", err);
            return res.status(404).json({ msg: "Chef not found" });
          }
          const chefId = chefResult[0].id;

          if (!req.file) {
            return res.status(400).json({ msg: "No photo uploaded" });
          }

          const photoUrl = `/uploads/chefs/${req.file.filename}`;

          // Update chef's photo in the database
          db.query(
            "UPDATE chefs SET photo = ? WHERE id = ?",
            [photoUrl, chefId],
            (err) => {
              if (err) {
                console.error("Error updating photo:", err);
                return res.status(500).json({ msg: "Error updating photo" });
              }
              res.json({ photoUrl });
            }
          );
        }
      );
    });
  });
};

const updateProfile = (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ msg: 'Access denied' });
  
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return res.status(403).json({ msg: 'Invalid token' });
  
      // Step 1: Fetch the chef's ID
      db.query(
        "SELECT id FROM chefs WHERE email = ? AND status = 'approved'",
        [decoded.email],
        (err, chefResult) => {
          if (err || chefResult.length === 0) {
            console.error("Error fetching chef:", err);
            return res.status(404).json({ msg: "Chef not found" });
          }
          const chefId = chefResult[0].id;
  
          const { name, email, phone_number, nationality, about_you } = req.body;
  
          if (!name || !email) {
            return res.status(400).json({ msg: "Name and email are required" });
          }
  
          // Step 2: Check if the new email is already in use by another chef, user, or seller
          if (email !== decoded.email) {
            db.query(
              `SELECT 'chef' as type, id FROM chefs WHERE email = ? AND id != ?
               UNION
               SELECT 'user' as type, id FROM users WHERE email = ? AND email != ?
               UNION
               SELECT 'seller' as type, id FROM sellers WHERE email = ? AND email != ?`,
              [email, chefId, email, decoded.email, email, decoded.email],
              (err, emailCheck) => {
                if (err) {
                  console.error("Error checking email:", err);
                  return res.status(500).json({ msg: "Database error" });
                }
                if (emailCheck.length > 0) {
                  const conflictType = emailCheck[0].type;
                  return res.status(409).json({ 
                    msg: `This email is already in use by another ${conflictType}. Please use a different email.` 
                  });
                }
  
                // If no email conflict, proceed to update profile data
                updateProfileData();
              }
            );
          } else {
            // If email hasn't changed, proceed to update profile data
            updateProfileData();
          }
  
          function updateProfileData() {
            // Step 3: Update the chefs table
            db.query(
              "UPDATE chefs SET name = ?, email = ?, phone_number = ?, nationality = ?, about_you = ? WHERE id = ?",
              [name, email, phone_number || null, nationality || null, about_you || null, chefId],
              (err) => {
                if (err) {
                  console.error("Error updating chef profile:", err);
                  return res.status(500).json({ msg: "Error updating chef profile" });
                }
  
                // Step 4: Update the users table
                db.query(
                  "UPDATE users SET email = ? WHERE email = ?",
                  [email, decoded.email],
                  (err) => {
                    if (err) {
                      console.error("Error updating user email:", err);
                      return res.status(500).json({ msg: "Error updating user email" });
                    }
  
                    // Step 5: Update the sellers table
                    db.query(
                      "UPDATE sellers SET email = ? WHERE email = ?",
                      [email, decoded.email],
                      (err) => {
                        if (err) {
                          console.error("Error updating seller email:", err);
                          return res.status(500).json({ msg: "Error updating seller email" });
                        }
  
                        // All updates successful
                        res.json({ message: "Profile updated successfully" });
                      }
                    );
                  }
                );
              }
            );
          }
        }
      );
    });
  };

module.exports = { 
    registerChef,
    getAllChefs,
    updateChefStatus,
    verifyChefDocuments,
    loginChef,
    getChefById,
    getChefRecipe,
    getCurrentChef,
    getChefRecipes,
    getChefRatings,
    getActivities,
    uploadPhoto,
    updateProfile
};