# Snake
Strategic Neural Analysis and Knowledge Enhancement 

**Description:** 
a chrome extension that extracts text from web pages,and answer the user questions depending on the content exists in the page visited by help of large language model.


## Extension:

Creating a labeled checkbox to ensure users are aware of data scraping.

Creating the necessary layout of the follwoing components:

- Prompt: creating a post request API that takes input from the user to the backend side with the content related to.

- Content: posting the extracted content with the unique id to the database.

- Response: return the reposnse back from the llm and displaying on the extension. 


## LLM:

### OpenAi API version:
Implement the openAI model to get answer for question related to the the context (without fine-tuning).
- Configuring the openAi model with the API key.
- Taking the prompt and conetext data from the backend side.
- Customizing the prompt and openAi parameters.
- Dividing the content into chunks that fits the maximum tokens for the model.
- Testing the actual and expected result.
  
