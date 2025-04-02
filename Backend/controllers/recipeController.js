const db = require("../config/dbConnection");



const getApprovedRecipes = (req, res) => {
  const query = `
      SELECT r.*, 
          IFNULL(AVG(rt.rating), 0) AS average_rating
      FROM recipes r
      LEFT JOIN ratings rt ON r.id = rt.recipe_id
      WHERE r.approval_status = 'approved'
      GROUP BY r.id
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Database Error:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "No approved recipes found" });
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
    try {
      // Extract recipe data from the request body
      const {
        title,
        difficulty,
        cooking_time,
        category,
        cuisine,
        ingredients,
        methods,
        nutrition,
      } = req.body;
  
      const recipeId = req.params.id; // Recipe ID from URL parameters
      const user_id = req.user.id; // Logged-in user ID (from JWT token)
      const image = req.file; // Image file if uploaded
  
      // Handle image URL (if updated)
      let image_url = null;
      if (image) {
        image_url = `http://localhost:3000/images/${image.filename}`;
      }
  
      // If no image uploaded, retain the previous image URL
      if (!image_url) {
        const query = `SELECT image_url FROM recipes WHERE id = ?`;
        db.query(query, [recipeId], (err, result) => {
          if (err) {
            console.error("Error fetching current image:", err);
            return res.status(500).json({ message: "Error fetching current image", error: err });
          }
          image_url = result[0]?.image_url;  // Retain the existing image URL
        });
      }
  
      // Basic validation
      if (!title || !difficulty || !cooking_time || !category) {
        return res.status(400).json({ message: "All required fields must be provided" });
      }
  
      // Update recipe in the database
      const recipeQuery = `
        UPDATE recipes 
        SET title = ?, difficulty = ?, cooking_time = ?, category = ?, cuisine = ?, image_url = ?
        WHERE id = ? AND user_id = ?
      `;
  
      db.query(
        recipeQuery,
        [title, difficulty, cooking_time, category, cuisine || null, image_url, recipeId, user_id],
        (err, result) => {
          if (err) {
            console.error("Error updating recipe:", err);
            return res.status(500).json({ message: "Error updating recipe", error: err });
          }
  
          // Proceed with ingredient, method, and nutrition updates after recipe update
          // Update Ingredients
          if (ingredients && ingredients.length > 0) {
            ingredients.forEach((ingredient) => {
              // Check if the ingredient already exists
              const checkQuery = 'SELECT * FROM ingredients WHERE name = ?';
              db.query(checkQuery, [ingredient.name], (err, result) => {
                if (err) {
                  console.error("Error checking ingredient:", err);
                  return res.status(500).json({ message: "Error checking ingredient", error: err });
                }
  
                let ingredientId;
                if (result.length > 0) {
                  ingredientId = result[0].id; // Use existing ingredient
                } else {
                  // Insert the ingredient if it doesn't exist
                  const insertIngredientQuery = 'INSERT INTO ingredients (name) VALUES (?)';
                  db.query(insertIngredientQuery, [ingredient.name], (err, insertResult) => {
                    if (err) {
                      console.error("Error inserting ingredient:", err);
                      return res.status(500).json({ message: "Error inserting ingredient", error: err });
                    }
                    ingredientId = insertResult.insertId; // Get the newly inserted ingredient ID
                  });
                }
  
                // Link the ingredient to the recipe
                const linkIngredientQuery = `
                  INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount) 
                  VALUES (?, ?, ?)
                `;
                db.query(linkIngredientQuery, [recipeId, ingredientId, ingredient.amount], (err) => {
                  if (err) {
                    console.error("Error linking ingredient:", err);
                    return res.status(500).json({ message: "Error linking ingredient", error: err });
                  }
                });
              });
            });
          }
  
          // Update Methods
          if (methods && methods.length > 0) {
            methods.forEach((method, index) => {
              const methodQuery = `
                UPDATE methods 
                SET description = ? 
                WHERE recipe_id = ? AND step_number = ?
              `;
              db.query(methodQuery, [method.description, recipeId, index + 1], (err) => {
                if (err) {
                  console.error("Error updating method:", err);
                  return res.status(500).json({ message: "Error updating method", error: err });
                }
              });
            });
          }
  
          // Update Nutrition
          if (nutrition && nutrition.length > 0) {
            nutrition.forEach((item, index) => {
              const nutritionQuery = `
                UPDATE nutrition 
                SET nutrient = ?, value = ?
                WHERE recipe_id = ? AND nutrient = ?
              `;
              db.query(nutritionQuery, [item.nutrient, item.value, recipeId, item.nutrient], (err) => {
                if (err) {
                  console.error("Error updating nutrition:", err);
                  return res.status(500).json({ message: "Error updating nutrition", error: err });
                }
              });
            });
          }
  
          // Successfully updated the recipe
          res.status(200).json({
            success: true,
            message: "Recipe updated successfully",
            recipeId,
          });
        }
      );
    } catch (error) {
      console.error("Error updating recipe:", error);
      res.status(500).json({ message: "Server error while updating recipe" });
    }
  };
  
  
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
    console.log(req.file); // Image file info
    console.log(req.body);

    const title = JSON.parse(req.body.title);
    const difficulty = JSON.parse(req.body.difficulty);
    const cooking_time = JSON.parse(req.body.cooking_time);
    const cuisine = JSON.parse(req.body.cuisine);
    const category = JSON.parse(req.body.category);
    const ingredients = JSON.parse(req.body.ingredients);
    const methods = JSON.parse(req.body.methods);
    const nutrition = JSON.parse(req.body.nutrition);

    const user_id = req.user.id; // Logged-in user ID
    const user_role = req.user.role; // Get user role from JWT payload

    // Extract image URL
    const image_url = req.file
      ? `http://localhost:3000/images/${req.file.filename}`
      : null;

    // Determine approval status based on role
    const approval_status = user_role === "admin" || user_role === "chef" ? "approved" : "pending";

    // Basic validation
    if (!title || !difficulty || !cooking_time || !category) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    // Insert recipe first, include user_id and approval_status
    const recipeQuery = `
      INSERT INTO recipes 
      (title, difficulty, cooking_time, category, cuisine, image_url, user_id, approval_status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      recipeQuery,
      [title, difficulty, cooking_time, category, cuisine || null, image_url, user_id, approval_status],
      (err, recipeResult) => {
        if (err) {
          console.error("Recipe insertion error:", err);
          return res.status(500).json({ message: "Error inserting recipe", error: err });
        }

        const recipeId = recipeResult.insertId;

        // Insert Ingredients
        if (ingredients && ingredients.length > 0) {
          ingredients.forEach((ingredient, index) => {
            // Check if the ingredient already exists
            const checkQuery = 'SELECT * FROM ingredients WHERE name = ?';
            db.query(checkQuery, [ingredient.name], (err, result) => {
              if (err) {
                console.error("Error checking ingredient:", err);
                return res.status(500).json({ message: "Error checking ingredient", error: err });
              }

              // If the ingredient exists, link it with the recipe
              if (result.length > 0) {
                const ingredientId = result[0].id;
                const linkQuery = `
                  INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount)
                  VALUES (?, ?, ?)
                `;
                db.query(linkQuery, [recipeId, ingredientId, ingredient.amount], (err) => {
                  if (err) {
                    console.error("Error linking existing ingredient:", err);
                    return res.status(500).json({ message: "Error linking ingredient", error: err });
                  }
                  if (index === ingredients.length - 1) {
                    console.log("Ingredients linked successfully");
                  }
                });
              } else {
                // Insert the ingredient if it doesn't exist
                const ingredientQuery = 'INSERT INTO ingredients (name) VALUES (?)';
                db.query(ingredientQuery, [ingredient.name], (err) => {
                  if (err) {
                    console.error("Error inserting ingredient:", err);
                    return res.status(500).json({ message: "Error inserting ingredient", error: err });
                  }

                  // Link the ingredient with the recipe after insertion
                  const linkQuery = `
                    INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount)
                    VALUES (?, (SELECT id FROM ingredients WHERE name = ?), ?)
                  `;
                  db.query(linkQuery, [recipeId, ingredient.name, ingredient.amount], (err) => {
                    if (err) {
                      console.error("Error linking ingredient:", err);
                      return res.status(500).json({ message: "Error linking ingredient", error: err });
                    }
                    if (index === ingredients.length - 1) {
                      console.log("Ingredients inserted and linked successfully");
                    }
                  });
                });
              }
            });
          });
        }

        // Insert Methods
        if (methods && methods.length > 0) {
          methods.forEach((method, index) => {
            const methodQuery = `
              INSERT INTO methods (recipe_id, step_number, description)
              VALUES (?, ?, ?)
            `;
            db.query(methodQuery, [recipeId, index + 1, method.description], (err) => {
              if (err) {
                console.error("Error inserting method:", err);
                return res.status(500).json({ message: "Error inserting method", error: err });
              }
              if (index === methods.length - 1) {
                console.log("Methods inserted successfully");
              }
            });
          });
        }

        // Insert Nutrition
        if (nutrition && nutrition.length > 0) {
          nutrition.forEach((item, index) => {
            const nutritionQuery = `
              INSERT INTO nutrition (recipe_id, nutrient, value)
              VALUES (?, ?, ?)
            `;
            db.query(nutritionQuery, [recipeId, item.nutrient, item.value], (err) => {
              if (err) {
                console.error("Error inserting nutrition:", err);
                return res.status(500).json({ message: "Error inserting nutrition", error: err });
              }
              if (index === nutrition.length - 1) {
                console.log("Nutrition inserted successfully");
              }
            });
          });
        }

        // Success response
        res.status(201).json({
          success: true,
          message: "Recipe created successfully",
          recipe_id: recipeId,
          approval_status,
        });
      }
    );
  } catch (error) {
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

  // Check if the ingredient already exists
  const checkQuery = 'SELECT * FROM ingredients WHERE name = ?';
  db.query(checkQuery, [name], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });

    // If the ingredient exists, throw an error
    if (result.length > 0) {
      return res.status(400).json({ message: "Ingredient with this name already exists" });
    }

    // If the ingredient doesn't exist, insert it
    const query = 'INSERT INTO ingredients (name) VALUES (?)';
    db.query(query, [name], (err, result) => {
      if (err) return res.status(500).json({ message: "Database error" });

      res.status(201).json({ message: "Ingredient created", name });
    });
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

const addFavorite = (req, res) => {
    const { userId, recipeId } = req.body;
  
    // Basic validation
    if (!userId || !recipeId) {
      return res.status(400).json({ message: "userId and recipeId are required." });
    }
  
    // 1) Check if the user exists
    const checkUserQuery = "SELECT * FROM users WHERE id = ?";
    db.query(checkUserQuery, [userId], (err, userRows) => {
      if (err) {
        console.error("Error checking user:", err);
        return res.status(500).json({ message: "Database error." });
      }
  
      if (userRows.length === 0) {
        return res.status(404).json({ message: "User not found." });
      }
  
      // 2) Check if the recipe exists
      const checkRecipeQuery = "SELECT * FROM recipes WHERE id = ?";
      db.query(checkRecipeQuery, [recipeId], (err, recipeRows) => {
        if (err) {
          console.error("Error checking recipe:", err);
          return res.status(500).json({ message: "Database error." });
        }
  
        if (recipeRows.length === 0) {
          return res.status(404).json({ message: "Recipe not found." });
        }
  
        // 3) Retrieve the user's current favorites (JSON column)
        const getFavoritesQuery = "SELECT favorites FROM users WHERE id = ?";
        db.query(getFavoritesQuery, [userId], (err, results) => {
          if (err) {
            console.error("Error retrieving favorites:", err);
            return res.status(500).json({ message: "Database error." });
          }
  
          let currentFavorites = [];
          if (results[0].favorites) {
            try {
              currentFavorites = JSON.parse(results[0].favorites);
              if (!Array.isArray(currentFavorites)) {
                // If somehow the JSON isn't an array, reset to an empty array
                currentFavorites = [];
              }
            } catch (parseErr) {
              // If JSON parse fails, reset to an empty array
              currentFavorites = [];
            }
          }
  
          // 4) Check if the recipe is already a favorite
          if (currentFavorites.includes(recipeId)) {
            // If so, send back a message that it's already in favorites
            return res.status(200).json({
              message: "Recipe is already in your favorites.",
              favorites: currentFavorites,
            });
          }
  
          // 5) Otherwise, add the new recipeId
          currentFavorites.push(recipeId);
  
          // 6) Update the favorites column in the database
          const updateFavoritesQuery = "UPDATE users SET favorites = ? WHERE id = ?";
          db.query(updateFavoritesQuery, [JSON.stringify(currentFavorites), userId], (err) => {
            if (err) {
              console.error("Error updating favorites:", err);
              return res.status(500).json({ message: "Failed to add to favorites." });
            }
  
            return res.status(200).json({
              message: "Recipe added to favorites successfully.",
              favorites: currentFavorites,
            });
          });
        });
      });
    });
  };
  
const getFavorite = async (req, res) => {
    const { userId } = req.params;
  
    try {
      // 1) Fetch the user's favorites JSON
      const getUserQuery = `SELECT favorites FROM users WHERE id = ?`;
      db.query(getUserQuery, [userId], (err, userRows) => {
        if (err) {
          console.error("Error fetching user favorites:", err);
          return res.status(500).json({ message: "Database error." });
        }
        if (userRows.length === 0) {
          return res.status(404).json({ message: "User not found." });
        }
  
        let favoritesArray = [];
        if (userRows[0].favorites) {
          try {
            favoritesArray = JSON.parse(userRows[0].favorites); 
          } catch (parseErr) {
            console.error("Error parsing favorites JSON:", parseErr);
          }
        }
  
        // If no favorites or empty array, return empty array
        if (!Array.isArray(favoritesArray) || favoritesArray.length === 0) {
          return res.status(200).json([]);
        }
  
        // 2) Fetch all recipes whose IDs are in favoritesArray
        const placeholders = favoritesArray.map(() => "?").join(","); 
        const recipeQuery = `SELECT r.*,
            IFNULL(AVG(rt.rating), 0) AS average_rating
          FROM recipes r
          LEFT JOIN ratings rt ON r.id = rt.recipe_id
          WHERE r.id IN (${placeholders})
          GROUP BY r.id`;
  
        db.query(recipeQuery, favoritesArray, (err, recipeRows) => {
          if (err) {
            console.error("Error fetching favorite recipes:", err);
            return res.status(500).json({ message: "Database error." });
          }
          return res.status(200).json(recipeRows);
        });
      });
    } catch (err) {
      console.error("Error in /favorites route:", err);
      return res.status(500).json({ message: "Internal server error." });
    }
  };
  
  const removeFavorite = (req, res) => {
    const { userId, recipeId } = req.body;
  
    if (!userId || !recipeId) {
      return res.status(400).json({ message: "userId and recipeId are required." });
    }
  
    // 1) Get the user's current favorites
    const checkUserQuery = `SELECT favorites FROM users WHERE id = ?`;
    db.query(checkUserQuery, [userId], (err, userRows) => {
      if (err) {
        console.error("Error finding user:", err);
        return res.status(500).json({ message: "Database error." });
      }
      if (userRows.length === 0) {
        return res.status(404).json({ message: "User not found." });
      }
  
      let favoritesArray = [];
      if (userRows[0].favorites) {
        try {
          favoritesArray = JSON.parse(userRows[0].favorites);
        } catch (parseErr) {
          console.error("Error parsing favorites JSON:", parseErr);
          return res.status(500).json({ message: "Favorites data corrupted." });
        }
      }
  
      // Convert everything to **strings** for a proper match
      const recipeIdString = recipeId.toString();
      const updatedFavorites = favoritesArray.filter(id => id !== recipeIdString);
  
      if (updatedFavorites.length === favoritesArray.length) {
        return res.status(404).json({ message: "Recipe was not in favorites." });
      }
  
      // 3) Update the favorites column in users table
      const updateQuery = `UPDATE users SET favorites = ? WHERE id = ?`;
      db.query(updateQuery, [JSON.stringify(updatedFavorites), userId], (updateErr) => {
        if (updateErr) {
          console.error("Error updating favorites JSON:", updateErr);
          return res.status(500).json({ message: "Database error updating favorites." });
        }
        return res.status(200).json({ message: "Recipe removed from favorites.", updatedFavorites });
      });
    });
  };
  

module.exports = {
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  searchRecipe,
  filterRecipes,
  giveratings,
  createRecipe,
  getIngridients,
  addIngridients,
  getRecipeByUser,
  addFavorite,
  getFavorite,
  removeFavorite,
  getApprovedRecipes
};
