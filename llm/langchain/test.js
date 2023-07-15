require('dotenv').config();
const { pipeline } = require("@huggingface/hub");
const { PDFTokenizer } = require("@huggingface/tokenizers");
const express = require("express");
const app = express();
app.use(express.json());

const openai = new OpenAIApi(process.env.OPENAI_API_KEY);

async function answerQuestion(context, question) {
    const response = await openai.complete({
      engine: "text-davinci-003",
      prompt: context + "\nQuestion: " + question + "\nAnswer:",
      maxTokens: 50,
      temperature: 0.7,
    });
    const answer = response.choices[0].text.trim();
    return answer;
}

app.post("/hugg", async (req, res) => {
  try {
    const prompt = req.body.prompt;
    const content = req.body.content;

    // Preprocess the content
    const answer = await answerQuestion(content, prompt);

    // Process the text chunks and get the answer

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
