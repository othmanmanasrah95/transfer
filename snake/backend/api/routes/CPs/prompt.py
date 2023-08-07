import requests
import sys

x = " what is python "
main_prompt_url = "http://localhost:5110/api/prompt_route"
response = requests.post(main_prompt_url, data={"user_prompt": x})
print(response.status_code)  # print HTTP response status code for debugging