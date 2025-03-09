import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Toast from "../../components/ToastNoti";
import { FaPlus, FaTrash } from 'react-icons/fa';

const RecipeModal = ({ isOpen, onClose, onSubmit }) => {
    const [recipeName, setRecipeName] = useState('');
    const [difficulty, setDifficulty] = useState('');
    const [cookingTime, setCookingTime] = useState('');
    const [category, setCategory] = useState('');
    const [image, setImage] = useState(null);
    const [cuisine, setCuisine] = useState('');
    const [toast, setToast] = useState(null); // Changed to match the Toast component's expected props
    const [ingredients, setIngredients] = useState([]);
    const [availableIngredients, setAvailableIngredients] = useState([]);
    const [currentIngredient, setCurrentIngredient] = useState({
        name: '',
        amount: ''
    });
    const [newIngredientName, setNewIngredientName] = useState('');

    // Methods state
    const [methods, setMethods] = useState([
        { step_number: 1, description: '' }
    ]);

    // Nutrition state
    const [nutrition, setNutrition] = useState([
        { nutrient: '', value: '' }
    ]);

    // Fetch available ingredients on component mount
    useEffect(() => {
        if (isOpen) { // Only fetch when modal is open
            axios.get("http://localhost:3000/api/recipe/ingredients")
                .then(response => {
                    setAvailableIngredients(response.data);
                })
                .catch(error => {
                    console.error("Error fetching ingredients:", error);
                    showToast("Failed to load ingredients", "error");
                });
        }
    }, [isOpen]);

    // Toast helper function
    const showToast = (message, type) => {
        setToast({ message, type });
        // Auto clear toast after duration
        setTimeout(() => {
            setToast(null);
        }, 3000);
    };

    // Add a new ingredient to the list
    const addIngredient = () => {
        if (currentIngredient.name && currentIngredient.amount) {
            setIngredients([...ingredients, currentIngredient]);
            setCurrentIngredient({ name: '', amount: '' });
        } else {
            showToast("Please select an ingredient and specify amount", "info");
        }
    };

    // Remove an ingredient from the list
    const removeIngredient = (index) => {
        const updatedIngredients = [...ingredients];
        updatedIngredients.splice(index, 1);
        setIngredients(updatedIngredients);
    };

    // Add a new custom ingredient to the database
    const addNewIngredient = () => {
        if (newIngredientName) {
            axios.post("http://localhost:3000/api/recipe/ingredients/create", { name: newIngredientName })
                .then(response => {
                    setAvailableIngredients([...availableIngredients, { name: newIngredientName }]);
                    setNewIngredientName('');
                    showToast(`Ingredient "${newIngredientName}" added successfully`, "success");
                })
                .catch(error => {
                    console.error("Error adding new ingredient:", error);
                    showToast("Failed to add new ingredient", "error");
                });
        } else {
            showToast("Please enter an ingredient name", "info");
        }
    };

    // Add a new method step
    const addMethodStep = () => {
        setMethods([
            ...methods, 
            { step_number: methods.length + 1, description: '' }
        ]);
    };

    // Update a method step
    const updateMethodStep = (index, description) => {
        const updatedMethods = [...methods];
        updatedMethods[index].description = description;
        setMethods(updatedMethods);
    };

    // Add a new nutrition entry
    const addNutritionEntry = () => {
        setNutrition([
            ...nutrition, 
            { nutrient: '', value: '' }
        ]);
    };

    // Update nutrition entry
    const updateNutritionEntry = (index, field, value) => {
        const updatedNutrition = [...nutrition];
        updatedNutrition[index][field] = value;
        setNutrition(updatedNutrition);
    };

    // Handle image upload
    const handleImageUpload = (e) => {
        setImage(e.target.files[0]);
    };

    // Submit recipe
    const handleSubmitRecipe = () => {
        // Validate required fields
        if (!recipeName || !difficulty || !cookingTime || !category) {
            showToast("Please fill in all required fields", "error");
            return;
        }
    
        // Validate ingredients
        if (ingredients.length === 0) {
            showToast("Please add at least one ingredient", "error");
            return;
        }
    
        // Validate methods
        const validMethods = methods.filter(method => method.description.trim() !== '');
        if (validMethods.length === 0) {
            showToast("Please add at least one cooking method step", "error");
            return;
        }
    
        const recipeData = {
            title: recipeName,
            difficulty: difficulty,
            cooking_time: cookingTime,
            category: category,
            ingredients: ingredients,
            cuisine: cuisine,
            methods: validMethods,
            nutrition: nutrition.filter(n => n.nutrient && n.value)
        };
    
        const formData = new FormData();
        
        // Append all recipe data fields
        Object.keys(recipeData).forEach(key => {
            formData.append(key, JSON.stringify(recipeData[key]));
        });
        
        // Append image if exists
        if (image) {
            // Generate a unique filename or use original filename
            const filename = `recipe_${Date.now()}_${image.name}`;
            formData.append('image_url', filename);
            formData.append('image', image);
        }
    
        axios.post("http://localhost:3000/api/recipe/addrecipe", formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${localStorage.getItem("token")}`,
            }
        })
        .then(response => {
            console.log("Recipe added successfully", response.data);
            resetForm();
            showToast("Recipe added successfully!", "success");
            setTimeout(() => {
                onClose();
                onSubmit(); // Call the onSubmit callback to refresh recipes
            }, 1000); // Small delay to let user see the success message
        })
        .catch(error => {
            console.error("Error adding recipe:", error.response?.data || error);
            showToast("Failed to add recipe. Please check your inputs.", "error");
        });
    };

    const resetForm = () => {
        setRecipeName('');
        setDifficulty('');
        setCookingTime('');
        setCategory('');
        setImage(null);
        setIngredients([]);
        setMethods([{ step_number: 1, description: '' }]);
        setNutrition([{ nutrient: '', value: '' }]);
    };

    if (!isOpen) return null;

    return (
        <div className="recipemodal-overlay">
            {/* Toast should be at the top level for visibility */}
            {toast && (
                <Toast
                    type={toast.type}
                    message={toast.message}
                    onClose={() => setToast(null)}
                />
            )}
            
            <div className="recipemodal-content">
                <h2>Add New Recipe</h2>
                <div className="recipe-form-section">
                    <h3>Recipe Basics</h3>
                    <input 
                        type="text" 
                        placeholder="Recipe Name" 
                        value={recipeName} 
                        onChange={(e) => setRecipeName(e.target.value)} 
                    />
                    <select 
                        value={difficulty} 
                        onChange={(e) => setDifficulty(e.target.value)}
                    >
                        <option value="">Select Difficulty</option>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                    </select>
                    <input 
                        type="text" 
                        placeholder="Cooking Time (e.g., 30 mins)" 
                        value={cookingTime} 
                        onChange={(e) => setCookingTime(e.target.value)} 
                    />
                    <select 
                        value={category} 
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        <option value="">Select Category</option>
                        <option value="Vegetarian">Vegetarian</option>
                        <option value="Pescatarian">Pescatarian</option>
                        <option value="Non-Vegetarian">Non-Vegetarian</option>
                        <option value="Vegan">Vegan</option>
                        <option value="Gluten-Free">Gluten-Free</option>
                    </select>
                    <select 
                        value={cuisine} 
                        onChange={(e) => setCuisine(e.target.value)}
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

                {/* Ingredients Section */}
                <div className="recipe-form-section">
                    <h3>Ingredients</h3>
                    <div className="ingredient-input">
                        <select 
                            value={currentIngredient.name} 
                            onChange={(e) => setCurrentIngredient({
                                ...currentIngredient, 
                                name: e.target.value
                            })}
                        >
                            <option value="">Select Ingredient</option>
                            {availableIngredients.map((ing, index) => (
                                <option key={index} value={ing.name}>
                                    {ing.name}
                                </option>
                            ))}
                        </select>
                        <input 
                            type="text" 
                            placeholder="Amount (e.g., 2 cups)" 
                            value={currentIngredient.amount} 
                            onChange={(e) => setCurrentIngredient({
                                ...currentIngredient, 
                                amount: e.target.value
                            })}
                        />
                        <button className='add-recipe-ingridients' onClick={addIngredient}>
                            <FaPlus /> Add Ingredient
                        </button>
                    </div>

                    {/* New Ingredient Creation */}
                    <div className="new-ingredient-input">
                        <input 
                            type="text" 
                            placeholder="Add New Ingredient" 
                            value={newIngredientName} 
                            onChange={(e) => setNewIngredientName(e.target.value)} 
                        />
                        <button className='create-recipe-ingridient' onClick={addNewIngredient}>
                            <FaPlus /> Create Ingredient
                        </button>
                    </div>

                    {/* Ingredients List */}
                    <div className="ingredients-list">
                        {ingredients.map((ing, index) => (
                            <div key={index} className="ingredient-tag">
                                {ing.name} - {ing.amount}
                                <FaTrash 
                                    className="remove-btn" 
                                    onClick={() => removeIngredient(index)} 
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Methods/Steps Section */}
                <div className="recipe-form-section">
                    <h3>Cooking Methods</h3>
                    {methods.map((step, index) => (
                        <div key={index} className="method-step">
                            <label>Step {step.step_number}</label>
                            <textarea 
                                value={step.description} 
                                onChange={(e) => updateMethodStep(index, e.target.value)}
                                placeholder={`Describe step ${step.step_number}`}
                            />
                        </div>
                    ))}
                    <button onClick={addMethodStep}>
                        <FaPlus /> Add Step
                    </button>
                </div>

                {/* Nutrition Section */}
                <div className="recipe-form-section">
                    <h3>Nutrition Information</h3>
                    {nutrition.map((item, index) => (
                        <div key={index} className="nutrition-entry">
                            <input 
                                type="text" 
                                placeholder="Nutrient (e.g., Calories)" 
                                value={item.nutrient}
                                onChange={(e) => updateNutritionEntry(index, 'nutrient', e.target.value)}
                            />
                            <input 
                                type="text" 
                                placeholder="Value (e.g., 250)" 
                                value={item.value}
                                onChange={(e) => updateNutritionEntry(index, 'value', e.target.value)}
                            />
                        </div>
                    ))}
                    <button onClick={addNutritionEntry}>
                        <FaPlus /> Add Nutrition Info
                    </button>
                </div>

                {/* Image Upload */}
                <div className="recipe-form-section">
                    <h3>Recipe Image</h3>
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                    />
                </div>

                {/* Action Buttons */}
                <div className="recipemodal-actions">
                    <button onClick={handleSubmitRecipe}>
                        Submit Recipe
                    </button>
                    <button onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecipeModal;