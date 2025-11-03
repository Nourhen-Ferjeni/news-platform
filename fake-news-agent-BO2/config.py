# config.py
import os
from dotenv import load_dotenv

# Load variables from .env
load_dotenv()

# === API KEYS ===
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
SERPAPI_API_KEY = os.getenv("SERPAPI_API_KEY")
NEWSAPI_KEY = os.getenv("NEWSAPI_KEY")

# === App info ===
APP_NAME = "AI Fact-Checking System with LangChain"
VERSION = "4.0"

# === Model config ===
MODEL_NAME = "gemini-2.0-flash"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

# === RAG / embedding settings ===
TOP_K_WEB = 3
TOP_K_NEWS = 2
VECTOR_DB_PATH = "data/embeddings/faiss.index"
METADATA_DB_PATH = "data/embeddings/metadata.pkl"
MEMORY_DB_PATH = "data/memory.db"
EMBEDDING_DIM = 384

# === FAISS Configuration ===
FAISS_INDEX_TYPE = "IndexFlatIP"
SIMILARITY_THRESHOLD = 0.85

# === LangChain Settings ===
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200
RETRIEVAL_TOP_K = 5

DEBUG = os.getenv("DEBUG", "False").lower() == "true"