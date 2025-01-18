import React from 'react';
import Footer from '../components/Footer';
import Navbar from '../components/Header';
import '../styles/Index.css'; // Custom styles for Index page // Styles for Footer
import IndexpageImage from '../assets/HomePage/Indexpage1.jpg';
import NonVegImage from '../assets/HomePage/non veg.jpg';
import VegImage from '../assets/HomePage/veg.jpg';
import VeganImage from '../assets/HomePage/vegan.jpg';
import PescatarianImage from '../assets/HomePage/Pescatarian.jpg';
import GlutenFreeImage from '../assets/HomePage/glutenFree.jpg';
import Cusine1Image from '../assets/HomePage/turkey.jpg';
import Cusine2Image from '../assets/HomePage/nepali.jpg';
import Cusine3Image from '../assets/HomePage/pakistani.jpg';
import Cusine4Image from '../assets/HomePage/indian.jpg';

const Home = () => {
  return (
    <div className="index-page">
      {/* Navbar Section */}
      <Navbar/>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>
            Elevate Your Cooking Game with <span className="highlight">Quick, Flavorful,</span> and <span className="highlight">Easy</span> Recipes!
          </h1>
          <p>
            Whether you're a beginner or a seasoned cook, our recipes are designed to bring out the best in every dish. Quick to prepare, packed with flavor, and simple to follow – cooking has never been this easy!
          </p>
          <button className="explore-button">Explore more Recipes</button>
        </div>
        <div className="hero-image">
          <img src={IndexpageImage} alt="Healthy food" />
        </div>
      </section>

      {/* Diet Preference Section */}
      <section className="diet-preference">
        <h2>Discover Recipes by Diet Preference</h2>
        <p>
          Explore a range of flavorful recipes designed to suit your dietary needs. Choose from our diverse options and start cooking your ideal meal today!
        </p>
        <div className="diet-options">
          <div className="card">
            <img src={NonVegImage} alt="Non-Vegetarian" />
            <h3>Non-Vegetarian</h3>
            <button>Click Here</button>
          </div>
          <div className="card">
            <img src={PescatarianImage} alt="Pescatarian" />
            <h3>Pescatarian</h3>
            <button>Click Here</button>
          </div>
          <div className="card">
            <img src={VegImage} alt="Vegetarian" />
            <h3>Vegetarian</h3>
            <button>Click Here</button>
          </div>
          <div className="card">
            <img src={GlutenFreeImage} alt="Gluten-Free" />
            <h3>Gluten-Free</h3>
            <button>Click Here</button>
          </div>
          <div className="card">
            <img src={VeganImage} alt="Vegan" />
            <h3>Vegan</h3>
            <button>Click Here</button>
          </div>
        </div>
      </section>

      {/* Cuisine Type Section */}
      <section className="cuisine-type">
        <h2>Explore By Cuisine Type</h2>
        <p>
          Explore fresh flavors and cooking techniques with our diverse recipes. Unlock new culinary possibilities today!
        </p>
        <div className="cuisine-options">
          <div className="image-container">
            <img src={Cusine1Image} alt="Cuisine 1" />
            <div className="image-overlay">Turkey Cuisine</div>
          </div>
          <div className="image-container">
            <img src={Cusine2Image} alt="Cuisine 2" />
            <div className="image-overlay">Nepali Cuisine</div>
          </div>
          <div className="image-container">
            <img src={Cusine3Image} alt="Cuisine 3" />
            <div className="image-overlay">Pakistani Cuisine</div>
          </div>
          <div className="image-container">
            <img src={Cusine4Image} alt="Cuisine 4" />
            <div className="image-overlay">Indian Cuisine</div>
          </div>
        </div>
        <button className="cuisine-button">Explore More Cuisine</button>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials">
        <h2>Testimonials</h2>
        <div className="testimonial-card">
          <blockquote>
          </blockquote>
          <p>
            Love this website! The recipes are so easy to follow, and the results are always delicious. I’ve tried a few dishes already, and they’ve all been a hit with my family. Plus, I appreciate the tips for substitutions—it makes cooking so much more flexible. Definitely my go-to for meal ideas now!
          </p>
          <div className="author">
            <img src="/path/to/author.jpg" alt="John Cena" />
            <p>John Cena</p>
          </div>
        </div>
      </section>

    <Footer/>
    </div>
  );
};

export default Home;
