const express = require('express');
const router = express.Router();
const db = require('../config/dbConnection');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../images');
    if (process.env.NODE_ENV !== 'production') {
      console.log('Storing file in:', uploadPath); 
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const name = `${Date.now()}-${file.originalname}`;
    cb(null, name);
  }
});


const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true); 
  } else {
    cb(new Error('Only JPG and PNG images are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } 
}).single('image');

router.get("/Orders",(req, res) => {
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
         pd.seller_id AS vendor_id,
         s.shop_name AS seller_name,
         pd.image AS product_image
  FROM orders o
  JOIN order_items oi ON o.order_id = oi.order_id
  JOIN productdetails pd ON oi.productdetails_id = pd.id
  JOIN products p ON pd.product_id = p.id
  JOIN users u ON o.user_id = u.id
  JOIN sellers s ON pd.seller_id = s.id;
`;

   db.query(query, (err, results) => {  
    if (err) {
      console.error("Database Error:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
    res.status(200).json({ success: true, orders: results });
  });
}
);

router.get("/allData", (req, res) => {
  const usersQuery = `
SELECT 
    COALESCE(u.id, c.id, s.id) AS id, 
    COALESCE(u.first_name, c.name, s.owner_name) AS first_name, 
    COALESCE(u.last_name, '') AS last_name,
    COALESCE(u.email, c.email, s.email) AS email,
    COALESCE(u.phone_number, c.phone_number, s.phone_number) AS phone_number,
    COALESCE(u.activity_status, '') AS activity_status, 

    GROUP_CONCAT(DISTINCT 
        CASE 
            WHEN u.is_admin = TRUE THEN 'Admin'
            WHEN c.email IS NOT NULL AND c.status = 'approved' THEN 'Chef'
            WHEN s.email IS NOT NULL THEN 'Seller'
            ELSE 'User'
        END
        ORDER BY FIELD(
            CASE 
                WHEN u.is_admin = TRUE THEN 'Admin'
                WHEN c.email IS NOT NULL AND c.status = 'approved' THEN 'Chef'
                WHEN s.email IS NOT NULL THEN 'Seller'
                ELSE 'User'
            END, 'Admin', 'Chef', 'Seller', 'User') 
        SEPARATOR ', '
    ) AS role,

    CASE 
        WHEN u.is_admin = TRUE THEN 'Admin'
        WHEN MAX(ps.user_id) IS NOT NULL AND MAX(ps.status) = 'active' THEN 'Premium User'
        WHEN MAX(c.email) IS NOT NULL AND MAX(c.status) = 'approved' THEN 'Chef'
        WHEN MAX(s.email) IS NOT NULL THEN 'Seller'
        ELSE 'Normal User'
    END AS status

FROM (
    SELECT id, first_name, last_name, email, phone_number, is_admin, activity_status FROM users
    UNION 
    SELECT id, name AS first_name, '' AS last_name, email, phone_number, FALSE AS is_admin, '' AS activity_status FROM chefs
    UNION 
    SELECT id, owner_name AS first_name, '' AS last_name, email, phone_number, FALSE AS is_admin, '' AS activity_status FROM sellers
) AS all_users
LEFT JOIN users u ON all_users.email = u.email
LEFT JOIN chefs c ON all_users.email = c.email
LEFT JOIN sellers s ON all_users.email = s.email
LEFT JOIN premium_subscriptions ps ON all_users.id = ps.user_id AND ps.status = 'active'
GROUP BY id, first_name, last_name, email, phone_number, activity_status, u.is_admin;
  `;

  db.query(usersQuery, (err, users) => {
    if (err) {
      console.error("Error fetching users:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    res.status(200).json({
      success: true,
      users,
    });
  });
});


router.post("/UserStatus/:id", (req, res) => {
  const userId = req.params.id;

  const checkUserQuery = `
      SELECT id, is_admin, email, activity_status
      FROM users
      WHERE id = ?`;

  db.query(checkUserQuery, [userId], (err, results) => {
    if (err) {
      console.error("Database Error (checkUserQuery):", err);
      return res.status(500).json({ success: false, message: "Database Error - checkUserQuery" });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "User not found in users table" });
    }

    const user = results[0];

    if (user.is_admin) {
      return res.status(403).json({ success: false, message: "Admins cannot be deactivated" });
    }

    const newStatus = user.activity_status === "active" ? "deactivated" : "active";

    // Step 2: Update `users` table only
    db.query(`UPDATE users SET activity_status = ? WHERE id = ?`, [newStatus, userId], (err) => {
      if (err) {
        console.error("Error updating user status:", err);
        return res.status(500).json({ success: false, message: "Error updating user status" });
      }

      return res.status(200).json({ success: true, message: `User ${newStatus} successfully` });
    });
  });
});


router.get('/recipes', (req, res) => {
  const query = `
    SELECT 
      r.*, 
      IFNULL(AVG(rt.rating), 0) AS average_rating,
      CASE 
        WHEN u.id IS NULL OR u.is_admin = 1 THEN 'Bhansako Swad Team'
        ELSE CONCAT(u.first_name, ' ', u.last_name)
      END AS submittedBy,
      CASE 
        WHEN u.id IS NULL THEN 'admin'
        WHEN u.is_admin = 1 THEN 'admin'
        WHEN EXISTS (SELECT 1 FROM chefs c WHERE c.email = u.email AND c.status = 'approved') THEN 'chef'
        ELSE 'user'
      END AS userType
    FROM recipes r
    LEFT JOIN ratings rt ON r.id = rt.recipe_id
    LEFT JOIN users u ON r.user_id = u.id
    GROUP BY r.id
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Database Error:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "No recipes found" });
    }

    res.status(200).json(results);
  });
});

router.post('/:id/approval', (req, res) => {
  const recipeId = req.params.id;
  const { approvalStatus } = req.body;

  // Validate input
  const validStatuses = ['approved', 'rejected', 'pending'];
  if (!validStatuses.includes(approvalStatus)) {
    return res.status(400).json({ message: 'Invalid approval status' });
  }

  const query = `UPDATE recipes SET approval_status = ? WHERE id = ?`;

  db.query(query, [approvalStatus, recipeId], (err, result) => {
    if (err) {
      console.error('Database Error:', err);
      return res.status(500).json({ message: 'Internal Server Error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    res.status(200).json({ message: `Recipe ${approvalStatus} successfully` });
  });
});

router.delete('/deleterecipes/:id', (req, res) => {
  const recipeId = req.params.id;
  console.log("Trying to delete recipe ID:", recipeId);

  const sql = 'DELETE FROM recipes WHERE id = ?';
  db.query(sql, [recipeId], (err, result) => {
    if (err) {
      console.error('SQL Error:', err);
      return res.status(500).json({ error: 'Failed to delete recipe' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    console.log("Recipe deleted successfully.");
    res.status(200).json({ message: 'Recipe deleted successfully' });
  });
});

router.get("/allProducts", (req, res) => {
  const query = `
    SELECT 
      p.id AS product_id,
      p.name AS product_name,
      p.category,
      pd.seller_id AS seller_id,
      s.owner_name AS seller_name,
      s.shop_name,
      pd.price,
      pd.in_stock,
      pd.image
    FROM products p
    JOIN productdetails pd ON p.id = pd.product_id
    JOIN sellers s ON pd.seller_id = s.id
    ORDER BY p.id;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Database Error:", err);
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
    res.status(200).json({
      success: true,
      data: results
    });
  });
});


router.delete("/products/:id", (req, res) => {
  const productId = req.params.id;

  // 1) Check if there's any order referencing this product that is NOT 'Delivered'
  const checkQuery = `
    SELECT COUNT(*) AS nonDeliveredCount
    FROM order_items oi
    JOIN productdetails pd ON oi.productdetails_id = pd.id
    JOIN orders o ON oi.order_id = o.order_id
    WHERE pd.product_id = ?
      AND o.status != 'Delivered'
  `;

  db.query(checkQuery, [productId], (err, results) => {
    if (err) {
      console.error("Error checking orders:", err);
      return res.status(500).json({ success: false, message: "Failed to check orders" });
    }

    const nonDeliveredCount = results[0].nonDeliveredCount;

    // If there's at least one non-Delivered order referencing this product, block deletion
    if (nonDeliveredCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete product. It is still in an active or non-delivered order.",
      });
    }

    // 2) If no non-Delivered references, proceed to delete from 'products'
    const deleteProductQuery = "DELETE FROM products WHERE id = ?";
    db.query(deleteProductQuery, [productId], (err, result) => {
      if (err) {
        console.error("Error deleting product:", err);
        return res.status(500).json({ success: false, message: "Failed to delete product" });
      }

      if (result.affectedRows === 0) {
        // Means no row was deleted because product with this ID doesn't exist
        return res.status(404).json({ success: false, message: "Product not found" });
      }

      return res.status(200).json({
        success: true,
        message: "Product deleted successfully",
      });
    });
  });
});

router.get('/dashboard/stats', (req, res) => {
  const statsQuery = `
    SELECT 
      (SELECT COUNT(*) FROM orders) AS totalOrders,
      (SELECT COUNT(*) FROM users) AS totalUsers,
      (SELECT COUNT(*) FROM products) AS totalProducts,
      (SELECT COUNT(*) FROM recipes) AS totalRecipes,
      (SELECT COUNT(*) FROM orders WHERE status = 'processing') AS pendingOrders,
      (SELECT COUNT(*) FROM testimonials WHERE status = 'pending') AS pendingTestimonials,
      (SELECT COUNT(*) FROM chefs WHERE status = 'pending') AS pendingChefs
  `;
  
  db.query(statsQuery, (err, results) => {
    if (err) {
      console.error("Error fetching dashboard stats:", err);
      return res.status(500).json({ success: false, message: "Error fetching dashboard stats" });
    }
    // results[0] will contain our aggregated stats
    return res.json({ success: true, stats: results[0] });
  });
});


router.get('/dashboard/recentOrders', (req, res) => {
  const recentOrdersQuery = `
    SELECT 
      o.order_id AS id,
      CONCAT(u.first_name, ' ', u.last_name) AS customer,
      DATE_FORMAT(o.order_date, '%Y-%m-%d') AS date,
      o.status,
      o.total_amount AS total
    FROM orders o
    JOIN users u ON o.user_id = u.id
    ORDER BY o.order_date DESC
    LIMIT 5;
  `;
  
  db.query(recentOrdersQuery, (err, results) => {
    if (err) {
      console.error("Error fetching recent orders:", err);
      return res.status(500).json({ success: false, message: "Error fetching recent orders" });
    }
    return res.json({ success: true, orders: results });
  });
});


router.get('/dashboard/recentUsers', (req, res) => {
  const recentUsersQuery = `
    SELECT 
        id,
        name,
        email,
        DATE_FORMAT(all_created_at, '%Y-%m-%d') AS joined,
        GROUP_CONCAT(DISTINCT 
            CASE 
                WHEN is_admin = TRUE THEN 'Admin'
                WHEN chef_email IS NOT NULL AND chef_status = 'approved' THEN 'Chef'
                WHEN seller_email IS NOT NULL THEN 'Seller'
                ELSE 'User'
            END
            ORDER BY FIELD(
                CASE 
                    WHEN is_admin = TRUE THEN 'Admin'
                    WHEN chef_email IS NOT NULL AND chef_status = 'approved' THEN 'Chef'
                    WHEN seller_email IS NOT NULL THEN 'Seller'
                    ELSE 'User'
                END, 'Admin', 'Chef', 'Seller', 'User'
            ) SEPARATOR ', '
        ) AS role
    FROM (
        SELECT 
            COALESCE(u.id, c.id, s.id) AS id,
            CONCAT(
                COALESCE(u.first_name, c.name, s.owner_name), 
                ' ', 
                COALESCE(u.last_name, '')
            ) AS name,
            COALESCE(u.email, c.email, s.email) AS email,
            COALESCE(u.created_at, c.created_at, s.created_at) AS all_created_at,
            COALESCE(u.is_admin, FALSE) AS is_admin,
            c.email AS chef_email,
            c.status AS chef_status,
            s.email AS seller_email
        FROM (
            SELECT id, first_name, last_name, email, created_at, is_admin 
            FROM users
            UNION ALL
            SELECT id, name AS first_name, '' AS last_name, email, created_at, FALSE AS is_admin 
            FROM chefs
            UNION ALL
            SELECT id, owner_name AS first_name, '' AS last_name, email, created_at, FALSE AS is_admin 
            FROM sellers
        ) AS all_users
        LEFT JOIN users u ON all_users.email = u.email
        LEFT JOIN chefs c ON all_users.email = c.email
        LEFT JOIN sellers s ON all_users.email = s.email
    ) AS combined
    GROUP BY 
        id, 
        name, 
        email, 
        all_created_at
    ORDER BY 
        all_created_at DESC
    LIMIT 5;
  `;

  db.query(recentUsersQuery, (err, results) => {
    if (err) {
      console.error("Error fetching recent users:", err);
      return res.status(500).json({ success: false, message: "Error fetching recent users" });
    }
    res.json({ success: true, users: results });
  });
});



router.post('/updaterecipe/:id', (req, res) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      return res.status(400).json({ message: 'File upload error', error: err.message });
    } else if (err) {
      console.error('File upload error:', err);
      return res.status(400).json({ message: 'File upload error', error: err.message });
    }

    const recipeId = req.params.id;

    const {
      title,
      title_ne,
      difficulty,
      cooking_time,
      category,
      cuisine,
      ingredients,
      methods,
      nutrition
    } = req.body;

    let image_url = undefined;
    if (req.file) {
      const getCurrentImageQuery = `SELECT image_url FROM recipes WHERE id = ?`;
      db.query(getCurrentImageQuery, [recipeId], (err, result) => {
        if (err) {
          console.error('Error fetching current image_url:', err);
          return res.status(500).json({ message: 'Error fetching current image_url', error: err.message });
        }

        if (result.length > 0 && result[0].image_url) {
          const oldRelativePath = result[0].image_url.startsWith(BASE_URL)
            ? result[0].image_url.replace(BASE_URL, '')
            : result[0].image_url;
          const oldImagePath = path.join(__dirname, '..', oldRelativePath);
          fs.unlink(oldImagePath, (err) => {
            if (err) {
              console.error('Error deleting old image:', err);
            }
          });
        }

        image_url = `${BASE_URL}/images/${req.file.filename}`;
        console.log('Image uploaded successfully:', image_url);
        proceedWithUpdate();
      });
    } else {
      proceedWithUpdate();
    }

    function proceedWithUpdate() {
      const fieldsToUpdate = {};
      if (title !== undefined) fieldsToUpdate.title = title;
      if (title_ne !== undefined) fieldsToUpdate.title_ne = title_ne;
      if (difficulty !== undefined) fieldsToUpdate.difficulty = difficulty;
      if (cooking_time !== undefined) fieldsToUpdate.cooking_time = cooking_time;
      if (category !== undefined) fieldsToUpdate.category = category;
      if (cuisine !== undefined) fieldsToUpdate.cuisine = cuisine;
      if (image_url !== undefined) fieldsToUpdate.image_url = image_url;

      const hasMainFieldsUpdate = Object.keys(fieldsToUpdate).length > 0;
      const hasRelatedFieldsUpdate = ingredients !== undefined || methods !== undefined || nutrition !== undefined;

      if (!hasMainFieldsUpdate && !hasRelatedFieldsUpdate) {
        return res.status(200).json({
          success: true,
          message: 'No changes provided; recipe remains unchanged',
          recipeId
        });
      }

      const updateRecipesTable = (callback) => {
        if (!hasMainFieldsUpdate) {
          console.log('No main fields to update, skipping recipes table update');
          return callback();
        }

        const setClauses = [];
        const queryParams = [];
        for (const [key, value] of Object.entries(fieldsToUpdate)) {
          setClauses.push(`${key} = ?`);
          queryParams.push(value);
        }

        const recipeQuery = `
          UPDATE recipes 
          SET ${setClauses.join(', ')}
          WHERE id = ?
        `;
        queryParams.push(recipeId);

        db.query(recipeQuery, queryParams, (err, result) => {
          if (err) {
            console.error('Error updating recipe:', err);
            return res.status(500).json({ message: 'Error updating recipe', error: err.message });
          }
          if (result.affectedRows === 0) {
            console.log('Recipe not found with ID:', recipeId);
            return res.status(404).json({ message: 'Recipe not found' });
          }
          console.log('Recipes table updated successfully:', result);
          callback();
        });
      };

      const updateRelatedTables = () => {
        const updateIngredients = (callback) => {
          if (ingredients === undefined) {
            console.log('No ingredients provided, skipping ingredients update');
            return callback();
          }

          let parsedIngredients;
          try {
            parsedIngredients = typeof ingredients === 'string' ? JSON.parse(ingredients) : ingredients;
            if (!Array.isArray(parsedIngredients)) {
              throw new Error('Ingredients must be an array');
            }
          } catch (err) {
            console.error('Error parsing ingredients:', err);
            return res.status(400).json({ message: 'Invalid ingredients format', error: err.message });
          }

          const fetchIngredientsQuery = `
            SELECT ri.id, ri.ingredient_id, i.name, i.name_ne, ri.amount, ri.amount_ne
            FROM recipe_ingredients ri
            JOIN ingredients i ON ri.ingredient_id = i.id
            WHERE ri.recipe_id = ?
          `;
          db.query(fetchIngredientsQuery, [recipeId], (err, existingIngredients) => {
            if (err) {
              console.error('Error fetching existing ingredients:', err);
              return res.status(500).json({ message: 'Error fetching existing ingredients', error: err });
            }

            const existingIngredientMap = new Map(
              existingIngredients.map(ing => [ing.id, ing])
            );

            let ingredientCount = 0;
            const totalIngredients = parsedIngredients.length;

            if (totalIngredients === 0) {
              const deleteAllQuery = `DELETE FROM recipe_ingredients WHERE recipe_id = ?`;
              db.query(deleteAllQuery, [recipeId], (err) => {
                if (err) {
                  console.error('Error deleting all ingredients:', err);
                  return res.status(500).json({ message: 'Error deleting ingredients', error: err });
                }
                console.log('All ingredients deleted');
                callback();
              });
              return;
            }

            parsedIngredients.forEach((ingredient, index) => {
              if (!ingredient.name || !ingredient.amount) {
                console.error('Invalid ingredient data at index', index, ':', ingredient);
                return res.status(400).json({ message: 'Invalid ingredient data: name and amount are required' });
              }

              const checkIngredientQuery = 'SELECT id, name_ne FROM ingredients WHERE name = ?';
              db.query(checkIngredientQuery, [ingredient.name], (err, result) => {
                if (err) {
                  console.error('Error checking ingredient:', err);
                  return res.status(500).json({ message: 'Error checking ingredient', error: err });
                }

                let ingredientId;
                if (result.length > 0) {
                  ingredientId = result[0].id;
                  // Update ingredients table with name_ne if provided (including empty string)
                  if (ingredient.name_ne !== undefined && result[0].name_ne !== ingredient.name_ne) {
                    const updateIngredientQuery = 'UPDATE ingredients SET name_ne = ? WHERE id = ?';
                    db.query(updateIngredientQuery, [ingredient.name_ne === '' ? null : ingredient.name_ne, ingredientId], (err) => {
                      if (err) {
                        console.error('Error updating ingredient name_ne:', err);
                      }
                    });
                  }
                  processIngredient(ingredientId);
                } else {
                  const insertIngredientQuery = 'INSERT INTO ingredients (name, name_ne) VALUES (?, ?)';
                  db.query(insertIngredientQuery, [ingredient.name, ingredient.name_ne === '' ? null : ingredient.name_ne], (err, insertResult) => {
                    if (err) {
                      console.error('Error inserting ingredient:', err);
                      return res.status(500).json({ message: 'Error inserting ingredient', error: err });
                    }
                    ingredientId = insertResult.insertId;
                    processIngredient(ingredientId);
                  });
                }

                function processIngredient(ingredientId) {
                  if (ingredient.id && existingIngredientMap.has(parseInt(ingredient.id))) {
                    const existing = existingIngredientMap.get(parseInt(ingredient.id));
                    const updateQuery = `
                      UPDATE recipe_ingredients
                      SET ingredient_id = ?, amount = ?, amount_ne = ?
                      WHERE id = ? AND recipe_id = ?
                    `;
                    const newAmountNe = ingredient.amount_ne !== undefined ? ingredient.amount_ne : existing.amount_ne;
                    db.query(
                      updateQuery,
                      [ingredientId, ingredient.amount, newAmountNe, ingredient.id, recipeId],
                      (err) => {
                        if (err) {
                          console.error('Error updating ingredient:', err);
                          return res.status(500).json({ message: 'Error updating ingredient', error: err });
                        }
                        existingIngredientMap.delete(parseInt(ingredient.id));
                        completeIngredient();
                      }
                    );
                  } else {
                    const insertQuery = `
                      INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, amount_ne)
                      VALUES (?, ?, ?, ?)
                    `;
                    db.query(
                      insertQuery,
                      [recipeId, ingredientId, ingredient.amount, ingredient.amount_ne || null],
                      (err) => {
                        if (err) {
                          console.error('Error inserting ingredient:', err);
                          return res.status(500).json({ message: 'Error inserting ingredient', error: err });
                        }
                        completeIngredient();
                      }
                    );
                  }

                  function completeIngredient() {
                    ingredientCount++;
                    if (ingredientCount === totalIngredients) {
                      if (existingIngredientMap.size > 0) {
                        const deleteIds = Array.from(existingIngredientMap.keys());
                        const deleteQuery = `DELETE FROM recipe_ingredients WHERE id IN (?)`;
                        db.query(deleteQuery, [deleteIds], (err) => {
                          if (err) {
                            console.error('Error deleting unused ingredients:', err);
                            return res.status(500).json({ message: 'Error deleting unused ingredients', error: err });
                          }
                          console.log('Unused ingredients deleted:', deleteIds);
                          callback();
                        });
                      } else {
                        console.log('Ingredients updated successfully');
                        callback();
                      }
                    }
                  }
                }
              });
            });
          });
        };

        const updateMethods = (callback) => {
          if (methods === undefined) {
            console.log('No methods provided, skipping methods update');
            return callback();
          }

          let parsedMethods;
          try {
            parsedMethods = typeof methods === 'string' ? JSON.parse(methods) : methods;
            if (!Array.isArray(parsedMethods)) {
              throw new Error('Methods must be an array');
            }
          } catch (err) {
            console.error('Error parsing methods:', err);
            return res.status(400).json({ message: 'Invalid methods format', error: err.message });
          }

          const fetchMethodsQuery = `
            SELECT id, step_number, description, description_ne
            FROM methods
            WHERE recipe_id = ?
          `;
          db.query(fetchMethodsQuery, [recipeId], (err, existingMethods) => {
            if (err) {
              console.error('Error fetching existing methods:', err);
              return res.status(500).json({ message: 'Error fetching existing methods', error: err });
            }

            const existingMethodMap = new Map(
              existingMethods.map(method => [method.id, method])
            );

            let methodCount = 0;
            const totalMethods = parsedMethods.length;

            if (totalMethods === 0) {
              const deleteAllQuery = `DELETE FROM methods WHERE recipe_id = ?`;
              db.query(deleteAllQuery, [recipeId], (err) => {
                if (err) {
                  console.error('Error deleting all methods:', err);
                  return res.status(500).json({ message: 'Error deleting methods', error: err });
                }
                console.log('All methods deleted');
                callback();
              });
              return;
            }

            parsedMethods.forEach((method, index) => {
              if (!method.description || !method.step_number) {
                console.error('Invalid method data at index', index, ':', method);
                return res.status(400).json({ message: 'Invalid method data: description and step_number are required' });
              }

              if (method.id && existingMethodMap.has(parseInt(method.id))) {
                const existing = existingMethodMap.get(parseInt(method.id));
                const updateQuery = `
                  UPDATE methods
                  SET step_number = ?, description = ?, description_ne = ?
                  WHERE id = ? AND recipe_id = ?
                `;
                const newDescriptionNe = method.description_ne !== undefined ? method.description_ne : existing.description_ne;
                db.query(
                  updateQuery,
                  [method.step_number, method.description, newDescriptionNe, method.id, recipeId],
                  (err) => {
                    if (err) {
                      console.error('Error updating method:', err);
                      return res.status(500).json({ message: 'Error updating method', error: err });
                    }
                    existingMethodMap.delete(parseInt(method.id));
                    completeMethod();
                  }
                );
              } else {
                const insertQuery = `
                  INSERT INTO methods (recipe_id, step_number, description, description_ne)
                  VALUES (?, ?, ?, ?)
                `;
                db.query(
                  insertQuery,
                  [recipeId, method.step_number, method.description, method.description_ne || null],
                  (err) => {
                    if (err) {
                      console.error('Error inserting method:', err);
                      return res.status(500).json({ message: 'Error inserting method', error: err });
                    }
                    completeMethod();
                  }
                );
              }

              function completeMethod() {
                methodCount++;
                if (methodCount === totalMethods) {
                  if (existingMethodMap.size > 0) {
                    const deleteIds = Array.from(existingMethodMap.keys());
                    const deleteQuery = `DELETE FROM methods WHERE id IN (?)`;
                    db.query(deleteQuery, [deleteIds], (err) => {
                      if (err) {
                        console.error('Error deleting unused methods:', err);
                        return res.status(500).json({ message: 'Error deleting unused methods', error: err });
                      }
                      console.log('Unused methods deleted:', deleteIds);
                      callback();
                    });
                  } else {
                    console.log('Methods updated successfully');
                    callback();
                  }
                }
              }
            });
          });
        };

        const updateNutrition = (callback) => {
          if (nutrition === undefined) {
            console.log('No nutrition provided, skipping nutrition update');
            return callback();
          }

          let parsedNutrition;
          try {
            parsedNutrition = typeof nutrition === 'string' ? JSON.parse(nutrition) : nutrition;
            if (!Array.isArray(parsedNutrition)) {
              throw new Error('Nutrition must be an array');
            }
          } catch (err) {
            console.error('Error parsing nutrition:', err);
            return res.status(400).json({ message: 'Invalid nutrition format', error: err.message });
          }

          const fetchNutritionQuery = `
            SELECT id, nutrient, value, nutrient_ne, value_ne
            FROM nutrition
            WHERE recipe_id = ?
          `;
          db.query(fetchNutritionQuery, [recipeId], (err, existingNutrition) => {
            if (err) {
              console.error('Error fetching existing nutrition:', err);
              return res.status(500).json({ message: 'Error fetching existing nutrition', error: err });
            }

            const existingNutritionMap = new Map(
              existingNutrition.map(nutr => [nutr.id, nutr])
            );

            let nutritionCount = 0;
            const totalNutrition = parsedNutrition.length;

            if (totalNutrition === 0) {
              const deleteAllQuery = `DELETE FROM nutrition WHERE recipe_id = ?`;
              db.query(deleteAllQuery, [recipeId], (err) => {
                if (err) {
                  console.error('Error deleting all nutrition:', err);
                  return res.status(500).json({ message: 'Error deleting nutrition', error: err });
                }
                console.log('All nutrition deleted');
                callback();
              });
              return;
            }

            parsedNutrition.forEach((item, index) => {
              if (!item.nutrient || !item.value) {
                console.error('Invalid nutrition data at index', index, ':', item);
                return res.status(400).json({ message: 'Invalid nutrition data: nutrient and value are required' });
              }

              if (item.id && existingNutritionMap.has(parseInt(item.id))) {
                const existing = existingNutritionMap.get(parseInt(item.id));
                const updateQuery = `
                  UPDATE nutrition
                  SET nutrient = ?, value = ?, nutrient_ne = ?, value_ne = ?
                  WHERE id = ? AND recipe_id = ?
                `;
                const newNutrientNe = item.nutrient_ne !== undefined ? item.nutrient_ne : existing.nutrient_ne;
                const newValueNe = item.value_ne !== undefined ? item.value_ne : existing.value_ne;
                db.query(
                  updateQuery,
                  [item.nutrient, item.value, newNutrientNe, newValueNe, item.id, recipeId],
                  (err) => {
                    if (err) {
                      console.error('Error updating nutrition:', err);
                      return res.status(500).json({ message: 'Error updating nutrition', error: err });
                    }
                    existingNutritionMap.delete(parseInt(item.id));
                    completeNutrition();
                  }
                );
              } else {
                const insertQuery = `
                  INSERT INTO nutrition (recipe_id, nutrient, value, nutrient_ne, value_ne)
                  VALUES (?, ?, ?, ?, ?)
                `;
                db.query(
                  insertQuery,
                  [recipeId, item.nutrient, item.value, item.nutrient_ne || null, item.value_ne || null],
                  (err) => {
                    if (err) {
                      console.error('Error inserting nutrition:', err);
                      return res.status(500).json({ message: 'Error inserting nutrition', error: err });
                    }
                    completeNutrition();
                  }
                );
              }

              function completeNutrition() {
                nutritionCount++;
                if (nutritionCount === totalNutrition) {
                  if (existingNutritionMap.size > 0) {
                    const deleteIds = Array.from(existingNutritionMap.keys());
                    const deleteQuery = `DELETE FROM nutrition WHERE id IN (?)`;
                    db.query(deleteQuery, [deleteIds], (err) => {
                      if (err) {
                        console.error('Error deleting unused nutrition:', err);
                        return res.status(500).json({ message: 'Error deleting unused nutrition', error: err });
                      }
                      console.log('Unused nutrition deleted:', deleteIds);
                      callback();
                    });
                  } else {
                    console.log('Nutrition updated successfully');
                    callback();
                  }
                }
              }
            });
          });
        };

        updateIngredients(() => {
          updateMethods(() => {
            updateNutrition(() => {
              res.status(200).json({
                success: true,
                message: 'Recipe updated successfully',
                recipeId
              });
            });
          });
        });
      };

      updateRecipesTable(() => {
        updateRelatedTables();
      });
    }
  });
});




module.exports = router;
