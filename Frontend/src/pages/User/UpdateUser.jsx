import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { toast, ToastContainer } from "react-toastify";
import "../../styles/User/UpdateUser.css";
import Footer from "../../components/Footer";
import Navigationbar from "../../components/NavBar";
import userImage from '../../assets/user.png';
import { FiLogOut } from "react-icons/fi";

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
  const [editMode, setEditMode] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
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
        toast.error(error.response?.data?.message || "Failed to fetch user data");
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
      toast.error("All fields are required.");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New password and confirm password do not match.");
      return;
    }

    axios
      .post(
        "http://localhost:3000/api/change-password",
        {
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      )
      .then((response) => {
        toast.success(response.data.message || "Password updated successfully.");
        setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => {
          setIsChangePasswordOpen(false);
          localStorage.removeItem("token");
          navigate("/login");
        }, 2000);
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Failed to change password. Please try again.");
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
        toast.success("Profile updated successfully!");
        setEditMode(false);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      })
      .catch((error) => {
        const errorMessage = error.response?.data?.message || "Failed to update profile";
        if (errorMessage.includes("Duplicate entry")) {
          toast.error("The email address is already in use. Please try a different one.");
        } else {
          toast.error(errorMessage);
        }
      });
  };

  const handleEditClick = () => {
    setEditMode(true);
  };

  const handleCancelClick = () => {
    setEditMode(false);
    setFormData({ ...user });
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
        const uploadedImagePath = response.data.image;
        setFormData((prevData) => ({
          ...prevData,
          image: `http://localhost:3000${uploadedImagePath}`,
        }));
        toast.success("Image uploaded successfully!");
      })
      .catch((error) => {
        toast.error("Image upload failed. Please try again.");
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
        toast.success("Image removed successfully!");
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Failed to remove the image");
      });
  };

  const handleGoPremium = () => {
    localStorage.setItem("premium_plan", JSON.stringify({
      plan: "Monthly Premium",
      price: 1500,
    }));
    navigate("/paymentdetails");
  };

  if (loading) {
    return <div>Loading your profile...</div>;
  }

  return (
    <div className="Update Profile">
      <Navigationbar />
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
                  className="image-btns"
                  onClick={() => document.getElementById("file-input").click()}
                >
                  Set
                </button>
                <button
                  type="button"
                  className="image-btn-cancels"
                  onClick={handleRemoveImage}
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <div className="profile-details">
            <h2 className="details-title">General Information</h2>
            <form onSubmit={handleSubmit}>
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
              <label>Account Status:</label>
                <div className="account-status-container">
                <p className="account-status">
                  {user.is_premium ? "Premium User" : "Normal User"}
                </p>
                {!user.is_premium && !editMode && (
                  <button
                    type="button"
                    className="go-premium-btn"
                    onClick={() => setShowPremiumModal(true)}
                  >
                    Go Premium
                  </button>
                )}
              </div>
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
                    className="secondary-btn cancel-btns"
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
                  onClick={() => setIsChangePasswordOpen(true)}
                >
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
                    <div className="button-group">
                      <button type="submit">Submit</button>
                      <button
                        type="button"
                        onClick={() => setIsChangePasswordOpen(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
        <p
          className="logout-text"
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("userId");
            window.location.href = "/login";
          }}
        >
          <FiLogOut className="logout-icon" /> Logout
        </p>
        {showPremiumModal && (
          <div className="premium-modal-overlay">
            <div className="premium-modal-container">
              <div className="premium-modal-content">
                <h2 className="premium-modal-title">Premium</h2>
                <p className="premium-modal-description">
                  Unlock the full potential of your culinary journey with our Premium Membership!
                </p>
                <div className="premium-modal-price">
                  <span>Rs 1500/month</span>
                </div>
                <button className="premium-modal-button" onClick={handleGoPremium}>
                  Go Premium
                </button>
                <div className="premium-modal-features">
                  <h3 className="premium-modal-features-title">Exclusive Chef Access</h3>
                  <div className="premium-modal-feature">
                    <div className="premium-modal-check">✓</div>
                    <p>Access exclusive, chef-crafted recipes tailored to your tastes and dietary needs</p>
                  </div>
                  <div className="premium-modal-feature">
                    <div className="premium-modal-check">✓</div>
                    <p>Be the first to try new features and seasonal recipe collection</p>
                  </div>
                  <div className="premium-modal-feature">
                    <div className="premium-modal-check">✓</div>
                    <p>Unlock all these benefits for just Rs1500/month, with no hidden fees.</p>
                  </div>
                  <div className="premium-modal-feature">
                    <div className="premium-modal-check">✓</div>
                    <p>Explore a growing library of chef-exclusive recipes designed to inspire your cooking.</p>
                  </div>
                  <div className="premium-modal-feature">
                    <div className="premium-modal-check">✓</div>
                    <p>Discover secret ingredients and methods used by professional chefs in their recipes.</p>
                  </div>
                </div>
              </div>
              <button className="back-modal-button" onClick={() => setShowPremiumModal(false)}>
                Back
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
    </div>
  );
};

export default ProfilePage;