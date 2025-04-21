import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import "../../styles/Admin/AdminRecipe.css";
import AdminSidebar from '../../components/AdminSidebar';
import { FaTrash, FaCheck, FaBan, FaPlus, FaEye, FaEllipsisV, FaEdit } from 'react-icons/fa';
import ViewRecipeModal from '../ViewRecipeModal';
import EditRecipeModal from '../EditRecipeModal';
import RecipeModal from '../User/RecipeModal';
import ManageIngredientsModal from './ManageIngredientsModal'; // Import the new modal

const BASE_API_URL = 'http://localhost:3000'; // Define the base API URL

const AdminRecipePanel = () => {
  const [recipes, setRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [translated, setTranslated] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManageIngredientsModalOpen, setIsManageIngredientsModalOpen] = useState(false); // New state for the modal
  const [ingredients, setIngredients] = useState([]);
  const [cookingSteps, setCookingSteps] = useState([]);
  const [nutritionInfo, setNutritionInfo] = useState([]);
  const [recipeImageFile, setRecipeImageFile] = useState(null);
  const [recipeImagePreview, setRecipeImagePreview] = useState(null);
  const [allIngredients, setAllIngredients] = useState([]);
  const [activeMenu, setActiveMenu] = useState(null);
  const menuRefs = useRef({});

  useEffect(() => {
    fetchRecipes();
    fetchAllIngredients();

    const handleClickOutside = (event) => {
      if (activeMenu && !menuRefs.current[activeMenu]?.contains(event.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenu]);

  const fetchRecipes = async () => {
    try {
      const response = await axios.get(`${BASE_API_URL}/api/admin/recipes`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setRecipes(response.data);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      toast.error('Failed to fetch recipes');
    }
  };

  const fetchAllIngredients = async () => {
    try {
      const response = await axios.get(`${BASE_API_URL}/api/recipe/ingredients`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setAllIngredients(response.data);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      toast.error('Failed to fetch ingredients');
    }
  };

  const handleIngredientsUpdated = (updatedIngredients) => {
    setAllIngredients(updatedIngredients);
  };

  const handleRecipeAdded = async () => {
    await fetchRecipes();
  };

  const filteredRecipes = recipes.filter(recipe => 
    recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.submittedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.approvalStatus.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateApprovalStatus = async (recipeId, status) => {
    try {
      await axios.post(`${BASE_API_URL}/api/admin/${recipeId}/approval`, {
        approvalStatus: status
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      fetchRecipes();
      toast.success(`Recipe ${status} successfully`);
    } catch (error) {
      console.error('Error updating approval status:', error);
      toast.error('Failed to update approval status');
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
        await axios.delete(`${BASE_API_URL}/api/admin/deleterecipes/${recipeId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        fetchRecipes();
        toast.success('Recipe deleted successfully');
      } catch (error) {
        console.error('Error deleting recipe:', error);
        toast.error('Failed to delete recipe');
      }
    }
  };

  const openEditModal = async (recipe) => {
    try {
      const response = await axios.get(`${BASE_API_URL}/api/recipe/recipe/${recipe.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const recipeData = response.data;

      setSelectedRecipe({
        ...recipeData,
        cookingSteps: recipeData.methods.map(step => ({
          id: step.id,
          step: step.description,
          step_ne: step.description_ne || ''
        })),
        ingredients: recipeData.ingredients.map(ing => ({
          id: ing.id,
          ingredient: ing.name,
          amount: ing.amount,
          amount_ne: ing.amount_ne || ing.amount || '',
          customIngredient: '',
          customIngredient_ne: ing.name_ne || ''
        })),
        nutritionInfo: recipeData.nutrition.map(info => ({
          id: info.id,
          nutrient: info.nutrient,
          value: info.value,
          nutrient_ne: info.nutrient_ne || '',
          value_ne: info.value_ne || ''
        })),
        image: recipeData.image_url,
        submittedBy: recipeData.creator_name || 'Bhansako Swad Team',
        created_at: recipeData.created_at,
      });

      setIngredients(recipeData.ingredients.map(ing => ({
        id: ing.id,
        ingredient: ing.name,
        amount: ing.amount,
        amount_ne: ing.amount_ne || ing.amount || '',
        customIngredient: '',
        customIngredient_ne: ing.name_ne || ''
      })));
      setCookingSteps(recipeData.methods.map(step => ({
        id: step.id,
        step: step.description,
        step_ne: step.description_ne || ''
      })));
      setNutritionInfo(recipeData.nutrition.map(info => ({
        id: info.id,
        nutrient: info.nutrient,
        value: info.value,
        nutrient_ne: info.nutrient_ne || '',
        value_ne: info.value_ne || ''
      })));
      setRecipeImageFile(null);
      setRecipeImagePreview(recipeData.image_url);

      setIsEditModalOpen(true);
    } catch (error) {
      console.error('Error fetching recipe for edit:', error);
      toast.error('Unable to fetch recipe details for editing');
    }
  };

  const handleEditSubmit = async (e, formData) => {
    e.preventDefault();

    const { title, title_ne, difficulty, cooking_time, category, cuisine, ingredients, methods, nutrition, recipeImage } = formData;

    const data = new FormData();
    data.append('title', title || '');
    data.append('title_ne', title_ne || '');
    data.append('difficulty', difficulty || '');
    data.append('cooking_time', cooking_time || '');
    data.append('category', category || '');
    data.append('cuisine', cuisine || '');

    // Use the formatted ingredients from EditRecipeModal
    data.append('ingredients', JSON.stringify(ingredients));

    // Use the formatted methods from EditRecipeModal
    data.append('methods', JSON.stringify(methods));

    data.append('nutrition', JSON.stringify(nutrition));

    if (recipeImage) {
      data.append('image', recipeImage);
    }

    try {
      const token = localStorage.getItem('token'); 

      if (!token) {
        toast.error('You are not logged in. Please log in again.');
        return;
      }

      await axios.put(
        `${BASE_API_URL}/api/chef/recipes/${selectedRecipe.id}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          }
        }
      );

      toast.success('Recipe updated successfully');
      fetchRecipes();
      setIsEditModalOpen(false);

      // Optionally, refresh the selectedRecipe to reflect the updated data
      const response = await axios.get(`${BASE_API_URL}/api/recipe/recipe/${selectedRecipe.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedRecipeData = response.data;
      setSelectedRecipe({
        ...updatedRecipeData,
        cookingSteps: updatedRecipeData.methods.map(step => ({
          id: step.id,
          step: step.description,
          step_ne: step.description_ne || ''
        })),
        ingredients: updatedRecipeData.ingredients.map(ing => ({
          id: ing.id,
          ingredient: ing.name,
          amount: ing.amount,
          amount_ne: ing.amount_ne || ing.amount || '',
          customIngredient: '',
          customIngredient_ne: ing.name_ne || ''
        })),
        nutritionInfo: updatedRecipeData.nutrition.map(info => ({
          id: info.id,
          nutrient: info.nutrient,
          value: info.value,
          nutrient_ne: info.nutrient_ne || '',
          value_ne: info.value_ne || ''
        })),
        image: updatedRecipeData.image_url,
        submittedBy: updatedRecipeData.creator_name || 'Bhansako Swad Team',
        created_at: updatedRecipeData.created_at,
      });
    } catch (error) {
      console.error('Error updating recipe:', error);
      toast.error('Failed to update recipe: ' + (error.response?.data?.message || error.message));
    }
  };

  const openViewModal = async (recipe) => {
    try {
      const response = await axios.get(`${BASE_API_URL}/api/recipe/recipe/${recipe.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const recipeData = response.data;
  
      setSelectedRecipe({
        ...recipeData,
        cookingSteps: recipeData.methods.map(step => ({
          id: step.id,
          step: step.description,
          step_ne: step.description_ne || ''
        })),
        ingredients: recipeData.ingredients.map(ing => ({
          id: ing.id,
          ingredient: ing.name,
          ingredient_ne: ing.name_ne || '',
          amount: ing.amount,
          amount_ne: ing.amount_ne || ''
        })),
        nutritionInfo: recipeData.nutrition.map(info => ({
          id: info.id,
          nutrient: info.nutrient,
          value: info.value,
          nutrient_ne: info.nutrient_ne || '',
          value_ne: info.value_ne || ''
        })),
        image: recipeData.image_url,
        submittedBy: recipeData.creator_name || 'Bhansako Swad Team',
        created_at: recipeData.created_at
      });
  
      setIsViewModalOpen(true);
    } catch (error) {
      console.error('Error fetching recipe details:', error);
      toast.error('Unable to fetch recipe details');
    }
  };
  
  const addIngredient = () => {
    setIngredients([...ingredients, { id: `ing-${Date.now()}`, ingredient: '', amount: '', amount_ne: '', customIngredient: '', customIngredient_ne: '' }]);
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
    setCookingSteps([...cookingSteps, { id: `step-${Date.now()}`, step: '', step_ne: '' }]);
  };

  const removeCookingStep = (index) => {
    const newSteps = cookingSteps.filter((_, i) => i !== index);
    setCookingSteps(newSteps);
  };

  const updateCookingStep = (index, field, value) => {
    const newSteps = [...cookingSteps];
    newSteps[index][field] = value;
    setCookingSteps(newSteps);
  };

  const addNutritionInfo = () => {
    setNutritionInfo([...nutritionInfo, { id: `nutr-${Date.now()}`, nutrient: '', value: '', nutrient_ne: '', value_ne: '' }]);
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
    if (file) {
      setRecipeImageFile(file); 
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setRecipeImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleTranslation = () => {
    setTranslated(!translated);
  };

  const toggleMenu = (recipeId) => {
    setActiveMenu(activeMenu === recipeId ? null : recipeId);
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
              <button className="admin-dashboard-add-recipe-btn" onClick={() => setIsAddModalOpen(true)}>
                <FaPlus /> Add New Recipe
              </button>
              <button
                className="admin-dashboard-manage-recipe-btn"
                onClick={() => setIsManageIngredientsModalOpen(true)} // Open the new modal
              >
                <FaPlus /> Manage Ingredients
              </button>
              <RecipeModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleRecipeAdded}
                allIngredients={allIngredients}
                ingredients={ingredients}
                setIngredients={setIngredients}
                cookingSteps={cookingSteps}
                setCookingSteps={setCookingSteps}
                nutritionInfo={nutritionInfo}
                setNutritionInfo={setNutritionInfo}
                addIngredient={addIngredient}
                removeIngredient={removeIngredient}
                updateIngredient={updateIngredient}
                addCookingStep={addCookingStep}
                removeCookingStep={removeCookingStep}
                updateCookingStep={updateCookingStep}
                addNutritionInfo={addNutritionInfo}
                removeNutritionInfo={removeNutritionInfo}
                updateNutritionInfo={updateNutritionInfo}
                handleImageUpload={handleImageUpload}
                recipeImagePreview={recipeImagePreview}
                setRecipeImagePreview={setRecipeImagePreview}
                recipeImageFile={recipeImageFile}
                setRecipeImageFile={setRecipeImageFile}
              />
              <ManageIngredientsModal
                isOpen={isManageIngredientsModalOpen}
                onClose={() => setIsManageIngredientsModalOpen(false)}
                onIngredientsUpdated={handleIngredientsUpdated}
                allIngredients={allIngredients}
              />
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
                          <div className="admin-action-menu">
                            <button
                              className="admin-btn-icon admin-btn-menu"
                              onClick={() => toggleMenu(recipe.id)}
                              title="More Actions"
                            >
                              <FaEllipsisV />
                            </button>
                            {activeMenu === recipe.id && (
                              <div
                                className="admin-recipe-action-menu-dropdown"
                                ref={(el) => (menuRefs.current[recipe.id] = el)}
                              >
                                <button
                                  className="admin-action-menu-item admin-btn-view"
                                  onClick={() => {
                                    openViewModal(recipe);
                                    setActiveMenu(null);
                                  }}
                                >
                                  <FaEye /> View
                                </button>
                                <button
                                  className="admin-action-menu-item admin-btn-edit"
                                  onClick={() => {
                                    openEditModal(recipe);
                                    setActiveMenu(null);
                                  }}
                                >
                                  <FaEdit /> Edit
                                </button>
                                <button
                                  className="admin-action-menu-item admin-btn-remove"
                                  onClick={() => {
                                    deleteRecipe(recipe.id);
                                    setActiveMenu(null);
                                  }}
                                >
                                  <FaTrash /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="admin-empty-results">
                        No recipes found matching your search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <ViewRecipeModal 
              isOpen={isViewModalOpen}
              onClose={() => setIsViewModalOpen(false)}
              recipe={selectedRecipe}
              translated={translated}
              toggleTranslation={toggleTranslation}
            />

            <EditRecipeModal 
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              selectedRecipe={selectedRecipe}
              setSelectedRecipe={setSelectedRecipe}
              ingredients={ingredients}
              setIngredients={setIngredients}
              cookingSteps={cookingSteps}
              setCookingSteps={setCookingSteps}
              nutritionInfo={nutritionInfo}
              setNutritionInfo={setNutritionInfo}
              recipeImagePreview={recipeImagePreview}
              setRecipeImagePreview={setRecipeImagePreview}
              allIngredients={allIngredients}
              handleEditSubmit={handleEditSubmit}
              handleImageUpload={handleImageUpload}
              addIngredient={addIngredient}
              removeIngredient={removeIngredient}
              updateIngredient={updateIngredient}
              addCookingStep={addCookingStep}
              removeCookingStep={removeCookingStep}
              updateCookingStep={updateCookingStep}
              addNutritionInfo={addNutritionInfo}
              removeNutritionInfo={removeNutritionInfo}
              updateNutritionInfo={updateNutritionInfo}
              recipeImage={recipeImageFile}
              setRecipeImage={setRecipeImageFile}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRecipePanel;