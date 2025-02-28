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
  const [role, setRole] = useState(""); // Default role is user
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
    if (!role) {
      newErrors.role = "Please select a role";
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
      const endpoint =
        role === "user"
          ? "http://localhost:3000/api/login" // User login endpoint
          : "http://localhost:3000/api/loginseller"; // Seller login endpoint

      const response = await axios.post(endpoint, formData);

      console.log("Login successful", response.data);

      // Store JWT token and role in localStorage
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", role);

      if (role === "seller") {
        localStorage.setItem("vendorId", response.data.seller.id);
        console.log("Stored Vendor ID:", response.data.seller.id); // Debugging
      }
      if (role === "user") {
        localStorage.setItem("userId", response.data.user.id);
        console.log("Stored user ID:", response.data.user.id); // Debugging
      }


      // Navigate based on role
      if (role === "user") {
        navigate("/home"); // Redirect to user home page
      } else if (role === "seller") {
        navigate("/dashboard"); // Redirect to seller dashboard
      }
    } catch (error) {
      // Handle errors from the backend
      if (error.response?.status === 401) {
        setErrors({ password: "Invalid password. Please try again." });
      } else if (error.response?.status === 404) {
        setErrors({ email: "Account not found. Please register first." });
      } else if (error.response?.status === 403) {
        setErrors({ api: "Email is not verified. Please verify your email first." });
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

          <div className="role-dropdown">
            <label htmlFor="role">Choose your Role:</label>
            <select
              id="role"
              name="role"
              value={role} // Controlled component to bind the state
              onChange={(e) => setRole(e.target.value)}
              className={errors.role ? "error-input" : ""} // Update the role state
            >
              <option value="" disabled>
                Select a role
              </option>
              <option value="user">User</option>
              <option value="seller">Seller</option>
            </select>
            {errors.role && <span className="error-message">{errors.role}</span>}
          </div>

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
