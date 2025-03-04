import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Toast from "../../components/ToastNoti"; // Adjust the path if needed
import { FaPlus, FaTrash } from 'react-icons/fa';

const RecipeModal = ({ isOpen, onClose, onSubmit }) => {
    const [recipeName, setRecipeName] = useState('');
    const [difficulty, setDifficulty] = useState('');
    const [cookingTime, setCookingTime] = useState('');
    const [category, setCategory] = useState('');
    const [image, setImage] = useState(null);
    const [toast, setToast] = useState({ show: false, message: "", type: "" });
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
        axios.get("http://localhost:3000/api/recipe/ingredients")
            .then(response => {
                setAvailableIngredients(response.data);
            })
            .catch(error => {
                console.error("Error fetching ingredients:", error);
            });
    }, []);

    // Add a new ingredient to the list
    const addIngredient = () => {
        if (currentIngredient.name && currentIngredient.amount) {
            setIngredients([...ingredients, currentIngredient]);
            setCurrentIngredient({ name: '', amount: '' });
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
                })
                .catch(error => {
                    console.error("Error adding new ingredient:", error);
                });
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

        const token = localStorage.getItem("token");
        // Validate required fields
        if (!recipeName || !difficulty || !cookingTime || !category) {
            setToast({ show: true, message: "Please fill in all required fields", type: "error" });
            return;
        }
    
        // Validate ingredients
        if (ingredients.length === 0) {
            setToast({ show: true, message: "Please add at least one ingredient", type: "error"});
            return;
        }
    
        // Validate methods
        const validMethods = methods.filter(method => method.description.trim() !== '');
        if (validMethods.length === 0) {
            setToast({ show: true, message: "Please add at least one cooking method step", type: "error"});
            return;
        }
    
        const recipeData = {
            title: recipeName,
            difficulty: difficulty,
            cooking_time: cookingTime,
            category: category,
            ingredients: ingredients,
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
            onClose();
            onSubmit(); // Call the onSubmit callback to refresh recipes
        })
        .catch(error => {
            console.error("Error adding recipe:", error.response?.data || error);
            setToast({ show: true, message: "Failed to add recipe. Please check your inputs.", type: "error"});
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
                        <option value="Non-Vegetarian">Non-Vegetarian</option>
                        <option value="Vegan">Vegan</option>
                        <option value="Gluten-Free">Gluten-Free</option>
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
                        <button onClick={addIngredient}>
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
                        <button onClick={addNewIngredient}>
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
            {toast.show && (
    <Toast
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ show: false, message: "", type: "" })}
    />
)}

        </div>
    );
};

export default RecipeModal;