import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import '../../styles/User/Recipe.css';
import { IoFastFoodSharp } from "react-icons/io5";
import { FaSearch, FaTrash, FaFish, FaDrumstickBite, FaBreadSlice, FaCarrot, FaLeaf, FaHeart, FaPlus, FaUtensils, FaLock } from "react-icons/fa";
import { GiChefToque, GiCookingPot } from "react-icons/gi";
import Navigationbar from "../../components/NavBar";
import Navbar from "../../components/Header";
import Footer from "../../components/Footer";
import FooterBefore from "../../components/FooterBefore";
import RecipeModal from "./RecipeModal.jsx";
import RecipeImage from '../../assets/RecipePage/Recipe1.jpg';
import NonVegImage from '../../assets/RecipePage/NonVeg.jpg';
import FishImage from '../../assets/RecipePage/Fish.jpg';
import VegImage from '../../assets/RecipePage/Veg.jpg';
import VeganImage from '../../assets/RecipePage/Vegan.jpg';
import GlutenFreeImage from '../../assets/RecipePage/GlutenFree.jpg';
import DrinksImage from '../../assets/RecipePage/drinks.jpg';
import DefaultChefImage from '../../assets/RecipePage/vegan.jpg';
import ItalianImg from "../../assets/cuisines/italian.jpg";
import ChineseImg from "../../assets/cuisines/chinese.jpg";
import IndianImg from "../../assets/cuisines/indian.jpg";
import MexicanImg from "../../assets/cuisines/mexican.jpg";
import NepaliImg from "../../assets/cuisines/nepali.jpg";
import ThaiImg from "../../assets/cuisines/thai.jpg";
import JapaneseImg from "../../assets/cuisines/japanese.jpg";
import TurkishImg from "../../assets/cuisines/turkish.jpg";

const categoryImages = {
    "Non-Vegetarian": NonVegImage,
    "Pescatarian": FishImage,
    "Vegetarian": VegImage,
    "Gluten-Free": GlutenFreeImage,
    "Vegan": VeganImage,
    "Drinks": DrinksImage,
    "Favorites": RecipeImage
};

const cuisineOptions = [
    { name: "Italian", image: ItalianImg },
    { name: "Chinese", image: ChineseImg },
    { name: "Indian", image: IndianImg },
    { name: "Mexican", image: MexicanImg },
    { name: "Nepali", image: NepaliImg },
    { name: "Thai", image: ThaiImg },
    { name: "Japanese", image: JapaneseImg },
    { name: "Turkish", image: TurkishImg },
];

const MainRecipe = () => {
    const isLoggedIn = localStorage.getItem("token") !== null;
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [showCuisineModal, setShowCuisineModal] = useState(false);
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [recipes, setRecipes] = useState([]);
    const [chefs, setChefs] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [selectedIngredients, setSelectedIngredients] = useState([]);
    const [filteredRecipes, setFilteredRecipes] = useState([]);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isPremium, setIsPremium] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isChef, setIsChef] = useState(false);
    const [chefStatus, setChefStatus] = useState(null);
    const [favoriteRecipes, setFavoriteRecipes] = useState([]);
    const cuisineList = ["Italian", "Chinese", "Indian", "Mexican", "Nepali", "Thai", "Japanese", "Turkish"];

    useEffect(() => {
        const token = localStorage.getItem("token");
        const fetchPremiumStatus = async () => {
            try {
                if (!token) {
                    return;
                }

                const userResponse = await axios.get("http://localhost:3000/api/get-user", {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (userResponse.data.success) {
                    const userData = userResponse.data.data;
                    setIsAdmin(userData.is_admin === 1 || userData.is_admin === true);
                    setIsPremium(userData.is_premium || false);
                    setIsChef(userData.is_chef || false);
                    setChefStatus(userData.status || null);
                }
            } catch (error) {}
        };

        axios.get(`http://localhost:3000/api/recipe/search?query=${searchTerm}`)
            .then((response) => {
                setSearchResults(response.data);
            })
            .catch((error) => {});

        axios.get("http://localhost:3000/api/recipe/recipes")
            .then((response) => {
                setRecipes(response.data);
            })
            .catch((error) => {});

        axios.get("http://localhost:3000/api/chef/chef")
            .then((response) => {
                const chefsData = response.data.map(chef => ({
                    ...chef,
                    photo: chef.photo ? `http://localhost:3000${chef.photo}` : null
                }));
                setChefs(chefsData);
            })
            .catch((error) => {});

        fetchPremiumStatus();
    }, [searchTerm]);

    const handleCuisineClick = (category) => {
        if (category === "Cuisine") {
            setShowCuisineModal(true);
        } else {
            setSelectedCategory(category);
        }
    };

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
            .catch((error) => {});
    };

    const finalrecipe = (() => {
        if (selectedCategory === "All") {
            return recipes;
        } else if (cuisineList.includes(selectedCategory)) {
            return recipes.filter((recipe) => recipe.cuisine === selectedCategory);
        } else {
            return recipes.filter((recipe) => recipe.category === selectedCategory);
        }
    })();

    const handleRecipeSubmit = () => {
        axios.get("http://localhost:3000/api/recipe/recipes")
            .then((response) => {
                setRecipes(response.data);
                setShowModal(false);
            })
            .catch((error) => {});
    };

    const handleCategoryClick = (category) => {
        if (category === "Chef" && !isPremium && !isAdmin && !(isChef && chefStatus === "approved")) {
            if (isLoggedIn) {
                setShowPremiumModal(true);
            } else {
                alert("You must be logged in to access Chef Recipes.");
            }
        } else {
            setSelectedCategory(category);
        }
    };

    const handleRecipeClick = (recipe) => {
        if (recipe.is_chef_recipe && !isPremium && !isAdmin && !(isChef && chefStatus === "approved")) {
            if (isLoggedIn) {
                setShowPremiumModal(true);
            } else {
                alert("You must be logged in to access chef-crafted recipes.");
            }
        } else {
            navigate(`/recipedetails/${recipe.id}`);
        }
    };

    const handleGoPremium = () => {
        localStorage.setItem("premium_plan", JSON.stringify({
            plan: "Monthly Premium",
            price: 1500
        }));
        navigate("/paymentdetails");
    };

    const fetchFavorites = async () => {
        try {
            const userId = localStorage.getItem("userId");
            if (!userId) {
                alert("User ID not found. Please log in again.");
                return;
            }
            const res = await axios.get(`http://localhost:3000/api/recipe/favorites/${userId}`);
            setFavoriteRecipes(res.data);
        } catch (error) {}
    };

    const handleRemoveFavorite = async (recipeId) => {
        try {
            const userId = localStorage.getItem("userId");
            if (!userId) {
                alert("No userId found. Please log in again.");
                return;
            }

            await axios.delete("http://localhost:3000/api/recipe/removefavorite", {
                data: { userId: userId, recipeId: recipeId }
            });

            setFavoriteRecipes((prevFavorites) =>
                prevFavorites.filter((recipe) => recipe.id !== recipeId)
            );

            alert("Recipe successfully removed from favorites!");
        } catch (error) {
            alert("Failed to remove from favorites.");
        }
    };

    return (
        <div className="recipe">
            {isLoggedIn ? <Navigationbar /> : <Navbar />}
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
                            <IoFastFoodSharp className="recipe-page-divider-icon" />
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
                                            <span onClick={() => handleRecipeClick(item)}>
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
                            <div className="icon-wrapper" data-tooltip="Cuisine" onClick={() => handleCuisineClick("Cuisine")}>
                                <GiCookingPot className="icon" />
                            </div>
                            <div
                                className="icon-wrapper"
                                data-tooltip="Chef"
                                onClick={() => {
                                    if (!isLoggedIn) {
                                        alert("You must be logged in to access Chef Recipes.");
                                        return;
                                    }
                                    handleCategoryClick("Chef");
                                }}
                            >
                                <GiChefToque className="icon" />
                            </div>
                            <div
                                className="icon-wrapper"
                                data-tooltip="Favorites"
                                onClick={() => {
                                    if (!isLoggedIn) {
                                        alert("You must be logged in to view Favorites.");
                                        return;
                                    }
                                    fetchFavorites();
                                    setSelectedCategory("Favorites");
                                }}
                            >
                                <FaHeart className="icon" />
                            </div>
                            <div
                                className="icon-wrapper"
                                data-tooltip="Add Recipe"
                                onClick={() => {
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
                    {selectedCategory === "Chef" ? (
                        <>
                            <h1>Our Chefs</h1>
                            <div className="chef-grid">
                                {chefs.length > 0 ? (
                                    chefs
                                        .filter((chef) => chef.status === "approved") 
                                        .map((chef) => (
                                            <div className="chef-card" key={chef.id}>
                                                <img
                                                    src={chef.photo || DefaultChefImage}
                                                    alt={chef.name}
                                                    className="chef-card-image"
                                                />
                                                <h2>{chef.name}</h2>
                                                <button
                                                    className="chef-view-button"
                                                    onClick={() => navigate(`/chef/${chef.id}`)}
                                                >
                                                    View
                                                </button>
                                            </div>
                                        ))
                                ) : (
                                    <p>No chefs found.</p>
                                )}
                                {chefs.filter((chef) => chef.status === "approved").length === 0 && chefs.length > 0 && (
                                    <p>No chefs found.</p>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <h1>
                                {selectedCategory === "All" ? "Crowd-Pleasing Recipes" : selectedCategory} Recipes
                            </h1>
                            <div className="recipe-grid">
                                {selectedCategory === "Favorites" ? (
                                    favoriteRecipes.length > 0 ? (
                                        favoriteRecipes.map((recipe) => (
                                            <div className="recipe-card" key={recipe.id}>
                                                <div className="recipe-card-image-container">
                                                    <img
                                                        src={recipe.image_url || RecipeImage}
                                                        alt={recipe.title}
                                                        className="recipe-card-image"
                                                        onClick={() => handleRecipeClick(recipe)}
                                                    />
                                                    {recipe.is_chef_recipe && !isPremium && !isAdmin && !(isChef && chefStatus === "approved") && (
                                                        <FaLock className="recipe-lock-icon" onClick={() => handleRecipeClick(recipe)} />
                                                    )}
                                                </div>
                                                <div className="recipe-card-content">
                                                    <h2>{recipe.title}</h2>
                                                    <div className="recipe-info">
                                                        <span>⏱ {recipe.cooking_time}</span>
                                                        <span>⚡ {recipe.difficulty}</span>
                                                        <span>⭐ {recipe.average_rating ? parseFloat(recipe.average_rating).toFixed(1) : 'N/A'}</span>
                                                    </div>
                                                    <button
                                                        className="remove-fav-btn"
                                                        onClick={() => handleRemoveFavorite(recipe.id)}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p>No favorite recipes yet.</p>
                                    )
                                ) : (
                                    (filteredRecipes.length > 0 ? filteredRecipes : finalrecipe).length > 0 ? (
                                        (filteredRecipes.length > 0 ? filteredRecipes : finalrecipe).map((recipe) => (
                                            <div className="recipe-card" key={recipe.id}>
                                                <div className="recipe-card-image-container">
                                                    <img
                                                        src={recipe.image_url || RecipeImage}
                                                        alt={recipe.title}
                                                        className="recipe-card-image"
                                                        onClick={() => handleRecipeClick(recipe)}
                                                    />
                                                    {recipe.is_chef_recipe && !isPremium && !isAdmin && !(isChef && chefStatus === "approved") && (
                                                        <FaLock className="recipe-lock-icon" onClick={() => handleRecipeClick(recipe)} />
                                                    )}
                                                </div>
                                                <div className="recipe-card-content">
                                                    <h2>{recipe.title}</h2>
                                                    <div className="recipe-info">
                                                        <span>⏱ {recipe.cooking_time}</span>
                                                        <span>⚡ {recipe.difficulty}</span>
                                                        <span>⭐ {recipe.rating ? parseFloat(recipe.rating).toFixed(1) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p>No recipes found in {selectedCategory} category.</p>
                                    )
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <RecipeModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSubmit={handleRecipeSubmit}
            />

            {showCuisineModal && (
                <div className="cuisinemodal-overlay">
                    <div className="cuisinemodal-container">
                        <h2>Select Cuisine</h2>
                        <div className="cuisinemodal-content">
                            {cuisineOptions.map((cuisine, index) => (
                                <button
                                    className="cuisine-option"
                                    onClick={() => {
                                        setSelectedCategory(cuisine.name);
                                        setShowCuisineModal(false);
                                    }}
                                    key={index}
                                >
                                    <img src={cuisine.image} alt={cuisine.name} className="cuisine-image" />
                                    <span>{cuisine.name}</span>
                                </button>
                            ))}
                        </div>
                        <button className="cuisinemodal-close" onClick={() => setShowCuisineModal(false)}>
                            Close
                        </button>
                    </div>
                </div>
            )}

            {showPremiumModal && (
                <div className="premium-modal-overlay">
                    <div className="premium-modal-container">
                        <div className="premium-modal-content">
                            <h2 className="premium-modal-title">Premium</h2>
                            <p className="premium-modal-description">
                                Unlock the full potential of your culinary journey with our Premium Membership!
                            </p>
                            <div className="premium-modal-price">
                                <span>Rs 1500/month</span>
                            </div>
                            <button className="premium-modal-button" onClick={handleGoPremium}>
                                Go Premium
                            </button>
                            <div className="premium-modal-features">
                                <h3 className="premium-modal-features-title">Exclusive Chef Access</h3>
                                <div className="premium-modal-feature">
                                    <div className="premium-modal-check">✓</div>
                                    <p>Access exclusive, chef-crafted recipes tailored to your tastes and dietary needs</p>
                                </div>
                                <div className="premium-modal-feature">
                                    <div className="premium-modal-check">✓</div>
                                    <p>Be the first to try new features and seasonal recipe collection</p>
                                </div>
                                <div className="premium-modal-feature">
                                    <div className="premium-modal-check">✓</div>
                                    <p>Unlock all these benefits for just Rs1500/month, with no hidden fees.</p>
                                </div>
                                <div className="premium-modal-feature">
                                    <div className="premium-modal-check">✓</div>
                                    <p>Explore a growing library of chef-exclusive recipes designed to inspire your cooking.</p>
                                </div>
                                <div className="premium-modal-feature">
                                    <div className="premium-modal-check">✓</div>
                                    <p>Discover secret ingredients and methods used by professional chefs in their recipes.</p>
                                </div>
                            </div>
                        </div>
                        <button className="back-modal-button" onClick={() => setShowPremiumModal(false)}>
                            Back
                        </button>
                    </div>
                </div>
            )}

            {isLoggedIn ? <Footer /> : <FooterBefore />}
        </div>
    );
};

export default MainRecipe;
