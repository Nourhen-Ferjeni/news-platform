# -------------------
# CONFIGURATION FILE
# -------------------

# This file contains the configuration for the News Analysis Pipeline.
# Please update the paths to point to your model and data files.

# Path to the fine-tuned BERT model for Named Entity Recognition (NER)
NER_MODEL_PATH = "bo4/models/bert_ner_news_finetuned_ner"

# Path to the fine-tuned Llama 3.2 model for analysis generation
LLM_MODEL_PATH = "bo4/models/llama-3-reasoning-16bit"

# Path to the SLM model for routing
ROUTER_MODEL_PATH = "models/gemma-3-270m" # Using a pre-trained Gemma model from Hugging Face

# Path to the TinyLlama model for chat and routing
TINYLLAMA_MODEL_PATH = "models/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf"

# NewsAPI Key
# Get your free API key from https://newsapi.org/
NEWS_API_KEY = "pub_c86fbbaf78404fe6b54fdf0df62cee2d"

# Path to the JSON file used for caching entity information
ENTITY_CACHE_PATH = "data/entity_cache.json"

# User-Agent for Wikipedia API requests
# It's good practice to identify your application
WIKIPEDIA_USER_AGENT = "NewsAnalysisPipeline/1.0 (your-email@example.com)"

# --- Microservice URLs ---
# These are the URLs the orchestrator will use to communicate with other services.
# When running with Docker Compose, these will be the service names.
NER_SERVICE_URL = "http://ner-service:8000/extract/"
RAG_SERVICE_URL = "http://rag-service:8001/retrieve/"
