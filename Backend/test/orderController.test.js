import { strict as assert } from 'assert';

const defaultDbQuery = (query, params, callback) => {
  const promise = new Promise((resolve, reject) => {
    try {
      let result;
      if (query.includes('INSERT INTO orders')) {
        result = { insertId: 1 };
      }
      else if (query.includes('INSERT INTO order_items')) {
        result = { affectedRows: 1 };
      }
      else if (query.includes('SELECT o.order_id')) {
        result = params[0] === '1' ? [{
          order_id: 1,
          user_id: 1,
          product_name: 'Test Product',
          first_name: 'John',
          last_name: 'Doe',
          price: 49.99,
          quantity: 2,
          total_amount: 99.99,
          order_date: new Date().toISOString(),
          status: 'Processing',
          product_image: 'product.jpg',
          vendor_id: 1
        }] : [];
      }
      else if (query.includes('SELECT o.user_id')) {
        result = params[0] === '1' ? [{
          user_id: 1,
          email: 'user@example.com',
          first_name: 'John',
          product_names: 'Test Product'
        }] : [];
      }
      else if (query.includes('UPDATE orders')) {
        result = { affectedRows: 1 };
      }
      else if (query.includes('INSERT INTO notifications')) {
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

let db = { query: defaultDbQuery };
let emailSent = false;

// Mock JWT and email functions
const jwt = {
  verify: (token, secret, callback) => {
    if (token === 'valid.token') {
      callback(null, { seller_id: 1 });
    } else {
      callback(new Error('Invalid token'));
    }
  }
};

const sendMail = () => {
  emailSent = true;
  return Promise.resolve();
};

// Controller functions
const controller = {
  createOrder: (req, res) => {
    const { user_id, totalAmount } = req.body;
    
    if (!user_id || !totalAmount) {
      return res.status(400).json({ message: "User ID and Total Amount are required" });
    }

    db.query(
      "INSERT INTO orders (user_id, total_amount, status, order_date) VALUES (?, ?, ?, NOW())",
      [user_id, totalAmount, "Processing"],
      (err, result) => {
        if (err) return res.status(500).json({ message: "Failed to create order" });
        res.status(200).json({ success: true, orderId: result.insertId });
      }
    );
  },

  saveOrderItems: (req, res) => {
    const { order_id, items } = req.body;

    if (!order_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Order ID and non-empty items array are required." });
    }

    let itemsProcessed = 0;
    const totalItems = items.length;

    items.forEach(item => {
      if (!item.productdetails_id || !item.quantity || !item.price) {
        return res.status(400).json({ success: false, message: "Each item must have productdetails_id, quantity, and price." });
      }
      db.query(
        "INSERT INTO order_items (order_id, productdetails_id, quantity, price) VALUES (?, ?, ?, ?)",
        [order_id, item.productdetails_id, item.quantity, item.price],
        (err) => {
          if (err) {
            return res.status(500).json({ success: false, message: "Failed to save order item." });
          }
          itemsProcessed++;
          if (itemsProcessed === totalItems) {
            res.status(200).json({ success: true, message: "Order items added successfully." });
          }
        }
      );
    });
  },

  updateStatus: (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || typeof status !== 'string') {
      return res.status(400).json({ message: "Valid status is required." });
    }

    db.query(
      `SELECT o.user_id, u.email, u.first_name, GROUP_CONCAT(p.name SEPARATOR ', ') AS product_names 
       FROM orders o
       JOIN users u ON o.user_id = u.id
       JOIN order_items oi ON o.order_id = oi.order_id
       JOIN productdetails pd ON oi.productdetails_id = pd.id
       JOIN products p ON pd.product_id = p.id
       WHERE o.order_id = ?
       GROUP BY o.order_id`,
      [id],
      (err, orderResult) => {
        if (err || orderResult.length === 0) {
          return res.status(404).json({ message: "Order not found." });
        }

        db.query(
          "UPDATE orders SET status = ? WHERE order_id = ?",
          [status, id],
          (err, result) => {
            if (err) return res.status(500).json({ message: "Internal Server Error" });
            
            if (status === 'Shipped') {
              db.query(
                "INSERT INTO notifications (user_id, message, read_status, order_id) VALUES (?, ?, false, ?)",
                [orderResult[0].user_id, `Order shipped`, id],
                (err) => {
                  if (err) console.error('Notification insertion failed:', err);
                }
              );
            }

            res.status(200).json({
              success: true,
              message: `Order marked as ${status}`,
              status,
            });
          }
        );
      }
    );
  }
};


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

// Helper functions
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
  }
});

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
      controllerFn(req, res);
    }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Callback timeout after 2s')), 2000))
  ]);
};

// Test cases (8 total)
runner.test('createOrder - should create new order', async () => {
  db.query = defaultDbQuery;
  const req = {
    body: {
      user_id: '1',
      totalAmount: 99.99
    }
  };
  const res = createRes();
  
  await waitForCallback(controller.createOrder, req, res);
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.responseData, { success: true, orderId: 1 });
});

runner.test('createOrder - should reject missing fields', async () => {
  db.query = defaultDbQuery;
  const req = { body: {} };
  const res = createRes();
  
  await waitForCallback(controller.createOrder, req, res);
  assert.strictEqual(res.statusCode, 400);
  assert.deepStrictEqual(res.responseData, { message: "User ID and Total Amount are required" });
});

runner.test('saveOrderItems - should save order items', async () => {
  db.query = defaultDbQuery;
  const req = {
    body: {
      order_id: 1,
      items: [
        { productdetails_id: 1, quantity: 2, price: 49.99 }
      ]
    }
  };
  const res = createRes();

  await waitForCallback(controller.saveOrderItems, req, res);
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.responseData, { success: true, message: "Order items added successfully." });
});

runner.test('saveOrderItems - should reject missing items', async () => {
  db.query = defaultDbQuery;
  const req = {
    body: {
      order_id: 1,
      items: []
    }
  };
  const res = createRes();

  await waitForCallback(controller.saveOrderItems, req, res);
  assert.strictEqual(res.statusCode, 400);
  assert.deepStrictEqual(res.responseData, { success: false, message: "Order ID and non-empty items array are required." });
});

runner.test('updateStatus - should update order status', async () => {
  db.query = defaultDbQuery;
  const req = {
    params: { id: '1' },
    body: { status: 'Shipped' }
  };
  const res = createRes();

  await waitForCallback(controller.updateStatus, req, res);
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.responseData, {
    success: true,
    message: 'Order marked as Shipped',
    status: 'Shipped'
  });
});

runner.test('updateStatus - should reject invalid status', async () => {
  db.query = defaultDbQuery;
  const req = {
    params: { id: '1' },
    body: { status: '' }
  };
  const res = createRes();

  await waitForCallback(controller.updateStatus, req, res);
  assert.strictEqual(res.statusCode, 400);
  assert.deepStrictEqual(res.responseData, { message: "Valid status is required." });
});

// Run tests
runner.run();