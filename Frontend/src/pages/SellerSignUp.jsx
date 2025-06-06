import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa"; 
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "../styles/UserSignUp.css";

function SellerSignUp() {
  const [formData, setFormData] = useState({
    shop_name: "",
    owner_name: "",
    store_address: "",
    email: "",
    phone_number: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false); 
  const navigate = useNavigate();

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const timer = setTimeout(() => {
        setErrors({});
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [errors]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const validateForm = () => {
    let errors = {};
    if (!formData.shop_name) {
      errors.shop_name = "Shop Name is required";
      toast.error("Shop Name is required");
    }
    if (!formData.owner_name) {
      errors.owner_name = "Owner Name is required";
      toast.error("Owner Name is required");
    }
    if (!formData.store_address) {
      errors.store_address = "Store Address is required";
      toast.error("Store Address is required");
    }
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Valid email is required";
      toast.error("Valid email is required");
    }
    if (!formData.phone_number || formData.phone_number.length !== 10) {
      errors.phone_number = "Phone Number must be 10 digits";
      toast.error("Phone Number must be 10 digits");
    }
    if (!formData.password) {
      errors.password = "Password is required";
      toast.error("Password is required");
    }
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const response = await axios.post(
          "http://localhost:3000/api/registerseller", 
          formData
        );
        console.log("Response from backend:", response.data);
  
        localStorage.setItem("email", formData.email); 
        setFormData({
          shop_name: "",
          owner_name: "",
          store_address: "",
          email: "",
          phone_number: "",
          password: "",
        });
        setErrors({});
        toast.success("Your account has been registered successfully, and your verification code has been sent to your email.", { autoClose: 4000 });
        setTimeout(() => {
          navigate("/SellerVerificationCode");
        }, 4000);
      } catch (error) {
        if (error.response) {
          console.error("Error Response Data:", error.response.data);
          if (error.response.status === 400) {
            setErrors({ password: error.response.data.msg });
            toast.error(error.response.data.msg);
          } else if (error.response.status === 409) {
            setErrors({ email: "This email is already registered as a seller." });
            toast.error("This email is already registered as a seller.");
          } else {
            setErrors({ api: "Registration failed. Please try again." });
            toast.error("Registration failed. Please try again.");
          }
        } else {
          setErrors({ api: "Unable to connect to server. Try again later." });
          toast.error("Unable to connect to server. Try again later.");
        }
      }
    }
  };  

  return (
    <div className="container">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <div className="form-section">
        <h2>HEY! WELCOME</h2>
        <h1>SIGN UP</h1>
        <form onSubmit={handleSubmit}>
          <div className="input-container">
            <label htmlFor="shop_name">Shop Name</label>
            <input
              type="text"
              id="shop_name"
              name="shop_name"
              placeholder="Enter your shop name"
              className={`input-box ${errors.shop_name ? "input-error" : ""}`}
              value={formData.shop_name}
              onChange={handleChange}
            />
          </div>

          <div className="input-container">
            <label htmlFor="owner_name">Shop Owner Name</label>
            <input
              type="text"
              id="owner_name"
              name="owner_name"
              placeholder="Enter your owner name"
              className={`input-box ${errors.owner_name ? "input-error" : ""}`}
              value={formData.owner_name}
              onChange={handleChange}
            />
          </div>

          <div className="input-container">
            <label htmlFor="store_address">Store Address</label>
            <input
              type="text"
              id="store_address"
              name="store_address"
              placeholder="Enter your store address"
              className={`input-box ${errors.store_address ? "input-error" : ""}`}
              value={formData.store_address}
              onChange={handleChange}
            />
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
          </div>

          <button type="submit" className="create-account-btn">
            Create Account
          </button>
        </form>
        <p style={{ marginLeft: "180px" }}>
          Already have an account?{" "}
          <a href="/login" className="login-link">
            Login
          </a>
        </p>
      </div>

      <div className="info-section">
        <h1>CREATE ACCOUNT</h1>
        <h1 style={{ fontSize: "30px" }}>What Will You Get?</h1>
        <ul>
          <li>Manage your ingredient sales the easy way</li>
          <li>Streamline your ingredient inventory and track supply efficiently</li>
          <li>Reach a wider audience by offering ingredients for diverse cuisines</li>
          <li>Simplify the ordering process for customers with a seamless interface</li>
          <li>Make ordering convenient and hassle-free for your customers</li>
          <li>Boost your sales by catering to home cooks and professional chefs alike</li>
        </ul>
        <span className="brand-text">Bhansako Swad</span>
      </div>
    </div>
  );
}

export default SellerSignUp;