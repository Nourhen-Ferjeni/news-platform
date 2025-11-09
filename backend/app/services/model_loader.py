import torch
from transformers import BertTokenizerFast, BertForTokenClassification, AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig, pipeline
from ..config import NER_MODEL_PATH, LLM_MODEL_PATH

class ModelLoader:
    def __init__(self):
        self.ner_tokenizer = None
        self.ner_model = None
        self.llm_model = None
        self.llm_tokenizer = None
        self.generator = None
        self.device = None
        self.has_gpu = torch.cuda.is_available()

    def load_models(self):
        print("--- Loading all models ---")
        
        # --- Initialize Device ---
        if self.has_gpu:
            self.device = torch.device("cuda")
            print("GPU is available. Using CUDA.")
        else:
            self.device = torch.device("cpu")
            print("GPU not available. Using CPU for NER.")

        # --- Initialize NER Model ---
        try:
            print("Loading NER model...")
            self.ner_tokenizer = BertTokenizerFast.from_pretrained(NER_MODEL_PATH)
            self.ner_model = BertForTokenClassification.from_pretrained(NER_MODEL_PATH)
            self.ner_model.to(self.device)
            self.ner_model.eval()
            print("NER model loaded successfully.")
        except Exception as e:
            print(f"Error loading NER model: {e}")

        # --- Initialize Analysis LLM ---
        if self.has_gpu:
            try:
                print("Loading Analysis LLM in 4-bit for GPU...")
                quantization_config = BitsAndBytesConfig(load_in_4bit=True)
                self.llm_tokenizer = AutoTokenizer.from_pretrained(LLM_MODEL_PATH)
                self.llm_model = AutoModelForCausalLM.from_pretrained(
                    LLM_MODEL_PATH,
                    quantization_config=quantization_config,
                    torch_dtype=torch.float16,
                    device_map="auto",
                )
                self.generator = pipeline("text-generation", model=self.llm_model, tokenizer=self.llm_tokenizer)
                print("Analysis LLM loaded successfully in 4-bit.")
            except Exception as e:
                print(f"Error loading Analysis LLM on GPU: {e}")
        else:
            print("Skipping LLM loading as no GPU is available.")
        
        print("--- All models loaded ---")

# Create a single instance of the model loader
model_loader = ModelLoader()
