import React from 'react';
import '../styles/Footer.css'; // Import the CSS file

const IndexFooter = () => {
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
          <p>214 Kathmandu, Nepal</p>
          <p>+977 9812345678</p>
        </div>

        {/* Navigation Section */}
        <div className="footer-section navigation" style={{ marginLeft: '200px' }}>
          <h3 style={{ color: 'white' }}>Navigation</h3>
          <ul>
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#recipe">Recipe</a></li>
            <li><a href="#store">Store</a></li>
            <li><a href="#seller">Seller</a></li>
            <li><a href="#chef">Chef</a></li>
          </ul>
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

export default IndexFooter;
