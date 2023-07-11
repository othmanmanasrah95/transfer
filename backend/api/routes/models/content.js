const mongoose = require('mongoose');

const contentSchema= mongoose.Schema({
    _id : String,
    content_data : String,
    
});

module.exports = mongoose.model('Content', contentSchema);