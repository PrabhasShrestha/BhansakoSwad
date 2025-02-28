import React from 'react';
import '../../styles/User/AboutUs.css';
import Navigationbar from '../../components/NavBar';
import Footer from '../../components/Footer';
import image1 from '../../assets/AboutUsPage/about us 1.jpg';
import image2 from '../../assets/AboutUsPage/about us 2.jpg';
import image3 from '../../assets/AboutUsPage/about us 3.jpg';
import image4 from '../../assets/AboutUsPage/about us 1.jpg';
import chefImage from '../../assets/AboutUsPage/about us.jpg';
import Navbar from '../../components/Header';
import FooterBefore from '../../components/FooterBefore';

const AboutUs = () => {
  const isLoggedIn = localStorage.getItem("token") !== null;
  return (
    <div className="about-us-container">
      {isLoggedIn ? <Navigationbar/> : <Navbar />}

      <div className="about-header">
        <h1>About Us</h1>
        <p>
          Discover the art of effortless cooking with us! We believe great meals
          bring people together, and we're here to make cooking fun, easy, and
          approachable for everyone.
        </p>
      </div>

      <div className="about-images">
        <img src={image1} alt="Dish 1" />
        <img src={image2} alt="Dish 2" />
        <img src={image3} alt="Dish 3" />
        <img src={image4} alt="Dish 4" />
      </div>

      <section className="about-content">
        <h2>We ensure your cooking journey is <span className="highlight">delightful and simple</span></h2>
        <div className="about-text">
          <p>
            Cooking doesn't have to be complicated. Our carefully curated
            recipes, step-by-step guides, and tips help you bring flavor to your
            table with ease. Whether you're a beginner or a pro, we've got
            something for you.
          </p>
          <p>
            Our carefully designed recipes take the stress out of cooking, so
            you can enjoy creating flavorful dishes with minimal effort. Whether
            you're cooking for one or feeding a family, we've got you covered.
          </p>
        </div>
      </section>

      <section className="about-empower">
        <img src={chefImage} alt="Chef cooking" />
        <div className="empower-content">
          <h3>We empower home cooks everywhere</h3>
          <p>
            Our mission is to inspire home cooks with recipes that save time, reduce stress, and maximize taste. From quick weekday dinners to indulgent weekend treats, we're your trusted partner in the kitchen.
          </p>
        </div>
      </section>

      <div className="about-footer">
        <h3>Helping you create delicious memories, one recipe at a time</h3>
      </div>
      {isLoggedIn ? <Footer />: <FooterBefore />}
      
    </div>
  );
};

export default AboutUs;