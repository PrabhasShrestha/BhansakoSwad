import React from 'react';
import '../styles/AboutUs.css';
import Navigationbar from '../components/NavBar';
import Footer from '../components/Footer';

const AboutUs = () => {
  return (
    <div className="about-us-container">
        <Navigationbar/>

      <main className="main-content">
        <section className="about-section">
          <h1>About Us</h1>
          <p>
            Discover the art of effortless cooking with us! We believe great meals bring people together, and we're here to make cooking fun, easy, and approachable for everyone.
          </p>

          <div className="image-gallery">
            <img src="/images/dish1.jpg" alt="Dish 1" />
            <img src="/images/dish2.jpg" alt="Dish 2" />
            <img src="/images/dish3.jpg" alt="Dish 3" />
          </div>
        </section>

        <section className="mission-section">
          <h2>We ensure your cooking journey is delightful and simple</h2>
          <div className="mission-content">
            <div className="mission-text">
              <p>
                Cooking doesn't have to be complicated. Our carefully curated recipes, step-by-step guides, and tips help you bring flavor to your table with ease. Whether you're a beginner or a pro, we've got something for you.
              </p>
            </div>
            <div className="mission-text">
              <p>
                Our carefully designed recipes take the stress out of cooking, so you can enjoy creating flavorful dishes with minimal effort. Whether you're cooking for one or feeding a family, we've got you covered.
              </p>
            </div>
          </div>
        </section>

        <section className="empower-section">
          <div className="empower-content">
            <img src="/images/chef.jpg" alt="Chef preparing food" />
            <div className="empower-text">
              <h2>We empower home cooks everywhere</h2>
              <p>
                Our mission is to inspire home cooks with recipes that save time, reduce stress, and maximize taste. From quick weekday dinners to indulgent weekend treats, we're your trusted partner in the kitchen.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer/>
    </div>
  );
};

export default AboutUs;
