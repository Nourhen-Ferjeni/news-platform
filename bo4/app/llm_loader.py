import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from config import LLM_MODEL_PATH

class LLMLoader:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(LLMLoader, cls).__new__(cls)
            cls._instance.model = None
            cls._instance.tokenizer = None
        return cls._instance

    def load_model(self):
        """Loads the Llama3 model and tokenizer if they haven't been loaded yet."""
        if self.model is None or self.tokenizer is None:
            try:
                quantization_config = BitsAndBytesConfig(
                    load_in_4bit=True,
                    bnb_4bit_compute_dtype=torch.bfloat16
                )
                self.tokenizer = AutoTokenizer.from_pretrained(LLM_MODEL_PATH)
                self.model = AutoModelForCausalLM.from_pretrained(
                    LLM_MODEL_PATH,
                    quantization_config=quantization_config,
                    device_map="auto"
                )
                print("LLM model (Llama3) and tokenizer loaded successfully with 4-bit quantization.")
            except Exception as e:
                print(f"Error loading LLM model: {e}")
                self.model = None
                self.tokenizer = None


# Singleton instance
llm_loader = LLMLoader()
