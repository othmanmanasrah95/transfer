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

### OpenAi API version:
Implement the openAI model to get answer for question related to the the context (without fine-tuning).
- Configuring the openAi model with the API key.
- Taking the prompt and conetext data from the backend side.
- Customizing the prompt and openAi parameters.
- Dividing the content into chunks that fits the maximum tokens for the model.
- Testing the actual and expected result.

Disadvantages : 
- Not an open-source or commercial use for confidential data.
- Sometimes responses with general answers that are not specific for the context. (depends on the prompt format).

### Snake_LocalGPT version
This project was inspired by the original localGPT repo [localGPT] (https://github.com/PromtEngineer/localGPT) and snake repo (https://github.com/khalifima/snake/tree/Prototype).
The features that we have added it to the project: Building a Chrome Extension takes the user prompt and content from the page visited.

- Saves the content and related prompts into mongo DB.
- Converts the content into pdf and stores it in the SOURCE_DOCUMENTS folder.
- Ingests the text after each content recieved from the browser which saves the chunks into DB folder. In the (run_ingest_route API) which runs the file called ingest.py.
- Answers the question recieved depending on the documents ingested. (Takes too much time on CPU)
- The LLM REST APIs are in the file called backAPIs (You can change the device_type to cpu or cuda in the code).

To run the backAPIs file after choosing the model you want to load: use the "python backAPIs.py " command.

Future features:

Adding a button click for ingesting process.


