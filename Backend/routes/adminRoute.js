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
         s.shop_name AS seller_name
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

    -- ✅ Correctly merge multiple roles
    GROUP_CONCAT(DISTINCT 
        CASE 
            WHEN u.is_admin = TRUE THEN 'Admin'
            WHEN c.email IS NOT NULL THEN 'Chef'
            WHEN s.email IS NOT NULL THEN 'Seller'
            ELSE 'User'
        END
        ORDER BY FIELD(
            CASE 
                WHEN u.is_admin = TRUE THEN 'Admin'
                WHEN c.email IS NOT NULL THEN 'Chef'
                WHEN s.email IS NOT NULL THEN 'Seller'
                ELSE 'User'
            END, 'Admin', 'Chef', 'Seller', 'User') 
        SEPARATOR ', '
    ) AS role,

    -- ✅ Prioritize Status Correctly
  CASE 
        WHEN u.is_admin = TRUE THEN 'Admin'
        WHEN ps.user_id IS NOT NULL AND ps.status = 'active' THEN 'Premium User'
        WHEN c.email IS NOT NULL THEN 'Chef'
        WHEN s.email IS NOT NULL THEN 'Seller'
        ELSE 'Normal User'
    END AS status

FROM (
    -- Get users from user table
    SELECT id, first_name, last_name, email, phone_number, is_admin FROM users
    UNION 
    -- Get chefs if they don't exist in users
    SELECT id, name AS first_name, '' AS last_name, email, phone_number, FALSE AS is_admin FROM chefs
    UNION 
    -- Get sellers if they don't exist in users
    SELECT id, owner_name AS first_name, '' AS last_name, email, phone_number, FALSE AS is_admin FROM sellers
) AS all_users
LEFT JOIN users u ON all_users.email = u.email
LEFT JOIN chefs c ON all_users.email = c.email
LEFT JOIN sellers s ON all_users.email = s.email
LEFT JOIN premium_subscriptions ps ON all_users.id = ps.user_id AND ps.status = 'active'
GROUP BY id, first_name, last_name, email, phone_number;

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

  // Step 1: Get User Details (Check `users`, `chefs`, and `sellers` tables)
  const checkUserQuery = `
      SELECT u.id, u.is_admin, u.email, u.activity_status, 
             (SELECT COUNT(*) FROM chefs WHERE email = u.email) AS is_chef, 
             (SELECT COUNT(*) FROM sellers WHERE email = u.email) AS is_seller
      FROM users u WHERE u.id = ?`;

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

      const userEmail = user.email;
      const newStatus = user.activity_status === "active" ? "deactivated" : "active";

      // Step 2: Update `users` table
      db.query(`UPDATE users SET activity_status = ? WHERE id = ?`, [newStatus, userId], (err) => {
          if (err) {
              console.error("Error updating user status:", err);
              return res.status(500).json({ success: false, message: "Error updating user status" });
          }

          // Step 3: Update `chefs` table if the user is a chef
          if (user.is_chef) {
              db.query(`UPDATE chefs SET activity_status = ? WHERE email = ?`, [newStatus, userEmail], (err) => {
                  if (err) console.error("Error updating chef status:", err);
              });
          }

          // Step 4: Update `sellers` table if the user is a seller
          if (user.is_seller) {
              db.query(`UPDATE sellers SET activity_status = ? WHERE email = ?`, [newStatus, userEmail], (err) => {
                  if (err) console.error("Error updating seller status:", err);
              });
          }

          return res.status(200).json({ success: true, message: `User ${newStatus} successfully` });
      });
  });
});




module.exports = router;