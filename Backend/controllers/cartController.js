const db = require('../config/dbConnection');

const addToCart = (req, res) => {
    const { productdetails_id, quantity } = req.body;
    const user_id = req.user.id; // Extract user ID from JWT

    if (!user_id || !productdetails_id || quantity <= 0) {
        return res.status(400).json({ message: "Invalid cart data." });
    }

    // Check stock availability first
    db.query(
        `SELECT in_stock FROM productdetails WHERE id = ?`,
        [productdetails_id],
        (err, stockResult) => {
            if (err) {
                console.error("Database Error:", err);
                return res.status(500).json({ message: "Internal server error." });
            }

            if (stockResult.length === 0) {
                return res.status(404).json({ message: "Product not found." });
            }

            const availableStock = stockResult[0].in_stock;

            if (availableStock < quantity) {
                return res.status(400).json({ message: "Not enough stock available." });
            }

            // Check if the item is already in the cart
            db.query(
                `SELECT quantity FROM cart_items WHERE user_id = ? AND productdetails_id = ?`,
                [user_id, productdetails_id],
                (cartErr, cartResult) => {
                    if (cartErr) {
                        console.error("Database Error:", cartErr);
                        return res.status(500).json({ message: "Internal server error." });
                    }

                    if (cartResult.length > 0) {
                        const existingQuantity = cartResult[0].quantity;
                        const newQuantity = existingQuantity + quantity;

                        if (newQuantity > availableStock) {
                            return res.status(400).json({ message: "Not enough stock available for this update." });
                        }

                        db.query(
                            `UPDATE cart_items SET quantity = ? WHERE user_id = ? AND productdetails_id = ?`,
                            [newQuantity, user_id, productdetails_id],
                            (updateErr) => {
                                if (updateErr) {
                                    return res.status(500).json({ message: "Failed to update cart." });
                                }
                                return res.status(200).json({ message: "Cart updated successfully." });
                            }
                        );
                    } else {
                        db.query(
                            `INSERT INTO cart_items (user_id, productdetails_id, quantity) VALUES (?, ?, ?)`,
                            [user_id, productdetails_id, quantity],
                            (insertErr) => {
                                if (insertErr) {
                                    return res.status(500).json({ message: "Failed to add to cart." });
                                }
                                return res.status(200).json({ message: "Item added to cart successfully." });
                            }
                        );
                    }
                }
            );
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


const deleteCart = (req, res) => {
    const user_id = req.user.id; // Extract user ID from JWT

    if (!user_id) {
        return res.status(400).json({ message: "User ID is required." });
    }

    db.query(
        `DELETE FROM cart_items WHERE user_id = ?`,
        [user_id],
        (err, result) => {
            if (err) {
                console.error("Database Error:", err);
                return res.status(500).json({ message: "Failed to clear cart." });
            }

            return res.status(200).json({ message: "Cart cleared successfully." });
        }
    );
};

module.exports = {
    addToCart,
    updateCartQuantity,
    removeFromCart,
    getCart,
    deleteCart
};
