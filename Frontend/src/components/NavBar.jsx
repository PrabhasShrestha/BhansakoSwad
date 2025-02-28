import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import axios from "axios";
import "../styles/Header.css";
import userImage from '../assets/user.png';
import { FaBell } from "react-icons/fa";

const Navigationbar = () => {
  const [errorMessages, setErrorMessages] = useState({});
  const [profileImage, setProfileImage] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const userId = localStorage.getItem("userId"); // Assuming user ID is stored in localStorage

  useEffect(() => {
    console.log("📢 Fetching user profile data...");

    axios
      .get("http://localhost:3000/api/get-user", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((response) => {
        console.log("User data response:", response.data);

        const userImage = response.data?.data?.image;
        if (userImage) {
          const fullImageUrl = userImage.startsWith("http")
            ? userImage
            : `http://localhost:3000${userImage}`;
          console.log("Profile image URL:", fullImageUrl);
          setProfileImage(fullImageUrl);
        } else {
          console.warn("No profile image found for the user.");
        }
      })
      .catch((error) => {
        console.error("Error fetching user data:", error.response?.data || error.message);
        setProfileImage(null);
      });

    // Fetch Notifications
    if (userId) {
      fetchNotifications();
    }
  }, [userId]); // Fetch notifications when userId changes

  // ✅ Confirm Order Delivery
  const confirmDelivery = async (orderId) => {
    try {
      console.log(`Confirming delivery for order: ${orderId}`);
      
      await axios.post(`http://localhost:3000/api/orders/${orderId}/status`, {
        status: "Delivered"
      });

      console.log("Order marked as Delivered.");
      
     
      fetchNotifications();
      
    } catch (error) {
      console.error("Error confirming delivery:", error.response?.data || error.message);
    }
  };

  // Fetch Notifications from API
  const fetchNotifications = async () => {
    const storedUserId = localStorage.getItem("userId");

    if (!storedUserId) {
      console.error("userId is missing from localStorage.");
      return;
    }

    console.log("Fetching notifications for user:", storedUserId);

    try {
      const response = await axios.get(`http://localhost:3000/api/notifications/${storedUserId}`);
      console.log("Notifications response:", response.data);
      setNotifications(response.data.notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error.response?.data || error.message);
    }
  };

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev);
    fetchNotifications();
  };
  const clearNotifications = async () => {
    try {
      const response = await axios.delete(`http://localhost:3000/api/notifications/${userId}`);
  
      console.log("API Response from clearNotifications:", response.data);
  
      setNotifications(prevNotifications => {
        if (response.data.deletedIds) {
          return prevNotifications.filter(n => !response.data.deletedIds.includes(n.id));
        }
        return []; // Clear all notifications if no specific IDs are returned
      });
  
      // Fetch fresh notifications to sync with the backend
      fetchNotifications();
    } catch (error) {
      console.error("❌ Error clearing notifications:", error.response?.data || error.message);
  
      if (error.response?.status === 403) {
        setErrorMessages(prevErrors => {
          const newErrors = { ...prevErrors };
  
          notifications.forEach(n => {
            if (n.message.includes("Confirm Delivery") || n.message.includes("shipped")) {
              newErrors[n.id] = "❌ This notification cannot be deleted!";
            }
          });
  
          return newErrors;
        });
  
        // Remove error messages after 3 seconds
        setTimeout(() => {
          setErrorMessages({});
        }, 3000);
      }
    }
  };
  
  
  return (
    <header className="header">
      {/* Logo */}
      <NavLink to="/" className="logo">
        Bhansako Swad
      </NavLink>

      {/* Navigation Links */}
      <nav className="nav">
        <NavLink to="/home" className={({ isActive }) => (isActive ? "active" : "")} end>
          Home
        </NavLink>
        <NavLink to="/recipes" className={({ isActive }) => (isActive ? "active" : "")}>
          Recipes
        </NavLink>
        <NavLink to="/aboutus" className={({ isActive }) => (isActive ? "active" : "")}>
          About
        </NavLink>
        <NavLink to="/contact" className={({ isActive }) => (isActive ? "active" : "")}>
          Contact Us
        </NavLink>
        <NavLink to="/store" className={({ isActive }) => (isActive ? "active" : "")}>
          Store
        </NavLink>
      </nav>

      {/* User & Notifications */}
      <div className="user-icon">
        {/* Notification Bell */}
        <div className="notification-container">
        <FaBell
          size={23}
          color="#d580ff"
          style={{ 
            marginRight: "18px", 
            cursor: "pointer", 
            transition: "color 0.3s ease-in-out" 
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#d580ff")} // Darker purple on hover
          onMouseLeave={(e) => (e.currentTarget.style.color = "#a64dff")} // Restore original color
          onClick={toggleNotifications} // ✅ Fetch notifications on bell click
        />
          {/* Dropdown Menu */}
          {showNotifications && (
            <div className="notification-dropdown">
              <h4>Notifications</h4>
              {notifications.length > 0 && (
                <span className="clear-text" onClick={clearNotifications}>
                  Clear All
                </span>
              )}
              {notifications.length > 0 ? (
                notifications.map((notification,index) => (
                  <div key={notification.id || index} className="notification-item">
                    {notification.message}

                    {errorMessages[notification.id] && (
                      <p className="notification-error">{errorMessages[notification.id]}</p>
                    )}
                    {notification.message.includes("shipped") && (
                      <button 
                        className="noticonfirm-btn"
                        onClick={() => confirmDelivery(notification.order_id)}
                      >
                        Confirm Delivery
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="no-notifications">No new notifications</div>
              )}
            </div>
          )}
        </div>

        {/* Profile Icon */}
        {profileImage ? (
          <img
            src={profileImage}
            alt="User Profile"
            className="profile-image"
            title="User Profile"
            style={{ cursor: "pointer" }}
            onClick={() => (window.location.href = "/userProfile")}
          />
        ) : (
          <NavLink to="/userProfile" className="sign-up-link">
            <img src={userImage} className="sign-up-link" />
          </NavLink>
        )}
      </div>
    </header>
  );
};

export default Navigationbar;
