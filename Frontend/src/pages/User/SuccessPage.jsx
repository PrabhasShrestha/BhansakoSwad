import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";


const SuccessPage = () => {
    const navigate = useNavigate();
    const [orderDetails, setOrderDetails] = useState(null);
    useEffect(() => {
        const paymentData = JSON.parse(localStorage.getItem("paymentData"));
        if (!paymentData) {
            navigate("/");
            return;
        }
    
        setOrderDetails(paymentData);
    
        // ✅ Step 3: Store Payment in Database After Successful Transaction
        const storePayment = async () => {
            try {
                const token = localStorage.getItem("token"); 
                if (!paymentData || !paymentData.user_id || !paymentData.order_id) {
                    console.error("Payment data or user_id missing!");
                    return;
                }
        
                const response = await fetch("http://localhost:3000/api/save-payment", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(paymentData),
                });
    
                const result = await response.json();
                if (!result.success) {
                    console.error("Failed to save payment:", result.message);
                } else {
                    console.log("Payment stored successfully.");
                }
    
             
                const clearCartResponse = await fetch("http://localhost:3000/api/cart/clear-cart", {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ user_id: paymentData.user_id }),
                });
                const clearCartResult = await clearCartResponse.json();
    
                localStorage.removeItem("paymentData");
                localStorage.removeItem("total");
    
            } catch (error) {
                console.error("Error storing payment:", error);
            }
        };
        
        storePayment();
    }, [navigate]);
    

    if (!orderDetails) {
        return <p>Loading...</p>;
    }
    return (
        <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            backgroundColor: "#f8fafa"
        }}>
            <div style={{
                background: "white",
                padding: "30px",
                borderRadius: "12px",
                boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
                textAlign: "center",
                maxWidth: "400px"
            }}>
                <h1 style={{ color: "#4caf50", fontSize: "24px", fontWeight: "bold" }}>Thank You for Your Purchase!</h1>
                <p style={{ fontSize: "16px", color: "#333", margin: "15px 0" }}>Your payment of <strong>Rs {orderDetails.amount}</strong> was successfully processed on <strong>{new Date(orderDetails.payment_date).toLocaleString()}</strong>.</p>
                <p style={{ fontSize: "16px", color: "#333", margin: "15px 0" }}>A receipt has been sent to <strong>{orderDetails.email}</strong>. Please check your email for order details.</p>
                <p style={{ fontSize: "16px", color: "#333", margin: "15px 0" }}>We appreciate your trust in us and look forward to serving you again.</p>
                <button style={{
                    background: "#4caf50",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "16px",
                    transition: "background 0.3s"
                }}
                onClick={() => navigate("/")}>
                    Back to the website
                </button>
            </div>
        </div>
    );
};
export default SuccessPage;
