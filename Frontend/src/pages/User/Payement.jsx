import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/User/TotalPayment.css";
import Navigationbar from "../../components/NavBar";
import Footer from "../../components/Footer";
import khaltiImage from "../../assets/khalti.png";


const TotalPayement = () => {
  const navigate = useNavigate();
  const [total, setTotal] = useState(0);
  const [user, setUser] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const storedTotal = localStorage.getItem("total");
    if (storedTotal) {
      setTotal(parseFloat(storedTotal));
    }
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token"); 
        if (!token) {
          console.error("No token found! User must log in.");
          setLoading(false);
          return;
        }

        const response = await fetch("http://localhost:3000/api/get-user", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`, 
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }

        const result = await response.json();
    
        if (result.success) {
          setUser({
            user_id: result.data.id,
            name: `${result.data.first_name} ${result.data.last_name}`.trim() || "Unknown User",
            email: result.data.email || "noemail@example.com",
            phone: result.data.phone_number || "9800000000", 
          });
        } else {
          console.error("User data fetch failed:", result.message);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const calculateTotalAmount = () => {
    const shippingAmount = 85;
    const totalAmount = total + shippingAmount;
    return { totalAmount};
  };

  const { totalAmount } = calculateTotalAmount();

  const handlePayment = async () => {
    if (!user.name || !user.email || !user.phone) {
        alert("User details are missing! Please log in.");
        return;
    }

    try {
        const orderResponse = await fetch("http://localhost:3000/api/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: user.user_id,
                totalAmount,
                email: user.email
            })
        });

        const orderData = await orderResponse.json();
        if (!orderData.success) {
            alert("Order creation failed. Try again.");
            return;
        }

        const orderId = orderData.orderId; 

        const cartItems = JSON.parse(localStorage.getItem("cart")) || []; 
        console.log(localStorage.getItem("cart"));
        if (cartItems.length === 0) {
            alert("No items in the cart.");
            return;
        }

        const saveOrderItemsResponse = await fetch("http://localhost:3000/api/save-order-items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                order_id: orderId,
                items: cartItems 
            })
        });

        const saveOrderItemsData = await saveOrderItemsResponse.json();
        if (!saveOrderItemsData.success) {
            alert("Failed to save order items.");
            return;
        }

        const paymentResponse = await fetch("http://localhost:3000/api/paymentorder", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                totalAmount,
                orderId,  
                customerInfo: {
                    user_id: user.user_id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                }
            })
        });

        const data = await paymentResponse.json();
        if (data.success) {
            localStorage.setItem("paymentData", JSON.stringify({
                user_id: user.user_id,
                amount: totalAmount,
                payment_date: new Date().toISOString(),
                email: user.email,
                order_id: orderId  
            }));

            window.location.href = data.paymentUrl; 
        } else {
            alert("Payment initiation failed. Try again.");
        }
    } catch (error) {
        console.error("Error initiating payment:", error);
        alert("Payment request failed. Check console for details.");
    }
};

  return (
    <div style={{ backgroundColor: "#f5f5f5" }}>
      <Navigationbar />
      <div>
        <header className="cartPage_header">
          <button className="cartPage_backButton" onClick={() => navigate(-1)}>← Back</button>
          <h1>Order Summary</h1>
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
          <h1 className="Total-summary-title">Order Summary</h1>
          <div className="Total-summary-item">
            <span>Subtotal</span>
            <span>Rs {total.toFixed(2)}</span>
          </div>
          <div className="Total-summary-item">
            <span>Shipping</span>
            <span>Rs 85</span>
          </div>
          <div className="Total-summary-total">
            <span>Total</span>
            <span>Rs {totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TotalPayement;
