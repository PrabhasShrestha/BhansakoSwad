import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/UserSignUp.css";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Importing new eye icons

function UserSignUp() {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    address: "",
    email: "",
    phone_number: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false); // Toggle visibility of password
  const navigate = useNavigate(); // Use navigate hook

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const validateForm = () => {
    let errors = {};
    if (!formData.first_name) errors.first_name = "First Name is required";
    if (!formData.last_name) errors.last_name = "Last Name is required";
    if (!formData.address) errors.address = "Address is required";
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email))
      errors.email = "Valid email is required";
    if (!formData.phone_number || formData.phone_number.length !== 10)
      errors.phone_number = "Phone Number must be 10 digits";
    if (!formData.password) errors.password = "Password is required";
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const response = await axios.post(
          "http://localhost:3000/api/register",
          formData
        );
        console.log("Response from backend:", response.data);

        localStorage.setItem("email", formData.email);
        setFormData({
          first_name: "",
          last_name: "",
          address: "",
          email: "",
          phone_number: "",
          password: "",
        });
        setErrors({});
        navigate("/verify"); // Navigate to the verification page
      } catch (error) {
        if (error.response?.status === 409) {
          // Handle duplicate email error
          setErrors({ email: "This email is already registered" });
        } else {
          // Handle other API errors
          console.error(
            "Error during registration:",
            error.response?.data?.message || error.message
          );
          setErrors({
            api: error.response?.data?.message || "Registration failed",
          });
        }
      }
    }
  };

  return (
    <div className="container">
      {/* Left Section: Sign Up Form */}
      <div className="form-section">
        <h2>HEY! WELCOME</h2>
        <h1>SIGN UP</h1>
        <form onSubmit={handleSubmit}>
          <div className="input-container">
            <label htmlFor="first_name">First Name</label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              placeholder="Enter your first name"
              className={`input-box ${errors.first_name ? "input-error" : ""}`}
              value={formData.first_name}
              onChange={handleChange}
            />
            {errors.first_name && <p className="error">{errors.first_name}</p>}
          </div>

          <div className="input-container">
            <label htmlFor="last_name">Last Name</label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              placeholder="Enter your last name"
              className={`input-box ${errors.last_name ? "input-error" : ""}`}
              value={formData.last_name}
              onChange={handleChange}
            />
            {errors.last_name && <p className="error">{errors.last_name}</p>}
          </div>

          <div className="input-container">
            <label htmlFor="address">Address</label>
            <input
              type="text"
              id="address"
              name="address"
              placeholder="Enter your address"
              className={`input-box ${errors.address ? "input-error" : ""}`}
              value={formData.address}
              onChange={handleChange}
            />
            {errors.address && <p className="error">{errors.address}</p>}
          </div>

          <div className="input-container">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              className={`input-box ${errors.email ? "input-error" : ""}`}
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <p className="error">{errors.email}</p>}
          </div>

          <div className="input-container">
            <label htmlFor="phone_number">Phone Number</label>
            <input
              type="text"
              id="phone_number"
              name="phone_number"
              placeholder="Enter your phone number"
              className={`input-box ${errors.phone_number ? "input-error" : ""}`}
              value={formData.phone_number}
              onChange={handleChange}
            />
            {errors.phone_number && (
              <p className="error">{errors.phone_number}</p>
            )}
          </div>

          <div className="input-container">
            <label htmlFor="password">Password</label>
            <div className="pw-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Enter your password"
                className={`input-box ${errors.password ? "input-error" : ""}`}
                value={formData.password}
                onChange={handleChange}
              />
              <span
                className="pw-eye-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </span>
            </div>
            {errors.password && <p className="error">{errors.password}</p>}
          </div>

          <button type="submit" className="create-account-btn">
            Create Account
          </button>
        </form>
        <p style={{ marginLeft: "180px" }}>
          Already have an account? <a href="/login" className="login-link">Login</a>
        </p>
      </div>

      {/* Right Section: Information Section */}
      <div className="info-section">
        <h1>CREATE ACCOUNT</h1>
        <h1 style={{ fontSize: "30px" }}>What Will You Get?</h1>
        <ul>
          <li>Manage your recipe the easy way</li>
          <li>Track your nutritional intake and maintain a balanced diet.</li>
          <li>Discover a variety of recipes from different cultures and cuisines.</li>
          <li>Get recipes tailored to your taste and available ingredients.</li>
          <li>Access recipes curated and approved by professional chefs.</li>
          <li>Easily order the ingredients you need directly</li>
        </ul>
        <span className="brand-text">Bhansako Swad</span>
      </div>
    </div>
  );
}

export default UserSignUp;
