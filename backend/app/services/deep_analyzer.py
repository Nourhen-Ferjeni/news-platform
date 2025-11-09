import torch
import re
import wikipediaapi
import chromadb
from sentence_transformers import SentenceTransformer
from transformers import BertTokenizerFast, BertForTokenClassification, AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from ..config import NER_MODEL_PATH, LLM_MODEL_PATH, WIKIPEDIA_USER_AGENT
import json
import nltk
from nltk.tokenize import word_tokenize, sent_tokenize
from transformers import pipeline

torch.backends.cudnn.benchmark = True
torch.backends.cuda.matmul.allow_tf32 = True
class AnalysisTool:
    """
    A tool that performs Named Entity Recognition (NER), enriches the
    entities with information from Wikipedia, and generates a final analysis using an LLM.
    """
    def __init__(self, ner_model, ner_tokenizer, llm_model, llm_tokenizer, generator, device, has_gpu):
        print("Initializing AnalysisTool with pre-loaded models...")
        
        # --- Use Pre-loaded Models ---
        self.ner_model = ner_model
        self.ner_tokenizer = ner_tokenizer
        self.llm_model = llm_model
        self.llm_tokenizer = llm_tokenizer
        self.generator = generator
        self.device = device
        self.has_gpu = has_gpu

        # --- Initialize RAG Components ---
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        db_path = "rag_db"
        self.db_client = chromadb.PersistentClient(path=db_path)
        self.db_collection = self.db_client.get_or_create_collection(name="entity_documents")
        self.wiki_api = wikipediaapi.Wikipedia(language='en', user_agent=WIKIPEDIA_USER_AGENT)
        try:
            nltk.download("punkt")
            nltk.download("punkt_tab")
        except Exception as e:
            print(f"Could not download nltk punkt: {e}")
        print(f"RAG components initialized with ChromaDB at '{db_path}'.")

        print("AnalysisTool initialization complete.")

    def _extract_entities(self, article_text):
        sentences = sent_tokenize(article_text)
        entities = {"persons": [], "locations": [], "organizations": []}

        for sent in sentences:
            tokens = word_tokenize(sent)
            if not tokens:
                continue
            tokenized_inputs = self.ner_tokenizer(
                tokens,
                return_tensors="pt",
                truncation=True,
                is_split_into_words=True,
                padding=True
            ).to(self.device)

            with torch.no_grad():
                outputs = self.ner_model(**tokenized_inputs)

            predictions = torch.argmax(outputs.logits, dim=-1).squeeze().tolist()
            if isinstance(predictions, int):
                predictions = [predictions]

            word_ids = tokenized_inputs.word_ids(0)

            previous_word_idx = None
            current_entity = []
            current_label = None

            for idx, word_idx in enumerate(word_ids):
                if word_idx is None or word_idx == previous_word_idx:
                    continue
                
                if idx >= len(predictions):
                    continue

                label = self.ner_model.config.id2label[predictions[idx]]
                word = tokens[word_idx]
                previous_word_idx = word_idx

                if label.startswith("B-"):
                    if current_entity and current_label:
                        entity_text = " ".join(current_entity)
                        if current_label == "per":
                            entities["persons"].append(entity_text)
                        elif current_label in ["geo", "loc"]:
                            entities["locations"].append(entity_text)
                        elif current_label == "org":
                            entities["organizations"].append(entity_text)
                    current_entity = [word]
                    current_label = label[2:].lower()
                elif label.startswith("I-") and current_entity:
                    current_entity.append(word)
                else:
                    if current_entity and current_label:
                        entity_text = " ".join(current_entity)
                        if current_label == "per":
                            entities["persons"].append(entity_text)
                        elif current_label in ["geo", "loc"]:
                            entities["locations"].append(entity_text)
                        elif current_label == "org":
                            entities["organizations"].append(entity_text)
                    current_entity = []
                    current_label = None

            if current_entity and current_label:
                entity_text = " ".join(current_entity)
                if current_label == "per":
                    entities["persons"].append(entity_text)
                elif current_label in ["geo", "loc"]:
                    entities["locations"].append(entity_text)
                elif current_label == "org":
                    entities["organizations"].append(entity_text)

        for k in entities:
            entities[k] = list(set(entities[k]))

        return entities

    def _enrich_entities(self, entities):
        enriched_data = {}
        all_entities = entities.get("persons", []) + entities.get("locations", []) + entities.get("organizations", [])
        
        for entity in all_entities:
            results = self.db_collection.get(ids=[entity])
            
            if results['documents']:
                print(f"Found '{entity}' in the database.")
                enriched_data[entity] = { "summary": results['documents'][0], "url": "" }
            else:
                print(f"'{entity}' not found in the database. Fetching from Wikipedia.")
                clean_entity = re.sub(r'^(President|Prime Minister|King|Queen|Senator|Governor)\s+', '', entity).strip()
                page = self.wiki_api.page(clean_entity)
                
                if page.exists():
                    summary = " ".join(sent_tokenize(page.summary)[:2])
                    enriched_data[entity] = { "summary": summary, "url": page.fullurl }
                    self.db_collection.add(ids=[entity], documents=[summary])
                else:
                    enriched_data[entity] = { "summary": f"No information found for '{entity}'.", "url": "" }
        return enriched_data

    def _generate_analysis(self, article_text, enriched_data):
        analysis_start = "<start_analysis>"
        analysis_end = "</end_analysis>"
        system_prompt = f"""You are an analyst given an article and associated entities.
Analyze the article and produce:
- Concise Summary: A brief overview.
- Expanded Analysis: A deeper analysis.
- Impact Forecast: List impacts with type, horizon (SHORT_TERM/MEDIUM_TERM/LONG_TERM), magnitude (LOW/MEDIUM/HIGH), probability (0-1), and rationale.
- Scenarios: List possible outcomes with probability (0-1) and description.
- Confidence: Overall confidence score (0-1).
- Evidence Refs: List of reference IDs.

Place your full analysis between {analysis_start} and {analysis_end}.
Output in plain text with sections like 'Concise Summary:', 'Impact Forecast:', etc."""

        ent_str = "Associated Entities:\n"
        for name, data in enriched_data.items():
            ent_str += f"- Name: {name}, Profile: {data['summary']}\n"
        user_prompt = f"""{ent_str}\nArticle Text: {article_text}\n\nAnalyze this article."""

        prompt = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        if not self.llm_tokenizer or not self.llm_model:
            if not self.has_gpu:
                return "LLM analysis skipped: No GPU available."
            return "LLM model or tokenizer not available."

        prompt_text = self.llm_tokenizer.apply_chat_template(prompt, tokenize=False, add_generation_prompt=True)
        outputs = self.generator(prompt_text, max_new_tokens=1024, do_sample=False, pad_token_id=self.llm_tokenizer.eos_token_id)
        generated_text = outputs[0]['generated_text'][len(prompt_text):]
        
        match = re.search(rf"{re.escape(analysis_start)}\s*(.+?)\s*{re.escape(analysis_end)}", generated_text, re.DOTALL | re.IGNORECASE)
        if match:
            return match.group(1).strip()
        else:
            return f"Raw Generated Output (no tags found):\n{generated_text}"

    def run(self, article_text: str) -> str:
        """
        Executes the full analysis pipeline.
        """
        print("\n--- Running Analysis Pipeline ---")
        entities = self._extract_entities(article_text)
        print(f"Extracted Entities: {json.dumps(entities, indent=2)}")
        
        enriched_data = self._enrich_entities(entities)
        print("Enriched Entity Data.")
        
        analysis = self._generate_analysis(article_text, enriched_data)
        print("Generated Analysis.")
        
        return analysis
