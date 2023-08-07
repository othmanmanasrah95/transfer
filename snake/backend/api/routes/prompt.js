const express = require('express');
const router = express.Router();
const Prompt = require('./models/prompt');
const Content = require('./models/content');
const { default: mongoose } = require('mongoose');
const { json } = require('body-parser');


{
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
  savePrompt( promptData, res);
  sendPrompt(promptData, res)
});

{
  function sendPrompt(promptData, res){
    const endpoint = 'http://127.0.0.1:5000/api/prompt_route'; 
    const prompt = {
      user_prompt : promptData.prompt_data,
    }
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body:  JSON.stringify(prompt) ,
    })
    .then((response) => response.json())
    .then((data) => {
      res.status(201).json({
        data:data
      });
      console.log(data)
    })
    .catch((error) => {
      console.error(error);
      // Handle any errors
    });
  }


  
  function savePrompt(promptData, res){
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
        return content.save();
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({
        error: err.message,
      });
    });
  }

}

}


module.exports = router;
