const express = require("express");
require("dotenv").config();
const { Configuration, OpenAIApi } = require("openai");

const app = express();
app.use(express.json());

const configuration = new Configuration({
  apiKey: process.env.OPEN_AI_KEY,
});
const openai = new OpenAIApi(configuration);

async function generateResponse(prompt, content) {
  const maxChunkLength = 220; 
  const messages = [
    {
      role: "user",
      content: `answer this question: ${prompt} based on this content `,
    },
  ];

  let startIndex = 0;
  let endIndex = 0;
  let chunk = "";

  while (startIndex < content.length) {
    endIndex = Math.min(startIndex + maxChunkLength, content.length);
    chunk = content.slice(startIndex, endIndex);
    messages[messages.length - 1].content += chunk;

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages,
    });

    const answer = completion.data.choices[0].message.content;

    if (completion.data.choices[0].finish_reason === "stop") {
      return answer;
    }

    startIndex = endIndex;
    messages[messages.length - 1].content = answer.slice(prompt.length + 26); 
  }

  return "Response generation incomplete.";
}

app.post("/test", async (req, res) => {
  try {
    const prompt = req.body.prompt;
    const content = req.body.content;
    console.log(prompt);

    const answer = await generateResponse(prompt, content);
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
