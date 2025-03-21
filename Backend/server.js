require("dotenv").config(); // Load environment variables
require('./config/dbConnection.js'); // Establish database connection
const path = require('path');
const express = require('express');
const cors = require('cors');
const userRouter = require('./routes/userRoute');
const sellerRouter = require('./routes/sellerRoute');
const cartRouter = require('./routes/cartRoute.js')
const khaltiPaymentRouter = require('./routes/khaltiPayment.js')
const recipeRouter = require('./routes/recipeRoute.js')
const chefRouter = require('./routes/chefRoute.js')
const adminRouter = require('./routes/adminRoute.js')
const bodyParser = require('body-parser');
const {expireSubscriptions} = require('./controllers/userController.js')

const app = express();

// Validate environment variables
if (!process.env.JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined.");
    process.exit(1); // Exit the application
}

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON requests
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded data

// Routes
app.use('/api', userRouter);
app.use('/api', sellerRouter);
app.use('/api/cart', cartRouter);
app.use('/api', khaltiPaymentRouter);
app.use('/api/recipe', recipeRouter);
app.use('/api/chef', chefRouter)
app.use('/api/admin', adminRouter)

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/images', express.static(path.join(__dirname, 'images')));

setInterval(expireSubscriptions, 24 * 60 * 60 * 1000);

// Handle 404 errors
app.use((req, res, next) => {
    res.status(404).json({ message: "Route not found" });
});

// Error-handling middleware
app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";
    res.status(err.statusCode).json({
        message: err.message,
    });
});


// Start the server
app.listen(3000, () => console.log('Server running on http://localhost:3000'));
