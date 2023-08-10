//This code defines a mongoose schema and exports a mongoose model.

//imports the mongoose package
const mongoose = require('mongoose');

//creates a new mongoose schema called promptSchema with a single field prompt
const promptSchema = new mongoose.Schema({
  prompt: String
});



/*
creates another mongoose schema called contentSchema with three fields:
  _id : field of type String which is required
  content_data : field of type String which is required
  prompts : field which is an array of objects. Each object has a single field prompt_data of type String.
*/
const contentSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  content_data: {
    type: String,
    required: true
  },
  prompts: [{prompt_data :{type :String}}]
});

// create a mongoose model called Content using the contentSchema.
const Content = mongoose.model('Content', contentSchema);

module.exports = Content;
