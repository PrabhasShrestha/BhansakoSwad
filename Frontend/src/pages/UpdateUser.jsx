import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import "../styles/UpdateUser.css";
import Footer from "../components/Footer";
import Navigationbar from "../components/NavBar";
import userImage from '../assets/user.png';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    address: "",
    email: "",
    phone_number: "",
    image: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState("");
  const [passwordChangeError, setPasswordChangeError] = useState("");
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  useEffect(() => {
    axios
      .get("http://localhost:3000/api/get-user", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((response) => {
        const data = response.data.data;
        setUser(data);
        setFormData({
          first_name: data.first_name,
          last_name: data.last_name,
          address: data.address,
          email: data.email,
          phone_number: data.phone_number,
          image: data.image || null,
        });
        setLoading(false);
      })
      .catch((error) => {
        setError(error.response?.data?.message || "Failed to fetch user data");
        setLoading(false);
      });
  }, []);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSubmitPasswordChange = (e) => {
    e.preventDefault();
  
    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordChangeError("All fields are required.");
      setPasswordChangeSuccess(""); // Clear success message
      return;
    }
  
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordChangeError("New password and confirm password do not match.");
      setPasswordChangeSuccess(""); // Clear success message
      return;
    }
  
    // Send the API request to change the password
    axios
      .post(
        "http://localhost:3000/api/change-password",
        {
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // Attach the JWT token
          },
        }
      )
      .then((response) => {
        // Display success message
        setPasswordChangeSuccess(response.data.message || "Password updated successfully.");
        setPasswordChangeError(""); // Clear error message
        setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => {
          setIsChangePasswordOpen(false);
          localStorage.removeItem("token"); // Clear the token
          navigate("/login"); // Redirect to login page
        }, 2000); // Clear form
      })
      .catch((error) => {
        // Display error message
        setPasswordChangeError(error.response?.data?.message || "Failed to change password. Please try again.");
        setPasswordChangeSuccess(""); // Clear success message
      });
  };
  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (value) {
        data.append(key, value);
      }
    });

    axios
      .post("http://localhost:3000/api/update-profile", data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      })
      .then(() => {
        setSuccessMessage("Profile updated successfully!");
        setEditMode(false); // Disable edit mode after saving
        setTimeout(() => setSuccessMessage(""), 3000);
        setTimeout(() => {
          window.location.reload(); // Reload the page after 3 seconds
        }, 3000); // Clear message after 3 seconds
      })
      .catch((error) => {
        setError(error.response?.data?.message || "Failed to update profile");
        if (errorMessage.includes("Duplicate entry")) {
          setError("The email address is already in use. Please try a different one.");
        } else {
          setError(errorMessage);
        }
      });
  };

  const handleEditClick = () => {
    setEditMode(true); // Enable edit mode
  };

  const handleCancelClick = () => {
    setEditMode(false); // Disable edit mode
    setError(null); // Clear any errors
    setFormData({ ...user }); // Reset form data to the original user data
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("image", file);
  
    axios
      .post("http://localhost:3000/api/upload-image", formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        const uploadedImagePath = response.data.image; // Use the backend's response
        setFormData((prevData) => ({
          ...prevData,
          image: `http://localhost:3000${uploadedImagePath}`, // Prepend the base URL for immediate rendering
        }));
        setSuccessMessage("Image uploaded successfully!");
        setTimeout(() => setSuccessMessage(""), 3000); // Clear success message
      })
      .catch((error) => {
        console.error("Image upload failed:", error.response?.data || error.message);
        alert("Image upload failed. Please try again.");
      });
  };
  
  
  
  const handleRemoveImage = () => {
    axios
      .delete("http://localhost:3000/api/remove-image", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then(() => {
        setFormData((prevData) => ({
          ...prevData,
          image: null,
        }));
        setSuccessMessage("Image removed successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      })
      .catch((error) => {
        console.error("Error removing image:", error.response?.data || error.message);
        setError(error.response?.data?.message || "Failed to remove the image");
      });
  };
  
  if (loading) {
    return <div>Loading your profile...</div>;
  }

  if (error && !editMode) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="Update Profile">
      <Navigationbar/>
    <div className="profile-page-container">
      <h1 className="profile-title">User Profile</h1>
      <p className="profile-subtitle">Manage your details and update your information.</p>

      <div className="profile-wrapper">
        <div className="profile-info">
        <img
          src={formData.image ? formData.image : userImage}
          alt="Profile Avatar"
          className="profile-avatar"
          
        />
        
        {!editMode && (
            <button
            type="button"
            className="logout-btn"
            onClick={() => {
              localStorage.removeItem("token"); // Clear the token
              window.location.href = "/login"; // Redirect to the login page
            }}
          >
            Log Out
          </button>
        )}

          {editMode && (
            <div className="image-actions">
              <input
                type="file"
                id="file-input"
                style={{ display: "none" }}
                onChange={handleImageUpload}
              />
              <button
                type="button"
                className="image-btn secondary-btn"
                onClick={() => document.getElementById("file-input").click()}
              >
                Add Image
              </button>
              <button
                type="button"
                className="image-btn cancel-btn"
                onClick={handleRemoveImage}
              >
                Remove Image
              </button>
            </div>
          )}
        </div>

        <div className="profile-details">
          <h2 className="details-title">General Information</h2>
          <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
            <div className="input-group">
              <label>First Name:</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                disabled={!editMode}
                required
              />
            </div>

            <div className="input-group">
              <label>Last Name:</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                disabled={!editMode}
                required
              />
            </div>

            <div className="input-group">
              <label>Email:</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!editMode}
                required
              />
            </div>

            <div className="input-group">
              <label>Phone Number:</label>
              <input
                type="text"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                disabled={!editMode}
                required
              />
            </div>

            <div className="input-group">
              <label>Address:</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={!editMode}
                required
              />
            </div>

            {editMode ? (
              <div className="button-container">
                <button type="submit" className="secondary-btn">
                  Save Changes
                </button>
                <button
                  type="button"
                  className="secondary-btn cancel-btn"
                  onClick={handleCancelClick}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="secondary-btn"
                onClick={handleEditClick}
              >
                Edit Profile
              </button>
              

            )}
          {!editMode && (
            <button
              type="button"
              className="secondary-btn"
              onClick={() => setIsChangePasswordOpen(true)}>
              Change Password
            </button>
          )}
      </form>
            {isChangePasswordOpen && (
        <div className="password-modal-overlay">
          <div className="password-modal">
            <form onSubmit={handleSubmitPasswordChange}>
              <h2>Change Password</h2>
              <div className="input-group">
                <label>Old Password</label>
                <div className="password-input">
                  <input
                    type={showPassword.oldPassword ? "text" : "password"}
                    name="oldPassword"
                    value={passwordData.oldPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                  {showPassword.oldPassword ? (
                    <AiFillEyeInvisible
                      onClick={() => togglePasswordVisibility("oldPassword")}
                    />
                  ) : (
                    <AiFillEye
                      onClick={() => togglePasswordVisibility("oldPassword")}
                    />
                  )}
                </div>
              </div>
              <div className="input-group">
                <label>New Password</label>
                <div className="password-input">
                  <input
                    type={showPassword.newPassword ? "text" : "password"}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                  {showPassword.newPassword ? (
                    <AiFillEyeInvisible
                      onClick={() => togglePasswordVisibility("newPassword")}
                    />
                  ) : (
                    <AiFillEye
                      onClick={() => togglePasswordVisibility("newPassword")}
                    />
                  )}
                </div>
              </div>
              <div className="input-group">
                <label>Confirm Password</label>
                <div className="password-input">
                  <input
                    type={showPassword.confirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                  {showPassword.confirmPassword ? (
                    <AiFillEyeInvisible
                      onClick={() => togglePasswordVisibility("confirmPassword")}
                    />
                  ) : (
                    <AiFillEye
                      onClick={() => togglePasswordVisibility("confirmPassword")}
                    />
                  )}
                </div>
              </div>
              {/* Success and Error Messages */}
              {passwordChangeError && (
                <div className="error-message">{passwordChangeError}</div>
              )}
              {passwordChangeSuccess && (
                <div className="success-message">{passwordChangeSuccess}</div>
              )}
              <div className="button-group">
                <button type="submit">Submit</button>
                <button
                  type="button"
                  onClick={() => {
                    setPasswordChangeError(""); // Clear error message
                    setPasswordChangeSuccess(""); // Clear success message
                    setIsChangePasswordOpen(false);
                  }}
                  disabled={!!passwordChangeSuccess} 
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
             {/* Success Message */}
      {successMessage && <div className="success-message">{successMessage}</div>}
        </div>
      </div>
      </div>
      <Footer/>
    </div>
  );
};

export default ProfilePage;
