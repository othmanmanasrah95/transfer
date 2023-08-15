#Import required dependencies
import os
import pdfkit
from flask import Flask,jsonify,request
import logging
import shutil
import subprocess
import torch
from auto_gptq import AutoGPTQForCausalLM
from langchain.chains import RetrievalQA
from langchain.embeddings import HuggingFaceInstructEmbeddings
from langchain.embeddings import HuggingFaceEmbeddings
# from langchain.embeddings import HuggingFaceEmbeddings
from langchain.llms import HuggingFacePipeline
from run_localGPT import load_model
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate
# from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langchain.vectorstores import Chroma
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    GenerationConfig,
    LlamaForCausalLM,
    LlamaTokenizer,
    pipeline,
)
from werkzeug.utils import secure_filename
from constants import CHROMA_SETTINGS, EMBEDDING_MODEL_NAME, PERSIST_DIRECTORY




# Set the device type to "cpu"
DEVICE_TYPE = "cpu"

# Enable showing source documents
SHOW_SOURCES = True

# Log the current device type to the console
logging.info(f"Running on: {DEVICE_TYPE}")

# Log the status of showing source documents to the console
logging.info(f"Display Source Documents set to: {SHOW_SOURCES}")




# Initialize HuggingFaceEmbeddings instance
EMBEDDINGS = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)

# Check if PERSIST_DIRECTORY exists and remove it if it does
if os.path.exists(PERSIST_DIRECTORY):
    try:
        shutil.rmtree(PERSIST_DIRECTORY)
    except OSError as e:
        print(f"Error: {e.filename} - {e.strerror}.")
else:
    print("The directory does not exist")

# Create run_langest_commands list
run_langest_commands = ["python", "ingest.py"]

# If DEVICE_TYPE is "cpu", append "--device_type" and DEVICE_TYPE to the run_langest_commands list
if DEVICE_TYPE == "cpu":
    run_langest_commands.append("--device_type")
    run_langest_commands.append(DEVICE_TYPE)

# Run subprocess
result = subprocess.run(run_langest_commands, capture_output=True)

# Check if return code is not 0
if result.returncode != 0:
    raise FileNotFoundError(
        "No files were found inside SOURCE_DOCUMENTS, please put a starter file inside before starting the API!"
    )




# Initialize Chroma database with specified parameters
DB = Chroma(
    persist_directory=PERSIST_DIRECTORY,
    embedding_function=EMBEDDINGS,
    client_settings=CHROMA_SETTINGS,
)
# Convert Chroma database object to retriever object
RETRIEVER = DB.as_retriever()



#--------------- HF models ---------------#
# model_id = "TheBloke/vicuna-7B-1.1-HF"
# model_id = "TheBloke/Wizard-Vicuna-7B-Uncensored-HF"
# model_id = "TheBloke/wizardLM-7B-HF"
#model_id = "TheBloke/guanaco-7B-HF"
# model_id = 'NousResearch/Nous-Hermes-13b' # Requires ~ 23GB VRAM.
# Using STransformers alongside will 100% create OOM on 24GB cards.
#LLM = load_model(device_type=DEVICE_TYPE, model_id=model_id)
#model_id = "TheBloke/Llama-2-7B-Chat-GGML"
#model_basename = "llama-2-7b-chat.ggmlv3.q4_0.bin"

#--------------- GPTQ (quantized) models ---------------#
# model_id = "TheBloke/Nous-Hermes-13B-GPTQ"
# model_basename = "nous-hermes-13b-GPTQ-4bit-128g.no-act.order"
# model_id = "TheBloke/WizardLM-30B-Uncensored-GPTQ"
# model_basename = "WizardLM-30B-Uncensored-GPTQ-4bit.act-order.safetensors"
# Requires ~21GB VRAM. Using STransformers alongside can potentially create OOM on 24GB cards.
# model_id = "TheBloke/wizardLM-7B-GPTQ"
# model_basename = "wizardLM-7B-GPTQ-4bit.compat.no-act-order.safetensors"
# model_id = "TheBloke/WizardLM-7B-uncensored-GPTQ"
# model_basename = "WizardLM-7B-uncensored-GPTQ-4bit-128g.compat.no-act-order.safetensors"
model_id = "TheBloke/Llama-2-7B-Chat-GGML"
model_basename = "llama-2-7b-chat.ggmlv3.q4_0.bin"


# Loading the model using the load_model function
LLM = load_model(device_type=DEVICE_TYPE, model_id=model_id, model_basename=model_basename)

# This is the prompt template structure for LLama2 model
template = """
Use only the following pieces of context to find answer to the question at the end. If you don't know the answer,
just say that you don't know, don't try to make up an answer.\n

{context}\n

{history}\n 

Question : {question}
Helpful Answer:
"""

# Initialize PromptTemplate object named prompt
prompt = PromptTemplate(input_variables=["history", "context", "question"], template=template)

# here is the memory buffer to recognize the history for the conversation
memory = ConversationBufferMemory(input_key="question", memory_key="history")

# Creating an instance of RetrievalQA class using the from_chain_type method
QA = RetrievalQA.from_chain_type(
    llm=LLM,
    chain_type="stuff", 
    retriever=RETRIEVER,
    return_source_documents=SHOW_SOURCES,
    chain_type_kwargs={"prompt": prompt, "memory": memory},
)


app = Flask(__name__)

@app.route("/api/delete_source", methods=["GET"])
def delete_source_route():
    folder_name = "SOURCE_DOCUMENTS"

    if os.path.exists(folder_name):
        shutil.rmtree(folder_name)

    os.makedirs(folder_name)

    return jsonify({"message": f"Folder '{folder_name}' successfully deleted and recreated."})


@app.route("/api/save_document", methods=["GET", "POST"])
def save_document_route():
    if "document" not in request.files:
        return "No document part", 400
    file = request.files["document"]
    if file.filename == "":
        return "No selected file", 400
    if file:
        filename = secure_filename(file.filename)
        folder_path = "SOURCE_DOCUMENTS"
        if not os.path.exists(folder_path):
            os.makedirs(folder_path)
        file_path = os.path.join(folder_path, filename)
        file.save(file_path)
        return "File saved successfully", 200


@app.route('/api/convert_to_pdf', methods=['POST','GET'])
def convert_to_pdf():
    """
    Converts the content from the JSON payload into a PDF file with the id as the filename.
    Saves the PDF file in the "./SOURCE_DOCUMENTS" directory.
    Returns a JSON response with the original content.
    """

    try:
        request_data = request.get_json()

        content_data = request_data.get('content')
        id = request_data.get('id')

        # Convert content to PDF
        pdf_file_path = os.path.join('./SOURCE_DOCUMENTS', f'{id}.pdf')

        # Save PDF file with id as the filename in "./SOURCE_DOCUMENTS"
        pdfkit.from_string(content_data, pdf_file_path)

        
        return jsonify(f"successfully convert content with ID:{id} to PDF "), 201
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500




@app.route("/api/run_ingest", methods=["GET"])
def run_ingest_route():
    """
    Runs the ingest process.
    Deletes the "PERSIST_DIRECTORY" if it exists.
    Executes the "ingest.py" script with optional arguments based on "DEVICE_TYPE".
    Returns an error message if the script execution fails.
    Loads the vectorstore, retriever, and QA models from the persist directory if successful.
    """

    global DB
    global RETRIEVER
    global QA
    try:
        # Check if persist directory exists and delete if it does
        if os.path.exists(PERSIST_DIRECTORY):
            try:
                shutil.rmtree(PERSIST_DIRECTORY)
            except OSError as e:
                print(f"Error: {e.filename} - {e.strerror}.")
        else:
            print("The directory does not exist")

        # Run ingest.py script with optional arguments based on device_type
        run_langest_commands = ["python", "ingest.py"]
        if DEVICE_TYPE == "cpu":
            run_langest_commands.append("--device_type")
            run_langest_commands.append(DEVICE_TYPE)
        result = subprocess.run(run_langest_commands, capture_output=True)

        # If script execution fails, return error message
        if result.returncode != 0:
            return "Ingesting Script execution failed: {}".format(result.stderr.decode("utf-8")), 500
        
        # Load vectorstore, retriever, and QA models from persist directory
        DB = Chroma(
            persist_directory=PERSIST_DIRECTORY,
            embedding_function=EMBEDDINGS,
            client_settings=CHROMA_SETTINGS,
        )
        RETRIEVER = DB.as_retriever()

        QA = RetrievalQA.from_chain_type(
            llm=LLM, 
            chain_type="stuff", 
            retriever=RETRIEVER, 
            return_source_documents=SHOW_SOURCES,
            chain_type_kwargs={"prompt": prompt, "memory": memory},
        )
        return "Ingesting Script executed successfully: "
    except Exception as e:
        return f"Error occurred:"


@app.route("/api/prompt_route", methods=["GET", "POST"])
def prompt_route():
    """
    Accepts a user prompt as a JSON payload.
    Passes the user prompt to the QA model to get an answer.
    Returns a JSON response with the user prompt and the answer.
    Option to print out source documents used in the answer.
    """

    global QA
    user_prompt = request.get_json().get("user_prompt")

    if user_prompt:
        print(f'User Prompt: {user_prompt}')
        # Get the answer from the chain
        res = QA(user_prompt)
        answer, docs = res["result"], res["source_documents"]
        
        prompt_response_dict  = {
            "Prompt": user_prompt,
            "Answer": answer,
        }
        prompt_response_dict["Sources"] = []
        for document in docs:
            prompt_response_dict["Sources"].append(
                (os.path.basename(str(document.metadata["source"])), str(document.page_content))
            )
        
        return jsonify(prompt_response_dict), 200
        
    else:
        return "No user prompt received", 400
    


@app.route("/api/prompt_ui_route", methods=["GET", "POST"])
def prompt_ui_route():
    """
    Accepts a user prompt as a JSON payload.
    Passes the user prompt to the QA model to get an answer.
    Returns a JSON response with the user prompt and the answer.
    Option to print out source documents used in the answer.
    """

    global QA
    user_prompt = request.form.get("user_prompt")

    if user_prompt:
        print(f'User Prompt: {user_prompt}')
        # Get the answer from the chain
        res = QA(user_prompt)
        answer, docs = res["result"], res["source_documents"]
        
        prompt_response_dict  = {
            "Prompt": user_prompt,
            "Answer": answer,
        }
        prompt_response_dict["Sources"] = []
        for document in docs:
            prompt_response_dict["Sources"].append(
                (os.path.basename(str(document.metadata["source"])), str(document.page_content))
            )
        
        return jsonify(prompt_response_dict), 200
        
    else:
        return "No user prompt received", 400


if __name__ == '__main__':
    logging.basicConfig(
        format="%(asctime)s - %(levelname)s - %(filename)s:%(lineno)s - %(message)s", level=logging.INFO
    )
    app.run(debug=True, port=5000)
