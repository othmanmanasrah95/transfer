
const express = require('express');
const req = require('express/lib/request');
const res = require('express/lib/response');
const app = express();
const contentRoutes = require('./api/routes/content');
const promptRoutes = require('./api/routes/prompt');
const morgan = require('morgan');
const bodyParser = require('body-parser');


const mongoose = require('mongoose');

const url = 'mongodb://127.0.0.1:27017'; // Replace with your MongoDB connection string
const dbName = 'llm'; // Replace with your database name

mongoose.connect(`${url}/${dbName}`, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to the database');
    // Perform database operations
  })
  .catch((err) => {
    console.error('Failed to connect to the database:', err);
  });



app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    if(req.method === 'OPTIONS'){
        res.header("Access-Control-Allow-Methods", "GET, POST");
        return res.status(200).json({});
    }
    next(); 
});

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());


//Routes
app.use('/content', contentRoutes);
app.use('/prompt', promptRoutes);


app.use((req, res, next) => {
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
});


app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error : {
            message : error.message
        }
    });
});


module.exports = app;



