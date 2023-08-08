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
  sendPrompt(promptData, res);
});

// Send prompt data to another API endpoint
function sendPrompt(promptData, res) {
  // Define the endpoint URL
  const endpoint = 'http://127.0.0.1:5000/api/prompt_route';
  // Create the prompt object with user_prompt field using promptData.prompt_data
  const prompt = {
    user_prompt: promptData.prompt_data,
  };

  // Send a POST request to the specified endpoint with the prompt data
  fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(prompt),
  })
    .then((response) => response.json())
    .then((data) => {
      // Respond with the received data
      res.status(201).json({
        data: data.Answer,
      });
      // Log the data to the console
      console.log(data);
    })
    .catch((error) => {
      console.error(error);
      // Handle any errors
    });
}

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
        return content.save();
      });
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
