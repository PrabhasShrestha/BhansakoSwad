import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaEye, FaEyeSlash, FaUpload } from "react-icons/fa";
import { ToastContainer, toast } from 'react-toastify';
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

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];

      if (file.type.match('image.*')) {
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
    if (!formData.full_name) {
      errors.full_name = "Full Name is required";
      toast.error("Full Name is required");
    }
    if (!formData.nationality) {
      errors.nationality = "Nationality is required";
      toast.error("Nationality is required");
    }
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Valid email is required";
      toast.error("Valid email is required");
    }
    if (!formData.phone_number || formData.phone_number.length !== 10) {
      errors.phone_number = "Phone Number must be 10 digits";
      toast.error("Phone Number must be 10 digits");
    }
    if (!formData.about_you) {
      errors.about_you = "About You is required";
      toast.error("About You is required");
    }
    if (!formData.password) {
      errors.password = "Password is required";
      toast.error("Password is required");
    }
    if (!formData.certificate) {
      errors.certificate = "Certificate is required";
      toast.error("Certificate is required");
    }

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
  
        console.log("Response from backend:", response.data);
        localStorage.setItem("email", formData.email);
        toast.success("Your account has been submitted for verification. Please wait for admin approval.", { autoClose: 4000 });
        setTimeout(() => {
          navigate("/");
        }, 4000);
  
      } catch (error) {
        if (error.response) {
          console.error("Error Response Data:", error.response.data);
  
          if (error.response.status === 400) {
            setErrors({ password: error.response.data.msg });
            toast.error(error.response.data.msg);
          } 
          else if (error.response.status === 409) {
            setErrors({ email: "This email is already registered as a chef." });
            toast.error("This email is already registered as a chef.");
          } 
          else {
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
            <label htmlFor="about_you">About You</label>
            <textarea
              id="about_you"
              name="about_you"
              placeholder="Tell us about yourself"
              className={`input-box ${errors.about_you ? "input-error" : ""}`}
              value={formData.about_you}
              onChange={handleChange}
              onInput={(e) => {
                e.target.style.height = "auto"; 
                e.target.style.height = e.target.scrollHeight + "px";
              }}
            />
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
          Already have an account? <a href="/login" className="login-link">Login</a>
        </p>
      </div>

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