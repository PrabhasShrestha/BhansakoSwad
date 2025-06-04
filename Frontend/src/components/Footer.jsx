import React, { useState } from 'react';
import '../styles/Footer.css'; // Import the CSS file
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Footer = ({ addTestimonial }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [testimonial, setTestimonial] = useState('');
  const [errors, setErrors] = useState({}); // Store validation and API errors

  // Open the testimonial modal
  const openModal = () => {
    setIsModalOpen(true);
    setErrors({}); // Clear errors when modal opens
  };

  // Close the testimonial modal and reset states
  const closeModal = () => {
    setIsModalOpen(false);
    setTestimonial('');
    setErrors({});
  };

  // Submit a testimonial
  const submitTestimonial = async () => {
    if (testimonial.trim() === '') {
      toast.error('Testimonial text is required.', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setErrors({ testimonial: 'Testimonial text is required.' });
      return;
    }

    setErrors({}); // Clear previous validation errors

    try {
      const token = localStorage.getItem('token'); // Retrieve token from localStorage

      if (!token) {
        toast.error('You are not logged in. Please log in first.', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
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

      toast.success('Testimonial submitted successfully! Your testimonial is pending approval.', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setTestimonial(''); // Clear the testimonial input
    } catch (error) {
      console.error('Error submitting testimonial:', error);

      if (error.response && error.response.status === 401) {
        toast.error('Unauthorized. Please log in first.', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        setErrors({ api: 'Unauthorized. Please log in first.' });
      } else if (error.response && error.response.status === 400) {
        toast.error('Invalid testimonial text.', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        setErrors({ testimonial: 'Invalid testimonial text.' });
      } else {
        toast.error('Failed to submit testimonial. Please try again later.', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
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
          <div className="footer-section-contact">
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
          </div>
        </div>
      )}

      <ToastContainer />
    </>
  );
};

export default Footer;