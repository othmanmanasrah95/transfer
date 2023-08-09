<iframe style="border: 1px solid rgba(0, 0, 0, 0.1);" width="800" height="450" src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FnUaAfW1Laigb9w9ST6AaQL%2FUntitled%3Ftype%3Dwhiteboard%26node-id%3D0%253A1%26t%3DwNi4uCevJBfVmFc8-1" allowfullscreen></iframe>
# Snake
Strategic Neural Analysis and Knowledge Enhancement. 
Initialize a neural network with pre-trained weights and let all weights be adjusted with the new training.

**Description:** 
a chrome extension that extracts text from web pages, and answer the user questions depending on the content extracted from web page visited by help of large language model.


## Extension:

- Creating a labeled checkbox to ensure users are aware of data scraping.

- Creating the necessary logic functions and layout of the follwoing components:

  Prompt: creating a post API that takes input from the user to the backend side with the content related to.

  Content: sending the extracted content with the unique id to the database.

  Response: return the reposnse back from the llm and displaying on the extension. 


## LLM:

## 1) OpenAi API version: (Prototype branch)
Implement the openAI model to get answer for question related to the the context (without fine-tuning).
- Configuring the openAi model with the API key.
- Taking the prompt and conetext data from the backend side.
- Customizing the prompt and openAi parameters.
- Dividing the content into chunks that fits the maximum tokens for the model.
- Testing the actual and expected result.

1.1) Disadvantages : 
- Not an open-source or commercial use for confidential data.
- Sometimes responses with general answers that are not specific for the context. (depends on the prompt format).

## 2) Snake_LocalGPT version (LocalGPT branch)
This project was inspired by the original localGPT repo [localGPT] (https://github.com/PromtEngineer/localGPT) and snake repo (https://github.com/khalifima/snake/tree/Prototype).

The features that we have added it to the project:
Building a Chrome Extension takes the user prompt and content from the page visited.
1. Saves the content and related prompts into mongo DB.
2. Converts the content into pdf and stores it in the SOURCE_DOCUMENTS folder.
3. Ingests the text after each content recieved from the browser which saves the chunks into DB folder. In the (run_ingest_route API) which runs the file called ingest.py.
4. Answers the question recieved depending on the documents ingested. (Takes too much time on CPU) 



Future features:
1. Adding a button click for ingesting process.


## 2.1 Instructions for ingesting your own dataset

Put any and all of your .txt, .pdf, or .csv files into the SOURCE_DOCUMENTS directory
in the load_documents() function, replace the docs_path with the absolute path of your source_documents directory.

The current default file types are .txt, .pdf, .csv, and .xlsx, if you want to use any other file type, you will need to convert it to one of the default file types.

It will create an index containing the local vectorstore. Will take time, depending on the size of your documents.
You can ingest as many documents as you want, and all will be accumulated in the local embeddings database.
If you want to start from an empty database, delete the `index`.

Note: When you run this for the first time, it will download take time as it has to download the embedding model. In the subseqeunt runs, no data will leave your local enviroment and can be run without internet connection.


## 2.2 Ask questions to your documents, locally!
The LLM REST APIs are in the file called backAPIs (You can change the device_type to cpu or cuda in the code).

In order to ask a questions:

- Lunch the extension on google chrome by loading the unpacked folder.
- run the backend server for the exetension using "npm start" command at the snake/backend folder.
- run the backAPIs.py file after choosing the model you want to load: use the "python backAPIs.py " command.
- ask your question on the exetnsion.
- be ready for the model answer!



Note: When you run this for the first time, it will need internet connection to download the model specified at teh backAPIs file. After that you can turn off your internet connection, and the script inference would still work. No data gets out of your local environment.



## 2.3 How does it work?

Selecting the right local models and the power of `LangChain` you can run the entire pipeline locally, without any data leaving your environment, and with reasonable performance.

- `ingest.py` uses `LangChain` tools to parse the document and create embeddings locally using `InstructorEmbeddings`. It then stores the result in a local vector database using `Chroma` vector store.
- `backAPIs.py` uses a local LLM  to understand questions and create answers. The context for the answers is extracted from the local vector store using a similarity search to locate the right piece of context from the docs.
- You can replace this local LLM with any other LLM from the HuggingFace. Make sure whatever LLM you select is in the HF format.




