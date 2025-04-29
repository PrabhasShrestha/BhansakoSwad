import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaEdit, FaPlus, FaTrash, FaEye, FaChartBar, FaUsers, FaGlobe, FaUtensils, FaStar } from 'react-icons/fa';
import { AiFillEye, AiFillEyeInvisible } from 'react-icons/ai';
import { toast } from 'react-toastify';
import RecipeModal from './User/RecipeModal';
import EditRecipeModal from './EditRecipeModal';
import ViewRecipeModal from './ViewRecipeModal';
import '../styles/ChefDashboard.css';

const ChefDashboard = () => {
  const [chef, setChef] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [stats, setStats] = useState({
    totalRecipes: 0,
    totalViews: 0,
    averageRating: 0,
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [viewedRecipe, setViewedRecipe] = useState(null);
  const [ingredients, setIngredients] = useState([{ ingredient: '', amount: '', customIngredient: '' }]);
  const [cookingSteps, setCookingSteps] = useState([{ step: '', step_ne: '' }]);
  const [nutritionInfo, setNutritionInfo] = useState([{ nutrient: '', value: '', nutrient_ne: '', value_ne: '' }]);
  const [recipeImageFile, setRecipeImageFile] = useState(null);
  const [recipeImagePreview, setRecipeImagePreview] = useState(null);
  const [allIngredients, setAllIngredients] = useState([]);
  const [translated, setTranslated] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Please log in to access the dashboard');
          return;
        }

        const chefResponse = await axios.get('http://localhost:3000/api/chef/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const chefData = chefResponse.data;
        if (chefData.photo) {
          chefData.photo = `http://localhost:3000${chefData.photo}`;
        }
        setChef(chefData);

        const recipesResponse = await axios.get('http://localhost:3000/api/chef/recipes', {
          headers: { Authorization: `Bearer ${token}` },
        });
        let fetchedRecipes = recipesResponse.data;

        const ratingsResponse = await axios.get('http://localhost:3000/api/chef/ratings', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const ratings = ratingsResponse.data;

        fetchedRecipes = fetchedRecipes.map(recipe => {
          const recipeRatings = ratings.filter(rating => rating.recipe_id === recipe.id);
          const avgRating = recipeRatings.length
            ? (recipeRatings.reduce((sum, r) => sum + r.rating, 0) / recipeRatings.length).toFixed(1)
            : 0;
          return {
            ...recipe,
            rating: avgRating,
            views: 0,
          };
        });

        setRecipes(fetchedRecipes);

        const totalRecipes = fetchedRecipes.length;
        const totalViews = fetchedRecipes.reduce((sum, recipe) => sum + recipe.views, 0);
        const averageRating = totalRecipes
          ? (fetchedRecipes.reduce((sum, recipe) => sum + parseFloat(recipe.rating || 0), 0) / totalRecipes).toFixed(1)
          : 0;

        setStats({ totalRecipes, totalViews, averageRating });

        const ingredientsResponse = await axios.get('http://localhost:3000/api/recipe/ingredients', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAllIngredients(ingredientsResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load dashboard data');
      }
    };

    fetchData();
  }, []);

  const handleRecipeAdded = async () => {
    try {
      const token = localStorage.getItem('token');
      const recipesResponse = await axios.get('http://localhost:3000/api/chef/recipes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      let fetchedRecipes = recipesResponse.data;

      const ratingsResponse = await axios.get('http://localhost:3000/api/chef/ratings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const ratings = ratingsResponse.data;

      fetchedRecipes = fetchedRecipes.map(recipe => {
        const recipeRatings = ratings.filter(rating => rating.recipe_id === recipe.id);
        const avgRating = recipeRatings.length
          ? (recipeRatings.reduce((sum, r) => sum + r.rating, 0) / recipeRatings.length).toFixed(1)
          : 0;
        return {
          ...recipe,
          rating: avgRating,
          views: 0,
        };
      });

      setRecipes(fetchedRecipes);

      const totalRecipes = fetchedRecipes.length;
      const totalViews = fetchedRecipes.reduce((sum, recipe) => sum + recipe.views, 0);
      const averageRating = totalRecipes
        ? (fetchedRecipes.reduce((sum, recipe) => sum + parseFloat(recipe.rating || 0), 0) / totalRecipes).toFixed(1)
        : 0;

      setStats({ totalRecipes, totalViews, averageRating });
    } catch (error) {
      console.error('Error refreshing recipes:', error);
      toast.error('Failed to refresh recipes');
    }
  };

  const openEditModal = async (recipe) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:3000/api/recipe/recipe/${recipe.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const recipeData = response.data;

      setSelectedRecipe({
        ...recipeData,
        cookingSteps: recipeData.methods.map(step => ({ step: step.description, step_ne: step.description_ne || '' })),
        ingredients: recipeData.ingredients.map(ing => ({
          ingredient: ing.name,
          amount: ing.amount,
          customIngredient: '',
        })),
        nutritionInfo: recipeData.nutrition.map(info => ({
          nutrient: info.nutrient,
          value: info.value,
          nutrient_ne: info.nutrient_ne || '',
          value_ne: info.value_ne || '',
        })),
        image: recipeData.image_url,
      });

      setIngredients(recipeData.ingredients.map(ing => ({
        ingredient: ing.name,
        amount: ing.amount,
        customIngredient: '',
      })));
      setCookingSteps(recipeData.methods.map(step => ({ step: step.description, step_ne: step.description_ne || '' })));
      setNutritionInfo(recipeData.nutrition.map(info => ({
        nutrient: info.nutrient,
        value: info.value,
        nutrient_ne: info.nutrient_ne || '',
        value_ne: info.value_ne || '',
      })));
      setRecipeImageFile(null);
      setRecipeImagePreview(recipeData.image_url);

      setIsEditModalOpen(true);
    } catch (error) {
      console.error('Error fetching recipe for edit:', error);
      toast.error('Unable to fetch recipe details for editing');
    }
  };

  const viewRecipe = async (recipeId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:3000/api/recipe/recipe/${recipeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const recipeData = response.data;

      setViewedRecipe({
        ...recipeData,
        image: recipeData.image_url,
        submittedBy: chef?.name || 'Unknown',
        cookingSteps: recipeData.methods.map(step => ({
          step: step.description,
          step_ne: step.description_ne || '',
        })),
        nutritionInfo: recipeData.nutrition.map(info => ({
          nutrient: info.nutrient,
          value: info.value,
          nutrient_ne: info.nutrient_ne || '',
          value_ne: info.value_ne || '',
        })),
      });
      setTranslated(false);
      setIsViewModalOpen(true);
    } catch (error) {
      console.error('Error fetching recipe for view:', error);
      toast.error('Unable to fetch recipe details');
    }
  };

  const toggleTranslation = () => {
    setTranslated(!translated);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
  
    const formData = new FormData();
    formData.append('title', selectedRecipe.title);
    formData.append('title_ne', selectedRecipe.title_ne || '');
    formData.append('difficulty', selectedRecipe.difficulty);
    formData.append('cooking_time', selectedRecipe.cooking_time);
    formData.append('category', selectedRecipe.category);
    formData.append('cuisine', selectedRecipe.cuisine || '');
  
    const finalIngredients = ingredients.map(({ id, ingredient, amount, amount_ne, customIngredient }) => ({
      id: id || undefined, // Include the ID for existing ingredients, undefined for new ones
      name: ingredient === 'Other' && customIngredient.trim() !== '' ? customIngredient : ingredient,
      amount: amount,
      amount_ne: amount_ne || undefined, // Include the Nepali amount
    }));
    formData.append('ingredients', JSON.stringify(finalIngredients));
  
    const finalMethods = cookingSteps.map(({ id, step, step_ne }, index) => ({
      id: id || undefined, // Include the ID for existing methods, undefined for new ones
      step_number: index + 1,
      description: step,
      description_ne: step_ne || null, // Rename to match backend expectation
    }));
    formData.append('methods', JSON.stringify(finalMethods));
  
    formData.append('nutrition', JSON.stringify(nutritionInfo));
  
    if (recipeImageFile) {
      formData.append('image', recipeImageFile);
    }
  
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:3000/api/admin/updaterecipe/${selectedRecipe.id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
  
      toast.success('Recipe updated successfully');
      handleRecipeAdded();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating recipe:', error);
      toast.error('Failed to update recipe');
    }
  };

  const handleDeleteRecipe = async (recipeId) => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:3000/api/admin/deleterecipes/${recipeId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Recipe deleted successfully');
        handleRecipeAdded();
      } catch (error) {
        console.error('Error deleting recipe:', error);
        toast.error('Failed to delete recipe');
      }
    }
  };

  const handleProfilePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('photo', file);

      axios
        .post('http://localhost:3000/api/chef/upload-photo', formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data',
          },
        })
        .then(response => {
          const photoUrl = `http://localhost:3000${response.data.photoUrl}`;
          setChef({ ...chef, photo: photoUrl });
          setSuccessMessage('Profile photo uploaded successfully');
          setTimeout(() => setSuccessMessage(''), 3000);
        })
        .catch(error => {
          console.error('Error uploading photo:', error);
          setErrorMessage('Failed to upload photo');
        });
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const updatedProfile = {
      name: e.target.name.value,
      email: e.target.email.value,
      phone_number: e.target.phone_number.value || null,
      nationality: e.target.nationality.value || null,
      about_you: e.target.about_you.value || null,
    };

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:3000/api/chef/profile', updatedProfile, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChef({ ...chef, ...updatedProfile });
      setSuccessMessage('Profile updated successfully');
      setEditMode(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error.response?.data || error.message);
      const errorMsg = error.response?.data?.msg || 'Server error';
      setErrorMessage(`Failed to update profile: ${errorMsg}`);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSubmitPasswordChange = (e) => {
    e.preventDefault();

    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setErrorMessage('All fields are required.');
      setSuccessMessage('');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage('New password and confirm password do not match.');
      setSuccessMessage('');
      return;
    }

    axios
      .post(
        'http://localhost:3000/api/change-password',
        {
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      )
      .then((response) => {
        setSuccessMessage(response.data.message || 'Password updated successfully.');
        setErrorMessage('');
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => {
          setIsChangePasswordOpen(false);
          localStorage.removeItem('token');
          window.location.href = '/login';
        }, 2000);
      })
      .catch((error) => {
        setErrorMessage(error.response?.data?.message || 'Failed to change password. Please try again.');
        setSuccessMessage('');
      });
  };

  const handleEditClick = () => {
    setEditMode(true);
  };

  const handleCancelClick = () => {
    setEditMode(false);
    setErrorMessage('');
    setSuccessMessage('');
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
    setCookingSteps([...cookingSteps, { step: '', step_ne: '' }]);
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
    setNutritionInfo([...nutritionInfo, { nutrient: '', value: '', nutrient_ne: '', value_ne: '' }]);
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

  const renderDashboardContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="chef-dashboard-dashboard-content">
            <div className="chef-dashboard-stats-grid">
              <div className="chef-dashboard-stat-card">
                <div className="chef-dashboard-stat-icon"><FaUtensils /></div>
                <div className="chef-dashboard-stat-info">
                  <h3>{stats.totalRecipes}</h3>
                  <p>Total Recipes</p>
                </div>
              </div>
              <div className="chef-dashboard-stat-card">
                <div className="chef-dashboard-stat-icon"><FaEye /></div>
                <div className="chef-dashboard-stat-info">
                  <h3>{stats.totalViews.toLocaleString()}</h3>
                  <p>Total Views</p>
                </div>
              </div>
              <div className="chef-dashboard-stat-card">
                <div className="chef-dashboard-stat-icon"><FaStar /></div>
                <div className="chef-dashboard-stat-info">
                  <h3>{stats.averageRating}</h3>
                  <p>Avg. Rating</p>
                </div>
              </div>
            </div>
            <div className="chef-dashboard-recipes-content">
              <div className="chef-dashboard-recipe-header">
                <h2>My Recipes</h2>
                <button className="chef-dashboard-add-recipe-btn" onClick={() => setIsAddModalOpen(true)}>
                  <FaPlus /> Add New Recipe
                </button>
              </div>
              <div className="chef-dashboard-recipes-table-container">
                <table className="chef-dashboard-recipes-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Cuisine</th>
                      <th>Cook Time</th>
                      <th>Difficulty</th>
                      <th>Rating</th>
                      <th>Views</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipes.length > 0 ? (
                      recipes.map(recipe => (
                        <tr key={recipe.id}>
                          <td>{recipe.title}</td>
                          <td>{recipe.cuisine || 'N/A'}</td>
                          <td>{recipe.cooking_time}</td>
                          <td>{recipe.difficulty}</td>
                          <td>{recipe.rating ? `${recipe.rating} ⭐` : 'N/A'}</td>
                          <td>{recipe.views.toLocaleString()}</td>
                          <td className="chef-dashboard-recipe-actions">
                            <button
                              className="chef-dashboard-action-btn chef-dashboard-view-btn"
                              onClick={() => viewRecipe(recipe.id)}
                              title="View Recipe"
                            >
                              <FaEye />
                            </button>
                            <button
                              className="chef-dashboard-action-btn chef-dashboard-edit-btn"
                              onClick={() => openEditModal(recipe)}
                              title="Edit Recipe"
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="chef-dashboard-action-btn chef-dashboard-delete-btn"
                              onClick={() => handleDeleteRecipe(recipe.id)}
                              title="Delete Recipe"
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7">No recipes found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <RecipeModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleRecipeAdded}
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
              />
              <ViewRecipeModal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                recipe={viewedRecipe}
                translated={translated}
                toggleTranslation={toggleTranslation}
              />
            </div>
          </div>
        );
      case 'profile':
        return (
          <div className="chef-dashboard-profile-content">
            <h2>My Profile</h2>
            {chef ? (
              <div className="profile-wrapper">
                <div className="profile-info">
                  <div className="chef-dashboard-profile-image-section">
                    <div className="chef-dashboard-profile-image-container">
                      {chef.photo ? (
                        <img src={chef.photo} alt="Profile" className="profile-avatar" />
                      ) : (
                        <div className="chef-dashboard-chef-initials">
                          {chef.name?.split(' ').map(n => n[0]).join('') || 'C'}
                        </div>
                      )}
                      <div className="chef-dashboard-chef-icon">
                        <svg viewBox="0 0 50 50" className="chef-dashboard-chef-hat">
                          <path d="M10,25C10,15,20,10,25,10c5,0,15,5,15,15c0,5-2,10-7,10h-16C12,35,10,30,10,25z" />
                          <ellipse cx="25" cy="7" rx="12" ry="3" />
                        </svg>
                      </div>
                    </div>
                    {editMode && (
                      <div className="image-actions">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePhotoUpload}
                          className="chef-dashboard-upload-photo-input"
                          id="profile-photo-upload"
                          style={{ display: 'none' }}
                        />
                        <div style={{display: 'flex'}}>
                        <button
                          type="button"
                          className="image-btns"
                          onClick={() => document.getElementById('profile-photo-upload').click()}
                        >
                          Set
                        </button>
                        <button
                          type="button"
                          className="image-btn-cancels"
                          onClick={() => setChef({ ...chef, photo: null })}
                        >
                          Remove
                        </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="profile-details">
                  <h2 className="details-title">General Information</h2>
                  {errorMessage && <div className="error-message">{errorMessage}</div>}
                  {successMessage && <div className="success-message">{successMessage}</div>}
                  <form onSubmit={handleProfileUpdate}>
                    <div className="input-group">
                      <label>Name</label>
                      <input
                        type="text"
                        name="name"
                        defaultValue={chef.name || ''}
                        disabled={!editMode}
                        required
                      />
                    </div>
                    <div className="input-group">
                      <label>Email</label>
                      <input
                        type="email"
                        name="email"
                        defaultValue={chef.email || ''}
                        disabled={!editMode}
                        required
                      />
                    </div>
                    <div className="input-group">
                      <label>Phone Number</label>
                      <input
                        type="text"
                        name="phone_number"
                        defaultValue={chef.phone_number || ''}
                        disabled={!editMode}
                      />
                    </div>
                    <div className="input-group">
                      <label>Nationality</label>
                      <input
                        type="text"
                        name="nationality"
                        defaultValue={chef.nationality || ''}
                        disabled={!editMode}
                      />
                    </div>
                    <div className="chef-dashboard-form-group chef-dashboard-full-width">
                      <label>About You</label>
                      <textarea
                        name="about_you"
                        rows="4"
                        defaultValue={chef.about_you || ''}
                        disabled={!editMode}
                      ></textarea>
                    </div>
                    <div className="input-group chef-dashboard-documents-group">
                      <label>Certificates</label>
                      <div className="chef-dashboard-document-display">
                        <span className="chef-dashboard-document-name">{chef.certificate || 'None'}</span>
                        {chef.certificate && (
                          <a
                            href={`http://localhost:3000/uploads/chefs/${chef.certificate}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="chef-dashboard-view-document-btn"
                          >
                            View
                          </a>
                        )}
                      </div>
                    </div>
                    {editMode ? (
                      <div className="button-container">
                        <button type="submit" className="secondary-btn">
                          Save Changes
                        </button>
                        <button
                          type="button"
                          className="secondary-btn cancel-btns"
                          onClick={handleCancelClick}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={handleEditClick}
                        >
                          Edit Profile
                        </button>
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() => setIsChangePasswordOpen(true)}
                        >
                          Change Password
                        </button>
                      </>
                    )}
                  </form>
                  {isChangePasswordOpen && (
                    <div className="password-modal-overlay">
                      <div className="password-modal">
                        <form onSubmit={handleSubmitPasswordChange}>
                          <h2>Change Password</h2>
                          <div className="input-group">
                            <label>Old Password</label>
                            <div className="password-input">
                              <input
                                type={showPassword.oldPassword ? 'text' : 'password'}
                                name="oldPassword"
                                value={passwordData.oldPassword}
                                onChange={handlePasswordChange}
                                required
                              />
                              {showPassword.oldPassword ? (
                                <AiFillEyeInvisible
                                  onClick={() => togglePasswordVisibility('oldPassword')}
                                />
                              ) : (
                                <AiFillEye
                                  onClick={() => togglePasswordVisibility('oldPassword')}
                                />
                              )}
                            </div>
                          </div>
                          <div className="input-group">
                            <label>New Password</label>
                            <div className="password-input">
                              <input
                                type={showPassword.newPassword ? 'text' : 'password'}
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                required
                              />
                              {showPassword.newPassword ? (
                                <AiFillEyeInvisible
                                  onClick={() => togglePasswordVisibility('newPassword')}
                                />
                              ) : (
                                <AiFillEye
                                  onClick={() => togglePasswordVisibility('newPassword')}
                                />
                              )}
                            </div>
                          </div>
                          <div className="input-group">
                            <label>Confirm Password</label>
                            <div className="password-input">
                              <input
                                type={showPassword.confirmPassword ? 'text' : 'password'}
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                required
                              />
                              {showPassword.confirmPassword ? (
                                <AiFillEyeInvisible
                                  onClick={() => togglePasswordVisibility('confirmPassword')}
                                />
                              ) : (
                                <AiFillEye
                                  onClick={() => togglePasswordVisibility('confirmPassword')}
                                />
                              )}
                            </div>
                          </div>
                          {errorMessage && <div className="error-message">{errorMessage}</div>}
                          {successMessage && <div className="success-message">{successMessage}</div>}
                          <div className="button-group">
                            <button type="submit">Submit</button>
                            <button
                              type="button"
                              onClick={() => {
                                setErrorMessage('');
                                setSuccessMessage('');
                                setIsChangePasswordOpen(false);
                              }}
                              disabled={!!successMessage}
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
            ) : (
              <p>Loading profile...</p>
            )}
          </div>
        );
      default:
        return <div>Select a tab to view content</div>;
    }
  };

  return (
    <div className="chef-dashboard">
      <header className="chef-dashboard-dashboard-header">
        <h1>Chef Dashboard</h1>
        <div className="chef-dashboard-user-info">
          <span>Welcome, {chef ? chef.name : 'Loading...'}</span>
          <div className="chef-dashboard-user-avatar">
            {chef && chef.photo ? (
              <img
                src={chef.photo}
                alt="Chef Profile"
                className="chef-dashboard-profile-photo"
                style={{ width: '40px', height: '40px', borderRadius: '50%' }}
              />
            ) : (
              chef ? chef.name?.split(' ').map(n => n[0]).join('') || 'C' : ''
            )}
          </div>
        </div>
      </header>
      
      <div className="chef-dashboard-dashboard-container">
        <div className="chef-dashboard-sidebar">
          <div className="chef-dashboard-sidebar-header">
            <div className="chef-dashboard-logo">Bhansako Swad</div>
          </div>
          <nav className="chef-dashboard-sidebar-nav">
            <ul>
              <li className={activeTab === 'dashboard' ? 'chef-dashboard-active' : ''}>
                <button onClick={() => setActiveTab('dashboard')}>
                  <FaChartBar className="chef-dashboard-nav-icon" /> Dashboard
                </button>
              </li>
              <li className={activeTab === 'profile' ? 'chef-dashboard-active' : ''}>
                <button onClick={() => setActiveTab('profile')}>
                  <FaUsers className="chef-dashboard-nav-icon" /> My Profile
                </button>
              </li>
              <li>
                <a href="/" className="chef-dashboard-view-website">
                  <FaGlobe className="chef-dashboard-nav-icon" /> View Website
                </a>
              </li>
            </ul>
          </nav>
        </div>
        
        <main className="chef-dashboard-dashboard-main">
          {renderDashboardContent()}
        </main>
      </div>
    </div>
  );
};

export default ChefDashboard;