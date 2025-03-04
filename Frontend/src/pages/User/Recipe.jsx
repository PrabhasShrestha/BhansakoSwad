import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import '../../styles/User/Recipe.css'
import { IoFastFoodSharp } from "react-icons/io5";
import { FaSearch, FaTrash, FaFish, FaDrumstickBite, FaBreadSlice, FaCarrot, FaLeaf, FaHeart, FaPlus, FaUtensils } from "react-icons/fa";
import Navigationbar from "../../components/NavBar";
import Navbar from "../../components/Header";
import Footer from "../../components/Footer";
import FooterBefore from "../../components/FooterBefore";
import RecipeModal from "./RecipeModal.jsx"; // Import the new RecipeModal

import RecipeImage from '../../assets/RecipePage/Recipe1.jpg';
import NonVegImage from '../../assets/RecipePage/NonVeg.jpg';
import FishImage from '../../assets/RecipePage/Fish.jpg';
import VegImage from '../../assets/RecipePage/Veg.jpg';
import GlutenFreeImage from '../../assets/RecipePage/GlutenFree.jpg';
import DrinksImage from '../../assets/RecipePage/drinks.jpg';
import VeganImage from '../../assets/RecipePage/vegan.jpg';

const categoryImages = {
    "Non-Vegetarian": NonVegImage,
    "Pescatarian": FishImage,
    "Vegetarian": VegImage,
    "Gluten-Free": GlutenFreeImage,
    "Vegan": VeganImage,
    "Drinks": DrinksImage,
    "Favorites": RecipeImage
};

const MainRecipe = () => {
    const isLoggedIn = localStorage.getItem("token") !== null;
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [recipes, setRecipes] = useState([])
    const [selectedCategory, setSelectedCategory] = useState("All")
    const [searchTerm, setSearchTerm] = useState(""); 
    const [searchResults, setSearchResults] = useState([]); 
    const [selectedIngredients, setSelectedIngredients] = useState([]);
    const [filteredRecipes, setFilteredRecipes] = useState([]); 
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    useEffect(() => {
        // Fetch search results
        axios.get(`http://localhost:3000/api/recipe/search?query=${searchTerm}`)
        .then((response) => {
            setSearchResults(response.data);
        })
        .catch((error) => {
            console.error("Error fetching search results:", error);
        });
       
        // Fetch all recipes
        axios.get("http://localhost:3000/api/recipe/recipes")
            .then((response) => {
                setRecipes(response.data);
            })
            .catch((error) => {
                console.error("Error fetching recipes:", error);
            });
    }, [searchTerm]);

    const addIngredient = (ingredient) => {
        if (!selectedIngredients.includes(ingredient)) {
            const updatedIngredients = [...selectedIngredients, ingredient];
            setSelectedIngredients(updatedIngredients);
            filterRecipesByIngredients(updatedIngredients);
        }
    };

    const removeIngredient = (ingredient) => {
        const updatedIngredients = selectedIngredients.filter(item => item !== ingredient);
        setSelectedIngredients(updatedIngredients);
        filterRecipesByIngredients(updatedIngredients);
    };

    const filterRecipesByIngredients = (ingredients) => {
        if (ingredients.length === 0) {
            setFilteredRecipes([]); 
            return;
        }
    
        axios.post("http://localhost:3000/api/recipe/filterRecipes", { ingredients })
            .then((response) => {
                setFilteredRecipes(response.data);
            })
            .catch((error) => {
                console.error("Error filtering recipes:", error.response?.data || error);
            });
    };

    const finalrecipe = selectedCategory === "All"
        ? recipes
        : recipes.filter(recipe => recipe.category === selectedCategory);

    const handleRecipeSubmit = () => {
        // Optional: Refresh recipes after adding a new recipe
        axios.get("http://localhost:3000/api/recipe/recipes")
            .then((response) => {
                setRecipes(response.data);
                setShowModal(false);
            })
            .catch((error) => {
                console.error("Error refreshing recipes:", error);
            });
    };

    return(
        <div className="recipe">
            {isLoggedIn ? <Navigationbar/> : <Navbar />}
            <div className="recipe-page">
                <div className="recipe-page-hero">
                    <div className="recipe-page-hero-overlay"></div>
                    <img 
                        src={categoryImages[selectedCategory] || RecipeImage} 
                        className="recipe-page-hero-image" 
                        alt="Recipe Hero"
                    />
                    <div className="recipe-page-hero-content">
                        <h1>IT'S ALL ABOUT GOOD FOOD AND TASTE</h1>
                        <div className="recipe-page-divider">
                            <IoFastFoodSharp className="recipe-page-divider-icon"/>
                        </div>
                        <p>Discover recipes, tips, and the joy of cooking.</p>
                    </div>
                </div>
                
                <div className="recipe-search-container">
                    <div className="recipe-search-left">
                        <div className="recipeaddsearch-box">
                            <input 
                                type="text" 
                                placeholder="Search Your Recipe Here" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                            />
                            <FaSearch className="recipeaddsearch-icon" />
                        </div>
                        
                        {selectedIngredients.length > 0 && (
                            <div className="selected-ingredients">
                                {selectedIngredients.map((ingredient, index) => (
                                    <div key={index} className="ingredient-tag">
                                        {ingredient}
                                        <FaTrash 
                                            className="recipeaddremove-btn" 
                                            onClick={() => removeIngredient(ingredient)} 
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {isSearchFocused && searchResults.length > 0 && (
                            <div className="recipeaddsearch-results-dropdown">
                                {searchResults.map((item, index) => (
                                    <div key={index} className="recipeaddsearch-result-item">
                                        {item.type === "ingredient" ? (
                                            <>
                                                <span>{item.name} (Ingredient)</span>
                                                <FaPlus 
                                                    className="recipeaddadd-btn" 
                                                    onClick={() => addIngredient(item.name)} 
                                                />
                                            </>
                                        ) : (
                                            <span onClick={() => navigate(`/recipedetails/${item.id}`)}>
                                                {item.title} (Recipe)
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div className="recipe-search-right">
                        <div className="icon-container">
                            <div className="icon-wrapper" data-tooltip="All Recipes" onClick={() => setSelectedCategory("All")}>
                                <FaUtensils className="icon" />
                            </div>
                            <div className="icon-wrapper" data-tooltip="Non-Vegetarian" onClick={() => setSelectedCategory("Non-Vegetarian")}>
                                <FaDrumstickBite className="icon" />
                            </div>
                            <div className="icon-wrapper" data-tooltip="Pescatarian" onClick={() => setSelectedCategory("Pescatarian")}>
                                <FaFish className="icon" />
                            </div>
                            <div className="icon-wrapper" data-tooltip="Vegetarian" onClick={() => setSelectedCategory("Vegetarian")}>
                                <FaCarrot className="icon" />
                            </div>
                            <div className="icon-wrapper" data-tooltip="Gluten-Free" onClick={() => setSelectedCategory("Gluten-Free")}>
                                <FaBreadSlice className="icon" />
                            </div>
                            <div className="icon-wrapper" data-tooltip="Vegan" onClick={() => setSelectedCategory("Vegan")}>
                                <FaLeaf className="icon" />
                            </div>
                            <div className="icon-wrapper" data-tooltip="Favorites" onClick={() => setSelectedCategory("Favorites")}>
                                <FaHeart className="icon" />
                            </div>
                            <div className="icon-wrapper" data-tooltip="Add Recipe" onClick={() => {
                                    
                                    if (!isLoggedIn) {
                                        
                                        alert("You must be logged in to add a recipe."); 
                                        return;
                                        }
                                        setShowModal(true);
                                    }}
                                    >
                                <FaPlus className="icon" />
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="recipe-details">
                    <h1>{selectedCategory === "All" ? "Crowd-Pleasing Recipes" : selectedCategory} Recipes</h1>
                    <div className="recipe-grid">
                        {(filteredRecipes.length > 0 ? filteredRecipes : finalrecipe).length > 0 ? (
                            (filteredRecipes.length > 0 ? filteredRecipes : finalrecipe).map((recipe) => (
                                <div className="recipe-card" key={recipe.id}>
                                    <img 
                                        src={recipe.image_url || RecipeImage} 
                                        alt={recipe.title} 
                                        className="recipe-card-image" 
                                        onClick={() => navigate(`/recipedetails/${recipe.id}`)} 
                                    />
                                    <div className="recipe-card-content">
                                        <h2>{recipe.title}</h2>
                                        <div className="recipe-info">
                                            <span>⏱ {recipe.cooking_time}</span>
                                            <span>⚡ {recipe.difficulty}</span>
                                            <span>⭐ {parseFloat(recipe.average_rating).toFixed(1)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>No recipes found in {selectedCategory} category.</p>
                        )}
                    </div>
                </div>
            </div>
            
            
            <RecipeModal 
                isOpen={showModal} 
                onClose={() => setShowModal(false)}
                onSubmit={handleRecipeSubmit}
            />
            
            {isLoggedIn ? <Footer/> : <FooterBefore />}
        </div>
    )
}

export default MainRecipe;