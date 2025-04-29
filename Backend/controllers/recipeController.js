const db = require("../config/dbConnection");


const getApprovedRecipes = (req, res) => {
  const query = `
        SELECT r.id, r.title, r.title_ne, r.difficulty, r.cooking_time, r.rating, r.created_at, 
               r.image_url, r.category, r.user_id, r.cuisine, r.approval_status,
               CASE WHEN u.email IN (SELECT email FROM chefs WHERE status = 'approved') THEN 1 END AS is_chef_recipe
        FROM recipes r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.approval_status = 'approved';
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

  db.query(recipeQuery, [id], (err, recipeResult) => {
    if (err || recipeResult.length === 0) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    const ingredientsQuery = `
        SELECT i.id, i.name, i.name_ne, ri.amount, ri.amount_ne
        FROM ingredients i 
        JOIN recipe_ingredients ri ON i.id = ri.ingredient_id 
        WHERE ri.recipe_id = ?`;

    db.query(ingredientsQuery, [id], (err, ingredients) => {
      if (err) {
        console.error("Error fetching ingredients:", err);
        return res.status(500).json({ message: "Server error" });
      }

      let ingredientsProcessed = 0;
      if (ingredients.length === 0) {
        fetchMethods();
      } else {
        ingredients.forEach((ingredient, index) => {
          const alternativesQuery = `
              SELECT alternative_name AS name, alternative_name_ne AS name_ne 
              FROM ingredient_alternatives 
              WHERE ingredient_id = ?`;
          db.query(alternativesQuery, [ingredient.id], (err, alternatives) => {
            if (err) {
              console.error("Error fetching alternatives:", err);
              return res.status(500).json({ message: "Server error" });
            }
            ingredient.alternatives = alternatives;
            ingredientsProcessed++;
            if (ingredientsProcessed === ingredients.length) {
              fetchMethods();
            }
          });
        });
      }

      function fetchMethods() {
        const methodsQuery = `
            SELECT step_number, description, description_ne 
            FROM methods 
            WHERE recipe_id = ? 
            ORDER BY step_number`;
        db.query(methodsQuery, [id], (err, methods) => {
          if (err) {
            console.error("Error fetching methods:", err);
            return res.status(500).json({ message: "Server error" });
          }

          const nutritionQuery = `
              SELECT nutrient, value, nutrient_ne, value_ne 
              FROM nutrition 
              WHERE recipe_id = ?`;
          db.query(nutritionQuery, [id], (err, nutrition) => {
            if (err) {
              console.error("Error fetching nutrition:", err);
              return res.status(500).json({ message: "Server error" });
            }

            const ratingQuery = `
                SELECT IFNULL(AVG(rating), 0) AS average_rating 
                FROM ratings 
                WHERE recipe_id = ?`;
            db.query(ratingQuery, [id], (err, ratingResult) => {
              if (err) {
                console.error("Error fetching rating:", err);
                return res.status(500).json({ message: "Server error" });
              }

              res.status(200).json({
                ...recipeResult[0],
                ingredients,
                methods,
                nutrition,
                average_rating: ratingResult[0].average_rating,
              });
            });
          });
        });
      }
    });
  });
};

const updateRecipe = (req, res) => {
  try {
    const { title, difficulty, cooking_time, category, cuisine, ingredients, methods, nutrition } = req.body;
    const recipeId = req.params.id;
    const user_id = req.user.id;
    const image = req.file;

    let image_url = null;
    if (image) {
      image_url = `http://localhost:3000/images/${image.filename}`;
    }

    if (!image_url) {
      const query = `SELECT image_url FROM recipes WHERE id = ?`;
      db.query(query, [recipeId], (err, result) => {
        if (err) {
          console.error("Error fetching current image:", err);
          return res.status(500).json({ message: "Error fetching current image", error: err });
        }
        image_url = result[0]?.image_url;
      });
    }

    if (!title || !difficulty || !cooking_time || !category) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

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

        if (ingredients && ingredients.length > 0) {
          ingredients.forEach((ingredient) => {
            const checkQuery = 'SELECT * FROM ingredients WHERE name = ?';
            db.query(checkQuery, [ingredient.name], (err, result) => {
              if (err) {
                console.error("Error checking ingredient:", err);
                return res.status(500).json({ message: "Error checking ingredient", error: err });
              }

              let ingredientId;
              if (result.length > 0) {
                ingredientId = result[0].id;
              } else {
                const insertIngredientQuery = 'INSERT INTO ingredients (name) VALUES (?)';
                db.query(insertIngredientQuery, [ingredient.name], (err, insertResult) => {
                  if (err) {
                    console.error("Error inserting ingredient:", err);
                    return res.status(500).json({ message: "Error inserting ingredient", error: err });
                  }
                  ingredientId = insertResult.insertId;
                });
              }

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

        if (nutrition && nutrition.length > 0) {
          nutrition.forEach((item) => {
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

      res.status(200).json([...recipes, ...ingredients]);
    });
  });
};


const filterRecipes = (req, res) => {
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

const giveratings = async (req, res) => {
  try {
    const { recipe_id, user_id, rating } = req.body;
    if (!user_id) {
      return res.status(400).json({ message: "You must be logged in to submit a rating." });
    }
    if (rating === undefined || rating === null || !recipe_id) {
      return res.status(400).json({ message: "A zero rating cannot be given." });
    }

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
      db.query(insertQuery, [recipe_id, user_id, rating], (err) => {
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
    const title = JSON.parse(req.body.title);
    const title_ne = JSON.parse(req.body.title_ne);
    const difficulty = JSON.parse(req.body.difficulty);
    const cooking_time = JSON.parse(req.body.cooking_time);
    const cuisine = JSON.parse(req.body.cuisine);
    const category = JSON.parse(req.body.category);
    const ingredients = JSON.parse(req.body.ingredients);
    const methods = JSON.parse(req.body.methods);
    const nutrition = JSON.parse(req.body.nutrition);

    const user_id = req.user.id;
    const user_email = req.user.email;

    db.query(
      "SELECT id FROM chefs WHERE email = ? AND status = 'approved'",
      [user_email],
      (err, chefResult) => {
        if (err) {
          console.error("Error verifying chef:", err);
          return res.status(500).json({ message: "Error verifying chef", error: err });
        }

        const approval_status = req.user.role === "admin" || chefResult.length > 0 ? "approved" : "pending";

        if (!title || !title_ne || !difficulty || !cooking_time || !category) {
          return res.status(400).json({ message: "All required fields (title, Nepali title, difficulty, cooking time, category) must be provided" });
        }

        if (!ingredients || ingredients.length === 0) {
          return res.status(400).json({ message: "At least one ingredient is required" });
        }

        const validMethods = methods.filter(method => method.description.trim() !== '');
        if (validMethods.length === 0) {
          return res.status(400).json({ message: "At least one cooking method step is required" });
        }

        const recipeQuery = `
          INSERT INTO recipes 
          (title, title_ne, difficulty, cooking_time, category, cuisine, image_url, user_id, approval_status) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const image_url = req.file
          ? `http://localhost:3000/images/${req.file.filename}`
          : null;

        db.query(
          recipeQuery,
          [title, title_ne, difficulty, cooking_time, category, cuisine || null, image_url, user_id, approval_status],
          (err, recipeResult) => {
            if (err) {
              console.error("Recipe insertion error:", err);
              return res.status(500).json({ message: "Error inserting recipe", error: err });
            }

            const recipeId = recipeResult.insertId;

            if (ingredients && ingredients.length > 0) {
              ingredients.forEach((ingredient, index) => {
                const checkQuery = 'SELECT * FROM ingredients WHERE name = ?';
                db.query(checkQuery, [ingredient.name], (err, result) => {
                  if (err) {
                    console.error("Error checking ingredient:", err);
                    return res.status(500).json({ message: "Error checking ingredient", error: err });
                  }

                  if (result.length > 0) {
                    const ingredientId = result[0].id;
                    const linkQuery = `
                      INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, amount_ne)
                      VALUES (?, ?, ?, ?)
                    `;
                    db.query(linkQuery, [recipeId, ingredientId, ingredient.amount, ingredient.amount_ne || null], (err) => {
                      if (err) {
                        console.error("Error linking existing ingredient:", err);
                        return res.status(500).json({ message: "Error linking ingredient", error: err });
                      }
                    });
                  } else {
                    const ingredientQuery = 'INSERT INTO ingredients (name, name_ne) VALUES (?, ?)';
                    db.query(ingredientQuery, [ingredient.name, ingredient.name_ne || null], (err, result) => {
                      if (err) {
                        console.error("Error inserting ingredient:", err);
                        return res.status(500).json({ message: "Error inserting ingredient", error: err });
                      }

                      const linkQuery = `
                        INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, amount_ne)
                        VALUES (?, ?, ?, ?)
                      `;
                      db.query(linkQuery, [recipeId, result.insertId, ingredient.amount, ingredient.amount_ne || null], (err) => {
                        if (err) {
                          console.error("Error linking ingredient:", err);
                          return res.status(500).json({ message: "Error linking ingredient", error: err });
                        }
                      });
                    });
                  }
                });
              });
            }

            if (validMethods && validMethods.length > 0) {
              validMethods.forEach((method, index) => {
                const methodQuery = `
                  INSERT INTO methods (recipe_id, step_number, description, description_ne)
                  VALUES (?, ?, ?, ?)
                `;
                db.query(methodQuery, [recipeId, index + 1, method.description, method.nepali_description || null], (err) => {
                  if (err) {
                    console.error("Error inserting method:", err);
                    return res.status(500).json({ message: "Error inserting method", error: err });
                  }
                });
              });
            }

            if (nutrition && nutrition.length > 0) {
              const validNutrition = nutrition.filter(n => n.nutrient && n.value);
              if (validNutrition.length > 0) {
                validNutrition.forEach((item) => {
                  const nutritionQuery = `
                    INSERT INTO nutrition (recipe_id, nutrient, value, nutrient_ne, value_ne)
                    VALUES (?, ?, ?, ?, ?)
                  `;
                  db.query(nutritionQuery, [recipeId, item.nutrient, item.value, item.nepali_nutrient || null, item.value_ne || item.value], (err) => {
                    if (err) {
                      console.error("Error inserting nutrition:", err);
                      return res.status(500).json({ message: "Error inserting nutrition", error: err });
                    }
                  });
                });
              }
            }

            res.status(201).json({
              success: true,
              message: "Recipe created successfully",
              recipe_id: recipeId,
              approval_status,
            });
          }
        );
      }
    );
  } catch (error) {
    console.error("Error creating recipe:", error);
    res.status(500).json({ message: "Server error while creating recipe" });
  }
};


const getIngredients = (req, res) => {
  const query = 'SELECT id, name, name_ne FROM ingredients ORDER BY name ASC';

  db.query(query, (err, ingredients) => {
    if (err) {
      console.error("Error fetching ingredients:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (ingredients.length === 0) {
      return res.status(200).json([]);
    }

    let ingredientsProcessed = 0;
    const totalIngredients = ingredients.length;

    ingredients.forEach((ingredient, index) => {
      const alternativesQuery = `
        SELECT id, alternative_name AS name, alternative_name_ne AS name_ne 
        FROM ingredient_alternatives 
        WHERE ingredient_id = ?`;
      db.query(alternativesQuery, [ingredient.id], (err, alternatives) => {
        if (err) {
          console.error("Error fetching alternatives for ingredient:", err);
          return res.status(500).json({ message: "Database error" });
        }

        ingredient.alternatives = alternatives;
        ingredientsProcessed++;

        if (ingredientsProcessed === totalIngredients) {
          res.status(200).json(ingredients);
        }
      });
    });
  });
};


const addIngredients = (req, res) => {
  const { name, name_ne, alternatives } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Ingredient name is required" });
  }

  const checkQuery = 'SELECT * FROM ingredients WHERE name = ?';
  db.query(checkQuery, [name], (err, result) => {
    if (err) {
      console.error("Error checking ingredient:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (result.length > 0) {
      return res.status(400).json({ message: "Ingredient with this name already exists" });
    }

    const insertIngredientQuery = 'INSERT INTO ingredients (name, name_ne) VALUES (?, ?)';
    db.query(insertIngredientQuery, [name, name_ne || null], (err, result) => {
      if (err) {
        console.error("Error inserting ingredient:", err);
        return res.status(500).json({ message: "Database error" });
      }

      const ingredientId = result.insertId;

      if (alternatives && alternatives.length > 0) {
        const alternativeValues = alternatives.map(alt => [
          ingredientId,
          alt.name,
          alt.name_ne || null
        ]);
        const insertAlternativesQuery = `
          INSERT INTO ingredient_alternatives (ingredient_id, alternative_name, alternative_name_ne) 
          VALUES ?
        `;
        db.query(insertAlternativesQuery, [alternativeValues], (err) => {
          if (err) {
            console.error("Error inserting alternatives:", err);
            return res.status(500).json({ message: "Database error" });
          }

          res.status(201).json({ id: ingredientId, name, name_ne, alternatives });
        });
      } else {
        res.status(201).json({ id: ingredientId, name, name_ne, alternatives: [] });
      }
    });
  });
};

const updateIngredient = (req, res) => {
  const { id } = req.params;
  const { name, name_ne, alternatives } = req.body;

  console.log('Received update request for ingredient ID:', id);
  console.log('Request body:', req.body);

  if (!name) {
    console.log('Validation failed: Ingredient name is required');
    return res.status(400).json({ message: "Ingredient name is required" });
  }

  const checkQuery = 'SELECT * FROM ingredients WHERE id = ?';
  db.query(checkQuery, [id], (err, result) => {
    if (err) {
      console.error("Error checking ingredient:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (result.length === 0) {
      console.log('Ingredient not found for ID:', id);
      return res.status(404).json({ message: "Ingredient not found" });
    }

    const updateIngredientQuery = 'UPDATE ingredients SET name = ?, name_ne = ? WHERE id = ?';
    db.query(updateIngredientQuery, [name, name_ne || null, id], (err) => {
      if (err) {
        console.error("Error updating ingredient:", err);
        return res.status(500).json({ message: "Database error" });
      }

      const deleteAlternativesQuery = 'DELETE FROM ingredient_alternatives WHERE ingredient_id = ?';
      db.query(deleteAlternativesQuery, [id], (err) => {
        if (err) {
          console.error("Error deleting existing alternatives:", err);
          return res.status(500).json({ message: "Database error" });
        }

        if (alternatives && alternatives.length > 0) {
          const alternativeValues = alternatives.map(alt => [
            id,
            alt.name,
            alt.name_ne || null
          ]);
          const insertAlternativesQuery = `
            INSERT INTO ingredient_alternatives (ingredient_id, alternative_name, alternative_name_ne) 
            VALUES ?
          `;
          db.query(insertAlternativesQuery, [alternativeValues], (err) => {
            if (err) {
              console.error("Error inserting new alternatives:", err);
              return res.status(500).json({ message: "Database error" });
            }

            console.log('Ingredient updated successfully:', { id, name, name_ne, alternatives });
            res.status(200).json({ id, name, name_ne, alternatives });
          });
        } else {
          console.log('Ingredient updated successfully (no alternatives):', { id, name, name_ne, alternatives: [] });
          res.status(200).json({ id, name, name_ne, alternatives: [] });
        }
      });
    });
  });
};


const deleteIngredient = (req, res) => {
  const { id } = req.params;

  const checkQuery = 'SELECT * FROM ingredients WHERE id = ?';
  db.query(checkQuery, [id], (err, result) => {
    if (err) {
      console.error("Error checking ingredient:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Ingredient not found" });
    }

    const deleteAlternativesQuery = 'DELETE FROM ingredient_alternatives WHERE ingredient_id = ?';
    db.query(deleteAlternativesQuery, [id], (err) => {
      if (err) {
        console.error("Error deleting alternatives:", err);
        return res.status(500).json({ message: "Database error" });
      }

      const deleteIngredientQuery = 'DELETE FROM ingredients WHERE id = ?';
      db.query(deleteIngredientQuery, [id], (err) => {
        if (err) {
          console.error("Error deleting ingredient:", err);
          return res.status(500).json({ message: "Database error" });
        }

        res.status(200).json({ message: "Ingredient deleted successfully" });
      });
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
        WHERE r.id = ?;
    `;

    db.query(query, [recipeId], (err, result) => {
      if (err) {
        console.error("Error fetching recipe creator:", err);
        return res.status(500).json({ success: false, message: "Server error" });
      }

      if (result.length === 0) {
        return res.status(404).json({ success: false, message: "Recipe not found" });
      }

      res.json(result[0]);
    });
  } catch (error) {
    console.error("Error fetching recipe creator:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


const addFavorite = (req, res) => {
  const { userId, recipeId } = req.body;

  if (!userId || !recipeId) {
    return res.status(400).json({ message: "userId and recipeId are required." });
  }

  const checkUserQuery = "SELECT * FROM users WHERE id = ?";
  db.query(checkUserQuery, [userId], (err, userRows) => {
    if (err) {
      console.error("Error checking user:", err);
      return res.status(500).json({ message: "Database error." });
    }

    if (userRows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const checkRecipeQuery = "SELECT * FROM recipes WHERE id = ?";
    db.query(checkRecipeQuery, [recipeId], (err, recipeRows) => {
      if (err) {
        console.error("Error checking recipe:", err);
        return res.status(500).json({ message: "Database error." });
      }

      if (recipeRows.length === 0) {
        return res.status(404).json({ message: "Recipe not found." });
      }

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
              currentFavorites = [];
            }
          } catch (parseErr) {
            currentFavorites = [];
          }
        }

        if (currentFavorites.includes(recipeId)) {
          return res.status(200).json({
            message: "Recipe is already in your favorites.",
            favorites: currentFavorites,
          });
        }

        currentFavorites.push(recipeId);

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

// GET: Fetch user's favorite recipes
const getFavorite = async (req, res) => {
  const { userId } = req.params;

  try {
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

      if (!Array.isArray(favoritesArray) || favoritesArray.length === 0) {
        return res.status(200).json([]);
      }

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
          return res.status(500).json({ message: "Database error" });
        }
        return res.status(200).json(recipeRows);
      });
    });
  } catch (err) {
    console.error("Error in /favorites route:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// DELETE: Remove a recipe from favorites
const removeFavorite = (req, res) => {
  const { userId, recipeId } = req.body;

  if (!userId || !recipeId) {
    return res.status(400).json({ message: "userId and recipeId are required." });
  }

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

    const recipeIdString = recipeId.toString();
    const updatedFavorites = favoritesArray.filter(id => id !== recipeIdString);

    if (updatedFavorites.length === favoritesArray.length) {
      return res.status(404).json({ message: "Recipe was not in favorites." });
    }

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
  getIngredients,
  addIngredients,
  updateIngredient,
  deleteIngredient,
  getRecipeByUser,
  addFavorite,
  getFavorite,
  removeFavorite,
  getApprovedRecipes
};