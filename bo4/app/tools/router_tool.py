import torch
import json
import re
from transformers import AutoTokenizer, AutoModelForCausalLM
from config import ROUTER_MODEL_PATH

class RouterTool:
    def __init__(self):
        """
        Initializes the Router Tool with a Gemma model for intent classification.
        """
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(ROUTER_MODEL_PATH)
            self.model = AutoModelForCausalLM.from_pretrained(
                ROUTER_MODEL_PATH,
                torch_dtype=torch.bfloat16  # Use dtype=torch.bfloat16 for newer versions
            )
            print("Router model (Gemma) loaded successfully.")
        except Exception as e:
            print(f"Error loading router model: {e}")
            self.model = None
            self.tokenizer = None

    def _create_router_prompt(self, user_input: str) -> str:
        """Creates a direct prompt for the model to classify intent and extract a topic."""
        return f"""<bos>You are a router that classifies user intent and extracts topics. Output ONLY a valid JSON like {{"intent": "chat", "topic": "None"}}. No other text.

Examples:
User: "Hello, how are you?" -> {{"intent": "chat", "topic": "None"}}
User: "Fetch news about AI" -> {{"intent": "fetch_news", "topic": "AI"}}
User: "Analyze this article" -> {{"intent": "analyze", "topic": "None"}}

User: "{user_input}"
{{"intent": "", "topic": ""}}"""

    def run(self, user_input: str) -> dict:
        """
        Determines the user's intent and extracts the topic using rules first, then the Gemma model as fallback.
        Returns a dictionary with "intent" and "topic".
        """
        if not self.model or not self.tokenizer:
            return {"intent": "chat", "topic": "None"}

        user_input_lower = user_input.lower().strip()

        # Rule-based routing for common cases (hybrid approach for reliability)
        if any(phrase in user_input_lower for phrase in ['fetch news', 'get news', 'news about', 'find news']):
            topic_match = re.search(r'(?:about|on)\s+([^\s.?!]+)', user_input_lower)
            topic = topic_match.group(1).capitalize() if topic_match else "general"
            print(f"Rule-based: Detected fetch_news with topic '{topic}'")
            return {"intent": "fetch_news", "topic": topic}
        
        elif any(word in user_input_lower for word in ['analyze', 'analyse', 'break down', 'summarize article']):
            print("Rule-based: Detected analyze")
            return {"intent": "analyze", "topic": "None"}
        
        # Fallback to model for ambiguous/chat cases
        print("Falling back to model for routing...")
        prompt = self._create_router_prompt(user_input)
        inputs = self.tokenizer(prompt, return_tensors="pt")

        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=30,  # Shorter to force quick JSON
                temperature=0.1,    # Low for less randomness
                top_p=0.9,          # Nucleus sampling
                do_sample=True,
                pad_token_id=self.tokenizer.eos_token_id,
                repetition_penalty=1.1  # Discourage loops
            )
        result = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        print(f"Raw model output for user input '{user_input}':\n---\n{result}\n---")
        
        # Better JSON extraction with regex
        try:
            # Look for {"intent": "...", "topic": "..."} anywhere in the output
            json_match = re.search(
                r'\{["\s]*"intent"["\s]*:["\s]*["\']?(\w+)["\']?["\s]*,[ "\s]*"topic"["\s]*:["\s]*["\']?([^"\}]+)["\']?["\s]*\}',
                result,
                re.IGNORECASE
            )
            if json_match:
                intent = json_match.group(1).strip().lower()
                topic = json_match.group(2).strip().strip('"\'')
                if intent in ['chat', 'fetch_news', 'analyze']:
                    parsed = {"intent": intent, "topic": topic if topic.lower() != "none" else "None"}
                    print(f"Parsed from model: {parsed}")
                    return parsed
            
            # If regex fails, try simple json.loads on potential snippets
            json_start = result.find('{')
            if json_start != -1:
                json_end = result.find('}', json_start) + 1
                if json_end > json_start:
                    json_part = result[json_start:json_end]
                    parsed_json = json.loads(json_part)
                    if isinstance(parsed_json, dict) and parsed_json.get("intent") in ['chat', 'fetch_news', 'analyze']:
                        print(f"Parsed from snippet: {parsed_json}")
                        return parsed_json
        except (json.JSONDecodeError, IndexError) as e:
            print(f"JSON parsing failed: {e}")
        
        # Ultimate fallback
        print("Model parsing failed, defaulting to chat")
        return {"intent": "chat", "topic": "None"}
