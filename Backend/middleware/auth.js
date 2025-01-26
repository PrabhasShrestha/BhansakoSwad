const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;

const isAuthorize = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: Token required.' });
    }

    const token = authHeader.split(' ')[1];

    // Verify the token
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        const message =
          err.name === 'TokenExpiredError'
            ? 'Unauthorized: Token has expired.'
            : 'Unauthorized: Invalid token.';
        return res.status(401).json({ message });
      }

      // Attach user info to the request object
      req.user = { id: decoded.id };
      next(); // Proceed to the next middleware or route handler
    });
  } catch (error) {
    console.error('Authorization error:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


module.exports = { isAuthorize };
