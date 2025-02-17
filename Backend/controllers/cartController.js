const db = require('../config/dbConnection');

const addToCart = (req, res) => {
    const { productdetails_id, quantity } = req.body;
    const user_id = req.user.id; // Extract user ID from JWT

    if (!user_id || !productdetails_id || quantity <= 0) {
        return res.status(400).json({ message: "Invalid cart data." });
    }

    db.query(
        `SELECT * FROM cart_items WHERE user_id = ? AND productdetails_id = ?`,
        [user_id, productdetails_id],
        (err, result) => {
            if (err) {
                console.error("Database Error:", err);
                return res.status(500).json({ message: "Internal server error." });
            }

            if (result.length > 0) {
                db.query(
                    `UPDATE cart_items SET quantity = quantity + ? WHERE user_id = ? AND productdetails_id = ?`,
                    [quantity, user_id, productdetails_id],
                    (updateErr) => {
                        if (updateErr) return res.status(500).json({ message: "Failed to update cart." });
                        return res.status(200).json({ message: "Cart updated successfully." });
                    }
                );
            } else {
                db.query(
                    `INSERT INTO cart_items (user_id, productdetails_id, quantity) VALUES (?, ?, ?)`,
                    [user_id, productdetails_id, quantity],
                    (insertErr) => {
                        if (insertErr) return res.status(500).json({ message: "Failed to add to cart." });
                        return res.status(200).json({ message: "Item added to cart successfully." });
                    }
                );
            }
        }
    );
};

const getCart = (req, res) => {
    const user_id = req.user.id;

    db.query(
        `SELECT c.id, c.productdetails_id, c.quantity, 
                p.product_id, p.seller_id, p.price, p.image, 
                prod.name AS product_name 
         FROM cart_items c
         JOIN productdetails p ON c.productdetails_id = p.id
         JOIN products prod ON p.product_id = prod.id 
         WHERE c.user_id = ?`,
        [user_id],
        (err, result) => {
            if (err) {
                console.error("Database Error:", err);
                return res.status(500).json({ message: "Internal server error." });
            }

            // Format product image URLs correctly
            const cartItems = result.map((item) => ({
                ...item,
                image: item.image 
                    ? `http://localhost:3000/uploads/products/${item.image}`
                    : null,
            }));

            res.status(200).json({
                success: true,
                cart: cartItems,
                message: "Cart items fetched successfully."
            });
        }
    );
};


const removeFromCart = (req, res) => {
    const { productdetails_id } = req.body;
    const user_id = req.user.id;

    db.query(
        `DELETE FROM cart_items WHERE user_id = ? AND productdetails_id = ?`,
        [user_id, productdetails_id],
        (err, result) => {
            if (err) return res.status(500).json({ message: "Internal server error." });
            return res.status(200).json({ message: "Item removed from cart." });
        }
    );
};

const updateCartQuantity = (req, res) => {
    const { productdetails_id, quantity } = req.body;
    const user_id = req.user.id;

    if (quantity <= 0) {
        return res.status(400).json({ message: "Quantity must be greater than zero." });
    }

    db.query(
        `UPDATE cart_items SET quantity = ? WHERE user_id = ? AND productdetails_id = ?`,
        [quantity, user_id, productdetails_id],
        (err, result) => {
            if (err) return res.status(500).json({ message: "Internal server error." });
            return res.status(200).json({ message: "Cart quantity updated successfully." });
        }
    );
};

module.exports = {
    addToCart,
    updateCartQuantity,
    removeFromCart,
    getCart
};
