import os
import pdfkit
from flask import Flask, jsonify, request
app= Flask(__name__)






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

        return jsonify(response_data), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500














# main driver function
if __name__ == '__main__':
    app.run(debug=True, port=5000)