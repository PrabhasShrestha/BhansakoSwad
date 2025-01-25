import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import axios from "axios";
import "../styles/Header.css";
import userImage from '../assets/user.png';

const Navigationbar = () => {
  const [profileImage, setProfileImage] = useState(null); // Use null for initialization

  useEffect(() => {
    console.log("Fetching user profile data...");
  
    axios
      .get("http://localhost:3000/api/get-user", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((response) => {
        console.log("User data response:", response.data);
  
        const userImage = response.data?.data?.image;
        if (userImage) {
          // Check if the URL is already complete
          const fullImageUrl = userImage.startsWith("http")
            ? userImage
            : `http://localhost:3000${userImage}`;
          console.log("Fetched profile image URL:", fullImageUrl);
          setProfileImage(fullImageUrl);
        } else {
          console.warn("No profile image found for the user.");
        }
      })
      .catch((error) => {
        console.error(
          "Error fetching user data:",
          error.response?.data || error.message
        );
        setProfileImage(null); // Fallback in case of error
      });
  }, []);
  
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

      {/* User Icon */}
      <div className="user-icon">
        {profileImage ? (
          <img
            src={profileImage}
            alt="User Profile"
            className="profile-image"
            title="User Profile"
            style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}
            onClick={() => (window.location.href = "/userProfile")}
          />
        ) : (
          <NavLink to="/userProfile" className="sign-up-link">
            <img
            src={userImage} className="sign-up-link"/>
          </NavLink>
        )}
      </div>
    </header>
  );
};

export default Navigationbar;
