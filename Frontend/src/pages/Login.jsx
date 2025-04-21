import React, { useState, useEffect } from "react";
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
  const [isUnverified, setIsUnverified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Debug state changes
  useEffect(() => {
    console.log("isUnverified:", isUnverified);
  }, [isUnverified]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    try {
      const endpoint = "http://localhost:3000/api/login";
      const response = await axios.post(endpoint, formData);
      console.log("Response data:", response.data);

      const user = response.data.user;
      if (user.isVerified === 0) {
        setIsUnverified(true);
        return;
      }

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", user.role);
      localStorage.setItem("userId", user.id);

      if (user.role === "all") {
        localStorage.setItem("userId", user.id);
        localStorage.setItem("sellerId", user.seller_id);
        if (user.chef_status === "approved") {
          localStorage.setItem("chefId", user.chef_id);
        }
      } else if (user.role === "user_seller") {
        localStorage.setItem("userId", user.id);
        localStorage.setItem("sellerId", user.seller_id);
      } else if (user.role === "user_chef") {
        localStorage.setItem("userId", user.id);
        if (user.chef_status === "approved") {
          localStorage.setItem("chefId", user.chef_id);
        }
      } else if (user.role === "seller_chef") {
        localStorage.setItem("sellerId", user.seller_id);
        if (user.chef_status === "approved") {
          localStorage.setItem("chefId", user.chef_id);
        }
      } else if (user.role === "seller") {
        localStorage.setItem("sellerId", user.seller_id);
      } else if (user.role === "chef") {
        if (user.chef_status === "approved") {
          localStorage.setItem("chefId", user.chef_id);
        }
      } else {
        localStorage.setItem("userId", user.id);
      }

      navigate("/");
    } catch (error) {
      if (error.response?.status === 401) {
        setErrors({ password: "Invalid password. Please try again." });
      } else if (error.response?.status === 404) {
        setErrors({ email: "Account not found. Please register first." });
      } else if (error.response?.status === 409) {
        setErrors({
          api: "Your account has been deactivated by the admin. Please contact support.",
        });
      } else if (error.response?.status === 403) {
        setErrors({
          api: "Your account is not verified. Please verify your email by resending the code",
        });
        setIsUnverified(true); 
      } else {
        setErrors({ api: "Login failed. Please try again later." });
      }
    }
  };

  const handleResendCodeNavigation = () => {
    // Store the email in localStorage before navigating
    localStorage.setItem("email", formData.email);
    // Navigate to /verify with the email as route state
    navigate("/verify", { state: { email: formData.email } });
  };

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

          <div className="forget-password-re-send">
            {isUnverified && (
              <a
                href="#"
                className="forgot-password left-link"
                onClick={(e) => {
                  e.preventDefault();
                  handleResendCodeNavigation();
                }}
              >
                Re-send Code
              </a>
            )}
            <a href="/ForgotPass" className="forgot-password right-link">
              Forgot Password?
            </a>
          </div>

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