require('dotenv').config();
const { pipeline } = require("@huggingface/hub");
const { PDFTokenizer } = require("@huggingface/tokenizers");
const express = require("express");
const app = express();
app.use(express.json());

const openai = new OpenAIApi(process.env.OPENAI_API_KEY);

async function answerQuestion(model, context, question) {
  const response = await pipeline("question-answering", {
    model: model,
    context: context,
    question: question,
  });

  return response.answer;
}

async function preprocessText(text) {
  // Convert text to PDF
  const tokenizer = await PDFTokenizer.fromOptions();
  const tokenized = await tokenizer.encode(text);

  // Return tokenized input as a string
  return tokenized.toString();
}

async function processTextChunks(textChunks, question) {
  let context = "";
  let answer = "";

  for (const chunk of textChunks) {
    const currentContext = context + chunk;

    // Answer the question using the current chunk of context
    const currentAnswer = await answerQuestion("text-davinci-003", currentContext, question);

    // Append the current chunk and answer to the overall context and answer
    context += chunk;
    answer += currentAnswer;

    // Check if the answer is complete (e.g., contains the expected answer or reaches a certain length)
    // Adjust this condition based on your requirements
    if (answer.includes("expected answer") || answer.length > 1000) {
      break;
    }
  }

  return answer;
}

app.post("/hugg", async (req, res) => {
  try {
    const prompt = req.body.prompt;
    const content = req.body.content;

    // Preprocess the content
    const cont = await preprocessText(content);

    // Split the content into smaller chunks
    const maxChunkSize = 4000; // Adjust this based on the maximum token limit of your model
    const textChunks = [];
    let currentChunk = "";

    for (const word of cont.split(" ")) {
      if ((currentChunk + word).length < maxChunkSize) {
        currentChunk += word + " ";
      } else {
        textChunks.push(currentChunk.trim());
        currentChunk = word + " ";
      }
    }

    // Add the last chunk to the list
    if (currentChunk.trim().length > 0) {
      textChunks.push(currentChunk.trim());
    }

    // Process the text chunks and get the answer
    const answer = await processTextChunks(textChunks, prompt);

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
