import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { FaStar } from "react-icons/fa";
import "../../styles/User/RecipeDetails.css";
import Navigationbar from "../../components/NavBar";
import Navbar from "../../components/Header";
import Footer from "../../components/Footer";
import FooterBefore from "../../components/FooterBefore";
import Toast from "../../components/ToastNoti";

const RecipeDetails = () => {
    const { id } = useParams(); // Get recipe ID from URL params
    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0)
    const isLoggedIn = localStorage.getItem("token") !== null;
    const [toast, setToast] = useState(null);
    const [creatorName, setCreatorName] = useState("Bhansako Swad Team");
    useEffect(() => {
        const fetchRecipeDetails = async () => {
            try {
                const response = await axios.get(`http://localhost:3000/api/recipe/recipe/${id}`);
                setRecipe(response.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching recipe:", err);
                setError("Failed to fetch recipe details.");
                setLoading(false);
            }
        };
    
        const fetchRecipeCreator = async () => {
            try {
                const response = await axios.get(`http://localhost:3000/api/recipe/creator/${id}`);
                if (response.data.creator_name) {
                    setCreatorName(response.data.creator_name);  // ✅ Correctly store creator name
                }
            } catch (err) {
                console.error("Error fetching creator:", err);
            }
        };
    
        fetchRecipeDetails();
        fetchRecipeCreator(); // Fetch creator name separately
    
    }, [id]);
    

    const handleRatingSubmit = async () => {
        const userId = localStorage.getItem("userId");
        console.log("User ID from localStorage:", userId); // Get user ID from localStorage or auth context
         if (!userId) {
            setToast({ message: "You must be logged in to submit a rating.", type: "error" });
            return;
        }
    
        try {
            await axios.post("http://localhost:3000/api/recipe/rate", {
                recipe_id: id,  // Recipe ID from URL params
                user_id: userId, // Logged-in user ID
                rating: rating   // Selected star rating
            });
            setToast({ message: "Rating submitted successfully!", type: "success" });
        } catch (error) {
            if (error.response && error.response.status === 400) {
                setToast({ message: error.response.data.message, type: "error" });
            } else {
                setToast({ message: "Failed to submit rating.", type: "error" });
            }
        }
    };

    const handleAddFavorite = async () => {
        // 1) Get userId from localStorage (or your auth context)
        const userId = localStorage.getItem("userId");
        if (!userId) {
          setToast({ message: "You must be logged in to add to favorites.", type: "error" });
          return;
        }
    
        try {
          // 2) POST to your /favorite endpoint
          const response = await axios.post("http://localhost:3000/api/recipe/favorite", {
            userId: userId,
            recipeId: id, // `id` comes from useParams()
          });
    
          // 3) Check response and display a suitable message
          if (response?.data?.message === "Recipe is already in your favorites.") {
            setToast({ message: response.data.message, type: "info" });
          } else {
            // You might get a success message like "Recipe added to favorites successfully."
            setToast({ message: response.data.message, type: "success" });
          }
        } catch (error) {
          console.error("Error setting favorite recipe:", error);
          // If the server sent back a specific error message, use it
          const errorMsg = error?.response?.data?.message || "Failed to set favorite recipe.";
          setToast({ message: errorMsg, type: "error" });
        }
      };
    
      
    if (loading) return <p className="loading-text">Loading recipe...</p>;
    if (error) return <p className="error-text">{error}</p>;

    return (
        <div className="recipe">
            {isLoggedIn ? <Navigationbar /> : <Navbar />}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <div className="recipe-page">
                <div className="recipe-page-hero">
                    <div className="recipe-page-hero-overlay"></div>
                    <img src={recipe.image_url} className="recipe-page-hero-image" alt={recipe.title} />
                </div>
                
                <div className="recipedetails-container">
                    <h1 className="title">{recipe.title}</h1>
                    <div className="recipedetails">
                        <div className="recipedetails-item">
                            <p><strong>Level:</strong></p>
                            <p>{recipe.difficulty}</p>
                        </div>
                        <div className="recipedetails-item">
                            <p><strong>Time:</strong></p>
                            <p>{recipe.cooking_time}</p>
                        </div>
                        <div className="recipedetails-item">
                            <p><strong>Ratings:</strong></p>
                            <div className="star-rating">
                                {[...Array(5)].map((_, index) => (
                                    <FaStar
                                        key={index}
                                        size={20}
                                        color={index < Math.round(recipe.average_rating) ? "#FFD700" : "#ccc"}
                                    />
                                ))}
                        
                            </div>
                        </div>
                    </div>
                </div>

                <div className="recipe-container-wrapper">
                    <div className="recipe-container">
                        <div className="nutrition-wrapper">
                            <div className="nutrition-title">Nutrition</div>
                            <div className="nutrition-scroll">
                                {recipe.nutrition.length > 0 ? (
                                    recipe.nutrition.map((item, index) => (
                                        <div key={index} className="nutrition-item">
                                            <span className="nutrition-label">{item.nutrient}</span>
                                            <span className="nutrition-value">{item.value}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p>No nutrition data available.</p>
                                )}
                            </div>
                        </div>

                        <div className="ingredients-section">
                            <h3>Ingredients</h3>
                            <ul>
                                {recipe.ingredients.length > 0 ? (
                                    recipe.ingredients.map((item, index) => (
                                        <li key={index}>{item.name} - {item.amount}</li>
                                    ))
                                ) : (
                                    <p>No ingredients available.</p>
                                )}
                            </ul>
                            <button className="favorite-btn" onClick={handleAddFavorite}>Add to Favorites</button>
                        </div>

                        <div className="methods-section">
                            <h3>Methods</h3>
                            
                            {recipe.methods.length > 0 ? (
                                <>
                                {recipe.methods.map((step, index) => (
                                    <div className="method-step" key={index}>
                                        <h4>Step {index + 1}</h4>
                                        <p>{step.description}</p>
                                       
                                    </div>
                                    
                                ))}
                                <div className="recipebottom">
                                <div className="translation-container">
                                    <button className="translate-btn">Translate to Nepali</button>
                                    <p className="translated-text"><strong>Created by:</strong> {creatorName}</p>

                               </div>
                               <div className="rating-section">            
                                <h3>Rate this Recipe:</h3>
                                <div className="star-ratings">
                                {[...Array(5)].map((_, index) => {
                                    const currentRating = index + 1;
                                    return (
                                        <FaStar
                                            key={index}
                                            className="star"
                                            size={24}
                                            onMouseEnter={() => setHover(currentRating)}
                                            onMouseLeave={() => setHover(0)}
                                            onClick={() => setRating(currentRating)}
                                            color={currentRating <= (hover || rating) ? "#FFD700" : "#ccc"}
                                        />
                                    );
                                })}
                            </div>

                        <button onClick={handleRatingSubmit} className="submit-review-btn">Submit Rating</button>
                       
                        </div>
                        </div>
                                            </>
                                        ) : (
                                            <p>No cooking steps available.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {isLoggedIn ? <Footer /> : <FooterBefore />}
                    </div>
                );
            };

            export default RecipeDetails;
