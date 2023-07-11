const express = require('express');
const req = require('express/lib/request');
const res = require('express/lib/response');
const mongoose = require('mongoose');
const router = express.Router();
const Content = require('./models/content')

router.get('/', (req, res, next) => {
    res.status(200).json({
        message : 'Handling GET requests to /content'
    });
});

router.post('/', (req, res, next) => {
    const data= {
        content_id : req.body.content_id,
        content_data: req.body.content_data,
    };

    const content = new Content({
        _id : req.body.content_id,
        content_data : req.body.content_data
    });
    content.save()
    .then(result => {
        console.log(result);
    })
    .catch(err => console.log(err));

    res.status(201).json({
        message : 'Handling POST requests to /content',
        data : data
      
    });
    console.log(data)
});

router.get('/:contentId', (req, res, next) => {
    const id = req.params.contentId;

    res.status(200).json({
        message : 'Handling GET requests to /content'
    });
});





module.exports = router