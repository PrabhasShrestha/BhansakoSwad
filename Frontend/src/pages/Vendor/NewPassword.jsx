import React, { useState } from "react";
import axios from "axios";
import "../../styles/NewPass.css";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai"; // Import eye icons

const CreateNewSellerPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false); // To toggle visibility of new password
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // To toggle visibility of confirm password

  const urlParams = new URLSearchParams(window.location.search);
  const resetToken = urlParams.get("token"); // Get the token from the query params

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match!");
      setMessage("");
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:3000/api/resetseller-password?token=${resetToken}`, // Use resetToken here
        { newPassword: newPassword }
      );

      setMessage(response.data.message);
      setError("");

      // After successful password reset, wait 3 seconds and redirect to login page
      setTimeout(() => {
        window.location.href = '/login'; // Redirect to login page
      }, 3000);

    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
      setMessage("");
    }
  };

  return (
    <div className="password-container">
      <div className="password-box">
        <h1>Create New Password</h1>
        <p>Your new password must be different from any of your previous passwords.</p>
        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSubmit}>
          <label>New Password</label>
          <div className="password-input-container">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <span
              className="eye-icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <AiFillEye /> : <AiFillEyeInvisible />}
            </span>
          </div>

          <label>Confirm Password</label>
          <div className="password-input-container">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Re-enter Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <span
              className="eye-icon"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <AiFillEye /> : <AiFillEyeInvisible />}
            </span>
          </div>

          <button type="submit">Reset Password</button>
        </form>
      </div>
    </div>
  );
};

export default CreateNewSellerPassword;
