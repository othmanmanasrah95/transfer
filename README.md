# Snake
Strategic Neural Analysis and Knowledge Enhancement. 
Initialize a neural network with pre-trained weights and let all weights be adjusted with the new training.

**Description:** 
a chrome extension that extracts text from web pages, and answer the user questions depending on the content exists in the page visited by help of large language model.


## Extension:

Creating a labeled checkbox to ensure users are aware of data scraping.

Creating the necessary logic functions and layout of the follwoing components:

- Prompt: creating a post request API that takes input from the user to the backend side with the content related to.

- Content: posting the extracted content with the unique id to the database.

- Response: return the reposnse back from the llm and displaying on the extension. 


## LLM:

### OpenAi API version: (Prototype branch)
Implement the openAI model to get answer for question related to the the context (without fine-tuning).
- Configuring the openAi model with the API key.
- Taking the prompt and conetext data from the backend side.
- Customizing the prompt and openAi parameters.
- Dividing the content into chunks that fits the maximum tokens for the model.
- Testing the actual and expected result.

Disadvantages : 
- Not an open-source or commercial use for confidential data.
- Sometimes responses with general answers that are not specific for the context. (depends on the prompt format).

### Snake_LocalGPT version (LocalGPT branch)
Checkout this readme file [README.md](https://github.com/khalifima/snake/files/12279234/README.md)


