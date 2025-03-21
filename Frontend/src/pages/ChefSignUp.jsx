import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaEye, FaEyeSlash, FaUpload } from "react-icons/fa";
import "../styles/UserSignUp.css";

function ChefSignUp() {
  const [formData, setFormData] = useState({
    full_name: "",
    nationality: "",
    email: "",
    phone_number: "",
    about_you: "",
    password: "",
    certificate: null,
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check if file is an image
      if (file.type.match('image.*')) {
        // Create a preview URL for the image
        const reader = new FileReader();
        reader.onload = () => {
          setPreviewUrl(reader.result);
          setPdfUrl(null);
        };
        reader.readAsDataURL(file);
      } else if (file.type === "application/pdf") {
        const pdfBlob = URL.createObjectURL(file);
        setPdfUrl(pdfBlob);
        setPreviewUrl(null);
      } else {
        setPreviewUrl(null);
        setPdfUrl(null);
      }
      
      setFormData({
        ...formData,
        certificate: file,
      });
    }
  };

  const validateForm = () => {
    let errors = {};
    if (!formData.full_name) errors.full_name = "Full Name is required";
    if (!formData.nationality) errors.nationality = "Nationality is required";
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email))
      errors.email = "Valid email is required";
    if (!formData.phone_number || formData.phone_number.length !== 10)
      errors.phone_number = "Phone Number must be 10 digits";
    if (!formData.about_you) errors.about_you = "About You is required";
    if (!formData.password) errors.password = "Password is required";
    if (!formData.certificate) errors.certificate = "Certificate is required";

    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (validateForm()) {
      try {
        const formDataToSend = new FormData();
        formDataToSend.append("name", formData.full_name);
        formDataToSend.append("email", formData.email);
        formDataToSend.append("nationality", formData.nationality);
        formDataToSend.append("about_you", formData.about_you);
        formDataToSend.append("phone_number", formData.phone_number);
        formDataToSend.append("password", formData.password);
        formDataToSend.append("certificate", formData.certificate);
  
        const response = await axios.post(
          "http://localhost:3000/api/chef/chefRegister",
          formDataToSend,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
  
        alert("Your account has been submitted for verification. Please wait for admin approval.");
        console.log("Response from backend:", response.data);
        localStorage.setItem("email", formData.email);
        navigate("/");
  
      } catch (error) {
        if (error.response) {
          console.error("Error Response Data:", error.response.data);
  
          // Handle 400 error (Bad Request)
          if (error.response.status === 400) {
            setErrors({ password: error.response.data.msg }); // Show password mismatch error
          } 
          // Handle 409 error (Conflict - Email Already Exists)
          else if (error.response.status === 409) {
            setErrors({ email: "This email is already registered as a chef." });
          } 
          // Handle General Errors
          else {
            setErrors({ api: "Registration failed. Please try again." });
          }
        } else {
          setErrors({ api: "Unable to connect to server. Try again later." });
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
            <label htmlFor="full_name">Full Name</label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              placeholder="Enter your full name"
              className={`input-box ${errors.full_name ? "input-error" : ""}`}
              value={formData.full_name}
              onChange={handleChange}
            />
            {errors.full_name && <p className="error">{errors.full_name}</p>}
          </div>

          <div className="input-container">
            <label htmlFor="nationality">Nationality</label>
            <input
              type="text"
              id="nationality"
              name="nationality"
              placeholder="Enter your nationality"
              className={`input-box ${errors.nationality ? "input-error" : ""}`}
              value={formData.nationality}
              onChange={handleChange}
            />
            {errors.nationality && <p className="error">{errors.nationality}</p>}
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
          <label htmlFor="about_you">About You</label>
          <textarea
            id="about_you"
            name="about_you"
            placeholder="Tell us about yourself"
            className={`input-box ${errors.about_you ? "input-error" : ""}`}
            value={formData.about_you}
            onChange={handleChange}
            onInput={(e) => {
              e.target.style.height = "auto"; // Reset height
              e.target.style.height = e.target.scrollHeight + "px"; // Adjust height based on content
            }}
          />
          {errors.about_you && <p className="error">{errors.about_you}</p>}
        </div>

        <div className="input-container">
            <label htmlFor="certificate">Certificate</label>
            <div className="file-upload-container">
              <div className={`file-input-wrapper ${errors.about_you ? "input-error" : ""}`}>
                {pdfUrl ? (
                  <button
                    onClick={() => window.open(pdfUrl, "_blank")}
                    className="pdf-preview-btn"
                  >
                    View PDF
                  </button>
                ) : (
                  <span className="no-file-text">No PDF chosen</span>
                )}

                <label htmlFor="certificate" className="upload-btn">
                  Choose PDF <FaUpload className="upload-icon" />
                </label>
                <input
                  type="file"
                  id="certificate"
                  name="certificate"
                  className="input-file"
                  onChange={handleFileChange}
                  accept=".pdf"
                />
              </div>
            </div>
            {errors.certificate && <p className="error">{errors.certificate}</p>}
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
          <li>Simplify your culinary journey effortlessly</li>
          <li>Share your expertise by curating and approving top-quality recipes.</li>
          <li>Help users discover new cuisines and expand their cooking skills.</li>
          <li>Gain recognition as a trusted professional in the culinary community.</li>
          <li>Share your expertise with a growing community of food enthusiasts.</li>
          <li>Curate and showcase unique recipes that inspire creativity.</li>
        </ul>
        <span className="brand-text">Bhansako Swad</span>
      </div>
    </div>
  );
}

export default ChefSignUp;