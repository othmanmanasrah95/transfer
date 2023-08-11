// Import required dependencies
const express = require('express');
const router = express.Router();
const Prompt = require('./models/prompt');
const Content = require('./models/content');
const { default: mongoose } = require('mongoose');
const { json } = require('body-parser');

// Define GET route at the root path '/'
router.get('/', (req, res, next) => {
  res.status(200).json({
    message: 'Prompt data fetched'
  }); 
});

// Define POST route at the root path '/'
router.post('/', (req, res, next) => {
  // Extract prompt_data and content_id from the request body
  const { prompt_data, content_id } = req.body;

  // Create promptData object with prompt_data and content_id
  const promptData = { prompt_data, content_id };

  // Call savePrompt function to save the prompt and associate it with the content
  savePrompt(promptData, res);
  // Call sendPrompt function to send the prompt data to another API endpoint
});



// Save the prompt and associate it with the content
function savePrompt(promptData, res) {
  // Create a new prompt document with the prompt_data from promptData object
  const prompt = new Prompt({
    prompt_data: promptData.prompt_data,
  });

  // Save the prompt document to the database
  prompt
    .save()
    .then((createdPrompt) => {
      // Find the corresponding content document with the specified content_id
      return Content.findById(promptData.content_id).then((content) => {
        // If the content document is not found, throw an error
        if (!content) {
          throw new Error('Content not found');
        }

        // Associate the created prompt with the content by pushing it to the prompts array
        content.prompts.push(createdPrompt);

        // Save the updated content document
       content.save();
      });
    })
    .then(() => {
      res.status(201).json();
    })
    .catch((err) => {
      console.error(err);
      // Respond with an error message
      res.status(500).json({
        error: err.message,
      });
    });
}

// Export the router module
module.exports = router;
