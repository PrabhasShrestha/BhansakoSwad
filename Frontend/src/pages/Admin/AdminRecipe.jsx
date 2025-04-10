import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "../../styles/Admin/AdminRecipe.css";
import AdminSidebar from '../../components/AdminSidebar';
import { FaTrash, FaCheck, FaBan, FaPlus, FaTimes, FaEye } from 'react-icons/fa';
import translations from "../../components/nepaliTranslations.json";

const AdminRecipePanel = () => {
  const [recipes, setRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [translated, setTranslated] = useState(false);

  const [ingredients, setIngredients] = useState([{ ingredient: '', amount: '', customIngredient: '' }]);
  const [cookingSteps, setCookingSteps] = useState([{ step: '' }]);
  const [nutritionInfo, setNutritionInfo] = useState([{ nutrient: '', value: '' }]);
  const [recipeImage, setRecipeImage] = useState(null);
  const [allIngredients, setAllIngredients] = useState([]);

  useEffect(() => {
    fetchRecipes();
    fetchAllIngredients();
  }, []);

  const fetchRecipes = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/admin/recipes');
      setRecipes(response.data);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    }
  };

  const fetchAllIngredients = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/recipe/ingredients');
      setAllIngredients(response.data);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
    }
  };

  const filteredRecipes = recipes.filter(recipe => 
    recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.submittedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.approvalStatus.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateApprovalStatus = async (recipeId, status) => {
    try {
      await axios.post(`http://localhost:3000/api/admin/${recipeId}/approval`, {
        approvalStatus: status
      });
      fetchRecipes();
    } catch (error) {
      console.error('Error updating approval status:', error);
      alert('Failed to update approval status. Please try again.');
    }
  };
  
  const handleApprove = async (recipeId) => {
    await updateApprovalStatus(recipeId, 'approved');
  };
  
  const handleReject = async (recipeId) => {
    await updateApprovalStatus(recipeId, 'rejected');
  };
  
  const handleReAdd = async (recipeId) => {
    await updateApprovalStatus(recipeId, 'approved'); 
  };
  
  const handleRevoke = async (recipeId) => {
    if (window.confirm('Are you sure you want to revoke approval for this recipe?')) {
      await updateApprovalStatus(recipeId, 'rejected');
    }
  };

  const deleteRecipe = async (recipeId) => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      try {
        await axios.delete(`http://localhost:3000/api/admin/deleterecipes/${recipeId}`);
        fetchRecipes();
      } catch (error) {
        console.error('Error deleting recipe:', error);
        alert('Failed to delete recipe. Please try again.');
      }
    }
  };

  const openEditModal = async (recipe) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/recipe/recipe/${recipe.id}`);
      const recipeData = response.data;

      setSelectedRecipe({
        ...recipeData,
        cookingSteps: recipeData.methods.map(step => ({ step: step.description, step_ne: step.description_ne })),
        ingredients: recipeData.ingredients.map(ing => ({
          ingredient: ing.name,
          amount: ing.amount,
          customIngredient: ''
        })),
        nutritionInfo: recipeData.nutrition,
        image: recipeData.image_url,
        submittedBy: recipeData.creator_name || 'Bhansako Swad Team',
        created_at: recipeData.created_at,
      });

      setIngredients(recipeData.ingredients.map(ing => ({
        ingredient: ing.name,
        amount: ing.amount,
        customIngredient: ''
      })));
      setCookingSteps(recipeData.methods.map(step => ({ step: step.description, step_ne: step.description_ne })));
      setNutritionInfo(recipeData.nutrition);
      setRecipeImage(recipeData.image_url);

      setIsEditModalOpen(true);
    } catch (error) {
      console.error('Error fetching recipe for edit:', error);
      alert('Unable to fetch recipe details for editing.');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    const finalImageUrl = recipeImage || selectedRecipe.image;

    const updatedRecipe = {
      title: selectedRecipe.title,
      difficulty: selectedRecipe.difficulty,
      cooking_time: selectedRecipe.cooking_time,
      category: selectedRecipe.category,
      image_url: finalImageUrl,
      ingredients: ingredients.map(({ ingredient, amount, customIngredient }) => ({
        name: ingredient === "Other" && customIngredient.trim() !== "" ? customIngredient : ingredient,
        amount: amount
      })),
      methods: cookingSteps.map(({ step }, index) => ({
        step_number: index + 1,
        description: step
      })),
      nutrition: nutritionInfo
    };

    try {
      const token = localStorage.getItem('token'); 

      if (!token) {
        alert('You are not logged in. Please log in again.');
        return;
      }
  
      await axios.post(
        `http://localhost:3000/api/recipe/updaterecipe/${selectedRecipe.id}`,
        updatedRecipe,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );
  
      alert('Recipe updated successfully.');
      fetchRecipes();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating recipe:', error);
      alert('Failed to update the recipe.');
    }
  };

  const openViewModal = async (recipe) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/recipe/recipe/${recipe.id}`);
      const recipeData = response.data;
  
      setSelectedRecipe({
        ...recipeData,
        cookingSteps: recipeData.methods.map(step => ({
          step: step.description,
          step_ne: step.description_ne // Store Nepali description
        })),
        ingredients: recipeData.ingredients.map(ing => ({
          ingredient: ing.name,
          amount: ing.amount
        })),
        nutritionInfo: recipeData.nutrition.map(info => ({
          nutrient: info.nutrient,
          value: info.value,
          nutrient_ne: info.nutrient_ne,
          value_ne: info.value_ne
        })),
        image: recipeData.image_url,
        submittedBy: recipeData.creator_name || 'Bhansako Swad Team',
        created_at: recipeData.created_at
      });
  
      setIsViewModalOpen(true);
    } catch (error) {
      console.error('Error fetching recipe details:', error);
      alert('Unable to fetch recipe details.');
    }
  };
  
  const addIngredient = () => {
    setIngredients([...ingredients, { ingredient: '', amount: '', customIngredient: '' }]);
  };

  const removeIngredient = (index) => {
    const newIngredients = ingredients.filter((_, i) => i !== index);
    setIngredients(newIngredients);
  };

  const updateIngredient = (index, field, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
  };

  const addCookingStep = () => {
    setCookingSteps([...cookingSteps, { step: '' }]);
  };

  const removeCookingStep = (index) => {
    const newSteps = cookingSteps.filter((_, i) => i !== index);
    setCookingSteps(newSteps);
  };

  const updateCookingStep = (index, value) => {
    const newSteps = [...cookingSteps];
    newSteps[index].step = value;
    setCookingSteps(newSteps);
  };

  const addNutritionInfo = () => {
    setNutritionInfo([...nutritionInfo, { nutrient: '', value: '' }]);
  };

  const removeNutritionInfo = (index) => {
    const newNutritionInfo = nutritionInfo.filter((_, i) => i !== index);
    setNutritionInfo(newNutritionInfo);
  };

  const updateNutritionInfo = (index, field, value) => {
    const newNutritionInfo = [...nutritionInfo];
    newNutritionInfo[index][field] = value;
    setNutritionInfo(newNutritionInfo);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    console.log("File selected:", file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log("Base64 data:", reader.result);
        setRecipeImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleTranslation = () => {
    setTranslated(!translated);
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
        <div className="admin-container">
          <div className="admin-panel">
            <div className="admin-panel-header">
              <h1 className="admin-panel-title">Recipe Management</h1>
              <p className="admin-panel-subtitle">Review and manage submitted recipes</p>
            </div>

            <div className="admin-search-section">
              <div className="admin-search-container">
                <div className="admin-search-input-wrapper">
                  <input
                    type="text"
                    placeholder="Search recipes..."
                    className="admin-search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <span className="admin-search-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>

            <div className="admin-table-container">
              <table className="admin-recipe-table">
                <thead className="admin-table-head">
                  <tr>
                    <th className="admin-table-headers">Title</th>
                    <th className="admin-table-headers">Category</th>
                    <th className="admin-table-headers">Difficulty</th>
                    <th className="admin-table-headers">Cook Time</th>
                    <th className="admin-table-headers">Submitted By</th>
                    <th className="admin-table-headers">Role</th>
                    <th className="admin-table-headers">Status</th>
                    <th className="admin-table-headers">Date Added</th>
                    <th className="admin-table-headers admin-actions-column">Actions</th>
                  </tr>
                </thead>
                <tbody className="admin-table-body">
                  {filteredRecipes.length > 0 ? (
                    filteredRecipes.map((recipe) => (
                      <tr key={recipe.id} className="admin-recipe-row">
                        <td className="admin-table-cell admin-recipe-title-cell">
                          {recipe.title}
                        </td>
                        <td className="admin-table-cell">
                          <span className="admin-badge admin-badge-blue">
                            {recipe.category}
                          </span>
                        </td>
                        <td className="admin-table-cell">
                          <span className={`admin-badge ${
                            recipe.difficulty === 'Easy' ? 'admin-badge-green' :
                            recipe.difficulty === 'Medium' ? 'admin-badge-orange' :
                            'admin-badge-red'
                          }`}>
                            {recipe.difficulty}
                          </span>
                        </td>
                        <td className="admin-table-cell">
                          {recipe.cooking_time || '-'}
                        </td>
                        <td className="admin-table-cell">
                          <span className={`admin-badge ${
                            recipe.userType === 'chef' ? 'admin-badge-purple' :
                            recipe.userType === 'admin' ? 'admin-badge-blue' :
                            'admin-badge-gray'
                          }`}>
                            {recipe.submittedBy || 'Bhansako Swad Team'}
                          </span>
                        </td>
                        <td className="admin-table-cell">
                          <span className={`admin-badge ${
                            recipe.userType === 'admin' ? 'admin-badge-purple' :
                            recipe.userType === 'chef' ? 'admin-badge-orange' :
                            recipe.userType === 'seller' ? 'admin-badge-gray' :
                            'admin-badge-blue'
                          }`}>
                            {recipe.userType.charAt(0).toUpperCase() + recipe.userType.slice(1)}
                          </span>
                        </td>
                        <td className="admin-table-cell">
                          <div className="admin-status-container">
                            <span className={`admin-badge ${
                              recipe.approval_status === 'approved' ? 'admin-badge-green' : 
                              recipe.approval_status === 'pending' ? 'admin-badge-orange' : 
                              'admin-badge-red'
                            }`}>
                              {recipe.approval_status}
                            </span>
                          </div>
                          <div className="admin-approval-actions">
                            {recipe.approval_status === 'pending' && (
                              <>
                                <button 
                                  onClick={() => handleApprove(recipe.id)} 
                                  className="admin-btn-icon admin-btn-approve" 
                                  title="Approve"
                                >
                                  <FaCheck />
                                </button>
                                <button 
                                  onClick={() => handleReject(recipe.id)} 
                                  className="admin-btn-icon admin-btn-reject" 
                                  title="Reject"
                                >
                                  <FaTrash />
                                </button>
                              </>
                            )}
                            {recipe.approval_status === 'rejected' && (
                              <button 
                                onClick={() => handleReAdd(recipe.id)} 
                                className="admin-btn-icon admin-btn-approve" 
                                title="Re-add for Approval"
                              >
                                <FaCheck />
                              </button>
                            )}
                            {recipe.approval_status === 'approved' && (
                              <button 
                                onClick={() => handleRevoke(recipe.id)} 
                                className="admin-btn-icon admin-btn-reject" 
                                title="Revoke Approval"
                              >
                                <FaBan />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="admin-table-cell admin-date-cell">
                          {new Date(recipe.created_at).toLocaleDateString()}
                        </td>
                        <td className="admin-table-cell admin-actions-cell">
                          <div className="admins-action-buttons">
                            <button 
                              onClick={() => deleteRecipe(recipe.id)} 
                              className="admin-btn-text admin-btn-remove"
                            >
                              Delete
                            </button>
                            <button 
                              onClick={() => openEditModal(recipe)} 
                              className="admin-btn-text admin-btn-edit"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => openViewModal(recipe)} 
                              className="admin-btn-text admin-btn-view"
                              title="View Recipe"
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="admin-empty-results">
                        No recipes found matching your search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* View Modal */}
            {isViewModalOpen && selectedRecipe && (
              <div className="admin-modal-overlay">
                <div className="admin-modal-container admin-view-recipe-modal">
                  <div className="admin-modal-header">
                    <h2>Recipe Details: {translated ? selectedRecipe.title_ne || selectedRecipe.title : selectedRecipe.title}</h2>
                    <button 
                      className="admin-modal-close"
                      onClick={() => setIsViewModalOpen(false)}
                    >
                      ×
                    </button>
                  </div>
                  <div className="admin-view-modal-content">
                    <div className="admin-view-recipe-image">
                      {selectedRecipe.image ? (
                        <img src={selectedRecipe.image_url} alt={selectedRecipe.title} />
                      ) : (
                        <div className="admin-no-image-placeholder">No Image Available</div>
                      )}
                    </div>
                    <div className="admin-view-recipe-details">
                      <div className="admin-view-recipe-header">
                        <h3>{translated ? selectedRecipe.title_ne || selectedRecipe.title : selectedRecipe.title}</h3>
                        <div className="admin-view-recipe-badges">
                          <span className="admin-badge admin-badge-blue">
                            {selectedRecipe.category}
                          </span>
                          <span className={`admin-badge ${
                            selectedRecipe.difficulty === 'Easy' ? 'admin-badge-green' :
                            selectedRecipe.difficulty === 'Medium' ? 'admin-badge-orange' :
                            'admin-badge-red'
                          }`}>
                            {selectedRecipe.difficulty}
                          </span>
                        </div>
                      </div>
                      <div className="admin-view-recipe-section">
                        <h4>{translated ? "खाना पकाउने समय" : "Cooking Time"}</h4>
                        <p>{selectedRecipe.cooking_time || (translated ? "उल्लेख गरिएको छैन" : "Not specified")}</p>
                      </div>
                      <div className="admin-view-recipe-section">
                        <h4>{translated ? "सामग्रीहरू" : "Ingredients"}</h4>
                        <ul>
                          {selectedRecipe.ingredients?.map((ing, index) => (
                            <li key={index}>
                              {ing.amount} {ing.ingredient}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="admin-view-recipe-section">
                      <h4>{translated ? translations.cookingSteps : "Cooking Steps"}</h4>
                      {selectedRecipe.cookingSteps?.length > 0 ? (
                        <>
                          {selectedRecipe.cookingSteps.map((step, index) => (
                            <div className="admin-method-step" key={index}>
                              <h4>
                                {translated ? translations.step : "Step"}{" "}
                                {translated ? translations.nepaliNumbers[index + 1] : index + 1}
                              </h4>
                              <p>{translated && step.step_ne ? step.step_ne : step.step}</p>
                            </div>
                          ))}
                        </>
                      ) : (
                        <p>{translated ? "कुनै चरणहरू उपलब्ध छैनन्" : "No steps available"}</p>
                      )}
                    </div>
                      <div className="admin-view-recipe-section">
                        <h4>{translated ? "पोषण जानकारी" : "Nutrition Information"}</h4>
                        <table className="admin-view-nutrition-table">
                          <tbody>
                            {selectedRecipe.nutritionInfo?.map((info, index) => (
                              <tr key={index}>
                                <td>{translated ? (info.nutrient_ne || info.nutrient) : info.nutrient}</td>
                                <td>{translated ? (info.value_ne || info.value) : info.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="admin-view-recipe-footer">
                        <div className="admin-view-recipe-metadata">
                          <p>{translated ? "पेश गर्ने: " : "Submitted By: "} {selectedRecipe.submittedBy}</p>
                          <p>{translated ? "थपिएको मिति: " : "Date Added: "} {new Date(selectedRecipe.created_at).toLocaleDateString()}</p>
                          <button
                            className="translate-btn"                      
                            onClick={toggleTranslation}                      
                          >
                            {translated ? "Translate to English" : translations.translateToNepali}                       
                          </button>                   
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="admin-modal-actions">
                    <button 
                      className="admin-btn-secondary"
                      onClick={() => setIsViewModalOpen(false)}
                    >
                      {translated ? "बन्द गर्नुहोस्" : "Close"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Modal (Unchanged) */}
            {isEditModalOpen && selectedRecipe && (
              <div className="admin-modal-overlay">
                <div className="admin-modal-container admin-edit-recipe-modal">
                  <div className="admin-modal-header">
                    <h2>Edit Recipe: {selectedRecipe.title}</h2>
                    <button 
                      className="admin-modal-close"
                      onClick={() => setIsEditModalOpen(false)}
                    >
                      ×
                    </button>
                  </div>

                  <form onSubmit={handleEditSubmit} className="admin-modal-form">
                    <div className="admin-modal-section">
                      <h3>Recipe Basics</h3>
                      <div className="admin-modal-form-row">
                        <div className="admin-modal-form-group">
                          <label>Recipe Name</label>
                          <input
                            type="text"
                            value={selectedRecipe.title || ""}
                            onChange={(e) =>
                              setSelectedRecipe({
                                ...selectedRecipe,
                                title: e.target.value
                              })
                            }
                            required
                          />
                        </div>
                        <div className="admin-modal-form-group">
                          <label>Difficulty</label>
                          <select
                            value={selectedRecipe.difficulty || ""}
                            onChange={(e) =>
                              setSelectedRecipe({
                                ...selectedRecipe,
                                difficulty: e.target.value
                              })
                            }
                            required
                          >
                            <option value="">Select Difficulty</option>
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                          </select>
                        </div>
                      </div>

                      <div className="admin-modal-form-row">
                        <div className="admin-modal-form-group">
                          <label>Cooking Time</label>
                          <input
                            type="text"
                            placeholder="e.g., 30 mins"
                            value={selectedRecipe.cooking_time || ""}
                            onChange={(e) =>
                              setSelectedRecipe({
                                ...selectedRecipe,
                                cooking_time: e.target.value
                              })
                            }
                            required
                          />
                        </div>
                        <div className="admin-modal-form-group">
                          <label>Category</label>
                          <select
                            value={selectedRecipe.category || ""}
                            onChange={(e) =>
                              setSelectedRecipe({
                                ...selectedRecipe,
                                category: e.target.value
                              })
                            }
                            required
                          >
                            <option value="">Select Category</option>
                            <option value="Vegetarian">Vegetarian</option>
                            <option value="Pescatarian">Pescatarian</option>
                            <option value="Non-Vegetarian">Non-Vegetarian</option>
                            <option value="Vegan">Vegan</option>
                            <option value="Gluten-Free">Gluten-Free</option>
                          </select>
                        </div>
                      </div>

                      <div className="admin-modal-form-group">
                        <label>Cuisine</label>
                        <select
                          value={selectedRecipe.cuisine || ""}
                          onChange={(e) =>
                            setSelectedRecipe({
                              ...selectedRecipe,
                              cuisine: e.target.value
                            })
                          }
                        >
                          <option value="">(Optional) Select Cuisine</option>
                          <option value="Italian">Italian</option>
                          <option value="Mexican">Mexican</option>
                          <option value="Japanese">Japanese</option>
                          <option value="Indian">Indian</option>
                          <option value="Nepali">Nepali</option>
                          <option value="Thai">Thai</option>
                          <option value="Turkish">Turkish</option>
                          <option value="Chinese">Chinese</option>
                        </select>
                      </div>
                    </div>

                    <div className="admin-modal-section">
                      <h3>Ingredients</h3>
                      {ingredients.map((ing, index) => (
                        <div key={index} className="admin-modal-form-row ingredient-row">
                          <div className="admin-modal-form-group">
                            <label>Ingredient</label>
                            <select
                              value={ing.ingredient}
                              onChange={(e) => updateIngredient(index, 'ingredient', e.target.value)}
                            >
                              <option value="">Select Ingredient</option>
                              {allIngredients.map(item => (
                                <option key={item.name} value={item.name}>
                                  {item.name}
                                </option>
                              ))}
                              <option value="Other">Other</option>
                            </select>
                            {ing.ingredient === "Other" && (
                              <input
                                type="text"
                                placeholder="Enter ingredient"
                                value={ing.customIngredient || ""}
                                onChange={(e) =>
                                  updateIngredient(index, 'customIngredient', e.target.value)
                                }
                              />
                            )}
                          </div>
                          <div className="admin-modal-form-group">
                            <label>Amount</label>
                            <input
                              type="text"
                              placeholder="e.g., 2 cups"
                              value={ing.amount}
                              onChange={(e) => updateIngredient(index, 'amount', e.target.value)}
                            />
                          </div>
                          <div className="admin-modal-form-group admin-ingredient-actions">
                            {ingredients.length > 1 && (
                              <button 
                                type="button" 
                                onClick={() => removeIngredient(index)}
                                className="admin-btn-remove"
                              >
                                <FaTimes />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      <button 
                        type="button" 
                        onClick={addIngredient}
                        className="admin-btn-add-ingredient"
                      >
                        <FaPlus /> Add Ingredient
                      </button>
                    </div>

                    <div className="admin-modal-section">
                      <h3>Cooking Methods</h3>
                      {cookingSteps.map((step, index) => (
                        <div key={index} className="admin-modal-form-row cooking-step-row">
                          <div className="admin-modal-form-group step-input">
                            <label>Step {index + 1}</label>
                            <textarea
                              placeholder="Describe step"
                              value={step.step}
                              onChange={(e) => updateCookingStep(index, e.target.value)}
                            />
                          </div>
                          <div className="admin-modal-form-group admin-step-actions">
                            {cookingSteps.length > 1 && (
                              <button 
                                type="button" 
                                onClick={() => removeCookingStep(index)}
                                className="admin-btn-remove"
                              >
                                <FaTimes />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      <button 
                        type="button" 
                        onClick={addCookingStep}
                        className="admin-btn-add-step"
                      >
                        <FaPlus /> Add Step
                      </button>
                    </div>

                    <div className="admin-modal-section">
                      <h3>Nutrition Information</h3>
                      {nutritionInfo.map((info, index) => (
                        <div key={index} className="admin-modal-form-row nutrition-row">
                          <div className="admin-modal-form-group">
                            <label>Nutrient</label>
                            <input
                              type="text"
                              placeholder="e.g., Calories"
                              value={info.nutrient}
                              onChange={(e) => updateNutritionInfo(index, 'nutrient', e.target.value)}
                            />
                          </div>
                          <div className="admin-modal-form-group">
                            <label>Value</label>
                            <input
                              type="text"
                              placeholder="e.g., 250"
                              value={info.value}
                              onChange={(e) => updateNutritionInfo(index, 'value', e.target.value)}
                            />
                          </div>
                          <div className="admin-modal-form-group admin-nutrition-actions">
                            {nutritionInfo.length > 1 && (
                              <button 
                                type="button" 
                                onClick={() => removeNutritionInfo(index)}
                                className="admin-btn-remove"
                              >
                                <FaTimes />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      <button 
                        type="button" 
                        onClick={addNutritionInfo}
                        className="admin-btn-add-nutrition"
                      >
                        <FaPlus /> Add Nutrition Info
                      </button>
                    </div>

                    <div className="admin-modal-section">
                      <h3>Recipe Image</h3>
                      <div className="admin-modal-form-group">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                        {recipeImage && (
                          <img src={recipeImage} alt="Preview" style={{ maxWidth: "200px" }} />
                        )}
                      </div>
                    </div>

                    <div className="admin-modal-actions">
                      <button type="submit" className="admin-btn-primary">
                        Update Recipe
                      </button>
                      <button
                        type="button"
                        className="admin-btn-secondary"
                        onClick={() => setIsEditModalOpen(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRecipePanel;