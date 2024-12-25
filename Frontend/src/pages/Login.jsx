import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai"; // Import eye icons from react-icons
import "../styles/Login.css";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({}); // Store form errors from frontend and backend
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility
  const navigate = useNavigate();

  // Handle input change for email and password
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  // Validate form input fields
  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Valid email is required";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    }
    return newErrors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors); // Display frontend validation errors
    } else {
      setErrors({}); // Clear previous validation errors
      try {
        // Send login request to backend
        const response = await axios.post(
          "http://localhost:3000/api/login",
          formData
        );
        console.log("Login successful", response.data);

        // Store the JWT token (if login is successful)
        localStorage.setItem("authToken", response.data.token);
        navigate("/dashboard"); // Redirect to dashboard or protected page
      } catch (error) {
        if (error.response && error.response.status === 401) {
          // Handle wrong password
          setErrors({ password: "Incorrect password. Please try again." });
        } else if (error.response && error.response.status === 404) {
          // Handle email not found
          setErrors({ email: "Email not registered. Please sign up first." });
        } else {
          // General error message
          setErrors({ api: "Email not verified. Please Verify first" });
        }
      }
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="login-container">
      {/* Left Section */}
      <div className="login-left">
        <h2>Bhansako Swad</h2>
      </div>

      {/* Right Section */}
      <div className="login-right">
        <h1>HEY! WELCOME BACK</h1>
        <h2>SIGN IN</h2>
        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter your email"
            className={errors.email || errors.api ? "error-input" : ""}
          />
          {errors.email && <span className="error-message">{errors.email}</span>}

          <label htmlFor="password">Password:</label>
          <div className="password-input-container">
            <input
              type={showPassword ? "text" : "password"} // Toggle the input type based on showPassword state
              id="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              className={errors.password || errors.api ? "error-input" : ""}
            />
            <div className="password-toggle-icon" onClick={togglePasswordVisibility}>
              {showPassword ? <AiFillEye /> : <AiFillEyeInvisible />}
            </div>
          </div>
          {errors.password && <span className="error-message">{errors.password}</span>}
          {errors.api && <span className="error-message">{errors.api}</span>} {/* Backend error */}

          <a href="/ForgotPass" className="forgot-password">
            Forgot Password?
          </a>
          <button type="submit">Log In</button>
        </form>
        <p>
          Don’t have an account? <a href="/">Sign Up</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
