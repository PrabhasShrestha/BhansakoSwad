const express = require("express");
const axios = require("axios");
require("dotenv").config();
const sendMail = require('../helpers/sendMail');
const db = require('../config/dbConnection');


const router = express.Router();

router.post("/paymentorder", async (req, res) => {
    try {
        const { totalAmount, orderId, customerInfo } = req.body;
        const response = await axios.post(
            "https://a.khalti.com/api/v2/epayment/initiate/",
            {
                return_url: "http://localhost:5173/success",
                website_url: "http://localhost:5173/",
                amount: totalAmount * 100, 
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

router.post("/save-payment", (req, res) => {
    const { user_id, payment_date, amount, order_id, email } = req.body;
  
    if (!order_id || !user_id || !amount) {
      return res.status(400).json({ success: false, message: "Order ID, User ID, and Amount are required." });
    }
  
    db.query("SELECT * FROM orders WHERE order_id = ?", [order_id], (err, orderResult) => {
      if (err) {
        console.error("Database Error:", err);
        return res.status(500).json({ success: false, message: "Failed to check order" });
      }
  
      if (orderResult.length === 0) {
        return res.status(400).json({ success: false, message: "Order does not exist" });
      }

      db.query(
        "INSERT INTO payments (user_id, amount, order_id) VALUES (?, ?, ?)",
        [user_id, amount, order_id],
        (err, paymentResult) => {
          if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ success: false, message: "Failed to store payment" });
          }
  
          const paymentId = paymentResult.insertId;
  
          db.query(
            "SELECT payment_date FROM payments WHERE id = ?",
            [paymentId],
            (err, paymentDateResult) => {
              if (err) {
                console.error("Database Error:", err);
                sendEmailWithFallback(new Date());
              } else {
                const insertedPaymentDate = paymentDateResult[0]?.payment_date || new Date();
                sendEmailWithFallback(insertedPaymentDate);
              }
            }
          );
  
          function sendEmailWithFallback(dateToUse) {
            try {
              const mailSubject = "Payment Receipt - Bhansako Swad";
              const content = `
                <div style="font-family: Arial, sans-serif; background-color: #f8f8f8; padding: 20px;">
                  <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h2 style="text-align: center; color: #4caf50;">Thank You for Your Payment!</h2>
                    <p style="font-size: 16px; color: #333;">
                      <strong>Amount Paid:</strong> Rs ${amount}<br>
                      <strong>Payment Date:</strong> ${dateToUse.toLocaleString()}
                    </p>
                    <p style="font-size: 16px; color: #333;">Your payment has been successfully processed.</p>
                    <p style="font-size: 16px; color: #333;">If you have any questions, feel free to contact us.</p>
                    <p style="font-size: 16px; color: #333;">Best regards,<br>Bhansako Swad Store Team</p>
                  </div>
                </div>
              `;
              sendMail(email, mailSubject, content);
            } catch (emailError) {
              console.error("Error sending email:", emailError);
              
            }
  
            res.json({ success: true, message: "Payment stored successfully", paymentId });
          }
        }
      );
    });
  });


module.exports = router;