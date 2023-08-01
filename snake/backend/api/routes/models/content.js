const mongoose = require('mongoose');

const promptSchema = new mongoose.Schema({
  prompt: String
});

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

const Content = mongoose.model('Content', contentSchema);

module.exports = Content;
