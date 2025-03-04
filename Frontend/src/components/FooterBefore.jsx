import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import navigate from react-router-dom
import '../styles/Footer.css'; // CSS for modal styles
import StoreImage from '../assets/store.jpg';
import ChefImage from '../assets/chef.jpg';

const FooterBefore = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState(''); // Track whether it's seller or chef popup
  const navigate = useNavigate(); // Initialize the navigate function

  const togglePopup = (type) => {
    setPopupType(type); // Set popup type (seller or chef)
    setShowPopup(!showPopup);
  };

  return (
    <>
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section about">
            <h3>Bhansako Swad</h3>
            <p>
              Welcome to Bhansako Swad, your ultimate destination for easy and tasty recipes!
              Our mission is to help you cook like a pro with simple steps and delicious results.
            </p>
          </div>
          <div className="footer-section-contact">
            <h3>Contact Us</h3>
            <p>bhansakoswad@gmail.com</p>
            <p>214 Kathmandu, Nepal</p>
            <p>+977 9812345678</p>
          </div>
          <div className="footer-section navigation" style={{ marginLeft: '200px', top: '0' }}>
            <h3 style={{ color: 'white' }}>Navigation</h3>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/aboutus">About</a></li>
              <li><a href="/recipes">Recipe</a></li>
              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault(); // Prevent default anchor behavior
                    togglePopup('seller'); // Toggle the popup for seller
                  }}
                >
                  Seller
                </a>
              </li>
              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault(); // Prevent default anchor behavior
                    togglePopup('chef'); // Toggle the popup for chef
                  }}
                >
                  Chef
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <hr />
          <p>© 2024 Bhansako Swad. All rights reserved.</p>
        </div>
      </footer>

      {showPopup && (
        <div className="popup-overlay" onClick={() => togglePopup('')}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <div className="popup-image">
            <img src={popupType === 'seller' ? StoreImage : ChefImage} alt={popupType === 'seller' ? "Store" : "Chef"} />
            </div>
            <h2>{popupType === 'seller' ? 'Seller' : 'Chef'}</h2>
            <p>
              {popupType === 'seller'
                ? `Join Bhansako Swad, your trusted platform for sharing the unique taste of your locally crafted products. We connect sellers like you to a wide community of customers who value authentic, homegrown flavors. Bhansako Swad is your partner in creating delightful shopping experiences that celebrate the richness of local traditions and cuisines.`
                : `Join Bhasako Swad, the platform that allows chefs like you to showcase your culinary creations and share authentic, homegrown flavors with a wider audience. We connect you with a community that values traditional and locally crafted dishes, providing the perfect space to highlight your unique recipes and build meaningful connections with customers who appreciate the richness of local cuisines. `}
            </p>
            <ul className="popup-list">
              {popupType === 'seller' ? (
                <>
                  <li>Showcase your products to a growing customer base that values authenticity.</li>
                  <li>Gain access to user-friendly seller tools to manage and grow your store effortlessly.</li>
                  <li>Enjoy a simple and transparent model—pay commission only when your products sell.</li>
                  <li>Be part of a community that supports local businesses and traditions.</li>
                </>
              ) : (
                <>
                  <li>Showcase your culinary creations to a growing customer base that values authenticity and tradition.</li>
                  <li>Gain access to tools and resources to grow your culinary brand effortlessly.</li>
                  <li>Earn recognition and rewards for your culinary skills.</li>
                  <li>Be part of a community that celebrates culinary diversity and creativity.</li>
                </>
              )}
            </ul>
            <div className="button-container">
              <button
                className="signup-btn"
                onClick={() => navigate(popupType === 'seller' ? '/sellersignUp' : '/chefSignUp')} // Navigate based on popup type
              >
                {popupType === 'seller' ? 'Sign Up As Seller' : 'Sign Up As Chef'}
              </button>
              <button className="close-btn" onClick={() => togglePopup('')}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FooterBefore;
