//This code defines a mongoose schema and exports a mongoose model.

//imports the mongoose package
const mongoose = require('mongoose');

//creates a new mongoose schema called promptSchema with a single field prompt
const promptSchema = new mongoose.Schema({
  prompt_data: {
    type: String,
    required: true
  }
});

// create a mongoose model called Content using the contentSchema.
const Prompt = mongoose.model('Prompt', promptSchema);

module.exports = Prompt;
