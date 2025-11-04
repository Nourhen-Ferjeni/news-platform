import requests
import json

with open('article.txt', 'r') as f:
    article_text = f.read()

data = {'article': article_text}
headers = {'Content-type': 'application/json'}
response = requests.post('http://localhost:8000/analyze/', data=json.dumps(data), headers=headers)

with open('analysis_output.txt', 'w') as f:
    f.write(response.text)
