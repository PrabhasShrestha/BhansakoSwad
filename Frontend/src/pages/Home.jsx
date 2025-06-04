import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import FooterBefore from '../components/FooterBefore';
import Navigationbar from '../components/NavBar';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import '../styles/Index.css';
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
import userImage from '../assets/user.png';
import Navbar from '../components/Header';

const Home = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/getapprovedtestimonials');
        if (response.ok) {
          const data = await response.json();
          setTestimonials(data.testimonials);
        } else {
          console.error('Failed to fetch testimonials:', response.status);
        }
      } catch (error) {
        console.error('Error fetching testimonials:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  const isLoggedIn = localStorage.getItem("token") !== null;

  // Handle navigation for diet preferences
  const handleDietClick = (category) => {
    navigate('/recipes', { state: { category } });
  };

  // Handle navigation for cuisines
  const handleCuisineClick = (cuisine) => {
    navigate('/recipes', { state: { category: cuisine } });
  };

  return (
    <div className="index-page">
      {isLoggedIn ? <Navigationbar /> : <Navbar />}

      <section className="hero">
        <div className="hero-content">
          <h1>
            Elevate Your Cooking Game with{' '}
            <span className="highlight">Quick, Flavorful,</span> and{' '}
            <span className="highlight">Easy</span> Recipes!
          </h1>
          <p>
            Whether you're a beginner or a seasoned cook, our recipes are
            designed to bring out the best in every dish. Quick to prepare,
            packed with flavor, and simple to follow – cooking has never been
            this easy!
          </p>
          <button className="explore-button" onClick={() => navigate("/recipes")}>
            Explore more Recipes
          </button>
        </div>
        <div className="hero-image">
          <img src={IndexpageImage} alt="Healthy food" />
        </div>
      </section>

      <section className="diet-preference">
        <h2>Discover Recipes by Diet Preference</h2>
        <p>
          Explore a range of flavorful recipes designed to suit your dietary
          needs. Choose from our diverse options and start cooking your ideal
          meal today!
        </p>
        <div className="diet-options">
          <div className="card">
            <img src={NonVegImage} alt="Non-Vegetarian" />
            <h3>Non-Vegetarian</h3>
            <button onClick={() => handleDietClick("Non-Vegetarian")}>View Recipes</button>
          </div>
          <div className="card">
            <img src={PescatarianImage} alt="Pescatarian" />
            <h3>Pescatarian</h3>
            <button onClick={() => handleDietClick("Pescatarian")}>View Recipes</button>
          </div>
          <div className="card">
            <img src={VegImage} alt="Vegetarian" />
            <h3>Vegetarian</h3>
            <button onClick={() => handleDietClick("Vegetarian")}>View Recipes</button>
          </div>
          <div className="card">
            <img src={GlutenFreeImage} alt="Gluten-Free" />
            <h3>Gluten-Free</h3>
            <button onClick={() => handleDietClick("Gluten-Free")}>View Recipes</button>
          </div>
          <div className="card">
            <img src={VeganImage} alt="Vegan" />
            <h3>Vegan</h3>
            <button onClick={() => handleDietClick("Vegan")}>View Recipes</button>
          </div>
        </div>
      </section>

      <section className="cuisine-type">
        <h2>Explore By Cuisine Type</h2>
        <p>
          Explore fresh flavors and cooking techniques with our diverse recipes.
          Unlock new culinary possibilities today!
        </p>
        <div className="cuisine-options">
          <div className="image-container" onClick={() => handleCuisineClick("Turkish")}>
            <img src={Cusine1Image} alt="Turkey Cuisine" />
            <div className="image-overlay">Turkey Cuisine</div>
          </div>
          <div className="image-container" onClick={() => handleCuisineClick("Nepali")}>
            <img src={Cusine2Image} alt="Nepali Cuisine" />
            <div className="image-overlay">Nepali Cuisine</div>
          </div>
          <div className="image-container" onClick={() => handleCuisineClick("Pakistani")}>
            <img src={Cusine3Image} alt="Pakistani Cuisine" />
            <div className="image-overlay">Pakistani Cuisine</div>
          </div>
          <div className="image-container" onClick={() => handleCuisineClick("Indian")}>
            <img src={Cusine4Image} alt="Indian Cuisine" />
            <div className="image-overlay">Indian Cuisine</div>
          </div>
        </div>
        <button className="cuisine-button" onClick={() => navigate("/recipes", { state: { category: "Cuisine" } })}>
          Explore More Cuisine
        </button>
      </section>

      <section className="testimonials">
        <h2>Testimonials</h2>
        {loading ? (
          <p>Loading testimonials...</p>
        ) : testimonials.length === 0 ? (
          <p>No testimonials yet. Be the first to write one!</p>
        ) : (
          <Swiper
            modules={[Pagination]}
            spaceBetween={30}
            slidesPerView={1}
            pagination={{ clickable: true }}
            className="testimonial-swiper"
          >
            {testimonials.map((testimonial) => (
              <SwiperSlide key={testimonial.id}>
                <div className="testimonial-card">
                  <div className="quote-icon">“</div>
                  <p className="testimonial-text">{testimonial.text}</p>
                  <div className="author">
                    <img
                      src={
                        testimonial.user_image
                          ? `http://localhost:3000${testimonial.user_image}`
                          : userImage
                      }
                      alt={`${testimonial.user_name}'s profile`}
                      className="author-image"
                    />
                    <p className="author-name">{testimonial.user_name}</p>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </section>

      {isLoggedIn ? <Footer /> : <FooterBefore />}
    </div>
  );
};

export default Home;