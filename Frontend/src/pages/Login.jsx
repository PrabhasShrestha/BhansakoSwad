import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import "../styles/Login.css";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Handle input changes
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  // Validate form inputs
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

    // Validate inputs
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
    }

    setErrors({}); // Clear any previous errors

    try {
        const endpoint = "http://localhost:3000/api/login"; // Single endpoint for all
        const response = await axios.post(endpoint, formData);

        console.log("Login successful", response.data);

        const user = response.data.user;
        // Store JWT token and role
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("role", user.role); // Role is received from backend
        localStorage.setItem("userId", user.id);
      
        if (response.data.user.role === "all") {
          localStorage.setItem("userId", response.data.user.id);
          localStorage.setItem("sellerId", response.data.user.seller_id);
          if (response.data.user.chef_status === "approved") {
              localStorage.setItem("chefId", response.data.user.chef_id);
          }
      } else if (response.data.user.role === "user_seller") {
          localStorage.setItem("userId", response.data.user.id);
          localStorage.setItem("sellerId", response.data.user.seller_id);
      } else if (response.data.user.role === "user_chef") {
          localStorage.setItem("userId", response.data.user.id);
          if (response.data.user.chef_status === "approved") {
              localStorage.setItem("chefId", response.data.user.chef_id);
          }
      } else if (response.data.user.role === "seller_chef") {
          localStorage.setItem("sellerId", response.data.user.seller_id);
          if (response.data.user.chef_status === "approved") {
              localStorage.setItem("chefId", response.data.user.chef_id);
          }
      } else if (response.data.user.role === "seller") {
          localStorage.setItem("sellerId", response.data.user.seller_id);
      } else if (response.data.user.role === "chef") {
          if (response.data.user.chef_status === "approved") {
              localStorage.setItem("chefId", response.data.user.chef_id);
          }
      } else {
          localStorage.setItem("userId", response.data.user.id);
      }
      
      navigate("/home");      
        
    } catch (error) {
        // Handle errors from the backend
        if (error.response?.status === 401) {
            setErrors({ password: "Invalid password. Please try again." });
        } else if (error.response?.status === 404) {
            setErrors({ email: "Account not found. Please register first." });
        } else if (error.response?.status === 409 ) {
          setErrors({
            api: "Your account has been deactivated by the admin. Please contact support."
          });}else if (error.response?.status === 403) {
            setErrors({
                api: "Your account is under verification. Please wait for admin approval."
            });
        } else {
            setErrors({ api: "Login failed. Please try again later." });
        }
    }
};

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <h2>Bhansako Swad</h2>
      </div>

      <div className="login-right">
        <h1>Welcome Back!</h1>
        <h2>Login</h2>
        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter your email"
            className={errors.email ? "error-input" : ""}
          />
          {errors.email && <span className="error-message">{errors.email}</span>}

          <label htmlFor="password">Password:</label>
          <div className="password-input-container">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              className={errors.password ? "error-input" : ""}
            />
            <div className="password-toggle-icon" onClick={togglePasswordVisibility}>
              {showPassword ? <AiFillEye /> : <AiFillEyeInvisible />}
            </div>
          </div>
          {errors.password && <span className="error-message">{errors.password}</span>}
          {errors.api && <span className="error-message">{errors.api}</span>}


          <a href="/ForgotPass" className="forgot-password">
            Forgot Password?
          </a>
          <button type="submit">Log In</button>
        </form>
        <p>
          Don’t have an account? <a href="/signUp">Sign Up</a>
        </p>
      </div>
    </div>
  );
};

export default Login;



