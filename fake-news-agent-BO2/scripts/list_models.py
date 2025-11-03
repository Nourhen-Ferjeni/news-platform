# scripts/list_models.py
import google.generativeai as genai
from config import GEMINI_API_KEY

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    models = genai.list_models()
    for model in models:
        print(f"Name: {model.name}")
        print(f"Supported methods: {model.supported_generation_methods}")
        print("---")