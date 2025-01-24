import React, { useEffect, useState } from 'react';
import axios from 'axios';
import "../styles/UpdateUser.css";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    address: '',
    email: '',
    phone_number: '',
    image: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch user data on component mount
    axios
      .get('http://localhost:3000/api/get-user', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
      .then((response) => {
        const data = response.data.data;
        console.log('Fetched user data:', data); // Debug log
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
        setError(error.response?.data?.message || 'Failed to fetch user data');
        setLoading(false);
      });
  }, []);

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
      .post('http://localhost:3000/api/update-profile', data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data',
        },
      })
      .then((response) => {
        alert('Profile updated successfully!');
        setFormData({
          ...formData,
          image: null, // Reset image field after submission
        });
      })
      .catch((error) => {
        console.error('Error:', error.response || error.message);
        setError(error.response?.data?.message || 'Failed to update profile');
      });
  };

  const handleImageClick = () => {
    document.getElementById('file-input').click(); // Trigger file input click
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('image', file);

    // Upload the image to the backend
    axios
      .post('http://localhost:3000/api/upload-image', formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data',
        },
      })
      .then((response) => {
        console.log('Uploaded image:', response.data.image); // Debug log
        setFormData({
          ...formData,
          image: response.data.image, // Assuming backend returns the image URL or filename
        });
      })
      .catch((error) => {
        console.error('Image upload failed', error);
      });
  };

  if (loading) {
    return <div>Loading your profile...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="profile-page-container">
      <h1 className="profile-title">User Profile</h1>
      <p className="profile-subtitle">Manage your details and update your information.</p>

      <div className="profile-wrapper">
        {/* Profile Info */}
        <div className="profile-info">
          <img
            src={
              formData.image
                ? formData.image // Base64 or URL from the backend
                : 'default-avatar.png' // Fallback image
            }
            alt="Profile Avatar"
            className="profile-avatar"
            onClick={handleImageClick} // Allow click to upload
          />
          <input
            type="file"
            id="file-input"
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />
        </div>

        {/* General Information */}
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
                required
              />
            </div>

            <button type="submit" className="secondary-btn">
              Edit Profile
            </button>
          </form>
        </div>
      </div>

      {/* Security Section */}
      <div className="security-section">
        <h2 className="details-title">Security</h2>
        <div className="security-fields">
          <div className="input-group">
            <label>Email:</label>
            <input type="email" value={formData.email} disabled />
          </div>
          <div className="input-group">
            <label>Password:</label>
            <input type="password" value="********" disabled />
          </div>
          <div className="input-group">
            <label>Phone Number:</label>
            <input type="text" value={formData.phone_number} disabled />
          </div>
        </div>

        <div className="security-buttons">
          <button className="secondary-btn">Change Password</button>
          <button className="secondary-btn">Change Phone Number</button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
