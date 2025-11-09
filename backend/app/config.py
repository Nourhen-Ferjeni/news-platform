# config.py
import os
from dotenv import load_dotenv

# Load variables from .env
load_dotenv()

# === API KEYS ===
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
print(f"Loaded GEMINI_API_KEY: {GEMINI_API_KEY}")  # Temporary print for verification
SERPAPI_API_KEY = os.getenv("SERPAPI_API_KEY")
NEWSAPI_KEY = os.getenv("NEWSAPI_KEY")
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")

# === RAG / embedding settings ===
VECTOR_DB_PATH = "data/embeddings/faiss.index"
METADATA_DB_PATH = "data/embeddings/metadata.pkl"
EMBEDDING_DIM = 384
SIMILARITY_THRESHOLD = 0.85

# === LangChain Settings ===
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200

# === Analysis Tool Settings ===
NER_MODEL_PATH = "backend/app/models/bert_ner_news_finetuned_ner"
LLM_MODEL_PATH = "backend/app/models/llama-3-reasoning-16bit"
WIKIPEDIA_USER_AGENT = "MyNewsApp/1.0 (myemail@example.com)"
