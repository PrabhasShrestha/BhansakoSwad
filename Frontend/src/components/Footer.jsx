import React, { useState } from 'react';
import '../styles/Footer.css'; // Import the CSS file
import axios from 'axios';

const Footer = ({ addTestimonial }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [testimonial, setTestimonial] = useState('');
  const [errors, setErrors] = useState({}); // Store validation and API errors
  const [success, setSuccess] = useState(''); // Store success message

  // Open the testimonial modal
  const openModal = () => {
    setIsModalOpen(true);
    setSuccess(''); // Clear success message when modal opens
  };

  // Close the testimonial modal and reset states
  const closeModal = () => {
    setIsModalOpen(false);
    setTestimonial('');
    setErrors({});
    setSuccess('');
    window.location.reload();
  };

  // Submit a testimonial
  const submitTestimonial = async () => {
    if (testimonial.trim() === '') {
      setErrors({ testimonial: 'Testimonial text is required.' });
      return;
    }

    setErrors({}); // Clear previous validation errors
    setSuccess(''); // Clear previous success message

    try {
      const token = localStorage.getItem('token'); // Retrieve token from localStorage

      if (!token) {
        setErrors({ api: 'You are not logged in. Please log in first.' });
        return;
      }

      const response = await axios.post(
        'http://localhost:3000/api/testimonials',
        { text: testimonial },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Add token to the Authorization header
          },
        }
      );

      setSuccess('Testimonial submitted successfully!'); // Set success message
      setTestimonial('');
       // Clear the testimonial input
    } catch (error) {
      console.error('Error submitting testimonial:', error);

      if (error.response && error.response.status === 401) {
        setErrors({ api: 'Unauthorized. Please log in first.' });
      } else if (error.response && error.response.status === 400) {
        setErrors({ testimonial: 'Invalid testimonial text.' });
      } else {
        setErrors({
          api: 'Failed to submit testimonial. Please try again later.',
        });
      }
    }
  };

  return (
    <>
      {/* Footer Section */}
      <footer className="footer">
        <div className="footer-content">
          {/* About Section */}
          <div className="footer-section about">
            <h3>Bhansako Swad</h3>
            <p>
              Welcome to Bhansako Swad, your ultimate destination for easy and
              tasty recipes! Our mission is to help you cook like a pro with
              simple steps and delicious results.
            </p>
          </div>

          {/* Contact Section */}
          <div className="footer-section contact">
            <h3>Contact Us</h3>
            <p>bhansakoswad@gmail.com</p>
            <p>214 Kathmandu, Nepal, Bhansako Swad</p>
            <p>+977 9812345678</p>
          </div>

          {/* Testimonial Section */}
          <div className="footer-section review">
            <h3>Testimonial</h3>
            <p>
              We value your feedback! Share your experience and let us know how
              we're doing.
            </p>
            <button className="review-button" onClick={openModal}>
              Share a Testimonial
            </button>
          </div>
        </div>

        {/* Footer Bottom Section */}
        <div className="footer-bottom">
          <hr />
          <p>© 2024 Bhansako Swad. All rights reserved.</p>
        </div>
      </footer>

      {/* Testimonial Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Share Your Testimonial</h2>
            <textarea
              placeholder="Share your thoughts..."
              rows="5"
              className={`modal-textarea ${
                errors.testimonial ? 'error-input' : ''
              }`}
              value={testimonial}
              onChange={(e) => setTestimonial(e.target.value)}
            ></textarea>
            {errors.testimonial && (
              <span className="error-message">{errors.testimonial}</span>
            )}
            {errors.api && <span className="error-message">{errors.api}</span>}

            <div className="modal-buttons">
              <button onClick={closeModal} className="modal-button cancel">
                Cancel
              </button>
              <button onClick={submitTestimonial} className="modal-button submit">
                Submit
              </button>
            </div>

            {/* Display Success or Error Message */}
            {success && <p className="success-message">{success}</p>}
            {errors.api && <p className="error-message">{errors.api}</p>}
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;
