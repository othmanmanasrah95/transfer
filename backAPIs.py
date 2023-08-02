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

# from langchain.embeddings import HuggingFaceEmbeddings
from langchain.llms import HuggingFacePipeline
from run_localGPT import load_model

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

EMBEDDINGS = HuggingFaceInstructEmbeddings(model_name=EMBEDDING_MODEL_NAME, model_kwargs={"device": DEVICE_TYPE})

# uncomment the following line if you used HuggingFaceEmbeddings in the ingest.py
# EMBEDDINGS = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)
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
model_id = "TheBloke/guanaco-7B-HF"
# model_id = 'NousResearch/Nous-Hermes-13b' # Requires ~ 23GB VRAM.
# Using STransformers alongside will 100% create OOM on 24GB cards.

LLM = load_model(device_type=DEVICE_TYPE, model_id=model_id)
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
# model_id = "TheBloke/Llama-2-7B-Chat-GGML"
# model_basename = "llama-2-7b-chat.ggmlv3.q4_0.bin"
# LLM = load_model(device_type=DEVICE_TYPE, model_id=model_id, model_basename=model_basename)

QA = RetrievalQA.from_chain_type(
    llm=LLM, chain_type="stuff", retriever=RETRIEVER, return_source_documents=SHOW_SOURCES
)

app = Flask(__name__)


@app.route('/', methods=['POST','GET'])
def get_prompt_and_content():
    try:
        request_data = request.get_json()

        prompt_data = request_data.get('prompt')
        content_data = request_data.get('content')

        response_data = {
            'prompt': prompt_data,
            'content': content_data,
        }
        
        pdf_file_path = os.path.join('SOURCE_DOCUMENTS', 'content_data.pdf')
        pdfkit.from_string(content_data, pdf_file_path)
        run_ingest_route()
        prompt_route(prompt_data)
        return jsonify(response_data), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# @app.route("/api/run_ingest", methods=["GET"])
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
            llm=LLM, chain_type="stuff", retriever=RETRIEVER, return_source_documents=SHOW_SOURCES
        )
        return "Script executed successfully: {}".format(result.stdout.decode("utf-8"))
    except Exception as e:
        return f"Error occurred: {str(e)}"


# @app.route("/api/prompt_route", methods=["GET", "POST"])
def prompt_route(user_prompt):
    global QA
    if user_prompt:
        # print(f'User Prompt: {user_prompt}')
        # Get the answer from the chain
        res = QA(user_prompt)
        answer, docs = res["result"], res["source_documents"]

        prompt_response_dict = {
            "Prompt": user_prompt,
            "Answer": answer,
        }

        prompt_response_dict["Sources"] = []
        for document in docs:
            prompt_response_dict["Sources"].append(
                (os.path.basename(str(document.metadata["source"])), str(document.page_content))
            )
    else:
        print("No user prompt received")


if __name__ == '__main__':
    app.run(debug=True, port=5000)






