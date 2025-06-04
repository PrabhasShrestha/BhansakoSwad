import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/User/ChefDetails.css';
import hullHullChicken from '../../assets/RecipePage/vegan.jpg';
import DefaultChefImage from '../../assets/RecipePage/chef.jpg';
import { FaClock, FaFire, FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import Footer from '../../components/Footer';
import Navigationbar from '../../components/NavBar';

const ChefDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chef, setChef] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchChefAndRecipes = async () => {
      try {
        // Fetch chef details
        const chefResponse = await axios.get(`http://localhost:3000/api/chef/chefinfo/${id}`);
        if (!chefResponse.data.success) {
          throw new Error('Chef not found');
        }
        const chefData = chefResponse.data.data;
        // Prefix photo URL if it exists
        if (chefData.photo) {
          chefData.photo = `http://localhost:3000${chefData.photo}`;
        }
        setChef(chefData);

        // Fetch chef's recipes
        const recipesResponse = await axios.get(`http://localhost:3000/api/chef/${id}/recipes`);
        setRecipes(recipesResponse.data.data || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load chef details');
      } finally {
        setLoading(false);
      }
    };

    fetchChefAndRecipes();
  }, [id]);

  // Function to render star ratings
  const renderStars = (rating) => {
    const maxStars = 5;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];

    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} className="pcp_star_icon" />);
    }

    // Add half star if applicable
    if (hasHalfStar && fullStars < maxStars) {
      stars.push(<FaStarHalfAlt key="half" className="pcp_star_icon" />);
    }

    // Add empty stars to fill up to maxStars
    while (stars.length < maxStars) {
      stars.push(<FaRegStar key={`empty-${stars.length}`} className="pcp_star_icon" />);
    }

    return stars;
  };

  // Handle recipe card click
  const handleRecipeClick = (recipeId) => {
    navigate(`/recipedetails/${recipeId}`);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error || !chef) {
    return <div>{error || 'Chef not found'}</div>;
  }

  return (
    <div>
      <Navigationbar />
      <div className="pcp_container">
        <div className="pcp_profile_section">
          <div className="pcp_info_container">
            <h1 className="pcp_chef_name">{chef.name}</h1>
            <h2 className="pcp_chef_title">{chef.nationality}</h2>
            <div className="pcp_details_section">
              <h3 className="pcp_section_title">Details</h3>
              <p className="pcp_chef_description">
                {chef.about_you || 'No description available.'}
              </p>
            </div>
          </div>
          <div className="pcp_chef_image_container">
            <img
              src={chef.photo || DefaultChefImage}
              alt={chef.name}
              className="pcp_chef_image"
            />
          </div>
        </div>
        <div className="pcp_contact_social_row">
          <div className="pcp_contact_section">
            <h3 className="pcp_section_title">Contact</h3>
            <div className="pcp_contact_info">
              <p><strong>Email:</strong> {chef.email}</p>
              <p><strong>Phone:</strong> {chef.phone_number || 'N/A'}</p>
            </div>
          </div>
        </div>
        <div className="pcp_recipes_section">
          <h2 className="pcp_recipes_title">Recipes</h2>
          <div className="pcp_recipes_grid">
            {recipes.length > 0 ? (
              recipes.map((recipe) => (
                <div
                  className="pcp_recipe_card"
                  key={recipe.id}
                  onClick={() => handleRecipeClick(recipe.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <img
                    src={recipe.image_url || hullHullChicken}
                    alt={recipe.title}
                    className="pcp_recipe_image"
                  />
                  <div className="pcp_recipe_title">{recipe.title}</div>
                  <div className="pcp_recipe_meta">
                    <div className="pcp_recipe_time">
                      <FaClock className="pcp_icon" />
                      <span>{recipe.cooking_time}</span>
                    </div>
                    <div className="pcp_recipe_heat">
                      <FaFire className="pcp_icon" />
                      <span>{recipe.difficulty || 'Medium'}</span>
                    </div>
                    <div className="pcp_recipe_rating">
                      {renderStars(parseFloat(recipe.rating) || 0)}
                      <span className="pcp_rating_value">
                        ({recipe.rating ? recipe.rating.toFixed(1) : '0.0'})
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p>No recipes posted by this chef yet.</p>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ChefDetails;