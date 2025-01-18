import React from 'react';
import '../styles/Footer.css'; // Import the CSS file

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        {/* About Section */}
        <div className="footer-section about">
          <h3>Bhansako Swad</h3>
          <p>
            Welcome to Bhansako Swad, your ultimate destination for easy and tasty recipes! 
            Our mission is to help you cook like a pro with simple steps and delicious results.
          </p>
        </div>

        {/* Contact Section */}
        <div className="footer-section-contact">
          <h3>Contact Us</h3>
          <p>bhansakoswad@gmail.com</p>
          <p>214 Kathmandu, Nepal, Bhansako Swad</p>
          <p>+977 9812345678</p>
        </div>

        {/* Review Section */}
        <div className="footer-section review">
          <h3>Review</h3>
          <p>
            We value your opinion! Write a review and let us know how we're doing.
          </p>
          <button className="review-button">Write a Review</button>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <hr />
        <p>© 2024 Bhansako Swad. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
