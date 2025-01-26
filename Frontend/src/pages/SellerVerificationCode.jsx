import React, { useState, useEffect } from "react";
import "../styles/Verification.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const SellerVerificationCode = () => {
  const [code, setCode] = useState(new Array(6).fill(""));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [isResending, setIsResending] = useState(false);
  const navigate = useNavigate();

  // Retrieve email stored after seller registration
  const email = localStorage.getItem("email");

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
    const verificationCode = code.join("");

    if (verificationCode.length !== 6) {
      setError("Please enter a complete 6-digit verification code.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:3000/api/verifyseller", {
        email,
        verificationCode,
      });

      if (response.data.success) {
        setSuccess("Verification successful! You can now log in.");
        setError("");
        setTimeout(() => {
          navigate("/Login");
        }, 2000);
      } else {
        setError(response.data.message || "Verification failed. Please try again.");
      }
    } catch (error) {
      if (error.response) {
        setError(error.response.data.message || "An error occurred during verification.");
      } else if (error.request) {
        setError("No response from server. Please check your connection.");
      } else {
        setError("An unexpected error occurred.");
      }
      console.error("Verification Error:", error);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setResendMessage("");

    try {
      const response = await axios.post("http://localhost:3000/api/resendseller", { email });

      if (response.data.success) {
        setResendMessage("A new verification code has been sent to your email.");
        setError("");
      } else {
        setError(response.data.message || "Failed to resend the code. Please try again.");
      }
    } catch (error) {
      if (error.response) {
        setError(error.response.data.message || "Failed to resend the code.");
      } else if (error.request) {
        setError("No response from server. Please check your connection.");
      } else {
        setError("An unexpected error occurred.");
      }
      console.error("Resend Code Error:", error);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="verification-container">
      <div className="verification-box">
        <h2>Verify Seller Account</h2>
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
        <button className="verify-button" onClick={handleVerify}>
          Verify
        </button>
        <button className="resend-button" onClick={handleResendCode} disabled={isResending}>
          {isResending ? "Sending..." : "Resend Code"}
        </button>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
        {resendMessage && <p className="resend-message">{resendMessage}</p>}
      </div>
    </div>
  );
};

export default SellerVerificationCode;
