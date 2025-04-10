import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Toast from "../../components/ToastNoti";
import { FaPlus, FaTrash } from 'react-icons/fa';

const RecipeModal = ({ isOpen, onClose, onSubmit }) => {
    const [recipeName, setRecipeName] = useState('');
    const [recipeNameNepali, setRecipeNameNepali] = useState('');
    const [difficulty, setDifficulty] = useState('');
    const [cookingTime, setCookingTime] = useState('');
    const [category, setCategory] = useState('');
    const [image, setImage] = useState(null);
    const [cuisine, setCuisine] = useState('');
    const [toast, setToast] = useState(null);
    const [ingredients, setIngredients] = useState([]);
    const [availableIngredients, setAvailableIngredients] = useState([]);
    const [currentIngredient, setCurrentIngredient] = useState({
        name: '',
        amount: ''
    });
    const [newIngredientName, setNewIngredientName] = useState('');
    const [showNewIngredientInput, setShowNewIngredientInput] = useState(false);

    // Methods state
    const [methods, setMethods] = useState([
        { step_number: 1, description: '', nepali_description: '' }
    ]);

    // Nutrition state
    const [nutrition, setNutrition] = useState([
        { nutrient: '', value: '', nepali_nutrient: '', nepali_value: '' } // Added nepali_value
    ]);

    // Fetch available ingredients on component mount
    useEffect(() => {
        if (isOpen) {
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
        setTimeout(() => {
            setToast(null);
        }, 3000);
    };

    // Add a new ingredient to the list
    const addIngredient = () => {
        if (currentIngredient.name && currentIngredient.amount) {
            const isIngredientExists = ingredients.some(ing => ing.name === currentIngredient.name);
            if (!isIngredientExists) {
                setIngredients([...ingredients, currentIngredient]);
                setCurrentIngredient({ name: '', amount: '' });
            } else {
                showToast("Ingredient already added to the recipe", "info");
            }
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
                    setShowNewIngredientInput(false);
                })
                .catch(error => {
                    console.error("Error adding new ingredient:", error);
                    showToast("Failed to add new ingredient", "error");
                });
        } else {
            showToast("Please enter an ingredient name", "info");
        }
    };

    // Toggle new ingredient input
    const toggleNewIngredientInput = () => {
        setShowNewIngredientInput(!showNewIngredientInput);
    };

    // Add a new method step
    const addMethodStep = () => {
        setMethods([
            ...methods, 
            { step_number: methods.length + 1, description: '', nepali_description: '' }
        ]);
    };

    // Update a method step
    const updateMethodStep = (index, field, value) => {
        const updatedMethods = [...methods];
        updatedMethods[index][field] = value;
        setMethods(updatedMethods);
    };

    // Add a new nutrition entry
    const addNutritionEntry = () => {
        setNutrition([
            ...nutrition, 
            { nutrient: '', value: '', nepali_nutrient: '', nepali_value: '' }
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
            title_ne: recipeNameNepali, // Changed from title_nepali to title_ne
            difficulty: difficulty,
            cooking_time: cookingTime,
            category: category,
            ingredients: ingredients,
            cuisine: cuisine,
            methods: validMethods.map(method => ({
                description: method.description,
                nepali_description: method.nepali_description // Already matches backend
            })),
            nutrition: nutrition.filter(n => n.nutrient && n.value).map(item => ({
                nutrient: item.nutrient,
                value: item.value,
                nepali_nutrient: item.nepali_nutrient,
                value_ne: item.nepali_value || item.value // Use nepali_value if provided, else use value
            }))
        };
    
        const formData = new FormData();
        
        // Append all recipe data fields
        Object.keys(recipeData).forEach(key => {
            formData.append(key, JSON.stringify(recipeData[key]));
        });
        
        // Append image if exists
        if (image) {
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
        
            if (response.data.approval_status === 'pending') {
                showToast("Recipe submitted and awaiting admin approval.", "info");
            } else {
                showToast("Recipe created successfully!", "success"); // Aligned with backend message
            }
        
            setTimeout(() => {
                onClose();
                onSubmit();
            }, 1000);
        })
        .catch(error => {
            console.error("Error adding recipe:", error.response?.data || error);
            showToast("Failed to add recipe. Please check your inputs.", "error");
        });
    };

    const resetForm = () => {
        setRecipeName('');
        setRecipeNameNepali('');
        setDifficulty('');
        setCookingTime('');
        setCategory('');
        setImage(null);
        setIngredients([]);
        setMethods([{ step_number: 1, description: '', nepali_description: '' }]);
        setNutrition([{ nutrient: '', value: '', nepali_nutrient: '', nepali_value: '' }]);
        setShowNewIngredientInput(false);
    };

    if (!isOpen) return null;

    return (
        <div className="recipemodal-overlay">
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
                    <input 
                        type="text" 
                        placeholder="Recipe Name in Nepali" 
                        value={recipeNameNepali} 
                        onChange={(e) => setRecipeNameNepali(e.target.value)} 
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
                        
                        <button className='create-ingredient-btn' onClick={toggleNewIngredientInput}>
                            {showNewIngredientInput ? 'Hide' : 'Add New Ingredient'}
                        </button>
                    </div>

                    {/* New Ingredient Creation */}
                    {showNewIngredientInput && (
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
                    )}

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
                                onChange={(e) => updateMethodStep(index, 'description', e.target.value)}
                                placeholder={`Describe step ${step.step_number}`}
                            />
                            <textarea 
                                value={step.nepali_description} 
                                onChange={(e) => updateMethodStep(index, 'nepali_description', e.target.value)}
                                placeholder={`Describe step ${step.step_number} in Nepali`}
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
                                placeholder="Nutrient in Nepali" 
                                value={item.nepali_nutrient}
                                onChange={(e) => updateNutritionEntry(index, 'nepali_nutrient', e.target.value)}
                            />
                            <input 
                                type="text" 
                                placeholder="Value (e.g., 250)" 
                                value={item.value}
                                onChange={(e) => updateNutritionEntry(index, 'value', e.target.value)}
                            />
                            <input 
                                type="text" 
                                placeholder="Value in Nepali" 
                                value={item.nepali_value}
                                onChange={(e) => updateNutritionEntry(index, 'nepali_value', e.target.value)}
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