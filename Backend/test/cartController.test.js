import { strict as assert } from 'assert';

const defaultDbQuery = (query, params) => {
  return new Promise((resolve) => {
    let result;
    if (query.includes('SELECT in_stock FROM productdetails')) {
      result = params[0] === 999 ? [] : [{ in_stock: 10 }];
    } else if (query.includes('SELECT quantity FROM cart_items')) {
      result = params[1] === 999 ? [] : [{ quantity: 2 }];
    } else if (query.includes('INSERT INTO cart_items')) {
      result = { affectedRows: 1 };
    } else if (query.includes('UPDATE cart_items')) {
      result = { affectedRows: 1 };
    } else if (query.includes('DELETE FROM cart_items')) {
      result = { affectedRows: 1 };
    } else if (query.includes('SELECT c.id, c.productdetails_id')) {
      result = [
        {
          id: 1,
          productdetails_id: 2,
          quantity: 3,
          product_id: 1,
          seller_id: 1,
          price: 100,
          image: 'uploads/products/test.jpg',
          product_name: 'Test Product',
        },
      ];
    } else if (query.includes('UPDATE productdetails p')) {
      result = { affectedRows: 1 };
    } else {
      result = { affectedRows: 1 };
    }
    resolve(result);
  });
};

const db = {
  query: (query, params, callback) => {
    const promise = defaultDbQuery(query, params);
    if (callback) {
      promise.then(result => callback(null, result));
    }
    return promise;
  }
};

const cartController = {
  addToCart: async (req, res) => {
    const { productdetails_id, quantity } = req.body;
    const user_id = req.user.id;

    if (!user_id || !productdetails_id || quantity <= 0) {
      return res.status(400).json({ message: 'Invalid cart data.' });
    }

    try {
      const stockResult = await db.query(
        `SELECT in_stock FROM productdetails WHERE id = ?`,
        [productdetails_id]
      );

      if (stockResult.length === 0) {
        return res.status(404).json({ message: 'Product not found.' });
      }

      const availableStock = stockResult[0].in_stock;

      if (availableStock < quantity) {
        return res.status(400).json({ message: 'Not enough stock available.' });
      }

      const cartResult = await db.query(
        `SELECT quantity FROM cart_items WHERE user_id = ? AND productdetails_id = ?`,
        [user_id, productdetails_id]
      );

      if (cartResult.length > 0) {
        const existingQuantity = cartResult[0].quantity;
        const newQuantity = existingQuantity + quantity;

        if (newQuantity > availableStock) {
          return res
            .status(400)
            .json({ message: 'Not enough stock available for this update.' });
        }

        await db.query(
          `UPDATE cart_items SET quantity = ? WHERE user_id = ? AND productdetails_id = ?`,
          [newQuantity, user_id, productdetails_id]
        );
        return res.status(200).json({ message: 'Cart updated successfully.' });
      } else {
        await db.query(
          `INSERT INTO cart_items (user_id, productdetails_id, quantity) VALUES (?, ?, ?)`,
          [user_id, productdetails_id, quantity]
        );
        return res.status(200).json({ message: 'Item added to cart successfully.' });
      }
    } catch (err) {
      console.error('Database Error:', err);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  },

  getCart: async (req, res) => {
    const user_id = req.user.id;

    try {
      const result = await db.query(
        `SELECT c.id, c.productdetails_id, c.quantity, 
                p.product_id, p.seller_id, p.price, p.image, 
                prod.name AS product_name 
         FROM cart_items c
         JOIN productdetails p ON c.productdetails_id = p.id
         JOIN products prod ON p.product_id = prod.id 
         WHERE c.user_id = ?`,
        [user_id]
      );

      const cartItems = result.map((item) => ({
        ...item,
        image: item.image
          ? item.image.startsWith('uploads/products/')
            ? `http://localhost:3000/${item.image}`
            : `http://localhost:3000/uploads/products/${item.image}`
          : 'http://localhost:3000/uploads/default-product.png',
      }));

      res.status(200).json({
        success: true,
        cart: cartItems,
        message: 'Cart items fetched successfully.',
      });
    } catch (err) {
      console.error('Database Error:', err);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  },

  removeFromCart: async (req, res) => {
    const { productdetails_id } = req.body;
    const user_id = req.user.id;

    try {
      await db.query(
        `DELETE FROM cart_items WHERE user_id = ? AND productdetails_id = ?`,
        [user_id, productdetails_id]
      );
      return res.status(200).json({ message: 'Item removed from cart.' });
    } catch (err) {
      console.error('Database Error:', err);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  },

  updateCartQuantity: async (req, res) => {
    const { productdetails_id, quantity } = req.body;
    const user_id = req.user.id;

    if (!productdetails_id || quantity == null) {
      return res
        .status(400)
        .json({ message: 'Product details ID and quantity are required.' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than zero.' });
    }

    try {
      const results = await db.query(
        `SELECT in_stock FROM productdetails WHERE id = ?`,
        [productdetails_id]
      );

      if (results.length === 0) {
        return res.status(404).json({ message: 'Product not found.' });
      }

      const in_stock = results[0].in_stock;

      if (quantity > in_stock) {
        return res.status(400).json({
          message: `Cannot set quantity to ${quantity}. Only ${in_stock} items in stock.`,
          success: false,
        });
      }

      await db.query(
        `UPDATE cart_items SET quantity = ? WHERE user_id = ? AND productdetails_id = ?`,
        [quantity, user_id, productdetails_id]
      );

      return res.status(200).json({ message: 'Cart quantity updated successfully.' });
    } catch (err) {
      console.error('Error updating cart quantity:', err);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  },

  deleteCart: async (req, res) => {
    const user_id = req.user.id;

    if (!user_id) {
      return res.status(400).json({ message: 'User ID is required.' });
    }

    try {
      await db.query(
        `UPDATE productdetails p
         JOIN cart_items c ON p.id = c.productdetails_id
         SET p.in_stock = p.in_stock - c.quantity
         WHERE c.user_id = ?`,
        [user_id]
      );

      await db.query(`DELETE FROM cart_items WHERE user_id = ?`, [user_id]);

      return res.status(200).json({
        message: 'Cart cleared and stock updated successfully.',
      });
    } catch (err) {
      console.error('Cart Deletion Error:', err);
      return res.status(500).json({ message: 'Failed to clear cart.' });
    }
  },
};

// Simple test runner
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

// Create test runner
const runner = new TestRunner();

// Mock res object factory
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
});

// Test cases
runner.test('addToCart - should add new item to cart', async () => {
  // Override db.query for this specific test to simulate a new item
  db.query = (query, params, callback) => {
    let result;
    if (query.includes('SELECT in_stock FROM productdetails')) {
      result = [{ in_stock: 10 }];
    } else if (query.includes('SELECT quantity FROM cart_items')) {
      result = []; // Empty to simulate no existing item
    } else {
      result = { affectedRows: 1 };
    }
    
    const promise = Promise.resolve(result);
    if (callback) {
      promise.then(result => callback(null, result));
    }
    return promise;
  };
  
  const req = { user: { id: 1 }, body: { productdetails_id: 2, quantity: 3 } };
  const res = createRes();

  await cartController.addToCart(req, res);
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.responseData, {
    message: 'Item added to cart successfully.',
  });
});

runner.test('addToCart - should update existing cart item', async () => {
  // Reset to default query behavior
  db.query = (query, params, callback) => {
    const promise = defaultDbQuery(query, params);
    if (callback) {
      promise.then(result => callback(null, result));
    }
    return promise;
  };
  
  const req = { user: { id: 1 }, body: { productdetails_id: 2, quantity: 3 } };
  const res = createRes();

  await cartController.addToCart(req, res);
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.responseData, {
    message: 'Cart updated successfully.',
  });
});

runner.test('addToCart - should reject invalid quantity', async () => {
  const req = { user: { id: 1 }, body: { productdetails_id: 2, quantity: 0 } };
  const res = createRes();

  await cartController.addToCart(req, res);
  assert.strictEqual(res.statusCode, 400);
  assert.deepStrictEqual(res.responseData, {
    message: 'Invalid cart data.',
  });
});

runner.test('addToCart - should reject product not found', async () => {
  // Override db.query for this specific test
  db.query = (query, params, callback) => {
    let result;
    if (query.includes('SELECT in_stock FROM productdetails')) {
      result = []; // Empty to simulate product not found
    } else {
      result = { affectedRows: 1 };
    }
    
    const promise = Promise.resolve(result);
    if (callback) {
      promise.then(result => callback(null, result));
    }
    return promise;
  };
  
  const req = { user: { id: 1 }, body: { productdetails_id: 999, quantity: 3 } };
  const res = createRes();

  await cartController.addToCart(req, res);
  assert.strictEqual(res.statusCode, 404);
  assert.deepStrictEqual(res.responseData, {
    message: 'Product not found.',
  });
});

runner.test('addToCart - should reject insufficient stock', async () => {
  // Override db.query for this specific test
  db.query = (query, params, callback) => {
    let result;
    if (query.includes('SELECT in_stock FROM productdetails')) {
      result = [{ in_stock: 2 }]; // Only 2 in stock
    } else {
      result = { affectedRows: 1 };
    }
    
    const promise = Promise.resolve(result);
    if (callback) {
      promise.then(result => callback(null, result));
    }
    return promise;
  };
  
  const req = { user: { id: 1 }, body: { productdetails_id: 2, quantity: 5 } };
  const res = createRes();

  await cartController.addToCart(req, res);
  assert.strictEqual(res.statusCode, 400);
  assert.deepStrictEqual(res.responseData, {
    message: 'Not enough stock available.',
  });
});

runner.test('getCart - should return cart data', async () => {
  // Reset to default query behavior
  db.query = (query, params, callback) => {
    const promise = defaultDbQuery(query, params);
    if (callback) {
      promise.then(result => callback(null, result));
    }
    return promise;
  };
  
  const req = { user: { id: 1 } };
  const res = createRes();

  await cartController.getCart(req, res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.responseData.success, true);
  assert.strictEqual(
    res.responseData.cart[0].image,
    'http://localhost:3000/uploads/products/test.jpg'
  );
});

runner.test('removeFromCart - should remove item from cart', async () => {
  const req = { user: { id: 1 }, body: { productdetails_id: 2 } };
  const res = createRes();

  await cartController.removeFromCart(req, res);
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.responseData, {
    message: 'Item removed from cart.',
  });
});

runner.test('updateCartQuantity - should update cart quantity', async () => {
  const req = { user: { id: 1 }, body: { productdetails_id: 2, quantity: 5 } };
  const res = createRes();

  await cartController.updateCartQuantity(req, res);
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.responseData, {
    message: 'Cart quantity updated successfully.',
  });
});

runner.test('updateCartQuantity - should reject missing productdetails_id', async () => {
  const req = { user: { id: 1 }, body: { quantity: 5 } };
  const res = createRes();

  await cartController.updateCartQuantity(req, res);
  assert.strictEqual(res.statusCode, 400);
  assert.deepStrictEqual(res.responseData, {
    message: 'Product details ID and quantity are required.',
  });
});

runner.test('updateCartQuantity - should reject invalid quantity', async () => {
  const req = { user: { id: 1 }, body: { productdetails_id: 2, quantity: 0 } };
  const res = createRes();

  await cartController.updateCartQuantity(req, res);
  assert.strictEqual(res.statusCode, 400);
  assert.deepStrictEqual(res.responseData, {
    message: 'Quantity must be greater than zero.',
  });
});

runner.test('updateCartQuantity - should reject product not found', async () => {
  // Override db.query for this specific test
  db.query = (query, params, callback) => {
    let result;
    if (query.includes('SELECT in_stock FROM productdetails')) {
      result = []; // Empty to simulate product not found
    } else {
      result = { affectedRows: 1 };
    }
    
    const promise = Promise.resolve(result);
    if (callback) {
      promise.then(result => callback(null, result));
    }
    return promise;
  };
  
  const req = { user: { id: 1 }, body: { productdetails_id: 999, quantity: 5 } };
  const res = createRes();

  await cartController.updateCartQuantity(req, res);
  assert.strictEqual(res.statusCode, 404);
  assert.deepStrictEqual(res.responseData, {
    message: 'Product not found.',
  });
});

runner.test('updateCartQuantity - should reject insufficient stock', async () => {
  // Override db.query for this specific test
  db.query = (query, params, callback) => {
    let result;
    if (query.includes('SELECT in_stock FROM productdetails')) {
      result = [{ in_stock: 3 }]; // Only 3 in stock
    } else {
      result = { affectedRows: 1 };
    }
    
    const promise = Promise.resolve(result);
    if (callback) {
      promise.then(result => callback(null, result));
    }
    return promise;
  };
  
  const req = { user: { id: 1 }, body: { productdetails_id: 2, quantity: 5 } };
  const res = createRes();

  await cartController.updateCartQuantity(req, res);
  assert.strictEqual(res.statusCode, 400);
  assert.deepStrictEqual(res.responseData, {
    message: 'Cannot set quantity to 5. Only 3 items in stock.',
    success: false,
  });
});

runner.test('deleteCart - should clear cart and update stock', async () => {
  // Reset to default query behavior
  db.query = (query, params, callback) => {
    const promise = defaultDbQuery(query, params);
    if (callback) {
      promise.then(result => callback(null, result));
    }
    return promise;
  };
  
  const req = { user: { id: 1 } };
  const res = createRes();

  await cartController.deleteCart(req, res);
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.responseData, {
    message: 'Cart cleared and stock updated successfully.',
  });
});

runner.test('deleteCart - should reject missing user_id', async () => {
  const req = { user: {} };
  const res = createRes();

  await cartController.deleteCart(req, res);
  assert.strictEqual(res.statusCode, 400);
  assert.deepStrictEqual(res.responseData, {
    message: 'User ID is required.',
  });
});

// Run tests
runner.run();