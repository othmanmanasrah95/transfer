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

DEVICE_TYPE = "cpu"
SHOW_SOURCES = True
logging.info(f"Running on: {DEVICE_TYPE}")
logging.info(f"Display Source Documents set to: {SHOW_SOURCES}")

# EMBEDDINGS = HuggingFaceInstructEmbeddings(model_name=EMBEDDING_MODEL_NAME, model_kwargs={"device": DEVICE_TYPE})

# uncomment the following line if you used HuggingFaceEmbeddings in the ingest.py
EMBEDDINGS = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)
if os.path.exists(PERSIST_DIRECTORY):
    try:
        shutil.rmtree(PERSIST_DIRECTORY)
    except OSError as e:
        print(f"Error: {e.filename} - {e.strerror}.")
else:
    print("The directory does not exist")

run_langest_commands = ["python", "ingest.py"]
if DEVICE_TYPE == "cpu":
    run_langest_commands.append("--device_type")
    run_langest_commands.append(DEVICE_TYPE)

result = subprocess.run(run_langest_commands, capture_output=True)
if result.returncode != 0:
    raise FileNotFoundError(
        "No files were found inside SOURCE_DOCUMENTS, please put a starter file inside before starting the API!"
    )

# load the vectorstore
DB = Chroma(
    persist_directory=PERSIST_DIRECTORY,
    embedding_function=EMBEDDINGS,
    client_settings=CHROMA_SETTINGS,
)

RETRIEVER = DB.as_retriever()

# for HF models
# model_id = "TheBloke/vicuna-7B-1.1-HF"
# model_id = "TheBloke/Wizard-Vicuna-7B-Uncensored-HF"
# model_id = "TheBloke/wizardLM-7B-HF"
#model_id = "TheBloke/guanaco-7B-HF"
# model_id = 'NousResearch/Nous-Hermes-13b' # Requires ~ 23GB VRAM.
# Using STransformers alongside will 100% create OOM on 24GB cards.

#LLM = load_model(device_type=DEVICE_TYPE, model_id=model_id)
#model_id = "TheBloke/Llama-2-7B-Chat-GGML"
#model_basename = "llama-2-7b-chat.ggmlv3.q4_0.bin"
# for GPTQ (quantized) models
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


# This is the prompt template structure for LLama2 model
template = """ [INST] <<SYS>>
User the following pieces of context only to find answer to the question at the end. If you don't know the answer,\
just say that you don't know, don't try to make up an answer.

<</SYS>>

{context}

{history}

{question}

[/INST]
"""
prompt = PromptTemplate(input_variables=["history", "context", "question"], template=template)


# here is the memory buffer to recognize the history for the conversation
memory = ConversationBufferMemory(input_key="question", memory_key="history")

LLM = load_model(device_type=DEVICE_TYPE, model_id=model_id, model_basename=model_basename)

QA = RetrievalQA.from_chain_type(
    llm=LLM,
    chain_type="stuff", 
    retriever=RETRIEVER,
    return_source_documents=SHOW_SOURCES,
    chain_type_kwargs={"prompt": prompt, "memory": memory},
)

app = Flask(__name__)


@app.route('/', methods=['POST','GET'])
def convert_to_pdf():
    try:
        request_data = request.get_json()

        content_data = request_data.get('content')
        id = request_data.get('id')
        

        cont_data = {
            'content': content_data
        }
        
        pdf_file_path = os.path.join('./SOURCE_DOCUMENTS', f'{id}.pdf')
        pdfkit.from_string(content_data, pdf_file_path)
        print("convert done !!!")
        return jsonify(cont_data), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route("/api/run_ingest", methods=["GET"])
def run_ingest_route():
    global DB
    global RETRIEVER
    global QA
    try:
        if os.path.exists(PERSIST_DIRECTORY):
            try:
                shutil.rmtree(PERSIST_DIRECTORY)
            except OSError as e:
                print(f"Error: {e.filename} - {e.strerror}.")
        else:
            print("The directory does not exist")

        run_langest_commands = ["python", "ingest.py"]
        if DEVICE_TYPE == "cpu":
            run_langest_commands.append("--device_type")
            run_langest_commands.append(DEVICE_TYPE)
            
        result = subprocess.run(run_langest_commands, capture_output=True)
        if result.returncode != 0:
            return "Script execution failed: {}".format(result.stderr.decode("utf-8")), 500
        # load the vectorstore
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
            return_source_documents=SHOW_SOURCES
        )
        return "Script executed successfully: "
    except Exception as e:
        return f"Error occurred:"


@app.route("/api/prompt_route", methods=["GET", "POST"])
def prompt_route():
    global QA
    user_prompt = request.get_json().get("user_prompt")

    if user_prompt:
        print(f'User Prompt: {user_prompt}')
        # Get the answer from the chain
        res = QA(user_prompt)
        answer, docs = res["result"], res["source_documents"]
        
        data = {
            "Prompt": user_prompt,
            "Answer": answer,
        }
        #you can print the resource docs here using for loop 
        print(data)
        return jsonify(data), 200
        
    else:
        print("No user prompt received")
        return "No user prompt received", 400


if __name__ == '__main__':
    logging.basicConfig(
        format="%(asctime)s - %(levelname)s - %(filename)s:%(lineno)s - %(message)s", level=logging.INFO
    )
    app.run(debug=True, port=5000)






