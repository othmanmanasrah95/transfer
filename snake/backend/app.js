// Require the necessary modules
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const bodyParser = require('body-parser');

// Import route modules from local files
const contentRoutes = require('./api/routes/content');
const promptRoutes = require('./api/routes/prompt');

// Create an instance of the Express application
const app = express();

// Define the URL and database name for MongoDB
const url = 'mongodb://127.0.0.1:27017';
const dbName = 'llm';

// Connect to the MongoDB database using mongoose.connect
mongoose.connect(`${url}/${dbName}`, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to the database\n#########################');
    // Perform database operations
  })
  .catch((err) => {
    console.error('Failed to connect to the database:', err);
  });

// Set up CORS handling using a middleware
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    if (req.method === 'OPTIONS') {
        res.header("Access-Control-Allow-Methods", "GET, POST");
        return res.status(200).json({});
    }
    next();
});

// Set up logging using morgan middleware in "dev" mode
app.use(morgan('dev'));

// Set up body parsing using body-parser middleware to handle JSON and URL encoded data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Define the routes for content and prompt using app.use, specifying the prefix for the routes
app.use('/content', contentRoutes);
app.use('/prompt', promptRoutes);

// Define a middleware for handling "Not Found" errors
app.use((req, res, next) => {
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
});

// Define a global error handling middleware
app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message
        }
    });
});

// Export the Express application
module.exports = app;
