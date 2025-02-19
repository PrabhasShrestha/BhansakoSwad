const express = require("express");
const axios = require("axios");
require("dotenv").config();



const router = express.Router();

router.post("/paymentorder", async (req, res) => {
    try {
        const { totalAmount, orderId, customerInfo } = req.body;

        console.log("Received Payment Request:", req.body); // ✅ Debugging

        const response = await axios.post(
            "https://a.khalti.com/api/v2/epayment/initiate/",
            {
                return_url: "http://localhost:5173/home",
                website_url: "http://localhost:5173/",
                amount: totalAmount * 100, // Convert Rs to Paisa
                purchase_order_id: orderId,
                purchase_order_name: "Product Purchase",
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
    } catch (error) {
        console.error("Khalti Payment Error:", error.response?.data || error.message);
        res.status(500).json({ error: error.response?.data || "Internal Server Error" });
    }
});

module.exports = router;
