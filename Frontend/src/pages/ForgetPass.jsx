import React, { useState } from "react";
import axios from "axios"; // Import axios for making API calls
import "../styles/ForgotPass.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("http://localhost:3000/api/forgot-password", { email });
      setMessage(response.data.message);
      setError(""); // Clear any previous errors
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
      setMessage(""); // Clear any previous success messages
    }
  };

  return (
    <div className="forgot-container">
      <div className="forgot-box">
        <h1>Forgot Password</h1>
        <p>
          Enter the email address you used to create the account, and we will
          email you instructions to reset your password.
        </p>
        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSubmit}>
          <label>Email Address</label>
          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Send Email</button>
        </form>
        <p>
          Remember Password? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
