require("dotenv").config();
require('./config/dbConnection.js')

const express = require('express');
const cors = require('cors')
const userRouter = require('./routes/userRoute')
const bodyParser = require('body-parser');
const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({extended:true}))
app.use('/api', userRouter)

app.use((err,req,res,nexr) =>{
    err.statusCode =err.statusCode || 500;
    err.message = err.message || "Interna lServer Error";
    res.status(err.statusCode).json({
        message:err.message,
    });
});

app.listen(3000, ()=> console.log('Server running'))