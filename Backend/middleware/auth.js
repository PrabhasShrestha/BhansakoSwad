const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;

const isAuthorize = (req, res, next) => {
  try {
    // Use the standard "Authorization" header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: Token required.' });
    }

    // Extract the token from "Bearer <token>"
    const token = authHeader.split(' ')[1];

    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user information to the request object
    req.user = { id: decoded.id };

    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error('Authorization error:', error.message);
    res.status(401).json({ message: 'Unauthorized: Invalid token.' });
  }
};

module.exports = { isAuthorize };
