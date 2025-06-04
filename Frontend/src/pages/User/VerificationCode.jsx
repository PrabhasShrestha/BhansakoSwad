import React, { useState, useEffect } from "react";
import "../../styles/Verification.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const VerificationCode = () => {
  const [code, setCode] = useState(new Array(6).fill(""));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [isResending, setIsResending] = useState(false);
  const navigate = useNavigate();

  // Retrieve email stored after user registration
  const email = localStorage.getItem("email");

  useEffect(() => {
    if (!email) {
      setError("Email is required to verify. Please register again.");
      return;
    }
  }, [email]);

  useEffect(() => {
    if (error || success || resendMessage) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
        setResendMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success, resendMessage]);

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
      toast.error("Please enter a complete 6-digit verification code.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:3000/api/verify-code", {
        email,
        verificationCode,
      });

      if (response.data.success) {
        toast.success("Verification successful! You can now log in.");
        setTimeout(() => {
          navigate("/Login");
        }, 2000);
      } else {
        toast.error("Correct code should be used, please check email.");
      }
    } catch (error) {
      if (error.response) {
        toast.error(error.response.data.message || "Correct code should be used, Please check your email properly.");
      } else if (error.request) {
        toast.error("No response from server. Please check your connection.");
      } else {
        toast.error("An unexpected error occurred.");
      }
      console.error("Verification Error:", error);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setResendMessage("");

    try {
      const response = await axios.post("http://localhost:3000/api/resend-code", { email });

      console.log("Resend Code Response:", response.data); // Debugging log

      if (response.data.success) {
        toast.info("A new verification code has been sent to your email.");
      } else {
        toast.error(response.data.message || "Failed to resend the code. Please try again.");
      }
    } catch (error) {
      if (error.response) {
        toast.error(error.response.data.message || "Failed to resend the code.");
      } else if (error.request) {
        toast.error("No response from server. Please check your connection.");
      } else {
        toast.error("An unexpected error occurred.");
      }
      console.error("Resend Code Error:", error);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="verification-container">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
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
        <button className="verify-button" onClick={handleVerify}>
          Verify
        </button>
        <button className="resend-button" onClick={handleResendCode} disabled={isResending}>
          {isResending ? "Sending..." : "Resend Code"}
        </button>
      </div>
    </div>
  );
};

export default VerificationCode;