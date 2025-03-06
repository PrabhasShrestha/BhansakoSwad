const db = require("../config/dbConnection");

const getAllRecipes = (req, res) => {
  const query = `
      SELECT r.*, 
          IFNULL(AVG(rt.rating), 0) AS average_rating
      FROM recipes r
      LEFT JOIN ratings rt ON r.id = rt.recipe_id
      GROUP BY r.id
  `;

  db.query(query, (err, results) => {
      if (err) {
          console.error("Database Error:", err);
          return res.status(500).json({ message: "Internal Server Error" });
      }

      if (results.length === 0) {
          return res.status(404).json({ message: "No recipes found" });
      }

      res.status(200).json(results);
  });
};


const getRecipeById = (req, res) => {
    const { id } = req.params;
  
    const recipeQuery = `
        SELECT r.*, 
               COALESCE(CONCAT(u.first_name, ' ', u.last_name), 'Bhansako Swad Team') AS creator_name
        FROM recipes r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.id = ?`;
    
    const ingredientsQuery = `
        SELECT i.name, ri.amount 
        FROM ingredients i 
        JOIN recipe_ingredients ri ON i.id = ri.ingredient_id 
        WHERE ri.recipe_id = ?`;
    
    const methodsQuery = `SELECT step_number, description FROM methods WHERE recipe_id = ? ORDER BY step_number`;
    const nutritionQuery = `SELECT nutrient, value FROM nutrition WHERE recipe_id = ?`;
    const ratingQuery = `SELECT IFNULL(AVG(rating), 0) AS average_rating FROM ratings WHERE recipe_id = ?`;
  
    db.query(recipeQuery, [id], (err, recipeResult) => {
      if (err || recipeResult.length === 0) {
        return res.status(404).json({ message: "Recipe not found" });
      }
  
      db.query(ingredientsQuery, [id], (err, ingredients) => {
        db.query(methodsQuery, [id], (err, methods) => {
          db.query(nutritionQuery, [id], (err, nutrition) => {
            db.query(ratingQuery, [id], (err, ratingResult) => {
              res.status(200).json({
                ...recipeResult[0],  // ✅ Now includes creator_name
                ingredients,
                methods,
                nutrition,
                average_rating: ratingResult[0].average_rating,
              });
            });
          });
        });
      });
    });
  };
  

const updateRecipe = (req, res) => {
  const { id } = req.params;
  const { title, difficulty, cooking_time, category, image_url } = req.body;

  const query = `UPDATE recipes SET title=?, difficulty=?, cooking_time=?, category=?, image_url=? WHERE id=?`;

  db.query(query, [title, difficulty, cooking_time, category, image_url, id], (err, result) => {
    if (err) {
      console.error("Database Error:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    res.status(200).json({ success: true, message: "Recipe updated successfully" });
  });
};

// ✅ Delete a Recipe
const deleteRecipe = (req, res) => {
  const { id } = req.params;
  const query = `DELETE FROM recipes WHERE id = ?`;

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Database Error:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    res.status(200).json({ success: true, message: "Recipe deleted successfully" });
  });
};

const searchRecipe = (req, res) => {
  const searchTerm = req.query.query;

  const recipeQuery = `SELECT id, title, 'recipe' AS type FROM recipes WHERE title LIKE ?`;
  const ingredientQuery = `SELECT name, 'ingredient' AS type FROM ingredients WHERE name LIKE ?`;

  db.query(recipeQuery, [`%${searchTerm}%`], (err, recipes) => {
      if (err) return res.status(500).json({ message: "Database error" });

      db.query(ingredientQuery, [`%${searchTerm}%`], (err, ingredients) => {
          if (err) return res.status(500).json({ message: "Database error" });

          res.status(200).json([...recipes, ...ingredients]); // Combine both results
      });
  });
};

const filterRecipes =  (req, res) => {
  const { ingredients } = req.body;

  if (!ingredients || ingredients.length === 0) {
      return res.status(400).json({ message: "No ingredients provided" });
  }

  const placeholders = ingredients.map(() => "?").join(",");
  const query = `
      SELECT DISTINCT r.*
      FROM recipes r
      JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE i.name IN (${placeholders})`;

  db.query(query, ingredients, (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });

      res.status(200).json(results);
  });
};

// POST: Submit a recipe rating (Only once per user per recipe)
const giveratings = async (req, res) => {
    try {
        const { recipe_id, user_id, rating } = req.body;
        if (!user_id) {
          return res.status(400).json({ message: "You must be logged in to submit a rating." });
      } else {
          if (rating === undefined || rating === null || !recipe_id) {
              return res.status(400).json({ message: "A zero rating cannot be given." });
          }
      }
      
      

        // ✅ Check if the user has already rated this recipe
        const checkQuery = `SELECT * FROM ratings WHERE recipe_id = ? AND user_id = ?`;
        db.query(checkQuery, [recipe_id, user_id], (err, results) => {
            if (err) {
                console.error("Error checking existing rating:", err);
                return res.status(500).json({ message: "Database error." });
            }

            if (results.length > 0) {
                return res.status(400).json({ message: "You have already submitted a rating for this recipe." });
            }

            const insertQuery = `INSERT INTO ratings (recipe_id, user_id, rating, created_at) VALUES (?, ?, ?, NOW())`;
            db.query(insertQuery, [recipe_id, user_id, rating], (err, result) => {
                if (err) {
                    console.error("Error inserting rating:", err);
                    return res.status(500).json({ message: "Database error." });
                }
                res.status(200).json({ message: "Rating submitted successfully!" });
            });
        });

    } catch (error) {
        console.error("Error submitting rating:", error);
        res.status(500).json({ message: "Internal Server Error." });
    }
};

const createRecipe = (req, res) => {
  try {
    console.log(req.file);  // Image file info
    console.log(req.body);
    const title = JSON.parse(req.body.title);
    const difficulty = JSON.parse(req.body.difficulty);
    const cooking_time = JSON.parse(req.body.cooking_time);
    const category = JSON.parse(req.body.category);
    const ingredients = JSON.parse(req.body.ingredients);
    const methods = JSON.parse(req.body.methods);
    const nutrition = JSON.parse(req.body.nutrition);

    const user_id = req.user.id; // Get the user ID from the logged-in user

    // Extract the image path correctly
    const image_url = req.file ? `http://localhost:3000/images/${req.file.filename}` : null;

    // Basic validation
    if (!title || !difficulty || !cooking_time || !category) {
        return res.status(400).json({ message: "All required fields must be provided" });
    }

    // Insert recipe first, include user_id in the query
    const recipeQuery = `
        INSERT INTO recipes 
        (title, difficulty, cooking_time, category, image_url, user_id) 
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(recipeQuery, [title, difficulty, cooking_time, category, image_url, user_id], (err, recipeResult) => {
        if (err) {
            console.error("Recipe insertion error:", err);
            return res.status(500).json({ message: "Error inserting recipe", error: err });
        }

        const recipeId = recipeResult.insertId;

        // Function to handle ingredients insertion
        const insertIngredients = (callback) => {
            if (!ingredients || ingredients.length === 0) {
                return callback(null);
            }

            // Insert or get existing ingredients and link to recipe
            const ingredientTasks = ingredients.map((ingredient, index) => {
                // First, insert ingredient if not exists
                const ingredientQuery = `
                    INSERT IGNORE INTO ingredients (name) 
                    VALUES (?)
                `;

                db.query(ingredientQuery, [ingredient.name], (err) => {
                    if (err) return callback(err);

                    // Link ingredient to recipe
                    const linkQuery = `
                        INSERT INTO recipe_ingredients 
                        (recipe_id, ingredient_id, amount) 
                        VALUES (?, (SELECT id FROM ingredients WHERE name = ?), ?)
                    `;

                    db.query(linkQuery, [recipeId, ingredient.name, ingredient.amount], (err) => {
                        if (err) return callback(err);
                        
                        // If this is the last ingredient, call callback
                        if (index === ingredients.length - 1) {
                            callback(null);
                        }
                    });
                });
            });
        };

        const insertMethods = (callback) => {
            if (!methods || methods.length === 0) {
                return callback(null);
            }

            const methodTasks = methods.map((method, index) => {
                const methodQuery = `
                    INSERT INTO methods 
                    (recipe_id, step_number, description) 
                    VALUES (?, ?, ?)
                `;

                db.query(methodQuery, [recipeId, index + 1, method.description], (err) => {
                    if (err) return callback(err);
                    
                    // If this is the last method, call callback
                    if (index === methods.length - 1) {
                        callback(null);
                    }
                });
            });
        };

        // Function to handle nutrition insertion
        const insertNutrition = (callback) => {
            if (!nutrition || nutrition.length === 0) {
                return callback(null);
            }

            const nutritionTasks = nutrition.map((item, index) => {
                const nutritionQuery = `
                    INSERT INTO nutrition 
                    (recipe_id, nutrient, value) 
                    VALUES (?, ?, ?)
                `;

                db.query(nutritionQuery, [recipeId, item.nutrient, item.value], (err) => {
                    if (err) return callback(err);
                    
                    // If this is the last nutrition item, call callback
                    if (index === nutrition.length - 1) {
                        callback(null);
                    }
                });
            });
        };

        // Run all insertions
        insertIngredients((err) => {
            if (err) {
                console.error("Ingredients insertion error:", err);
                return res.status(500).json({ message: "Error inserting ingredients", error: err });
            }

            insertMethods((err) => {
                if (err) {
                    console.error("Methods insertion error:", err);
                    return res.status(500).json({ message: "Error inserting methods", error: err });
                }

                insertNutrition((err) => {
                    if (err) {
                        console.error("Nutrition insertion error:", err);
                        return res.status(500).json({ message: "Error inserting nutrition", error: err });
                    }

                    // Success response
                    res.status(201).json({ 
                        success: true, 
                        message: "Recipe created successfully", 
                        recipe_id: recipeId 
                    });
                });
            });
        });
    });
  }
  catch (error) {
    console.error("Error creating recipe:", error);
    res.status(500).json({ message: "Server error while creating recipe" });
  }
};


// In your backend routes
const getIngridients = (req, res) => {
  const query = 'SELECT name FROM ingredients';
  db.query(query, (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.status(200).json(results);
  });
};

const addIngridients = (req, res) => {
  const { name } = req.body;
  const query = 'INSERT IGNORE INTO ingredients (name) VALUES (?)';
  db.query(query, [name], (err, result) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.status(201).json({ message: "Ingredient created", name });
  });
};

const getRecipeByUser = async (req, res) => {
    try {
        const recipeId = req.params.id;
        const query = `
            SELECT r.*, 
                   COALESCE(CONCAT(u.first_name, ' ', u.last_name), 'Bhansako Swad Team') AS creator_name
            FROM recipes r
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.id = ?;  -- Fetch recipe by its ID
        `;

        db.query(query, [recipeId], (err, result) => {
            if (err) {
                console.error("Error fetching recipe creator:", err);
                return res.status(500).json({ success: false, message: "Server error" });
            }

            if (result.length === 0) {
                return res.status(404).json({ success: false, message: "Recipe not found" });
            }

            console.log("Fetched Creator Name:", result[0]); // Debugging log
            res.json(result[0]);  // Send recipe details including creator_name
        });
    } catch (error) {
        console.error("Error fetching recipe creator:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};




module.exports = {
  getAllRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  searchRecipe,
  filterRecipes,
  giveratings,
  createRecipe,
  getIngridients,
  addIngridients,
  getRecipeByUser
};
