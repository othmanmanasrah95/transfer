const express = require('express');
const router = express.Router();
const Content = require('./models/content');

router.get('/', (req, res, next) => {
  res.status(200).json({
    message: 'Content data fetched',
  });
});

router.post('/', (req, res, next) => {
  const contentData = {
    content_id: req.body.content_id,
    content_data: req.body.content_data,
  };

  // Create the content document
  const content = new Content({
    _id: contentData.content_id,
    content_data: contentData.content_data,
    prompts : []
  });

  // Save the content document
  content.save()
    .then(() => {
      res.status(201).json({
        message: 'Content created',
        data: contentData,
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({
        error: err.message,
      });
    });
});

router.get('/:contentId', (req, res, next) => {
  const id = req.params.contentId;

  res.status(200).json({
    message: `Content ID: ${id}`,
  });
});

module.exports = router;
