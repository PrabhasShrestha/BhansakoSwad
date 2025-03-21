const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;


const isAuthorize = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "Unauthorized: Missing token" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "Forbidden: Invalid or expired token" });
        }

        req.user = decoded; // Attach user info to request
        next();
    });
};


module.exports = { isAuthorize };
