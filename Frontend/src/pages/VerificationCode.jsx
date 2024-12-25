import React, { useState, useEffect } from "react";
import "../styles/Verification.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const VerificationCode = () => {
  const [code, setCode] = useState(new Array(6).fill(""));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  // Retrieve email stored after user registration (e.g., from localStorage or state)
  const email = localStorage.getItem("email"); // Store email after registration in localStorage

  useEffect(() => {
    if (!email) {
      setError("Email is required to verify. Please register again.");
      return;
    }
  }, [email]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return;

    const newCode = [...code];
    newCode[index] = element.value;
    setCode(newCode);

    if (element.nextSibling) {
      element.nextSibling.focus();
    }
  };

  const handleVerify = async () => {
    const verificationCode = code.join(""); // Join the code array to make a string

    if (verificationCode.length !== 6) {
      setError("Please enter a complete 6-digit verification code.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:3000/api/verify-code", {
        email,
        verificationCode,
      });

      if (response.data.success) {
        setSuccess("Verification successful! You can now log in.");
        setError(""); // Clear previous errors
        setTimeout(() => {
          navigate("/Login"); // Navigate to login or wherever needed
        }, 2000);
      } else {
        setError(response.data.message || "Verification failed. Please try again.");
      }
    } catch (error) {
      setError("An error occurred during verification.");
      console.error("Verification Error:", error);
    }
  };

  // Function to handle "Back" button
  const handleBack = () => {
    navigate(-1); // Navigate to the previous page in history
  };

  return (
    <div className="verification-container">
      <div className="verification-box">
        <h2>Verify</h2>
        <p>Please check your email for the 6-digit verification code.</p>
        <div className="verification-inputs">
          {code.map((digit, index) => (
            <input
              key={index}
              type="text"
              maxLength="1"
              value={digit}
              onChange={(e) => handleChange(e.target, index)}
              onFocus={(e) => e.target.select()}
            />
          ))}
        </div>
        <div className="digits-left">{6 - code.filter(Boolean).length} digits left</div>
        <button className="verify-button" onClick={handleVerify}>Verify</button>
        <button className="back-button" onClick={handleBack}>Back</button> {/* Back button */}
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
      </div>
    </div>
  );
};

export default VerificationCode;
