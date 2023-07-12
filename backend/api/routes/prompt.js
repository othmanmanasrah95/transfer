const express = require('express');
const router = express.Router();
const Prompt = require('./models/prompt');
const Content = require('./models/content');
const { default: mongoose } = require('mongoose');

router.get('/', (req, res, next) => {
  res.status(200).json({
    message: 'Prompt data fetched'
  });
});

router.post('/', (req, res, next) => {
  const promptData = {
    prompt_data: req.body.prompt_data,
    content_id: req.body.content_id,
  };

  // Create the prompt document
  const prompt = new Prompt({
    prompt_data: promptData.prompt_data,
    
  });

  // Save the prompt document
  prompt.save()
    .then((createdPrompt) => {
      // Find the corresponding content document
      return Content.findById(promptData.content_id)
        .then((content) => {
          if (!content) {
            throw new Error('Content not found');
          }
          // Associate the prompt with the content
          content.prompts.push(createdPrompt);
          console.log(createdPrompt)
          return content.save();
        });
    })
    .then(() => {
      res.status(201).json({
        message: 'Prompt created and associated with content',
        data: promptData,
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({
        error: err.message,
      });
    });

  
});

module.exports = router;
