import { strict as assert } from 'assert';

const mockValidationResult = (isEmpty) => ({
  isEmpty: () => isEmpty,
  array: () => isEmpty ? [] : [{ msg: 'Validation error' }],
});

const mockBcrypt = {
  hash: async (password, salt) => `hashed_${password}`,
  compare: async (password, hash) => password === hash.replace('hashed_', ''),
};

const mockJwt = {
  sign: (payload, secret, options) => `jwt_${JSON.stringify(payload)}`,
};

const mockRandomstring = {
  generate: ({ length, charset }) => '123456',
};

const mockSendMail = async () => Promise.resolve();

const mockUploadCertificate = (req) => {
  req.file = { filename: 'certificate.pdf' };
};

const defaultDbQuery = (query, params) => {
  return new Promise((resolve, reject) => {
    try {
      let result;
      const email = params[0]?.toLowerCase();

      // Handle user queries
      if (query.includes('SELECT * FROM users WHERE LOWER(email) = LOWER(?)') || query.includes('SELECT * FROM users WHERE email = ?')) {
        if (['existing@example.com', 'newchef@example.com', 'newseller@example.com'].includes(email)) {
          result = [{
            id: 1,
            password: 'hashed_testpass',
            isVerified: 1,
            activity_status: 'active',
            first_name: 'John',
            last_name: 'Doe',
            is_admin: false
          }];
        } else if (email === 'user@example.com') {
          if (query.includes('verificationCode') && params[1] === '123456') {
            result = [{ id: 1, first_name: 'John', last_name: 'Doe', verificationCodeExpiryAT: new Date(Date.now() + 10 * 60 * 1000), isVerified: 0, is_admin: false }];
          } else if (query.includes('verificationCode')) {
            result = [];
          } else {
            result = [{ id: 1, first_name: 'John', last_name: 'Doe', isVerified: 0, verificationCodeExpiryAT: new Date(Date.now() + 10 * 60 * 1000), is_admin: false }];
          }
        } else {
          result = [];
        }
      }
      // Handle chef queries
      else if (query.includes('SELECT * FROM chefs WHERE LOWER(email) = LOWER(?)')) {
        result = email === 'chef@example.com' ? [{ id: 1, email: 'chef@example.com' }] : [];
      }
      // Handle seller queries
      else if (query.includes('SELECT * FROM sellers WHERE LOWER(email) = LOWER(?)') || query.includes('SELECT * FROM sellers WHERE email = ?')) {
        if (email === 'seller@example.com' && !query.includes('verificationCode')) {
          result = [{ id: 1, email: 'seller@example.com', owner_name: 'Jane Doe', isVerified: 0, verificationCodeExpiryAT: new Date(Date.now() + 10 * 60 * 1000) }];
        } else if (email === 'seller@example.com' && query.includes('verificationCode')) {
          result = params[1] === '123456'
            ? [{ id: 1, owner_name: 'Jane Doe', verificationCodeExpiryAT: new Date(Date.now() + 10 * 60 * 1000), isVerified: 0 }]
            : [];
        } else {
          result = [];
        }
      }
      // Handle seller ID queries
      else if (query.includes('SELECT id AS seller_id FROM sellers')) {
        result = email === 'seller@example.com' ? [{ seller_id: 1 }] : [];
      }
      // Handle chef ID queries
      else if (query.includes('SELECT id AS chef_id')) {
        result = email === 'chef@example.com' ? [{ chef_id: 1, chef_status: 'approved' }] : [];
      }
      // Handle INSERT and UPDATE queries
      else if (query.includes('INSERT INTO') || query.includes('UPDATE')) {
        result = { affectedRows: 1 };
      }
      else {
        result = { affectedRows: 1 };
      }
      resolve(result);
    } catch (err) {
      console.error('Error in defaultDbQuery:', query, params, err.stack);
      reject(err);
    }
  });
};

let db = { query: defaultDbQuery };

const controller = {
  registerChef: async (req, res) => {
    try {
      mockUploadCertificate(req);
      const errors = mockValidationResult(req.valid !== false);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { name, email, nationality, phone_number, password, about_you } = req.body;
      const certificate = req.file ? req.file.filename : null;
      if (!password) {
        return res.status(400).json({ msg: 'Password is required' });
      }
      const nameParts = name ? name.split(' ') : ['Unknown', ''];
      const first_name = nameParts[0];
      const last_name = nameParts.slice(1).join(' ') || '';
      const userResult = await db.query(`SELECT * FROM users WHERE LOWER(email) = LOWER(?)`, [email]);
      let hashedPassword;
      if (userResult.length > 0) {
        const user = userResult[0];
        const isMatch = await mockBcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(400).json({ msg: 'Password does not match your existing user account' });
        }
        hashedPassword = user.password;
      } else {
        hashedPassword = await mockBcrypt.hash(password, 10);
        await db.query(
          `INSERT INTO users (first_name, last_name, address, email, phone_number, password, isVerified, activity_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [first_name, last_name, nationality, email, phone_number, hashedPassword, 0, 'active']
        );
      }
      const chefResult = await db.query(`SELECT * FROM chefs WHERE LOWER(email) = LOWER(?)`, [email]);
      if (chefResult.length > 0) {
        return res.status(409).json({ msg: 'This email is already registered as a chef.' });
      }
      const status = 'pending';
      await db.query(
        `INSERT INTO chefs (name, email, nationality, phone_number, password, certificate, about_you, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, email, nationality, phone_number, hashedPassword, certificate, about_you, status]
      );
      return res.status(200).json({
        msg: 'Chef registration submitted. Awaiting admin approval.',
        certificate,
      });
    } catch (err) {
      console.error(`Error in registerChef for email ${req.body.email}:`, err.stack);
      return res.status(500).json({ msg: 'DB error', error: err.message });
    }
  },
  register: async (req, res) => {
    const errors = mockValidationResult(req.valid !== false);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const result = await db.query(`SELECT * FROM users WHERE LOWER(email) = LOWER(?)`, [req.body.email]);
      if (result.length) {
        return res.status(409).send({ msg: 'This email is already in use!!' });
      }
      const hash = await mockBcrypt.hash(req.body.password, 10);
      const verificationCode = mockRandomstring.generate({ length: 6, charset: 'numeric' });
      const verificationCodeExpiryAT = new Date(Date.now() + 60 * 10000);
      await db.query(
        `INSERT INTO users(first_name, last_name, address, email, phone_number, password, verificationCode, verificationCodeExpiryAT, isVerified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.body.first_name,
          req.body.last_name,
          req.body.address,
          req.body.email,
          req.body.phone_number,
          hash,
          verificationCode,
          verificationCodeExpiryAT,
          0,
        ]
      );
      await mockSendMail();
      return res.status(200).send({
        msg: 'The user has been submitted. Please check your email for the verification code.',
      });
    } catch (err) {
      return res.status(400).send({ msg: err.message || 'Error' });
    }
  },
  verifyCode: async (req, res) => {
    const { email, verificationCode } = req.body;
    try {
      const result = await db.query(
        `SELECT * FROM users WHERE email = ? AND verificationCode = ?`,
        [email, verificationCode]
      );
      if (!result.length) {
        return res.status(400).send({ msg: 'Invalid verification code.' });
      }
      const user = result[0];
      const currentTime = new Date();
      if (currentTime > new Date(user.verificationCodeExpiryAT)) {
        return res.status(400).send({ msg: 'Verification code has expired. Please enter a new code' });
      }
      await db.query(`UPDATE users SET isVerified = 1 WHERE email = ?`, [email]);
      await mockSendMail();
      return res.status(200).send({ success: true, msg: 'Email successfully verified!' });
    } catch (err) {
      return res.status(400).send({ msg: err.message || 'Error' });
    }
  },
  resendCode: async (req, res) => {
    const { email } = req.body;
    try {
      const result = await db.query(`SELECT * FROM users WHERE email = ?`, [email]);
      if (!result.length) {
        return res.status(404).send({ msg: 'Email not found' });
      }
      const user = result[0];
      if (user.isVerified) {
        return res.status(400).send({ msg: 'User is already verified.' });
      }
      const verificationCode = mockRandomstring.generate({ length: 6, charset: 'numeric' });
      const verificationCodeExpiryAT = new Date(Date.now() + 60 * 10000);
      await db.query(
        `UPDATE users SET verificationCode = ?, verificationCodeExpiryAT = ? WHERE email = ?`,
        [verificationCode, verificationCodeExpiryAT, email]
      );
      await mockSendMail();
      return res.status(200).send({ success: true, msg: 'New verification code sent successfully.' });
    } catch (err) {
      return res.status(500).send({ msg: 'Internal Server Error' });
    }
  },
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const userResult = await db.query(`SELECT * FROM users WHERE email = ?`, [email]);
      if (!userResult.length) {
        return res.status(404).json({ message: 'User not found' });
      }
      const user = userResult[0];
      if (user.activity_status === 'deactivated') {
        return res.status(409).json({ message: 'Your account has been deactivated by the admin. Please contact support.' });
      }
      if (user.isVerified === 0) {
        return res.status(403).json({ message: 'Your account is not verified. Please verify by the using code' });
      }
      const isMatch = await mockBcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const sellerResult = await db.query(`SELECT id AS seller_id FROM sellers WHERE email = ?`, [email]);
      const sellerId = sellerResult.length ? sellerResult[0].seller_id : null;
      const chefResult = await db.query(`SELECT id AS chef_id, status AS chef_status FROM chefs WHERE email = ?`, [email]);
      const chefId = chefResult.length ? chefResult[0].chef_id : null;
      const chefStatus = chefResult.length ? chefResult[0].chef_status : null;
      let role = user.is_admin ? 'admin' : 'user';
      if (sellerId && chefId && chefStatus === 'approved') {
        role = 'all';
      } else if (sellerId && chefId && chefStatus !== 'approved') {
        role = 'user_seller';
      } else if (sellerId) {
        role = 'seller';
      } else if (chefId && chefStatus === 'approved') {
        role = 'chef';
      } else if (chefId && chefStatus !== 'approved') {
        role = 'user';
      }
      const token = mockJwt.sign(
        { id: user.id, email: user.email, role, seller_id: sellerId, chef_id: chefId, chef_status: chefStatus },
        'JWT_SECRET',
        { expiresIn: '7d' }
      );
      res.status(200).json({
        msg: 'Login successful',
        token,
        user: { id: user.id, email: user.email, role, seller_id: sellerId, chef_id: chefId, chef_status: chefStatus },
      });
    } catch (error) {
      console.error('Error in login:', error.stack);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
  logout: async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).send({ msg: 'Unauthorized. No token provided.' });
    }
    try {
      await db.query(`UPDATE users SET token = NULL WHERE token = ?`, [token]);
      return res.status(200).send({ msg: 'Logged out successfully.' });
    } catch (err) {
      return res.status(500).send({ msg: 'Failed to log out. Please try again.', error: err.message });
    }
  },
  registerSeller: async (req, res) => {
    const errors = mockValidationResult(req.valid !== false);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { shop_name, owner_name, store_address, email, phone_number, password } = req.body;
    const nameParts = owner_name ? owner_name.split(' ') : ['Unknown', ''];
    const first_name = nameParts[0];
    const last_name = nameParts.slice(1).join(' ') || '';
    try {
      const userResult = await db.query(`SELECT * FROM users WHERE LOWER(email) = LOWER(?)`, [email]);
      let hashedPassword;
      if (userResult.length > 0) {
        const user = userResult[0];
        const isMatch = await mockBcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(400).json({ msg: 'Password does not match your existing user account' });
        }
        hashedPassword = user.password;
      } else {
        hashedPassword = await mockBcrypt.hash(password, 10);
        await db.query(
          `INSERT INTO users (first_name, last_name, address, email, phone_number, password, isVerified, activity_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [first_name, last_name, store_address, email, phone_number, hashedPassword, 1, 'active']
        );
      }
      const sellerResult = await db.query(`SELECT * FROM sellers WHERE LOWER(email) = LOWER(?)`, [email]);
      if (sellerResult.length) {
        return res.status(409).send({ msg: 'This email is already in use!' });
      }
      const verificationCode = mockRandomstring.generate({ length: 6, charset: 'numeric' });
      const verificationCodeExpiryAT = new Date(Date.now() + 60 * 10000);
      await db.query(
        `INSERT INTO sellers (shop_name, owner_name, store_address, email, phone_number, password, verificationCode, verificationCodeExpiryAT) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [shop_name, owner_name, store_address, email, phone_number, hashedPassword, verificationCode, verificationCodeExpiryAT]
      );
      await mockSendMail();
      return res.status(200).send({ msg: 'Seller registered successfully. Please verify your email.' });
    } catch (err) {
      return res.status(500).send({ msg: 'Error saving seller to database' });
    }
  },
  verifySellerCode: async (req, res) => {
    const { email, verificationCode } = req.body;
    try {
      const result = await db.query(
        `SELECT * FROM sellers WHERE email = ? AND verificationCode = ?`,
        [email, verificationCode]
      );
      if (!result.length) {
        return res.status(400).send({ msg: 'Invalid verification code.' });
      }
      const seller = result[0];
      const currentTime = new Date();
      if (currentTime > new Date(seller.verificationCodeExpiryAT)) {
        return res.status(400).send({ msg: 'Verification code has expired. Please request a new code.' });
      }
      await db.query(`UPDATE sellers SET isVerified = 1 WHERE email = ?`, [email]);
      await mockSendMail();
      return res.status(200).send({ success: true, msg: 'Email successfully verified!' });
    } catch (err) {
      console.error('Error in verifySellerCode:', err.stack);
      return res.status(500).send({ msg: 'Internal Server Error' });
    }
  },
  resendSellerCode: async (req, res) => {
    const { email } = req.body;
    try {
      const result = await db.query(`SELECT * FROM sellers WHERE email = ?`, [email]);
      if (!result.length) {
        return res.status(404).send({ msg: 'Email not found' });
      }
      const seller = result[0];
      if (seller.isVerified) {
        return res.status(400).send({ msg: 'Seller is already verified.' });
      }
      const verificationCode = mockRandomstring.generate({ length: 6, charset: 'numeric' });
      const verificationCodeExpiryAT = new Date(Date.now() + 60 * 10000);
      await db.query(
        `UPDATE sellers SET verificationCode = ?, verificationCodeExpiryAT = ? WHERE email = ?`,
        [verificationCode, verificationCodeExpiryAT, email]
      );
      await mockSendMail();
      return res.status(200).send({ success: true, msg: 'New verification code sent successfully.' });
    } catch (err) {
      console.error('Error in resendSellerCode:', err.stack);
      return res.status(500).send({ msg: 'Internal Server Error' });
    }
  },
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
  },
});

runner.test('registerChef - should register new chef', async () => {
  db.query = defaultDbQuery;
  const req = {
    body: {
      name: 'John Doe',
      email: 'newchef@example.com',
      nationality: 'USA',
      phone_number: '1234567890',
      password: 'testpass',
      about_you: 'Experienced chef',
    },
    valid: true,
  };
  const res = createRes();
  await controller.registerChef(req, res);
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.responseData, {
    msg: 'Chef registration submitted. Awaiting admin approval.',
    certificate: 'certificate.pdf',
  });
});

runner.test('registerChef - should handle existing user with correct password', async () => {
  db.query = defaultDbQuery;
  const req = {
    body: {
      name: 'John Doe',
      email: 'existing@example.com',
      nationality: 'USA',
      phone_number: '1234567890',
      password: 'testpass',
      about_you: 'Experienced chef',
    },
    valid: true,
  };
  const res = createRes();
  await controller.registerChef(req, res);
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.responseData, {
    msg: 'Chef registration submitted. Awaiting admin approval.',
    certificate: 'certificate.pdf',
  });
});

runner.test('registerChef - should reject validation errors', async () => {
  db.query = defaultDbQuery;
  const req = { body: {}, valid: false };
  const res = createRes();
  await controller.registerChef(req, res);
  assert.strictEqual(res.statusCode, 400);
  assert.deepStrictEqual(res.responseData, { errors: [{ msg: 'Validation error' }] });
});

runner.test('registerChef - should reject missing password', async () => {
  db.query = defaultDbQuery;
  const req = {
    body: {
      name: 'John Doe',
      email: 'newchef@example.com',
      nationality: 'USA',
      phone_number: '1234567890',
      about_you: 'Experienced chef',
    },
    valid: true,
  };
  const res = createRes();
  await controller.registerChef(req, res);
  assert.strictEqual(res.statusCode, 400);
  assert.deepStrictEqual(res.responseData, { msg: 'Password is required' });
});

runner.test('registerChef - should reject existing chef email', async () => {
  db.query = defaultDbQuery;
  const req = {
    body: {
      name: 'John Doe',
      email: 'chef@example.com',
      nationality: 'USA',
      phone_number: '1234567890',
      password: 'testpass',
      about_you: 'Experienced chef',
    },
    valid: true,
  };
  const res = createRes();
  await controller.registerChef(req, res);
  assert.strictEqual(res.statusCode, 409);
  assert.deepStrictEqual(res.responseData, { msg: 'This email is already registered as a chef.' });
});

runner.test('register - should register new user', async () => {
  db.query = defaultDbQuery;
  const req = {
    body: {
      first_name: 'John',
      last_name: 'Doe',
      address: '123 Main St',
      email: 'newuser@example.com',
      phone_number: '1234567890',
      password: 'testpass',
    },
    valid: true,
  };
  const res = createRes();
  await controller.register(req, res);
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.responseData, {
    msg: 'The user has been submitted. Please check your email for the verification code.',
  });
});

runner.test('register - should reject existing email', async () => {
  db.query = defaultDbQuery;
  const req = {
    body: {
      first_name: 'John',
      last_name: 'Doe',
      address: '123 Main St',
      email: 'existing@example.com',
      phone_number: '1234567890',
      password: 'testpass',
    },
    valid: true,
  };
  const res = createRes();
  await controller.register(req, res);
  assert.strictEqual(res.statusCode, 409);
  assert.deepStrictEqual(res.responseData, { msg: 'This email is already in use!!' });
});

runner.test('register - should reject validation errors', async () => {
  db.query = defaultDbQuery;
  const req = { body: {}, valid: false };
  const res = createRes();
  await controller.register(req, res);
  assert.strictEqual(res.statusCode, 400);
  assert.deepStrictEqual(res.responseData, { errors: [{ msg: 'Validation error' }] });
});

runner.test('verifyCode - should verify email', async () => {
  db.query = defaultDbQuery;
  const req = { body: { email: 'user@example.com', verificationCode: '123456' } };
  const res = createRes();
  await controller.verifyCode(req, res);
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.responseData, { success: true, msg: 'Email successfully verified!' });
});

runner.test('verifyCode - should reject invalid code', async () => {
  db.query = defaultDbQuery;
  const req = { body: { email: 'user@example.com', verificationCode: 'wrongcode' } };
  const res = createRes();
  await controller.verifyCode(req, res);
  assert.strictEqual(res.statusCode, 400);
  assert.deepStrictEqual(res.responseData, { msg: 'Invalid verification code.' });
});

runner.test('verifyCode - should reject expired code', async () => {
  db.query = (query, params) =>
    Promise.resolve(
      query.includes('verificationCode')
        ? [{ id: 1, first_name: 'John', last_name: 'Doe', verificationCodeExpiryAT: new Date(Date.now() - 10 * 60 * 1000), is_admin: false }]
        : defaultDbQuery(query, params)
    );
  const req = { body: { email: 'user@example.com', verificationCode: '123456' } };
  const res = createRes();
  await controller.verifyCode(req, res);
  assert.strictEqual(res.statusCode, 400);
  assert.deepStrictEqual(res.responseData, { msg: 'Verification code has expired. Please enter a new code' });
});

runner.test('resendCode - should resend verification code', async () => {
  db.query = defaultDbQuery;
  const req = { body: { email: 'user@example.com' } };
  const res = createRes();
  await controller.resendCode(req, res);
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.responseData, { success: true, msg: 'New verification code sent successfully.' });
});

runner.test('resendCode - should reject non-existent email', async () => {
  db.query = defaultDbQuery;
  const req = { body: { email: 'nonexistent@example.com' } };
  const res = createRes();
  await controller.resendCode(req, res);
  assert.strictEqual(res.statusCode, 404);
  assert.deepStrictEqual(res.responseData, { msg: 'Email not found' });
});

runner.test('resendCode - should reject verified user', async () => {
  db.query = (query, params) =>
    Promise.resolve(
      query.includes('SELECT * FROM users')
        ? [{ id: 1, first_name: 'John', last_name: 'Doe', isVerified: 1, is_admin: false }]
        : defaultDbQuery(query, params)
    );
  const req = { body: { email: 'user@example.com' } };
  const res = createRes();
  await controller.resendCode(req, res);
  assert.strictEqual(res.statusCode, 400);
  assert.deepStrictEqual(res.responseData, { msg: 'User is already verified.' });
});

runner.test('login - should login successfully', async () => {
  db.query = defaultDbQuery;
  const req = { body: { email: 'existing@example.com', password: 'testpass' } };
  const res = createRes();
  await controller.login(req, res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.responseData.msg, 'Login successful');
});

runner.test('login - should reject non-existent user', async () => {
  db.query = defaultDbQuery;
  const req = { body: { email: 'nonexistent@example.com', password: 'testpass' } };
  const res = createRes();
  await controller.login(req, res);
  assert.strictEqual(res.statusCode, 404);
  assert.deepStrictEqual(res.responseData, { message: 'User not found' });
});

runner.test('login - should reject invalid password', async () => {
  db.query = defaultDbQuery;
  const req = { body: { email: 'existing@example.com', password: 'wrongpass' } };
  const res = createRes();
  await controller.login(req, res);
  assert.strictEqual(res.statusCode, 401);
  assert.deepStrictEqual(res.responseData, { message: 'Invalid credentials' });
});

runner.test('login - should reject unverified user', async () => {
  db.query = (query, params) =>
    Promise.resolve(
      query.includes('SELECT * FROM users')
        ? [{ id: 1, password: 'hashed_testpass', isVerified: 0, activity_status: 'active', is_admin: false }]
        : defaultDbQuery(query, params)
    );
  const req = { body: { email: 'existing@example.com', password: 'testpass' } };
  const res = createRes();
  await controller.login(req, res);
  assert.strictEqual(res.statusCode, 403);
  assert.deepStrictEqual(res.responseData, { message: 'Your account is not verified. Please verify by the using code' });
});

runner.test('login - should reject deactivated user', async () => {
  db.query = (query, params) =>
    Promise.resolve(
      query.includes('SELECT * FROM users')
        ? [{ id: 1, password: 'hashed_testpass', isVerified: 1, activity_status: 'deactivated', is_admin: false }]
        : defaultDbQuery(query, params)
    );
  const req = { body: { email: 'existing@example.com', password: 'testpass' } };
  const res = createRes();
  await controller.login(req, res);
  assert.strictEqual(res.statusCode, 409);
  assert.deepStrictEqual(res.responseData, { message: 'Your account has been deactivated by the admin. Please contact support.' });
});

runner.test('logout - should logout successfully', async () => {
  db.query = defaultDbQuery;
  const req = { headers: { authorization: 'Bearer testtoken' } };
  const res = createRes();
  await controller.logout(req, res);
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.responseData, { msg: 'Logged out successfully.' });
});

runner.test('logout - should reject missing token', async () => {
  db.query = defaultDbQuery;
  const req = { headers: {} };
  const res = createRes();
  await controller.logout(req, res);
  assert.strictEqual(res.statusCode, 401);
  assert.deepStrictEqual(res.responseData, { msg: 'Unauthorized. No token provided.' });
});

runner.test('registerSeller - should register new seller', async () => {
  db.query = defaultDbQuery;
  const req = {
    body: {
      shop_name: 'Test Shop',
      owner_name: 'Jane Doe',
      store_address: '456 Market St',
      email: 'newseller@example.com',
      phone_number: '1234567890',
      password: 'testpass',
    },
    valid: true,
  };
  const res = createRes();
  await controller.registerSeller(req, res);
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.responseData, { msg: 'Seller registered successfully. Please verify your email.' });
});

runner.test('registerSeller - should handle existing user with correct password', async () => {
  db.query = defaultDbQuery;
  const req = {
    body: {
      shop_name: 'Test Shop',
      owner_name: 'Jane Doe',
      store_address: '456 Market St',
      email: 'existing@example.com',
      phone_number: '1234567890',
      password: 'testpass',
    },
    valid: true,
  };
  const res = createRes();
  await controller.registerSeller(req, res);
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.responseData, { msg: 'Seller registered successfully. Please verify your email.' });
});

runner.test('registerSeller - should reject existing seller email', async () => {
  db.query = defaultDbQuery;
  const req = {
    body: {
      shop_name: 'Test Shop',
      owner_name: 'Jane Doe',
      store_address: '456 Market St',
      email: 'seller@example.com',
      phone_number: '1234567890',
      password: 'testpass',
    },
    valid: true,
  };
  const res = createRes();
  await controller.registerSeller(req, res);
  assert.strictEqual(res.statusCode, 409);
  assert.deepStrictEqual(res.responseData, { msg: 'This email is already in use!' });
});

runner.test('registerSeller - should reject validation errors', async () => {
  db.query = defaultDbQuery;
  const req = { body: {}, valid: false };
  const res = createRes();
  await controller.registerSeller(req, res);
  assert.strictEqual(res.statusCode, 400);
  assert.deepStrictEqual(res.responseData, { errors: [{ msg: 'Validation error' }] });
});

runner.test('verifySellerCode - should verify seller email', async () => {
  db.query = defaultDbQuery;
  const req = { body: { email: 'seller@example.com', verificationCode: '123456' } };
  const res = createRes();
  await controller.verifySellerCode(req, res);
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.responseData, { success: true, msg: 'Email successfully verified!' });
});

runner.test('verifySellerCode - should reject invalid code', async () => {
  db.query = defaultDbQuery;
  const req = { body: { email: 'seller@example.com', verificationCode: 'wrongcode' } };
  const res = createRes();
  await controller.verifySellerCode(req, res);
  assert.strictEqual(res.statusCode, 400);
  assert.deepStrictEqual(res.responseData, { msg: 'Invalid verification code.' });
});

runner.test('verifySellerCode - should reject expired code', async () => {
  db.query = (query, params) =>
    Promise.resolve(
      query.includes('verificationCode')
        ? [{ id: 1, owner_name: 'Jane Doe', verificationCodeExpiryAT: new Date(Date.now() - 10 * 60 * 1000), isVerified: 0 }]
        : defaultDbQuery(query, params)
    );
  const req = { body: { email: 'seller@example.com', verificationCode: '123456' } };
  const res = createRes();
  await controller.verifySellerCode(req, res);
  assert.strictEqual(res.statusCode, 400);
  assert.deepStrictEqual(res.responseData, { msg: 'Verification code has expired. Please request a new code.' });
});

runner.test('resendSellerCode - should resend verification code', async () => {
  db.query = defaultDbQuery;
  const req = { body: { email: 'seller@example.com' } };
  const res = createRes();
  await controller.resendSellerCode(req, res);
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.responseData, { success: true, msg: 'New verification code sent successfully.' });
});

runner.test('resendSellerCode - should reject non-existent email', async () => {
  db.query = defaultDbQuery;
  const req = { body: { email: 'nonexistent@example.com' } };
  const res = createRes();
  await controller.resendSellerCode(req, res);
  assert.strictEqual(res.statusCode, 404);
  assert.deepStrictEqual(res.responseData, { msg: 'Email not found' });
});

runner.test('resendSellerCode - should reject verified seller', async () => {
  db.query = (query, params) =>
    Promise.resolve(
      query.includes('SELECT * FROM sellers')
        ? [{ id: 1, owner_name: 'Jane Doe', isVerified: 1 }]
        : defaultDbQuery(query, params)
    );
  const req = { body: { email: 'seller@example.com' } };
  const res = createRes();
  await controller.resendSellerCode(req, res);
  assert.strictEqual(res.statusCode, 400);
  assert.deepStrictEqual(res.responseData, { msg: 'Seller is already verified.' });
});

runner.run();