import { strict as assert } from 'assert';

// Mock database query function
const defaultDbQuery = (query, params, callback) => {
  const promise = new Promise((resolve, reject) => {
    try {
      let result;

      // getRecipeById
      if (query.includes('SELECT r.*, COALESCE(CONCAT(u.first_name, \' \', u.last_name), \'Bhansako Swad Team\') AS creator_name')) {
        result = params[0] === '1' ? [{ id: 1, title: 'Test Recipe', creator_name: 'John Doe', approval_status: 'approved' }] : [];
      }
      // updateRecipe
      else if (query.includes('SELECT image_url FROM recipes WHERE id = ?')) {
        result = params[0] === '1' ? [{ image_url: 'http://localhost:3000/images/old.jpg' }] : [];
      }
      else if (query.includes('UPDATE recipes SET title = ?')) {
        result = { affectedRows: 1 };
      }
      // searchRecipe
      else if (query.includes('SELECT id, title, \'recipe\' AS type')) {
        result = params[0].includes('test') ? [{ id: 1, title: 'Test Recipe', type: 'recipe' }] : [];
      }
      else if (query.includes('SELECT name, \'ingredient\' AS type')) {
        result = params[0].includes('flour') ? [{ name: 'Flour', type: 'ingredient' }] : [];
      }
      // createRecipe
      else if (query.includes('SELECT id FROM chefs WHERE email = ?')) {
        result = params[0] === 'chef@example.com' ? [{ id: 1 }] : [];
      }
      else if (query.includes('INSERT INTO recipes')) {
        result = { insertId: 1 };
      }
      // addFavorite
      else if (query.includes('SELECT * FROM users WHERE id = ?')) {
        result = params[0] === '1' ? [{ id: 1, favorites: '[]' }] : [];
      }
      else if (query.includes('SELECT * FROM recipes WHERE id = ?')) {
        result = params[0] === '1' ? [{ id: 1, title: 'Test Recipe' }] : [];
      }
      else if (query.includes('SELECT favorites FROM users WHERE id = ?')) {
        result = params[0] === '1' ? [{ favorites: '[]' }] : [];
      }
      else if (query.includes('UPDATE users SET favorites = ?')) {
        result = { affectedRows: 1 };
      }
      else {
        result = [];
      }
      resolve(result);
    } catch (err) {
      console.error('Error in defaultDbQuery:', query, params, err.stack);
      reject(err);
    }
  });

  if (callback) {
    promise.then(result => callback(null, result)).catch(err => callback(err, null));
  }
  return promise;
};

// Mock db module
let db = { query: defaultDbQuery };

// Controller functions
const controller = {
  updateRecipe: (req, res) => {
    try {
      const { title, difficulty, cooking_time, category, cuisine } = req.body;
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
            return res.status(500).json({ message: "Error fetching current image", error: err });
          }
          image_url = result[0]?.image_url;
          proceedWithUpdate();
        });
      } else {
        proceedWithUpdate();
      }
      function proceedWithUpdate() {
        if (!title || !difficulty || !cooking_time || !category) {
          return res.status(400).json({ message: "All required fields must be provided" });
        }
        const recipeQuery = `
          UPDATE recipes 
          SET title = ?, difficulty = ?, cooking_time = ?, category = ?, cuisine = ?, image_url = ?
          WHERE id = ? AND user_id = ?
        `;
        db.query(
          recipeQuery, // <-- Add the SQL query string here
          [title, difficulty, cooking_time, category, cuisine || null, image_url, recipeId, user_id],
          (err, result) => {
            if (err) {
              return res.status(500).json({ message: "Error updating recipe", error: err });
            }
            res.status(200).json({
              success: true,
              message: "Recipe updated successfully",
              recipeId,
            });
          }
        );
      }
    } catch (error) {
      res.status(500).json({ message: "Server error while updating recipe" });
    }
  },
  searchRecipe: (req, res) => {
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
  },
  createRecipe: (req, res) => {
    try {
      const title = JSON.parse(req.body.title || '""');
      const title_ne = JSON.parse(req.body.title_ne || '""');
      const difficulty = JSON.parse(req.body.difficulty || '""');
      const cooking_time = JSON.parse(req.body.cooking_time || '""');
      const cuisine = JSON.parse(req.body.cuisine || '""');
      const category = JSON.parse(req.body.category || '""');
      const ingredients = JSON.parse(req.body.ingredients || '[]');
      const methods = JSON.parse(req.body.methods || '[]');
      const user_id = req.user.id;
      const user_email = req.user.email;
      db.query(
        "SELECT id FROM chefs WHERE email = ? AND status = 'approved'",
        [user_email],
        (err, chefResult) => {
          if (err) {
            return res.status(500).json({ message: "Error verifying chef", error: err });
          }
          const approval_status = req.user.role === "admin" || chefResult.length > 0 ? "approved" : "pending";
          if (!title || !title_ne || !difficulty || !cooking_time || !category) {
            return res.status(400).json({ message: "All required fields must be provided" });
          }
          if (!ingredients || ingredients.length === 0) {
            return res.status(400).json({ message: "At least one ingredient is required" });
          }
          const validMethods = methods.filter(method => method.description?.trim() !== '');
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
                return res.status(500).json({ message: "Error inserting recipe", error: err });
              }
              const recipeId = recipeResult.insertId;
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
      res.status(500).json({ message: "Server error while creating recipe" });
    }
  },
  addFavorite: (req, res) => {
    const { userId, recipeId } = req.body;
    if (!userId || !recipeId) {
      return res.status(400).json({ message: "userId and recipeId are required." });
    }
    const checkUserQuery = "SELECT * FROM users WHERE id = ?";
    db.query(checkUserQuery, [userId], (err, userRows) => {
      if (err) {
        return res.status(500).json({ message: "Database error." });
      }
      if (userRows.length === 0) {
        return res.status(404).json({ message: "User not found." });
      }
      const checkRecipeQuery = "SELECT * FROM recipes WHERE id = ?";
      db.query(checkRecipeQuery, [recipeId], (err, recipeRows) => {
        if (err) {
          return res.status(500).json({ message: "Database error." });
        }
        if (recipeRows.length === 0) {
          return res.status(404).json({ message: "Recipe not found." });
        }
        const getFavoritesQuery = "SELECT favorites FROM users WHERE id = ?";
        db.query(getFavoritesQuery, [userId], (err, results) => {
          if (err) {
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
  }
};

// Test runner
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }
  test(name, fn) {
    this.tests.push({ name, fn });
  }
  async run() {
    for (const { name, fn } of this.tests) {
      try {
        await fn();
        this.passed++;
        console.log(`✓ ${name}`);
      } catch (err) {
        this.failed++;
        console.log(`✗ ${name}`);
        console.log(err.message);
      }
    }
    console.log(`\nResults: ${this.passed} passed, ${this.failed} failed`);
  }
}

const runner = new TestRunner();

const createRes = () => ({
  statusCode: null,
  responseData: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(data) {
    this.responseData = data;
    return this;
  },
  send(data) {
    this.responseData = data;
    return this;
  }
});

// Helper to wait for callback-based controller calls
const waitForCallback = (controllerFn, req, res) => {
  return Promise.race([
    new Promise((resolve) => {
      const originalJson = res.json;
      res.json = function (data) {
        res.responseData = data;
        originalJson.call(this, data);
        resolve();
        return this;
      };
      const originalSend = res.send;
      res.send = function (data) {
        res.responseData = data;
        originalSend.call(this, data);
        resolve();
        return this;
      };
      controllerFn(req, res);
    }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Callback timeout after 1s')), 1000))
  ]);
};

runner.test('updateRecipe - should update recipe with image', async () => {
  db.query = defaultDbQuery;
  const req = {
    params: { id: '1' },
    user: { id: '1' },
    body: {
      title: 'Updated Recipe',
      difficulty: 'easy',
      cooking_time: '30 min',
      category: 'dessert',
      cuisine: 'Italian'
    },
    file: { filename: 'new.jpg' }
  };
  const res = createRes();
  await waitForCallback(controller.updateRecipe, req, res);
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.responseData, {
    success: true,
    message: 'Recipe updated successfully',
    recipeId: '1'
  });
});

runner.test('updateRecipe - should reject missing required fields', async () => {
  db.query = defaultDbQuery;
  const req = {
    params: { id: '1' },
    user: { id: '1' },
    body: {
      difficulty: 'easy',
      cooking_time: '30 min'
    }
  };
  const res = createRes();
  await waitForCallback(controller.updateRecipe, req, res);
  assert.strictEqual(res.statusCode, 400);
  assert.deepStrictEqual(res.responseData, { message: 'All required fields must be provided' });
});

runner.test('searchRecipe - should return recipes for search term', async () => {
  db.query = defaultDbQuery;
  const req = { query: { query: 'test' } };
  const res = createRes();
  await waitForCallback(controller.searchRecipe, req, res);
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.responseData, [
    { id: 1, title: 'Test Recipe', type: 'recipe' }
  ]);
});


runner.test('createRecipe - should create recipe as user', async () => {
  db.query = defaultDbQuery;
  const req = {
    user: { id: '1', email: 'user@example.com', role: 'user' },
    body: {
      title: '"New Recipe"',
      title_ne: '"नयाँ रेसिपी"',
      difficulty: '"easy"',
      cooking_time: '"30 min"',
      category: '"dessert"',
      cuisine: '"Italian"',
      ingredients: '[{"name":"Flour","amount":"2 cups","name_ne":"Pitho","amount_ne":"2 kap"}]',
      methods: '[{"description":"Mix ingredients","nepali_description":"Samagri mix garnuhos"}]'
    },
    file: { filename: 'recipe.jpg' }
  };
  const res = createRes();
  await waitForCallback(controller.createRecipe, req, res);
  assert.strictEqual(res.statusCode, 201);
  assert.deepStrictEqual(res.responseData, {
    success: true,
    message: 'Recipe created successfully',
    recipe_id: 1,
    approval_status: 'pending'
  });
});

runner.test('createRecipe - should reject empty data', async () => {
  db.query = defaultDbQuery;
  const req = {
    user: { id: '1', email: 'user@example.com', role: 'user' },
    body: {}
  };
  const res = createRes();
  await waitForCallback(controller.createRecipe, req, res);
  assert.strictEqual(res.statusCode, 400);
  assert.deepStrictEqual(res.responseData, { message: 'All required fields must be provided' });
});

runner.test('addFavorite - should add recipe to favorites', async () => {
  db.query = defaultDbQuery;
  const req = { body: { userId: '1', recipeId: '1' } };
  const res = createRes();
  await waitForCallback(controller.addFavorite, req, res);
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.responseData, {
    message: 'Recipe added to favorites successfully.',
    favorites: ['1']
  });
});

// Run tests
runner.run();