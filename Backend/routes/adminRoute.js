const express = require("express");
const db = require('../config/dbConnection');
const router = express.Router();


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
        WHEN ps.user_id IS NOT NULL AND ps.status = 'active' THEN 'Premium User'
        WHEN c.email IS NOT NULL AND c.status = 'approved' THEN 'Chef'
        WHEN s.email IS NOT NULL THEN 'Seller'
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
GROUP BY id, first_name, last_name, email, phone_number, activity_status;

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

  // Step 1: Get User Details from `users` table
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
    COALESCE(u.id, c.id, s.id) AS id,
    CONCAT(
      COALESCE(u.first_name, c.name, s.owner_name), 
      ' ', 
      COALESCE(u.last_name, '')
    ) AS name,
    COALESCE(u.email, c.email, s.email) AS email,
    DATE_FORMAT(all_users.all_created_at, '%Y-%m-%d') AS joined,
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
          END, 'Admin', 'Chef', 'Seller', 'User'
        ) SEPARATOR ', '
    ) AS role
      FROM (
          SELECT 
            id, 
            first_name, 
            last_name, 
            email, 
            created_at AS all_created_at, 
            is_admin 
          FROM users

          UNION ALL

          SELECT 
            id, 
            name AS first_name, 
            '' AS last_name, 
            email, 
            created_at AS all_created_at, 
            FALSE AS is_admin 
          FROM chefs

          UNION ALL

          SELECT 
            id, 
            owner_name AS first_name, 
            '' AS last_name, 
            email, 
            created_at AS all_created_at, 
            FALSE AS is_admin 
          FROM sellers
      ) AS all_users
      LEFT JOIN users u ON all_users.email = u.email
      LEFT JOIN chefs c ON all_users.email = c.email
      LEFT JOIN sellers s ON all_users.email = s.email
      GROUP BY 
          id, 
          name, 
          email, 
          all_users.all_created_at
      ORDER BY 
          all_users.all_created_at DESC
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
module.exports = router;