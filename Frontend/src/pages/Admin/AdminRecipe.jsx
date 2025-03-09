// AdminRecipePanel.jsx
import React, { useState } from 'react';
import '../../styles/Admin/AdminRecipe.css';
import AdminSidebar from '../../components/AdminSidebar';

const AdminRecipePanel = () => {
  // Sample initial recipe data
  const initialRecipes = [
    { 
      id: 1, 
      title: 'Spaghetti Carbonara', 
      category: 'Italian', 
      difficulty: 'Medium', 
      prepTime: '20 mins', 
      cookTime: '15 mins',
      ingredients: ['Spaghetti', 'Eggs', 'Pancetta', 'Parmesan cheese', 'Black pepper', 'Salt'],
      instructions: '1. Cook pasta. 2. Fry pancetta. 3. Mix eggs and cheese. 4. Combine all ingredients.',
      isPublished: true,
      dateAdded: '2025-02-15'
    },
    { 
      id: 2, 
      title: 'Classic Beef Burger', 
      category: 'American', 
      difficulty: 'Easy', 
      prepTime: '15 mins', 
      cookTime: '10 mins',
      ingredients: ['Ground beef', 'Burger buns', 'Cheese slices', 'Lettuce', 'Tomato', 'Onion', 'Ketchup', 'Mustard'],
      instructions: '1. Form patties. 2. Grill until cooked. 3. Assemble burger with toppings.',
      isPublished: true,
      dateAdded: '2025-03-01'
    },
    { 
      id: 3, 
      title: 'Vegetable Stir Fry', 
      category: 'Asian', 
      difficulty: 'Easy', 
      prepTime: '15 mins', 
      cookTime: '10 mins',
      ingredients: ['Broccoli', 'Carrots', 'Bell peppers', 'Snap peas', 'Soy sauce', 'Garlic', 'Ginger', 'Vegetable oil'],
      instructions: '1. Prepare vegetables. 2. Heat oil in wok. 3. Stir fry vegetables. 4. Add sauce and serve.',
      isPublished: false,
      dateAdded: '2025-03-05'
    },
  ];
  
  // State variables
  const [recipes, setRecipes] = useState(initialRecipes);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [currentRecipe, setCurrentRecipe] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    difficulty: 'Easy',
    prepTime: '',
    cookTime: '',
    ingredients: '',
    instructions: '',
    isPublished: true
  });
  
  // Filter recipes based on search term
  const filteredRecipes = recipes.filter(recipe => 
    recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Handle input change for form fields
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Handle ingredients input (convert string to array)
  const handleIngredientsChange = (e) => {
    setFormData({
      ...formData,
      ingredients: e.target.value
    });
  };
  
  // Start adding a new recipe
  const startAddRecipe = () => {
    setFormData({
      title: '',
      category: '',
      difficulty: 'Easy',
      prepTime: '',
      cookTime: '',
      ingredients: '',
      instructions: '',
      isPublished: true
    });
    setIsAdding(true);
    setIsEditing(false);
  };
  
  // Start editing a recipe
  const startEditRecipe = (recipe) => {
    setCurrentRecipe(recipe);
    setFormData({
      title: recipe.title,
      category: recipe.category,
      difficulty: recipe.difficulty,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      ingredients: recipe.ingredients.join('\n'),
      instructions: recipe.instructions,
      isPublished: recipe.isPublished
    });
    setIsEditing(true);
    setIsAdding(false);
  };
  
  // Cancel editing or adding
  const cancelEdit = () => {
    setIsEditing(false);
    setIsAdding(false);
    setCurrentRecipe(null);
  };
  
  // Save a new or edited recipe
  const saveRecipe = (e) => {
    e.preventDefault();
    
    const ingredientsArray = formData.ingredients
      .split('\n')
      .map(item => item.trim())
      .filter(item => item !== '');
    
    const recipeData = {
      title: formData.title,
      category: formData.category,
      difficulty: formData.difficulty,
      prepTime: formData.prepTime,
      cookTime: formData.cookTime,
      ingredients: ingredientsArray,
      instructions: formData.instructions,
      isPublished: formData.isPublished,
      dateAdded: new Date().toISOString().split('T')[0]
    };
    
    if (isAdding) {
      // Add new recipe
      const newRecipe = {
        id: recipes.length > 0 ? Math.max(...recipes.map(r => r.id)) + 1 : 1,
        ...recipeData
      };
      setRecipes([...recipes, newRecipe]);
    } else if (isEditing && currentRecipe) {
      // Update existing recipe
      setRecipes(recipes.map(recipe => 
        recipe.id === currentRecipe.id ? { ...recipe, ...recipeData } : recipe
      ));
    }
    
    // Reset form state
    setIsEditing(false);
    setIsAdding(false);
    setCurrentRecipe(null);
  };
  
  // Delete a recipe
  const deleteRecipe = (recipeId) => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      setRecipes(recipes.filter(recipe => recipe.id !== recipeId));
    }
  };
  
  // Toggle recipe publication status
  const togglePublishStatus = (recipeId) => {
    setRecipes(recipes.map(recipe => 
      recipe.id === recipeId ? { ...recipe, isPublished: !recipe.isPublished } : recipe
    ));
  };
  
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
    <div className="admin-container">
      <div className="admin-panel">
        <div className="admin-panel-header">
          <h1 className="admin-panel-title">Recipe Management</h1>
          <p className="admin-panel-subtitle">Add, edit, and manage recipes</p>
        </div>
        
        {/* Recipe Form (Add/Edit) */}
        {(isAdding || isEditing) && (
          <div className="admin-form-container">
            <h2 className="admin-form-title">
              {isAdding ? 'Add New Recipe' : 'Edit Recipe'}
            </h2>
            <form onSubmit={saveRecipe} className="admin-recipe-form">
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Recipe Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="admin-form-input"
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Category</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="admin-form-input"
                    required
                  />
                </div>
              </div>
              
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-form-label">Difficulty</label>
                  <select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleInputChange}
                    className="admin-form-select"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Prep Time</label>
                  <input
                    type="text"
                    name="prepTime"
                    value={formData.prepTime}
                    onChange={handleInputChange}
                    className="admin-form-input"
                    placeholder="e.g. 15 mins"
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Cook Time</label>
                  <input
                    type="text"
                    name="cookTime"
                    value={formData.cookTime}
                    onChange={handleInputChange}
                    className="admin-form-input"
                    placeholder="e.g. 30 mins"
                    required
                  />
                </div>
              </div>
              
              <div className="admin-form-group">
                <label className="admin-form-label">Ingredients (one per line)</label>
                <textarea
                  name="ingredients"
                  value={formData.ingredients}
                  onChange={handleIngredientsChange}
                  className="admin-form-textarea"
                  rows="6"
                  required
                />
              </div>
              
              <div className="admin-form-group">
                <label className="admin-form-label">Instructions</label>
                <textarea
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleInputChange}
                  className="admin-form-textarea"
                  rows="6"
                  required
                />
              </div>
              
              <div className="admin-form-group admin-form-checkbox-group">
                <input
                  type="checkbox"
                  name="isPublished"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={handleInputChange}
                  className="admin-form-checkbox"
                />
                <label htmlFor="isPublished" className="admin-form-checkbox-label">
                  Publish recipe
                </label>
              </div>
              
              <div className="admin-form-actions">
                <button type="submit" className="admin-btn admin-btn-primary">
                  {isAdding ? 'Add Recipe' : 'Save Changes'}
                </button>
                <button 
                  type="button" 
                  onClick={cancelEdit} 
                  className="admin-btn admin-btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Recipe List */}
        {!isAdding && !isEditing && (
          <>
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
                <button 
                  className="admin-btn admin-btn-primary"
                  onClick={startAddRecipe}
                >
                  Add Recipe
                </button>
              </div>
            </div>
            
            <div className="admin-table-container">
              <table className="admin-recipe-table">
                <thead className="admin-table-head">
                  <tr>
                    <th className="admin-table-header">Title</th>
                    <th className="admin-table-header">Category</th>
                    <th className="admin-table-header">Difficulty</th>
                    <th className="admin-table-header">Prep/Cook Time</th>
                    <th className="admin-table-header">Status</th>
                    <th className="admin-table-header">Date Added</th>
                    <th className="admin-table-header admin-actions-column">Actions</th>
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
                          {recipe.prepTime} / {recipe.cookTime}
                        </td>
                        <td className="admin-table-cell">
                          <span 
                            className={`admin-badge ${recipe.isPublished ? 'admin-badge-green' : 'admin-badge-gray'}`}
                            onClick={() => togglePublishStatus(recipe.id)}
                          >
                            {recipe.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="admin-table-cell admin-date-cell">
                          {recipe.dateAdded}
                        </td>
                        <td className="admin-table-cell admin-actions-cell">
                          <div className="admin-action-buttons">
                            <button 
                              onClick={() => startEditRecipe(recipe)} 
                              className="admin-btn-text admin-btn-edit"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => deleteRecipe(recipe.id)} 
                              className="admin-btn-text admin-btn-remove"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="admin-empty-results">
                        No recipes found matching your search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
    </div>
    </div>
  );
};

export default AdminRecipePanel;