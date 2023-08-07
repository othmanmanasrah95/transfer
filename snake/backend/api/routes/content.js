const express = require("express");

const router = express.Router();

const Content = require("./models/content");
var child_process = require('child_process');

{
  router.get("/", (req, res, next) => {
    res.status(200).json({
      message: "Content data fetched",
    });
  });

   router.post("/", async (req, res, next) => {
    const contentData = {
      content_id: req.body.content_id,

      content_data: req.body.content_data,
    }

    SaveContent(contentData, res);
    pdfEndPoint(contentData.content_data,contentData.content_id,res);
    ingestEndPoint(res);
  
  });

  router.get("/:contentId", (req, res, next) => {
    const id = req.params.contentId;

    res.status(200).json({
      message: `Content ID: ${id}`,
    });
  });

  {
    
    function SaveContent(contentData, res) {
      // Create the content document
      const content = new Content({
        _id: contentData.content_id,
        content_data: contentData.content_data,
        prompts: [],
      });
      // Save the content document
      content.save()
        .then(() => {
          res.status(201).json({
            message: "Content created",
            data: contentData,
          });
        })

        .catch((err) => {
          console.error(err);

          res.status(500).json({
            error: err.message,
          });
        });
    }


    function pdfEndPoint(content_data,id,res){
      const endpoint = 'http://127.0.0.1:5000/'; 
      const sendContent = {
        content : content_data,
        id : id
      }
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body:  JSON.stringify(sendContent) ,
      })
      .then((response) => response.json())
      .then(() => {
        console.log("convert done")
      })
      .catch((error) => {
        console.error("converting didn't work :    "+error);
        // Handle any errors
      });
    }

    function ingestEndPoint(res){
      const endpoint = 'http://127.0.0.1:5000/api/run_ingest';
      fetch(endpoint, {
        method: 'GET',
      })
      .then(() => {
        console.log("ingest done")
      })
      .catch((error) => {
        console.error("ingesting doesnt  work "+ error );
        // Handle any errors
      });
    }


  }
}

module.exports = router;
