import React, { useState } from 'react';
import '../../styles/User/ContactUs.css';
import Footer from '../../components/Footer';
import Navigationbar from '../../components/NavBar';
import Navbar from '../../components/Header';
import FooterBefore from '../../components/FooterBefore';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ContactSection = () => {
  const isLoggedIn = localStorage.getItem("token") !== null;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:3000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        toast.success('Message sent successfully!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        toast.error('Failed to send message. Please try again.', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error('Error sending message.', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  return (
    <div>
      {isLoggedIn ? <Navigationbar /> : <Navbar />}
      <div className="contact-container">
        <h1 className="contact-title">Get In Touch</h1>
        <p className="contact-description">
          We'll create irresistible, share-worthy recipes that not only captivate your audience
          but also inspire engagement and repeat visits. By combining creativity with strategy,
          we'll help drive traffic, boost your online presence, and establish your brand as a go-
          to source for delicious, easy-to-make recipes.
        </p>
        <div className="contact-card">
          <div className="contact-info">
            <h2>Contact Information</h2>
            <p>
              We're here to help you every step of the way.
              Whether you have questions, need support, or
              are looking to collaborate, reach out to us
              anytime.
            </p>
            <div className="contact-details">
              <div className="contact-item">
                <div className="contact-icon phone-icon"></div>
                <div className="contact-text">
                  <p>+977 9841142545</p>
                  <p>+977 9803594795</p>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon email-icon"></div>
                <div className="contact-text">
                  <p>bhansakoswad@gmail.com</p>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon location-icon"></div>
                <div className="contact-text">
                  <p>Kathmandu, Nepal</p>
                </div>
              </div>
            </div>
          </div>
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="contactform-group">
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                className="contactform-control"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                className="contactform-control"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="contactform-group single">
              <input
                type="text"
                name="subject"
                placeholder="Your Subject"
                className="contactform-control"
                value={formData.subject}
                onChange={handleChange}
                required
              />
            </div>
            <div className="contactform-group single">
              <div className="message-label">MESSAGE</div>
              <textarea
                name="message"
                placeholder="Write Your Message Here"
                className="contactform-control message-area"
                value={formData.message}
                onChange={handleChange}
                required
              ></textarea>
              <button type="submit" className="contactsubmit-button">Send Message</button>
            </div>
          </form>
        </div>
      </div>
      {isLoggedIn ? <Footer /> : <FooterBefore />}
      <ToastContainer />
    </div>
  );
};

export default ContactSection;