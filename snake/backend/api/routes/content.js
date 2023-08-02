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

  router.post("/", (req, res, next) => {
    const contentData = {
      content_id: req.body.content_id,

      content_data: req.body.content_data,
    };

    /* child_process.exec('python ../../../../../../content.py', function (err){
      if (err) {
      console.log("child processes failed with error code: " + err.code);
    }
  });
  */

    SaveContent(contentData, res);


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

      content
        .save()

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


  }
}

module.exports = router;
