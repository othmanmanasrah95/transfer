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
  await SaveContent(contentData, res);
});

// Function to save content
async function SaveContent(contentData, res) {
  const result = {
    saveToDB: 'In Hold',
    convertToPDF: 'In Hold',
    ingest: 'In Hold'
  };
  
  try {
    // Check if ID exists
    const existingContent = await Content.findById(contentData.content_id);
    
    if (existingContent) {
      console.log("Content ID already exists");
      result.saveToDB = 'failed';
      res.status(400).json({
        message: "Content ID already exists",
      });
      return;
    }

    // Create the content document
    const content = new Content({
      _id: contentData.content_id,
      content_data: contentData.content_data,
      prompts: [],
    });

    // Save the content document
    await content.save();
    console.log("Content created");
    result.saveToDB = 'successful';
    // Return success response
    res.status(201).json({
      message: "Content created",
      data: contentData,
      result: result
      });
    // Call the PDF endpoint
    try {
      await pdfEndPoint(contentData.content_data, contentData.content_id);
      console.log("Content converted to PDF successfully");
      result.convertToPDF = 'successful';

      // Call the ingest endpoint
      try {
        await ingestEndPoint();
        console.log("PDF ingested successfully");
        result.ingest = 'successful';
      } catch (ingestError) {
        console.error("Ingesting didn't work: " + ingestError);
      }
    } catch (pdfError) {
      console.error("Converting didn't work: " + pdfError);
    }

    
  } catch (err) {
    // Handle errors
    console.error("Error:", err.message);
    res.status(500).json({
      error: err.message,
      result: result
    });
  }
}

// Function to make API call for converting content to PDF
async function pdfEndPoint(content_data, id) {
  const endpoint = 'http://127.0.0.1:5000/api/convert_to_pdf';
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
    } catch (error) {
      console.error("ingesting doesn't work: " + error);
      // Handle any errors
    }
  }
  


module.exports = router;