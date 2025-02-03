import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import Sidebar from "../../components/Sidebar";
import "../../styles/Vendor/UpdateSeller.css";
import vendorImage from '../../assets/store.jpg';
import { FiLogOut } from "react-icons/fi";

const SellerUpdatePage = () => {
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [formData, setFormData] = useState({
    shopName: "",
    ownerName: "",
    storeAddress: "",
    email: "",
    phoneNumber: "",
    image: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
    fetchVendorData();
  }, []);

  const fetchVendorData = () => {
    axios.get("http://localhost:3000/api/get-seller", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
    .then((response) => {
      const data = response.data.data;
      const FormData = {
        shopName: data.shop_name,
        ownerName: data.owner_name,
        storeAddress: data.store_address,
        email: data.email,
        phoneNumber: data.phone_number,
        image: data.image || vendorImage,
      };
      setFormData(FormData);
      setVendor(FormData);
      setLoading(false);
    })
    .catch((error) => {
      setError(error.response?.data?.message || "Failed to fetch vendor data");
      setLoading(false);
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    const phoneRegex = /^[0-9]{10}$/; // Assuming 10-digit phone numbers
    if (!phoneRegex.test(formData.phoneNumber)) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }

    const data = new FormData();
    data.append("shop_name", formData.shopName);
    data.append("owner_name", formData.ownerName);
    data.append("store_address", formData.storeAddress);
    data.append("email", formData.email);
    data.append("phone_number", formData.phoneNumber);
  
    if (formData.image && formData.image instanceof File) {
      data.append("image", formData.image);
    }
  
    axios.post("http://localhost:3000/api/update-seller", data, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "multipart/form-data",
      },
    })
    .then(() => {
      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
      setEditMode(false);
      fetchVendorData();
    })
    .catch(error => {
      setError(error.response?.data?.message || "Failed to update profile");
    });
  };

  const handleCancelClick = () => {
    setEditMode(false); // Disable edit mode
    setError(null); // Clear any errors
    setFormData(vendor); // Reset form data to the original user data
  };


  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    const formData = new FormData();
    formData.append("image", file);
  
    axios
      .post("http://localhost:3000/api/upload-seller-image", formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        console.log("Uploaded Image Response:", response.data); // Debugging
  
        if (response.data?.image) {
          setFormData((prevData) => ({
            ...prevData,
            image: response.data.image + `?t=${new Date().getTime()}`, // Force cache refresh
          }));
        } else {
          console.error("Image field missing in API response", response.data);
        }
  
        setSuccessMessage("Image uploaded successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      })
      .catch((error) => {
        setError(error.response?.data?.message || "Image upload failed");
      });
  };
  
  const handleRemoveImage = () => {
    axios.delete("http://localhost:3000/api/remove-seller-image", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
    .then(() => {
      setFormData(prev => ({ ...prev, image: null }));
      setSuccessMessage("Image removed successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    })
    .catch(error => {
      setError(error.response?.data?.message || "Failed to remove image");
    });
  };

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
        "http://localhost:3000/api/change-password-seller",
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
  

  if (loading) return <div>Loading vendor profile...</div>;
 

  return (
    <div className="seller-grid">
      <Sidebar />
      <div className="vendor-update-page">
        <div className="vendor-container">
          <h1 className="vendor-header">Shop Profile</h1>
          <p className="vendor-subheader">Manage your shop information</p>

          <div className="vendor-profile-wrapper">
            <div className="vendor-image-section">
            <img
              src={formData.image ? `${formData.image}?t=${new Date().getTime()}` : vendorImage}
              alt="Shop Logo"
              className="shop-logo"
            />

              {editMode && (
                <div className="image-controls">
                  <input
                    type="file"
                    id="shop-image-upload"
                    hidden
                    onChange={handleImageUpload}
                  />
                  <button
                    className="image-btn"
                    onClick={() => document.getElementById("shop-image-upload").click()}
                  >
                    Upload
                  </button>
                  <button className="image-btn remove-btn" onClick={handleRemoveImage}>
                    Remove
                  </button>
                </div>
              )}
            </div>

            <div className="vendor-details-section">
              <form onSubmit={handleSubmit}>
                {error && <div className="error-message">{error}</div>}
                
                <div className="form-group">
                  <label>Shop Name</label>
                  <input
                    type="text"
                    name="shopName"
                    value={formData.shopName}
                    onChange={handleChange}
                    disabled={!editMode}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Owner Name</label>
                  <input
                    type="text"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleChange}
                    disabled={!editMode}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Store Address</label>
                  <input
                    type="text"
                    name="storeAddress"
                    value={formData.storeAddress}
                    onChange={handleChange}
                    disabled={!editMode}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!editMode}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    disabled={!editMode}
                    required
                  />
                </div>
                {editMode && (
                <div className="form-actions">
                  <button type="submit" className="save-btn">
                    Save Changes
                  </button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={handleCancelClick}
                  >
                    Cancel
                  </button>
                </div>
              )}
              </form>
              {!editMode && (
                <>
                  <button
                    type="button"
                    className="edit-btn"
                    onClick={() => {
                      setEditMode(true);
                      setSuccessMessage("");
                    }}
                  >
                    Edit Profile
                  </button>
                  <button
                    type="button"
                    className="edit-btn"
                    onClick={() => setIsChangePasswordOpen(true)}
                  >
                    Change Password
                  </button>
                </>
              )}
            </div>
            </div>
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
          {successMessage && <p className="success-message">{successMessage}</p>}
          <p className="logout-text" onClick={() => {
              localStorage.removeItem("token"); // Clear the token
              window.location.href = "/login"; // Redirect to the login page
            }}
          >
        <FiLogOut className="logout-icon" /> Logout
        </p>
        </div>
      </div>
    </div>
  );
};

export default SellerUpdatePage;