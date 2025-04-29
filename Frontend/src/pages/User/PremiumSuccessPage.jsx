import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const PremiumSuccessPage = () => {
    const navigate = useNavigate();
    const [subscriptionDetails, setSubscriptionDetails] = useState(null);

    useEffect(() => {
        const premiumData = JSON.parse(localStorage.getItem("premiumData"));
        if (!premiumData) {
            navigate("/"); 
            return;
        }

        setSubscriptionDetails(premiumData);
        const activatePremium = async () => {
            try {
                const premiumData = JSON.parse(localStorage.getItem("premiumData"));
        
                if (!premiumData || !premiumData.user_id || !premiumData.email) {
                    console.error("Missing required premium data:", premiumData);
                    alert("Error: Missing user details. Please try again.");
                    return;
                }
        
                console.log("Sending Premium Activation Data:", premiumData);
        
                const response = await fetch("http://localhost:3000/api/confirm-premium", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(premiumData),
                });
        
                const result = await response.json();
        
                if (result.success) {
                    console.log(" Premium activated successfully.");
                    alert("Premium activated! Enjoy exclusive features.");
                    localStorage.removeItem("premiumData"); 
                    navigate("/"); 
                } else {
                    console.error("Failed to activate premium:", result.message);
                    alert(`Activation failed: ${result.message}`);
                }
            } catch (error) {
                console.error("Error activating premium:", error);
                alert("An error occurred. Please try again.");
            }
        };
    
        activatePremium();
    }, [navigate]);

    if (!subscriptionDetails) {
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
                <h1 style={{ color: "#4caf50", fontSize: "24px", fontWeight: "bold" }}>Welcome to Premium!</h1>
                <p style={{ fontSize: "16px", color: "#333", margin: "15px 0" }}>
                    Your premium membership has been successfully activated!
                </p>
                <p style={{ fontSize: "16px", color: "#333", margin: "15px 0" }}>
                    Your subscription is valid until <strong>{new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString()}</strong>.
                </p>
                <p style={{ fontSize: "16px", color: "#333", margin: "15px 0" }}>
                    Enjoy exclusive premium content and chef-crafted recipes!
                </p>
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
                onClick={() => navigate("/recipes")}>
                    Explore Premium Recipes
                </button>
            </div>
        </div>
    );
};

export default PremiumSuccessPage;
