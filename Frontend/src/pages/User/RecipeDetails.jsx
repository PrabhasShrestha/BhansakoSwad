import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { FaStar } from "react-icons/fa";
import "../../styles/User/RecipeDetails.css";
import Navigationbar from "../../components/NavBar";
import Navbar from "../../components/Header";
import Footer from "../../components/Footer";
import FooterBefore from "../../components/FooterBefore";
import { toast } from 'react-toastify';
import translations from "../../components/nepaliTranslations.json";

const RecipeDetails = () => {
    const { id } = useParams(); 
    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0)
    const isLoggedIn = localStorage.getItem("token") !== null;
    const [creatorName, setCreatorName] = useState("Bhansako Swad Team");
    const [translated, setTranslated] = useState(false);
    
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
                    setCreatorName(response.data.creator_name);
                }
            } catch (err) {
                console.error("Error fetching creator:", err);
            }
        };
    
        fetchRecipeDetails();
        fetchRecipeCreator();
    
    }, [id]);
    
    const handleRatingSubmit = async () => {
        const userId = localStorage.getItem("userId");
        console.log("User ID from localStorage:", userId);
        
        if (!userId) {
            toast.error("You must be logged in to submit a rating.");
            return;
        }
    
        try {
            await axios.post("http://localhost:3000/api/recipe/rate", {
                recipe_id: id,
                user_id: userId,
                rating: rating
            });
            toast.success("Rating submitted successfully!");
        } catch (error) {
            if (error.response && error.response.status === 400) {
                toast.error(error.response.data.message);
            } else {
                toast.error("Failed to submit rating.");
            }
        }
    };

    const handleAddFavorite = async () => {
        const userId = localStorage.getItem("userId");
        if (!userId) {
            toast.error("You must be logged in to add to favorites.");
            return;
        }
    
        try {
            const response = await axios.post("http://localhost:3000/api/recipe/favorite", {
                userId: userId,
                recipeId: id,
            });
    
            if (response?.data?.message === "Recipe is already in your favorites.") {
                toast.info(response.data.message);
            } else {
                toast.success(response.data.message || "Recipe added to favorites successfully!");
            }
        } catch (error) {
            console.error("Error setting favorite recipe:", error);
            const errorMsg = error?.response?.data?.message || "Failed to set favorite recipe.";
            toast.error(errorMsg);
        }
    };
    
    const toggleTranslation = () => {
        setTranslated(!translated);
    };
    
    if (loading) return <p className="loading-text">Loading recipe...</p>;
    if (error) return <p className="error-text">{error}</p>;

    return (
        <div className="recipe">
            {isLoggedIn ? <Navigationbar /> : <Navbar />}
           
            <div className="recipe-page">
                <div className="recipe-page-hero">
                    <div className="recipe-page-hero-overlay"></div>
                    <img src={recipe.image_url} className="recipe-page-hero-image" alt={recipe.title} />
                </div>
                
                <div className="recipedetails-container">
                <h1 className="title">
    {translated ? recipe.title_ne : recipe.title}
</h1>

                    <div className="recipedetails">
                        <div className="recipedetails-item">
                            <p><strong>{translated ? translations.level : "Level:"}</strong></p>
                            <p>{recipe.difficulty}</p>
                        </div>
                        <div className="recipedetails-item">
                            <p><strong>{translated ? translations.time : "Time:"}</strong></p>
                            <p>{recipe.cooking_time}</p>
                        </div>
                        <div className="recipedetails-item">
                            <p><strong>{translated ? translations.ratings : "Ratings:"}</strong></p>
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
                            <div className="nutrition-title">{translated ? translations.nutrition : "Nutrition"}</div>
                            <div className="nutrition-scroll">
                            {recipe.nutrition.length > 0 ? (
                            <>
                                {recipe.nutrition.map((item, index) => (
                                    <div key={index} className="nutrition-item">
                                        <span className="nutrition-label">
                                            {translated ? item.nutrient_ne : item.nutrient}
                                        </span>
                                        <span className="nutrition-value">
                                            {translated ? item.value_ne : item.value}
                                        </span>
                                    </div>
                                ))}
                            </>
                        ) : (
                            <p>{translated ? translations.noNutritionData : "No nutrition data available."}</p>
                        )}
                            </div>
                        </div>

                        <div className="ingredients-section">
                            <h3>{translated ? translations.ingredients : "Ingredients"}</h3>
                            <ul>
                                {recipe.ingredients.length > 0 ? (
                                    recipe.ingredients.map((item, index) => (
                                        <li key={index}>{item.name} - {item.amount}</li>
                                    ))
                                ) : (
                                    <p>No ingredients available.</p>
                                )}
                            </ul>
                            <button className="favorite-btn" onClick={handleAddFavorite}>
                                {translated ? translations.addToFavorites || "Add to Favorites" : "Add to Favorites"}
                            </button>
                        </div>

                        <div className="methods-section">
                            <h3>{translated ? translations.methods : "Methods"}</h3>
                            
                            {recipe.methods.length > 0 ? (
                                <>
                                    {recipe.methods.map((step, index) => (
                                        <div className="method-step" key={index}>
                                            <h4>
                                                {translated ? translations.step : "Step"} {translated ? translations.nepaliNumbers[index + 1] : index + 1}
                                            </h4>
                                            <p>{translated && step.description_ne ? step.description_ne : step.description}</p>
                                        </div>
                                    ))}

                                    <div className="recipebottom">
                                        <div className="translation-container">
                                            <button
                                                className="translate-btn"
                                                onClick={toggleTranslation}
                                            >
                                                {translated ? "Translate to English" : translations.translateToNepali}
                                            </button>
                                            <p className="translated-text">
                                                <strong>{translated ? translations.createdBy : "Created by:"}</strong> {creatorName}
                                            </p>
                                        </div>
                                        <div className="rating-section">            
                                            <h3>{translated ? translations.rateRecipe : "Rate this Recipe"}:</h3>
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
                                            <button onClick={handleRatingSubmit} className="submit-review-btn">
                                                {translated ? translations.submitRating || "Submit Rating" : "Submit Rating"}
                                            </button>
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