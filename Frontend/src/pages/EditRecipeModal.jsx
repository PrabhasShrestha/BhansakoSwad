import React, { useEffect } from 'react';
import { FaTimes, FaPlus } from 'react-icons/fa';
import '../styles/EditModal.css'

const EditRecipeModal = ({
  isOpen,
  onClose,
  selectedRecipe,
  setSelectedRecipe,
  ingredients,
  setIngredients,
  cookingSteps,
  setCookingSteps,
  nutritionInfo,
  setNutritionInfo,
  recipeImagePreview,
  setRecipeImagePreview,
  allIngredients,
  handleEditSubmit,
  handleImageUpload,
  addIngredient,
  removeIngredient,
  updateIngredient,
  addCookingStep,
  removeCookingStep,
  updateCookingStep,
  addNutritionInfo,
  removeNutritionInfo,
  updateNutritionInfo,
  recipeImage,
  setRecipeImage
}) => {
  // Initialize ingredients from selectedRecipe.ingredients
  useEffect(() => {
    console.log('Checking ingredients initialization...');
    console.log('selectedRecipe:', selectedRecipe);
    console.log('allIngredients:', allIngredients);
    if (selectedRecipe && selectedRecipe.ingredients && Array.isArray(selectedRecipe.ingredients) && allIngredients && Array.isArray(allIngredients)) {
      console.log('All Ingredients:', allIngredients);
      console.log('Selected Recipe Ingredients:', selectedRecipe.ingredients);
      const initializedIngredients = selectedRecipe.ingredients.map((ing, index) => {
        const matchedIngredient = allIngredients.find(i => 
          i.name && ing.ingredient && i.name.trim().toLowerCase() === ing.ingredient.trim().toLowerCase()
        );
        const isExistingIngredient = !!matchedIngredient;
        console.log(`Ingredient at index ${index}: ${ing.ingredient}, Exists: ${isExistingIngredient}, Matched: ${matchedIngredient?.name}`);
        const ingredientData = {
          id: ing.id || `ing-${index}`,
          ingredient: isExistingIngredient ? matchedIngredient.name : (ing.ingredient || 'Other'),
          amount: ing.amount || '',
          amount_ne: ing.amount_ne || ing.amount || '', // Fallback to amount if amount_ne is missing
          customIngredient: isExistingIngredient ? '' : (ing.ingredient || ''),
          customIngredient_ne: isExistingIngredient ? '' : (ing.name_ne || ing.ingredient || '')
        };
        console.log(`Initialized Ingredient at index ${index}:`, ingredientData);
        return ingredientData;
      });
      setIngredients(initializedIngredients.length > 0 ? initializedIngredients : [
        { id: `ing-0`, ingredient: '', amount: '', amount_ne: '', customIngredient: '', customIngredient_ne: '' }
      ]);
      console.log('Final Ingredients State:', initializedIngredients);
    } else {
      console.log('SelectedRecipe or allIngredients not ready:', { selectedRecipe, allIngredients });
      setIngredients([{ id: `ing-0`, ingredient: '', amount: '', amount_ne: '', customIngredient: '', customIngredient_ne: '' }]);
    }
  }, [selectedRecipe, allIngredients, setIngredients]);

  // Initialize cookingSteps from selectedRecipe.methods
  useEffect(() => {
    console.log('Checking cookingSteps initialization...');
    console.log('selectedRecipe.methods:', selectedRecipe?.methods);
    if (selectedRecipe && selectedRecipe.methods && Array.isArray(selectedRecipe.methods)) {
      console.log('Initializing cookingSteps:', selectedRecipe.methods);
      const initializedSteps = selectedRecipe.methods.map((step, index) => {
        const stepData = {
          id: step.id || `step-${index}`,
          step: step.description || step.step || '',
          step_ne: step.description_ne || step.step_ne || ''
        };
        console.log(`Initialized Step at index ${index}:`, stepData);
        return stepData;
      });
      setCookingSteps(initializedSteps.length > 0 ? initializedSteps : [
        { id: `step-0`, step: '', step_ne: '' }
      ]);
      console.log('Final Cooking Steps State:', initializedSteps);
    } else {
      console.log('SelectedRecipe methods not ready:', { selectedRecipe });
      setCookingSteps([{ id: `step-0`, step: '', step_ne: '' }]);
    }
  }, [selectedRecipe, setCookingSteps]);

  // Initialize nutritionInfo from selectedRecipe.nutrition
  useEffect(() => {
    console.log('Checking nutritionInfo initialization...');
    console.log('selectedRecipe.nutrition:', selectedRecipe?.nutrition);
    if (selectedRecipe && selectedRecipe.nutrition && Array.isArray(selectedRecipe.nutrition)) {
      console.log('Initializing nutritionInfo:', selectedRecipe.nutrition);
      const initializedNutrition = selectedRecipe.nutrition.map((nutr, index) => {
        const nutrData = {
          id: nutr.id || `nutr-${index}`,
          nutrient: nutr.nutrient || '',
          nutrient_ne: nutr.nutrient_ne || '',
          value: nutr.value || '',
          value_ne: nutr.value_ne || ''
        };
        console.log(`Initialized Nutrition at index ${index}:`, nutrData);
        return nutrData;
      });
      setNutritionInfo(initializedNutrition.length > 0 ? initializedNutrition : [
        { id: `nutr-0`, nutrient: '', nutrient_ne: '', value: '', value_ne: '' }
      ]);
      console.log('Final Nutrition Info State:', initializedNutrition);
    } else {
      console.log('SelectedRecipe nutrition not ready:', { selectedRecipe });
      setNutritionInfo([{ id: `nutr-0`, nutrient: '', nutrient_ne: '', value: '', value_ne: '' }]);
    }
  }, [selectedRecipe, setNutritionInfo]);

  // Format data before submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Map ingredients to backend-expected format
    const formattedIngredients = ingredients.map(ing => ({
      id: ing.id && !String(ing.id).startsWith('ing-') ? ing.id : undefined, // Convert id to string
      name: ing.ingredient === 'Other' ? ing.customIngredient : ing.ingredient,
      name_ne: ing.ingredient === 'Other' ? ing.customIngredient_ne : undefined,
      amount: ing.amount,
      amount_ne: ing.amount_ne || ing.amount // Ensure amount_ne is sent
    }));

    // Map cookingSteps to backend-expected format
    const formattedMethods = cookingSteps.map((step, index) => ({
      id: step.id && !String(step.id).startsWith('step-') ? step.id : undefined, // Convert id to string
      step_number: index + 1,
      description: step.step,
      description_ne: step.step_ne || step.step // Ensure description_ne is sent
    }));

    // Map nutritionInfo to backend-expected format
    const formattedNutrition = nutritionInfo.map(nutr => ({
      id: nutr.id && !String(nutr.id).startsWith('nutr-') ? nutr.id : undefined, // Convert id to string
      nutrient: nutr.nutrient,
      nutrient_ne: nutr.nutrient_ne,
      value: nutr.value,
      value_ne: nutr.value_ne
    }));

    console.log('Submitting Form Data:');
    console.log('Formatted Ingredients:', formattedIngredients);
    console.log('Formatted Methods:', formattedMethods);
    console.log('Formatted Nutrition:', formattedNutrition);

    // Call the handleEditSubmit function with formatted data
    handleEditSubmit(e, {
      title: selectedRecipe.title,
      title_ne: selectedRecipe.title_ne,
      difficulty: selectedRecipe.difficulty,
      cooking_time: selectedRecipe.cooking_time,
      category: selectedRecipe.category,
      cuisine: selectedRecipe.cuisine,
      ingredients: formattedIngredients,
      methods: formattedMethods,
      nutrition: formattedNutrition,
      recipeImage
    });
  };

  if (!isOpen || !selectedRecipe) {
    console.log('Modal not open or selectedRecipe missing:', { isOpen, selectedRecipe });
    return null;
  }

  return (
    <div className="edit-recipe-modal-overlay">
      <div className="edit-recipe-modal-container edit-recipe-modal">
        <div className="edit-recipe-modal-header">
          <h2>Edit Recipe: {selectedRecipe.title}</h2>
          <button 
            className="edit-recipe-modal-close"
            onClick={onClose}
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-recipe-modal-form">
          <div className="edit-recipe-modal-section">
            <h3>Recipe Basics</h3>
            <div className="edit-recipe-modal-form-row">
              <div className="edit-recipe-modal-form-group">
                <label>Recipe Name (English)</label>
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
              <div className="edit-recipe-modal-form-group">
                <label>Recipe Name (Nepali)</label>
                <input
                  type="text"
                  lang="ne"
                  value={selectedRecipe.title_ne || ""}
                  onChange={(e) =>
                    setSelectedRecipe({
                      ...selectedRecipe,
                      title_ne: e.target.value
                    })
                  }
                />
              </div>
            </div>

            <div className="edit-recipe-modal-form-row">
              <div className="edit-recipe-modal-form-group">
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
              <div className="edit-recipe-modal-form-group">
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
            </div>

            <div className="edit-recipe-modal-form-row">
              <div className="edit-recipe-modal-form-group">
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
              <div className="edit-recipe-modal-form-group">
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
          </div>

          <div className="edit-recipe-modal-section">
            <h3>Ingredients</h3>
            {ingredients.map((ing, index) => (
              <div key={ing.id || `ingredient-${index}`} className="edit-recipe-modal-form-row ingredient-row">
                <div className="edit-recipe-modal-form-group">
                  <label>Ingredient</label>
                  <select
                    value={ing.ingredient || ""}
                    onChange={(e) => {
                      console.log(`Updating ingredient at index ${index}:`, { field: 'ingredient', value: e.target.value });
                      updateIngredient(index, 'ingredient', e.target.value);
                    }}
                    required
                  >
                    <option value="">Select Ingredient</option>
                    {allIngredients.map(item => (
                      <option key={item.id || `all-ing-${item.name}`} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                  {ing.ingredient === "Other" && (
                    <div className="custom-ingredient-inputs">
                      <input
                        type="text"
                        placeholder="Enter ingredient (English)"
                        value={ing.customIngredient || ""}
                        onChange={(e) => {
                          console.log(`Updating ingredient at index ${index}:`, { field: 'customIngredient', value: e.target.value });
                          updateIngredient(index, 'customIngredient', e.target.value);
                        }}
                        required
                      />
                      <input
                        type="text"
                        lang="ne"
                        placeholder="Enter ingredient (Nepali)"
                        value={ing.customIngredient_ne || ""}
                        onChange={(e) => {
                          console.log(`Updating ingredient at index ${index}:`, { field: 'customIngredient_ne', value: e.target.value });
                          updateIngredient(index, 'customIngredient_ne', e.target.value);
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="edit-recipe-modal-form-group">
                  <label>Amount (English)</label>
                  <input
                    type="text"
                    placeholder="e.g., 2 cups"
                    value={ing.amount || ""}
                    onChange={(e) => {
                      console.log(`Updating ingredient at index ${index}:`, { field: 'amount', value: e.target.value });
                      updateIngredient(index, 'amount', e.target.value);
                    }}
                    required
                  />
                </div>
                <div className="edit-recipe-modal-form-group">
                  <label>Amount (Nepali)</label>
                  <input
                    type="text"
                    lang="ne"
                    placeholder="e.g., २ कप"
                    value={ing.amount_ne || ""}
                    onChange={(e) => {
                      console.log(`Updating ingredient at index ${index}:`, { field: 'amount_ne', value: e.target.value });
                      updateIngredient(index, 'amount_ne', e.target.value);
                    }}
                  />
                </div>
                <div className="edit-recipe-modal-form-group edit-recipe-modal-ingredient-actions">
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="edit-recipe-modal-btn-remove"
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
              className="edit-recipe-modal-btn-add-ingredient"
            >
              <FaPlus /> Add Ingredient
            </button>
          </div>

          <div className="edit-recipe-modal-section">
            <h3>Cooking Methods</h3>
            {cookingSteps.map((step, index) => (
              <div key={step.id || `step-${index}`} className="edit-recipe-modal-form-row cooking-step-row">
                <div className="edit-recipe-modal-form-group step-input">
                  <label>Step {index + 1} (English)</label>
                  <textarea
                    placeholder="Describe step in English"
                    value={step.step || ""}
                    onChange={(e) => {
                      console.log(`Updating cooking step at index ${index}:`, { field: 'step', value: e.target.value });
                      updateCookingStep(index, 'step', e.target.value);
                    }}
                    required
                  />
                </div>
                <div className="edit-recipe-modal-form-group step-input">
                  <label>Step {index + 1} (Nepali)</label>
                  <textarea
                    lang="ne"
                    placeholder="Describe step in Nepali"
                    value={step.step_ne || ""}
                    onChange={(e) => {
                      console.log(`Updating cooking step at index ${index}:`, { field: 'step_ne', value: e.target.value });
                      updateCookingStep(index, 'step_ne', e.target.value);
                    }}
                  />
                </div>
                <div className="edit-recipe-modal-form-group edit-recipe-modal-step-actions">
                  {cookingSteps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCookingStep(index)}
                      className="edit-recipe-modal-btn-remove"
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
              className="edit-recipe-modal-btn-add-step"
            >
              <FaPlus /> Add Step
            </button>
          </div>

          <div className="edit-recipe-modal-section">
            <h3>Nutrition Information</h3>
            {nutritionInfo.map((info, index) => (
              <div key={info.id || `nutrition-${index}`} className="edit-recipe-modal-form-row nutrition-row">
                <div className="edit-recipe-modal-form-group">
                  <label>Nutrient (English)</label>
                  <input
                    type="text"
                    placeholder="e.g., Calories"
                    value={info.nutrient || ""}
                    onChange={(e) => updateNutritionInfo(index, 'nutrient', e.target.value)}
                  />
                </div>
                <div className="edit-recipe-modal-form-group">
                  <label>Nutrient (Nepali)</label>
                  <input
                    type="text"
                    lang="ne"
                    placeholder="e.g., क्यालोरी"
                    value={info.nutrient_ne || ""}
                    onChange={(e) => updateNutritionInfo(index, 'nutrient_ne', e.target.value)}
                  />
                </div>
                <div className="edit-recipe-modal-form-group">
                  <label>Value (English)</label>
                  <input
                    type="text"
                    placeholder="e.g., 250 kcal"
                    value={info.value || ""}
                    onChange={(e) => updateNutritionInfo(index, 'value', e.target.value)}
                  />
                </div>
                <div className="edit-recipe-modal-form-group">
                  <label>Value (Nepali)</label>
                  <input
                    type="text"
                    lang="ne"
                    placeholder="e.g., २५० क्यालोरी"
                    value={info.value_ne || ""}
                    onChange={(e) => updateNutritionInfo(index, 'value_ne', e.target.value)}
                  />
                </div>
                <div className="edit-recipe-modal-form-group edit-recipe-modal-nutrition-actions">
                  {nutritionInfo.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeNutritionInfo(index)}
                      className="edit-recipe-modal-btn-remove"
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
              className="edit-recipe-modal-btn-add-nutrition"
            >
              <FaPlus /> Add Nutrition Info
            </button>
          </div>

          <div className="edit-recipe-modal-section">
            <h3>Recipe Image</h3>
            <div className="edit-recipe-modal-form-group">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
              />
              {(recipeImagePreview || selectedRecipe.image) && (
                <img
                  src={recipeImagePreview || selectedRecipe.image}
                  alt="Preview"
                  style={{ maxWidth: "200px", marginTop: "10px" }}
                />
              )}
            </div>
          </div>

          <div className="edit-recipe-modal-actions">
            <button type="submit" className="edit-recipe-modal-btn-primary">
              Update Recipe
            </button>
            <button
              type="button"
              className="edit-recipe-modal-btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRecipeModal;