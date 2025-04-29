import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/User/TotalPayment.css";
import Navigationbar from "../../components/NavBar";
import Footer from "../../components/Footer";
import khaltiImage from "../../assets/khalti.png";

const PremiumPayment = () => {
  const navigate = useNavigate();
  const [premiumPlan, setPremiumPlan] = useState(null);
  const [user, setUser] = useState({ name: "", email: "", phone: "" });

  useEffect(() => {
    const storedPremiumPlan = localStorage.getItem("premium_plan");

    if (!storedPremiumPlan) {
      navigate("/recipes"); 
      return;
    }

    setPremiumPlan(JSON.parse(storedPremiumPlan));

    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found! User must log in.");
          return;
        }

        
        const response = await fetch("http://localhost:3000/api/get-user", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();
        if (result.success) {
          setUser({
            user_id: result.data.id,
            name: `${result.data.first_name} ${result.data.last_name}`.trim(),
            email: result.data.email,
            phone: result.data.phone_number,
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handlePayment = async () => {
    if (!premiumPlan) {
        alert("No premium plan selected!");
        navigate("/recipes");
        return;
    }
     if (!user.name || !user.email || !user.phone) {
        alert("User details are missing! Please log in.");
        return;
    }

    try {

      const paymentData = {
        totalAmount: premiumPlan.price,
        userId: user.user_id,
        email: user.email,
        customerInfo: user,
    };

    console.log("Sending Payment Data:", paymentData);
        const paymentResponse = await fetch("http://localhost:3000/api/initiate-premium", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(paymentData),
        });

        const data = await paymentResponse.json();
        if (data.success) {
          console.log("Payment Initiated:", data);
            localStorage.setItem("premiumData", JSON.stringify({
                user_id: user.user_id,
                amount: premiumPlan.price, 
                payment_date: new Date().toISOString(),
                email: user.email
            }));

            window.location.href = data.paymentUrl;
        } else {
            alert("Payment initiation failed. Try again.");
        }
    } catch (error) {
        console.error("Error initiating payment:", error);
    }
};



  return (
    <div style={{ backgroundColor: "#f5f5f5" }}>
      <Navigationbar />
      <div>
        <header className="cartPage_header">
          <button className="cartPage_backButton" onClick={() => navigate(-1)}>← Back</button>
          <h1>Premium Subscription</h1>
        </header>
      </div>
      <div className="Total-payment-container">
              <div className="Total-payment-box">
                <h2 className="Total-payment-title">Select Payment</h2>
                <div className="Total-payment-option">
                  <img src={khaltiImage} alt="Total" className="Total-payment-logo" />
                  <p className="Total-payment-text">Khalti</p>
                </div>
                <div className="Total-payment-instructions">
                <p>You will be redirected to your Khalti account to complete the payment process:</p>
            <ul>
              <li>Log in to your Khalti account using your Khalti ID and password.</li>
              <li>Ensure your Khalti account is active and has sufficient balance.</li>
              <li>Enter the OTP (One-Time Password) sent to your registered mobile number.</li>
            </ul>
            <p className="Total-payment-note">Note: Use your Khalti mobile number and PASSWORD (not MPin) to log in.</p>
          </div>
          <button className="Total-payment-button" onClick={handlePayment}>Pay Now</button>
          </div>
          <div className="Total-payment-summary">
          <h1 className="Total-summary-title">Subscription Summary</h1>
          <div className="Total-summary-item">
          <span>Plan:</span>
          <span>{premiumPlan ? premiumPlan.plan : "Loading..."}</span> 
          </div>
          <div className="Total-summary-total">
            <span>Total</span>
            <span>{premiumPlan ? `Rs ${premiumPlan.price.toFixed(2)}` : "Loading..."}</span> 
          </div>

          </div>
      </div>
      <Footer />
      </div>
  );
};

export default PremiumPayment;
