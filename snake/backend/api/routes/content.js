// Import required packages and modules
const express = require("express");
const app = require("../../app");
const router = express.Router();

const Content = require("./models/content");
const db = app.db;

// Route handler for getting all content
router.get("/", (req, res, next) => {
  db.collection("contents")
    .find()
    .toArray()
    .then((response) => {
      res.status(200).json(response);
    })
    .catch((error) => {
      res.status(500).json({
        message: "Internal server error.",
        error: error,
      });
    });
});


// Route handler for getting content by ID
router.get("/:contentId", (req, res, next) => {
  const id = req.params.contentId;
  db.collection("contents")
    .findOne({ _id: id })
    .then((response) => {
      if (response) {
        res.status(200).json({
          _id: response._id,
          content_data: response.content_data,
          prompts: response.prompts,
        });
      } else {
        res.status(404).json({
          message: `Content ID "${id}" not found.`,
        });
      }
    })
    .catch((error) => {
      res.status(500).json({
        message: "Internal server error.",
        error: error,
      });
    });
});


// Route handler for creating new content
router.post("/", async (req, res, next) => {
  const contentData = {
    content_id: req.body.content_id,
    content_data: req.body.content_data,
  };
  SaveContent(contentData, res);
});


// Function to save content
async function SaveContent(contentData, res) {
  try {
    // Check if ID exists
    const existingContent = await Content.findById(contentData.content_id);

    if (existingContent) {
      return res.status(400).json({
        message: "Content ID already exists",
      });
    }

    // Create the content document
    const content = new Content({
      _id: contentData.content_id,
      content_data: contentData.content_data,
      prompts: [],
    });

    // Save the content document
    await content.save();

    // Call the PDF endpoint
    await pdfEndPoint(contentData.content_data, contentData.content_id);

    // Call the ingest endpoint
    await ingestEndPoint();

    // Return success response
    res.status(201).json({
      message: "Content created",
      data: contentData,
    });
  } catch (err) {
    // Handle errors
    res.status(500).json({
      error: err.message,
    });
  }
}


// Function to make API call for converting content to PDF
async function pdfEndPoint(content_data, id) {
  const endpoint = 'http://127.0.0.1:5000/';
  const sendContent = {
    content: content_data,
    id: id
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sendContent),
    });

    if (!response.ok) {
      throw new Error('Failed to convert content');
    }

    console.log("convert done");
  } catch (error) {
    console.error("converting didn't work: " + error);
    // Handle any errors
  }
}


// Function to make API call for running ingest processes
async function ingestEndPoint() {
    const endpoint = 'http://127.0.0.1:5000/api/run_ingest';

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
      });
  
      if (!response.ok) {
        throw new Error('Failed to run ingest');
      }
  
      console.log("ingest done");
    } catch (error) {
      console.error("ingesting doesn't work: " + error);
      // Handle any errors
    }
  }
  


module.exports = router;
