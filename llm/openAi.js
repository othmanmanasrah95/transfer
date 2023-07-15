const express = require("express");
require("dotenv").config();
const { Configuration, OpenAIApi } = require("openai");

const app = express();
app.use(express.json());

const configuration = new Configuration({
  apiKey: process.env.OPEN_AI_KEY,
});
const openai = new OpenAIApi(configuration);

function chunkContent(content) {
  const maxChunkLength = 4096; // Maximum chunk length for GPT-3.5-turbo

  if (content.length <= maxChunkLength) {
    return [content];
  }

  const chunks = [];
  let currentChunk = "";

  const sentences = content.split("."); // Split content by sentences

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length <= maxChunkLength) {
      currentChunk += sentence + ".";
    } else {
      chunks.push(currentChunk);
      currentChunk = sentence + ".";
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

app.post("/test", async (req, res) => {
  try {
    const prompt = req.body.prompt;
    const content = req.body.content;
    const chunks = chunkContent(content);
    const messages = [];
    
    for (const chunk of chunks) {
      messages.push(
        {
          role: "user",
          content: `answer this question ${prompt} based on this content ${chunk}`,
        }
      );

      // Check the total context length before making an API call
      const totalContextLength = messages.reduce(
        (length, message) => length + message.content.length,
        0
      );

      if (totalContextLength > 4096) {
        // If the total context length exceeds the maximum, remove the last message
        messages.pop();

        // Make the API call with the current messages
        const completion = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages,
        });

        const answer = completion.data.choices[0].message.content;
        console.log(answer);
        return res.status(200).json({
          data: answer,
        });
      }
    }

    // If the total context length is within the limit, make the final API call
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages,
    });

    const answer = completion.data.choices[0].message.content;
    console.log(answer);
    return res.status(200).json({
      data: answer,
    });
  } catch (e) {
    return res.status(400).json({
      success: false,
      error: e.response ? e.response.data : e.message,
    });
  }
});

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server listening on port ${port}`));
