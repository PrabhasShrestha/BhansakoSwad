import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaTrash, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import '../../styles/RecipeModal.css'; // Ensure the CSS file path is correct

const RecipeModal = ({ isOpen, onClose, onSubmit }) => {
    const [recipeName, setRecipeName] = useState('');
    const [recipeNameNepali, setRecipeNameNepali] = useState('');
    const [difficulty, setDifficulty] = useState('');
    const [hours, setHours] = useState('');
    const [minutes, setMinutes] = useState('');
    const [category, setCategory] = useState('');
    const [image, setImage] = useState(null);
    const [cuisine, setCuisine] = useState('');
    const [ingredients, setIngredients] = useState([]);
    const [availableIngredients, setAvailableIngredients] = useState([]);
    const [currentIngredient, setCurrentIngredient] = useState({
        name: '',
        name_ne: '',
        amount: '',
        amount_ne: ''
    });
    const [newIngredient, setNewIngredient] = useState({
        name: '',
        name_ne: ''
    });
    const [showNewIngredientInput, setShowNewIngredientInput] = useState(false);
    const [methods, setMethods] = useState([
        { step_number: 1, description: '', nepali_description: '' }
    ]);
    const [nutrition, setNutrition] = useState([
        { nutrient: '', value: '', nepali_nutrient: '', nepali_value: '' }
    ]);

    // Utility function to capitalize the first letter of a string
    const capitalizeFirstLetter = (str) => {
        if (!str) return str;
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    useEffect(() => {
        if (isOpen) {
            axios.get("http://localhost:3000/api/recipe/ingredients")
                .then(response => {
                    // Capitalize the ingredient names when fetched
                    const capitalizedIngredients = response.data.map(ing => ({
                        ...ing,
                        name: capitalizeFirstLetter(ing.name),
                        name_ne: capitalizeFirstLetter(ing.name_ne)
                    }));
                    setAvailableIngredients(capitalizedIngredients);
                })
                .catch(error => {
                    console.error("Error fetching ingredients:", error);
                    toast.error("Failed to load ingredients");
                });
        }
    }, [isOpen]);

    const addIngredient = () => {
        if (currentIngredient.name && currentIngredient.amount) {
            const isIngredientExists = ingredients.some(ing => ing.name === currentIngredient.name);
            if (!isIngredientExists) {
                setIngredients([...ingredients, {
                    ...currentIngredient,
                    name: capitalizeFirstLetter(currentIngredient.name),
                    name_ne: capitalizeFirstLetter(currentIngredient.name_ne)
                }]);
                setCurrentIngredient({ name: '', name_ne: '', amount: '', amount_ne: '' });
                setShowNewIngredientInput(false);
            } else {
                toast.info("Ingredient already added to the recipe");
            }
        } else {
            toast.info("Please select an ingredient and specify amount");
        }
    };

    const removeIngredient = (index) => {
        const updatedIngredients = [...ingredients];
        updatedIngredients.splice(index, 1);
        setIngredients(updatedIngredients);
    };

    const addNewIngredient = () => {
        if (newIngredient.name && newIngredient.name_ne) {
            const capitalizedNewIngredient = {
                name: capitalizeFirstLetter(newIngredient.name),
                name_ne: capitalizeFirstLetter(newIngredient.name_ne)
            };
            axios.post("http://localhost:3000/api/recipe/ingredients/create", capitalizedNewIngredient)
                .then(response => {
                    setAvailableIngredients([...availableIngredients, capitalizedNewIngredient]);
                    setNewIngredient({ name: '', name_ne: '' });
                    toast.success(`Ingredient "${capitalizedNewIngredient.name}" added successfully`);
                    setShowNewIngredientInput(false);
                    setCurrentIngredient({
                        ...currentIngredient,
                        name: capitalizedNewIngredient.name,
                        name_ne: capitalizedNewIngredient.name_ne
                    });
                })
                .catch(error => {
                    console.error("Error adding new ingredient:", error);
                    toast.error("Failed to add new ingredient");
                });
        } else {
            toast.info("Please enter both English and Nepali names for the new ingredient");
        }
    };

    const handleIngredientChange = (e) => {
        const selectedName = e.target.value;
        if (selectedName === 'other') {
            setShowNewIngredientInput(true);
            setCurrentIngredient({ ...currentIngredient, name: '', name_ne: '' });
        } else {
            const selectedIngredient = availableIngredients.find(ing => ing.name === selectedName);
            setCurrentIngredient({
                ...currentIngredient,
                name: selectedName,
                name_ne: selectedIngredient?.name_ne || ''
            });
            setShowNewIngredientInput(false);
        }
    };

    const addMethodStep = () => {
        setMethods([
            ...methods,
            { step_number: methods.length + 1, description: '', nepali_description: '' }
        ]);
    };

    const updateMethodStep = (index, field, value) => {
        const updatedMethods = [...methods];
        updatedMethods[index][field] = value;
        setMethods(updatedMethods);
    };

    const addNutritionEntry = () => {
        setNutrition([
            ...nutrition,
            { nutrient: '', value: '', nepali_nutrient: '', nepali_value: '' }
        ]);
    };

    const updateNutritionEntry = (index, field, value) => {
        const updatedNutrition = [...nutrition];
        updatedNutrition[index][field] = value;
        setNutrition(updatedNutrition);
    };

    const handleImageUpload = (e) => {
        setImage(e.target.files[0]);
    };

    const handleSubmitRecipe = () => {
        if (!recipeName || !difficulty || (!hours && !minutes) || !category) {
            toast.error("Please fill in all required fields");
            return;
        }

        if (ingredients.length === 0) {
            toast.error("Please add at least one ingredient");
            return;
        }

        const validMethods = methods.filter(method => method.description.trim() !== '');
        if (validMethods.length === 0) {
            toast.error("Please add at least one cooking method step");
            return;
        }

        const formattedHours = hours || "0";
        const formattedMinutes = minutes || "0";
        const cookingTime = `${formattedHours} hour${formattedHours === "1" ? "" : "s"} ${formattedMinutes} minute${formattedMinutes === "1" ? "" : "s"}`;

        const recipeData = {
            title: recipeName,
            title_ne: recipeNameNepali,
            difficulty,
            cooking_time: cookingTime,
            category,
            ingredients,
            cuisine,
            methods: validMethods.map(method => ({
                description: method.description,
                nepali_description: method.nepali_description
            })),
            nutrition: nutrition.filter(n => n.nutrient && n.value).map(item => ({
                nutrient: item.nutrient,
                value: item.value,
                nepali_nutrient: item.nepali_nutrient,
                value_ne: item.nepali_value || item.value
            }))
        };

        const formData = new FormData();
        formData.append('title', JSON.stringify(recipeData.title));
        formData.append('title_ne', JSON.stringify(recipeData.title_ne));
        formData.append('difficulty', JSON.stringify(recipeData.difficulty));
        formData.append('cooking_time', JSON.stringify(recipeData.cooking_time));
        formData.append('category', JSON.stringify(recipeData.category));
        formData.append('cuisine', JSON.stringify(recipeData.cuisine));
        formData.append('ingredients', JSON.stringify(recipeData.ingredients));
        formData.append('methods', JSON.stringify(recipeData.methods));
        formData.append('nutrition', JSON.stringify(recipeData.nutrition));
        if (image) {
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
                    toast.info("Recipe submitted and awaiting admin approval.");
                } else {
                    toast.success("Recipe created successfully!");
                }

                setTimeout(() => {
                    onClose();
                    onSubmit();
                }, 1000);
            })
            .catch(error => {
                console.error("Error adding recipe:", error.response?.data || error);
                toast.error("Failed to add recipe: " + (error.response?.data?.message || "Please check your inputs."));
            });
    };

    const resetForm = () => {
        setRecipeName('');
        setRecipeNameNepali('');
        setDifficulty('');
        setHours('');
        setMinutes('');
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
            <div className="recipemodal-content">
                <button className="recipemodal-close-btn" onClick={onClose} aria-label="Close modal">
                    <FaTimes />
                </button>
                <h2>Add New Recipe</h2>
                
                <div className="recipe-form-section">
                    <h3>Recipe Basics</h3>
                    <div className="input-group">
                        <span className="input-label">Recipe Name</span>
                        <input
                            type="text"
                            placeholder="Enter recipe name"
                            value={recipeName}
                            onChange={(e) => setRecipeName(e.target.value)}
                        />
                    </div>
                    
                    <div className="input-group">
                        <span className="input-label">Recipe Name in Nepali</span>
                        <input
                            type="text"
                            placeholder="Enter recipe name in Nepali"
                            value={recipeNameNepali}
                            onChange={(e) => setRecipeNameNepali(e.target.value)}
                        />
                    </div>
                    
                    <div className="input-group">
                        <span className="input-label">Difficulty Level</span>
                        <select
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                        >
                            <option value="">Select Difficulty</option>
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                    </div>
                    
                    <div className="cooking-time-input">
                        <div className="time-input-wrapper">
                            <span className="input-label">Hours</span>
                            <input
                                type="number"
                                placeholder="0"
                                value={hours}
                                onChange={(e) => setHours(e.target.value)}
                                min="0"
                            />
                        </div>
                        <span>hours</span>
                        
                        <div className="time-input-wrapper">
                            <span className="input-label">Minutes</span>
                            <input
                                type="number"
                                placeholder="0"
                                value={minutes}
                                onChange={(e) => setMinutes(e.target.value)}
                                min="0"
                            />
                        </div>
                        <span>minutes</span>
                    </div>
                    
                    <div className="input-group">
                        <span className="input-label">Category</span>
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
                    </div>
                    
                    <div className="input-group">
                        <span className="input-label">Cuisine (Optional)</span>
                        <select
                            value={cuisine}
                            onChange={(e) => setCuisine(e.target.value)}
                        >
                            <option value="">Select Cuisine</option>
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

                <div className="recipe-form-section">
                    <h3>Ingredients</h3>
                    <div className="ingredient-input">
                        <div className="ingredient-select-wrapper">
                            <span className="input-label">Select Ingredient</span>
                            <select
                                value={currentIngredient.name}
                                onChange={handleIngredientChange}
                            >
                                <option value="">Select Ingredient</option>
                                {availableIngredients.map((ing, index) => (
                                    <option key={index} value={ing.name}>
                                        {ing.name}
                                    </option>
                                ))}
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div className="ingredient-amount-wrapper">
                            <span className="input-label">Amount (e.g., 2 cups)</span>
                            <input
                                type="text"
                                value={currentIngredient.amount}
                                onChange={(e) => setCurrentIngredient({
                                    ...currentIngredient,
                                    amount: e.target.value
                                })}
                            />
                        </div>

                        <div className="ingredient-amount-wrapper">
                            <span className="input-label">Amount in Nepali</span>
                            <input
                                type="text"
                                value={currentIngredient.amount_ne}
                                onChange={(e) => setCurrentIngredient({
                                    ...currentIngredient,
                                    amount_ne: e.target.value
                                })}
                            />
                        </div>

                        <button className="add-recipe-ingredients" onClick={addIngredient}>
                            <FaPlus /> Add Ingredient
                        </button>
                    </div>

                    {showNewIngredientInput && (
                        <div className="new-ingredient-input">
                            <div className="new-ingredient-wrapper">
                                <span className="input-label">New Ingredient (English)</span>
                                <input
                                    type="text"
                                    value={newIngredient.name}
                                    onChange={(e) => setNewIngredient({
                                        ...newIngredient,
                                        name: e.target.value
                                    })}
                                />
                            </div>
                            <div className="new-ingredient-wrapper">
                                <span className="input-label">New Ingredient (Nepali)</span>
                                <input
                                    type="text"
                                    value={newIngredient.name_ne}
                                    onChange={(e) => setNewIngredient({
                                        ...newIngredient,
                                        name_ne: e.target.value
                                    })}
                                />
                            </div>
                            <button className="create-recipe-ingredient" onClick={addNewIngredient}>
                                <FaPlus /> Create Ingredient
                            </button>
                        </div>
                    )}

                    <div className="ingredients-list">
                        {ingredients.map((ing, index) => (
                            <div key={index} className="ingredient-tag">
                                {ing.name} - {ing.amount} {ing.amount_ne && `(${ing.amount_ne})`}
                                <FaTrash
                                    className="addrecipe-remove-btn"
                                    onClick={() => removeIngredient(index)}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="recipe-form-section">
                    <h3>Cooking Methods</h3>
                    {methods.map((step, index) => (
                        <div key={index} className="method-step">
                            <label>Step {step.step_number}</label>
                            <div className="input-group">
                                <span className="input-label">Description</span>
                                <textarea
                                    value={step.description}
                                    onChange={(e) => updateMethodStep(index, 'description', e.target.value)}
                                    placeholder={`Describe step ${step.step_number}`}
                                />
                            </div>
                            <div className="input-group">
                                <span className="input-label">Description in Nepali</span>
                                <textarea
                                    value={step.nepali_description}
                                    onChange={(e) => updateMethodStep(index, 'nepali_description', e.target.value)}
                                    placeholder={`Describe step ${step.step_number} in Nepali`}
                                />
                            </div>
                        </div>
                    ))}
                    <button onClick={addMethodStep}>
                        <FaPlus /> Add Step
                    </button>
                </div>

                <div className="recipe-form-section">
                    <h3>Nutrition Information</h3>
                    {nutrition.map((item, index) => (
                        <div key={index} className="nutrition-entry">
                            <div className="nutrition-field">
                                <label>Nutrient (e.g., Calories)</label>
                                <input
                                    type="text"
                                    value={item.nutrient}
                                    onChange={(e) => updateNutritionEntry(index, 'nutrient', e.target.value)}
                                />
                            </div>
                            <div className="nutrition-field">
                                <label>Nutrient in Nepali</label>
                                <input
                                    type="text"
                                    value={item.nepali_nutrient}
                                    onChange={(e) => updateNutritionEntry(index, 'nepali_nutrient', e.target.value)}
                                />
                            </div>
                            <div className="nutrition-field">
                                <label>Value (e.g., 250)</label>
                                <input
                                    type="text"
                                    value={item.value}
                                    onChange={(e) => updateNutritionEntry(index, 'value', e.target.value)}
                                />
                            </div>
                            <div className="nutrition-field">
                                <label>Value in Nepali</label>
                                <input
                                    type="text"
                                    value={item.nepali_value}
                                    onChange={(e) => updateNutritionEntry(index, 'nepali_value', e.target.value)}
                                />
                            </div>
                        </div>
                    ))}
                    <button onClick={addNutritionEntry}>
                        <FaPlus /> Add Nutrition Info
                    </button>
                </div>

                <div className="recipe-form-section">
                    <h3>Recipe Image</h3>
                    <div className="input-group">
                        <span className="input-label">Upload Image</span>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                        />
                    </div>
                </div>

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