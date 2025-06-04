import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import RecipeImage from '../../assets/RecipePage/Recipe1.jpg';
import NonVegImage from '../../assets/RecipePage/NonVeg.jpg';
import FishImage from '../../assets/RecipePage/Fish.jpg';
import VegImage from '../../assets/RecipePage/Veg.jpg';
import VeganImage from '../../assets/RecipePage/Vegan.jpg';
import GlutenFreeImage from '../../assets/RecipePage/GlutenFree.jpg';
import DrinksImage from '../../assets/RecipePage/drinks.jpg';
import DefaultChefImage from '../../assets/RecipePage/chef.jpg';
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
  const location = useLocation();
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
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true); // Added loading state
  const recipesPerPage = 6;

  useEffect(() => {
    if (location.state?.category) {
      const category = location.state.category;
      if (category === "Cuisine") {
        setShowCuisineModal(true);
      } else {
        setSelectedCategory(category);
      }
    }

    const token = localStorage.getItem("token");
    const fetchPremiumStatus = async () => {
      try {
        setIsLoading(true);
        if (!token) {
          toast.error("No token found. Please log in again.", {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
          return;
        }

        const userResponse = await axios.get("http://localhost:3000/api/get-user", {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log("User API Response:", userResponse.data); // Debug log
        if (userResponse.data.success) {
          const userData = userResponse.data.data;
          console.log("is_chef:", userData.is_chef, "chef_status:", userData.chef_status); // Debug log
          setIsAdmin(userData.is_admin === 1 || userData.is_admin === true);
          setIsPremium(!!userData.is_premium);
          setIsChef(!!userData.is_chef); // Ensure boolean
          setChefStatus(userData.chef_status ? userData.chef_status.toLowerCase() : null); // Use chef_status
        } else {
          toast.error("Failed to fetch user data. Please log in again.", {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Authentication error. Please log in again.", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    const fetchRecipesWithRatings = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/recipe/recipes", {
          headers: { Authorization: `Bearer ${token}` }
        });

        const recipesWithRatings = response.data.map(recipe => ({
          ...recipe,
          average_rating: recipe.average_rating || null
        }));

        const updatedRecipes = await Promise.all(recipesWithRatings.map(async (recipe) => {
          if (!recipe.average_rating) {
            try {
              const ratingResponse = await axios.get(`http://localhost:3000/api/recipe/${recipe.id}/rating`);
              return { ...recipe, average_rating: ratingResponse.data.average_rating || null };
            } catch (error) {
              return { ...recipe, average_rating: null };
            }
          }
          return recipe;
        }));

        setRecipes(updatedRecipes);
      } catch (error) {
        console.error("Error fetching recipes:", error);
      }
    };

    axios.get(`http://localhost:3000/api/recipe/search?query=${searchTerm}`)
      .then((response) => {
        setSearchResults(response.data);
      })
      .catch((error) => {
        console.error("Error fetching search results:", error);
      });

    axios.get("http://localhost:3000/api/chef/chef")
      .then((response) => {
        console.log("Chefs API Response:", response.data); // Debug log
        const chefsData = response.data.map(chef => ({
          ...chef,
          photo: chef.photo ? `http://localhost:3000${chef.photo}` : null
        }));
        setChefs(chefsData);
      })
      .catch((error) => {
        console.error("Error fetching chefs:", error);
      });

    fetchRecipesWithRatings();
    fetchPremiumStatus();
  }, [searchTerm, location.state, isLoggedIn]);

  const handleCuisineClick = (category) => {
    if (category === "Cuisine") {
      setShowCuisineModal(true);
    } else {
      setSelectedCategory(category);
      setCurrentPage(1);
    }
  };

  const addIngredient = (ingredient) => {
    if (!selectedIngredients.includes(ingredient)) {
      const updatedIngredients = [...selectedIngredients, ingredient];
      setSelectedIngredients(updatedIngredients);
      filterRecipesByIngredients(updatedIngredients);
      setCurrentPage(1);
    }
  };

  const removeIngredient = (ingredient) => {
    const updatedIngredients = selectedIngredients.filter(item => item !== ingredient);
    setSelectedIngredients(updatedIngredients);
    filterRecipesByIngredients(updatedIngredients);
    setCurrentPage(1);
  };

  const filterRecipesByIngredients = (ingredients) => {
    if (ingredients.length === 0) {
      setFilteredRecipes([]);
      setCurrentPage(1);
      return;
    }

    axios.post("http://localhost:3000/api/recipe/filterRecipes", { ingredients })
      .then((response) => {
        setFilteredRecipes(response.data);
        setCurrentPage(1);
      })
      .catch((error) => {
        console.error("Error filtering recipes by ingredients:", error);
      });
  };

  const finalrecipe = (() => {
    if (selectedCategory === "All") {
      return recipes;
    } else if (cuisineOptions.map(c => c.name).includes(selectedCategory)) {
      return recipes.filter((recipe) => recipe.cuisine === selectedCategory);
    } else {
      return recipes.filter((recipe) => recipe.category === selectedCategory);
    }
  })();

  const indexOfLastRecipe = currentPage * recipesPerPage;
  const indexOfFirstRecipe = indexOfLastRecipe - recipesPerPage;
  const currentRecipes = (filteredRecipes.length > 0 ? filteredRecipes : selectedCategory === "Favorites" ? favoriteRecipes : finalrecipe).slice(indexOfFirstRecipe, indexOfLastRecipe);
  const totalPages = Math.ceil((filteredRecipes.length > 0 ? filteredRecipes : selectedCategory === "Favorites" ? favoriteRecipes : finalrecipe).length / recipesPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleRecipeSubmit = () => {
    axios.get("http://localhost:3000/api/recipe/recipes")
      .then((response) => {
        setRecipes(response.data);
        setShowModal(false);
        setCurrentPage(1);
      })
      .catch((error) => {
        console.error("Error fetching recipes after submit:", error);
      });
  };

  const handleCategoryClick = (category) => {
    if (isLoading) {
      toast.info("Please wait, loading user data...", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }
    console.log("isChef:", isChef, "chefStatus:", chefStatus); // Debug log
    if (category === "Chef" && !isPremium && !isAdmin && !(isChef && chefStatus === "approved")) {
      if (isLoggedIn) {
        setShowPremiumModal(true);
      } else {
        toast.error("You must be logged in to access Chef Recipes.", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } else {
      setSelectedCategory(category);
      setCurrentPage(1);
    }
  };

  const handleRecipeClick = (recipe) => {
    if (recipe.is_chef_recipe && !isPremium && !isAdmin && !(isChef && chefStatus === "approved")) {
      if (isLoggedIn) {
        setShowPremiumModal(true);
      } else {
        toast.error("You must be logged in to access chef-crafted recipes.", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
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
        toast.error("User ID not found. Please log in again.", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        return;
      }
      const res = await axios.get(`http://localhost:3000/api/recipe/favorites/${userId}`);
      setFavoriteRecipes(res.data);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching favorites:", error);
    }
  };

  const handleRemoveFavorite = async (recipeId) => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        toast.error("No userId found. Please log in again.", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        return;
      }

      await axios.delete("http://localhost:3000/api/recipe/removefavorite", {
        data: { userId: userId, recipeId: recipeId }
      });

      setFavoriteRecipes((prevFavorites) =>
        prevFavorites.filter((recipe) => recipe.id !== recipeId)
      );

      toast.success("Recipe successfully removed from favorites!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      if (selectedCategory === "Favorites" && favoriteRecipes.length <= recipesPerPage && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      console.error("Error removing favorite:", error);
      toast.error("Failed to remove from favorites.", {
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
              <IoFastFoodSharp className="recipe-page-difficulty-icon" />
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
                    toast.error("You must be logged in to access Chef Recipes.", {
                      position: "top-right",
                      autoClose: 3000,
                      hideProgressBar: false,
                      closeOnClick: true,
                      pauseOnHover: true,
                      draggable: true,
                    });
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
                    toast.error("You must be logged in to view Favorites.", {
                      position: "top-right",
                      autoClose: 3000,
                      hideProgressBar: false,
                      closeOnClick: true,
                      pauseOnHover: true,
                      draggable: true,
                    });
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
                    toast.error("You must be logged in to add a recipe.", {
                      position: "top-right",
                      autoClose: 3000,
                      hideProgressBar: false,
                      closeOnClick: true,
                      pauseOnHover: true,
                      draggable: true,
                    });
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
                    .filter((chef) => chef.status?.toLowerCase() === "approved")
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
                {chefs.filter((chef) => chef.status?.toLowerCase() === "approved").length === 0 && chefs.length > 0 && (
                  <p>No approved chefs found.</p>
                )}
              </div>
            </>
          ) : (
            <>
              <h1>
                {selectedCategory === "All" ? "Crowd-Pleasing Recipes" : selectedCategory} Recipes
              </h1>
              <div className="recipe-grid">
                {currentRecipes.length > 0 ? (
                  currentRecipes.map((recipe) => (
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
                        {selectedCategory === "Favorites" && (
                          <button
                            className="remove-fav-btn"
                            onClick={() => handleRemoveFavorite(recipe.id)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No recipes found in {selectedCategory} category.</p>
                )}
              </div>
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="pagination-button"
                  >
                    ←
                  </button>
                  {totalPages <= 5 ? (
                    Array.from({ length: totalPages }, (_, index) => (
                      <button
                        key={index + 1}
                        onClick={() => handlePageChange(index + 1)}
                        className={`pagination-button ${currentPage === index + 1 ? 'active' : ''}`}
                      >
                        {index + 1}
                      </button>
                    ))
                  ) : (
                    <>
                      <button
                        onClick={() => handlePageChange(1)}
                        className={`pagination-button ${currentPage === 1 ? 'active' : ''}`}
                      >
                        1
                      </button>
                      {currentPage > 3 && <span className="pagination-ellipsis">...</span>}
                      {Array.from({ length: 3 }, (_, index) => {
                        const page = currentPage <= 3 ? index + 2 : currentPage > totalPages - 3 ? totalPages - 4 + index : currentPage - 1 + index;
                        if (page >= 2 && page <= totalPages - 1) {
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`pagination-button ${currentPage === page ? 'active' : ''}`}
                            >
                              {page}
                            </button>
                          );
                        }
                        return null;
                      })}
                      {currentPage < totalPages - 2 && <span className="pagination-ellipsis">...</span>}
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        className={`pagination-button ${currentPage === totalPages ? 'active' : ''}`}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="pagination-button"
                  >
                    →
                  </button>
                </div>
              )}
            </>
          )}
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
                      setCurrentPage(1);
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

        <ToastContainer />
        {isLoggedIn ? <Footer /> : <FooterBefore />}
      </div>
    </div>
  );
};

export default MainRecipe;