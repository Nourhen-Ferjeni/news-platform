import torch
import json
import re
from app.llm_loader import llm_loader
from transformers import pipeline
from json_repair import repair_json  # pip install json-repair if not installed

class RouterTool:
    def __init__(self):
        """
        Initializes the Router Tool with the shared Llama3 model.
        """
        llm_loader.load_model()
        self.model = llm_loader.model
        self.tokenizer = llm_loader.tokenizer
        if self.model and self.tokenizer:
            self.generator = pipeline("text-generation", model=self.model, tokenizer=self.tokenizer)
        else:
            self.generator = None

    def _create_router_prompt(self, history: list) -> str:
        """Returns a formatted prompt using Llama 3's chat template for better compliance."""
        messages = []
        for msg in history[-4:]:  # Use up to last 4 messages for better context
            role = "user" if msg.type == "human" else "assistant"
            messages.append({"role": role, "content": msg.content})
        
        # Add system prompt for strict JSON output
        messages.insert(0, {
            "role": "system",
            "content": """You are a precise router. Analyze the full conversation to classify intent ("fetch_news", "analyze", or "chat") and extract topic (the news subject from context, or "None" if unclear).
            
            Rules:
            - Output ONLY valid JSON: {"intent": "exact_value", "topic": "exact_value"}. Nothing else—no explanations, no text.
            - Intent: "fetch_news" for news requests (e.g., "get articles on X" or "news about it"), "analyze" for article breakdowns (e.g., "analyze this"), "chat" for general talk.
            - Topic: Specific subject from recent context (e.g., if prior message mentions "london" and now "news about it", use "london"); use "None" otherwise.
            
            Examples:
            <|start_header_id|>user<|end_header_id|>
            lets talk about london<|eot_id|>
            <|start_header_id|>assistant<|end_header_id|>
            {"intent": "chat", "topic": "london"}<|eot_id|>
            
            <|start_header_id|>user<|end_header_id|>
            lets talk about london<|eot_id|>
            <|start_header_id|>assistant<|end_header_id|>
            Sure, what's on your mind about london?<|eot_id|>
            <|start_header_id|>user<|end_header_id|>
            fetch news about it<|eot_id|>
            <|start_header_id|>assistant<|end_header_id|>
            {"intent": "fetch_news", "topic": "london"}<|eot_id|>
            
            <|start_header_id|>user<|end_header_id|>
            analyze this article<|eot_id|>
            <|start_header_id|>assistant<|end_header_id|>
            {"intent": "analyze", "topic": "None"}<|eot_id|>
            
            <|start_header_id|>user<|end_header_id|>
            Hello<|eot_id|>
            <|start_header_id|>assistant<|end_header_id|>
            {"intent": "chat", "topic": "None"}<|eot_id|>"""
        })
        
        # Apply Llama 3 chat template - do not append extra after this
        formatted_prompt = self.tokenizer.apply_chat_template(
            messages, 
            tokenize=False, 
            add_generation_prompt=True
        )
        
        return formatted_prompt

    def _extract_json_from_generation(self, result: str) -> dict:
        """Extract and parse JSON from the generated part only."""
        # Find the start of the current assistant generation
        assistant_start_marker = '<|start_header_id|>assistant<|end_header_id|>\n'
        assistant_start = result.rfind(assistant_start_marker)
        if assistant_start != -1:
            gen_part = result[assistant_start + len(assistant_start_marker):].strip()
        else:
            gen_part = result.strip()
        
        print(f"Generated part: {gen_part[:200]}...")  # Debug: first 200 chars
        
        # Find potential JSON in generated part
        json_matches = re.findall(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', gen_part)
        if json_matches:
            json_str = json_matches[-1]  # Take the last one
        else:
            json_str = None
        
        if not json_str:
            return None
        
        try:
            fixed_json = repair_json(json_str)
            parsed = json.loads(fixed_json)
            if isinstance(parsed, dict) and parsed.get("intent") in ["fetch_news", "analyze", "chat"]:
                topic = parsed.get("topic", "None")
                return {"intent": parsed["intent"].lower(), "topic": topic if topic.lower() != "none" else "None"}
        except (json.JSONDecodeError, KeyError) as e:
            print(f"JSON extraction error: {e}")
        
        return None

    def run(self, history: list) -> dict:
        """
        Determines the user's intent and extracts the topic using the model (no rule-based to handle context better).
        Returns a dictionary with "intent" and "topic".
        """
        if not self.generator:
            return {"intent": "chat", "topic": "None"}
        
        # Full reliance on model for context-aware routing
        print("Routing via model (context-aware)...")
        prompt = self._create_router_prompt(history)
        
        # Generate with tuned params for determinism (remove temperature when do_sample=False to avoid warning)
        outputs = self.generator(
            prompt,
            max_new_tokens=50,      # Enough for JSON
            top_p=1.0,              # Full nucleus
            do_sample=False,        # Greedy decoding
            pad_token_id=self.tokenizer.eos_token_id,
            eos_token_id=self.tokenizer.eos_token_id,
            repetition_penalty=1.05 # Mild anti-repetition
        )
        result = outputs[0]['generated_text']
        print(f"Raw model output for user input '{history[-1].content}':\n---\n{result[-300:]}\n---")  # Last 300 for brevity
        
        # Extract from generation
        parsed = self._extract_json_from_generation(result)
        if parsed:
            print(f"Parsed from model: {parsed}")
            return parsed
        
        # Retry once with simpler prompt (just classify this input, but keep some context)
        print("Initial parse failed, retrying with single-turn prompt...")
        retry_messages = [
            {"role": "system", "content": """You are a precise router. Classify intent ("fetch_news", "analyze", or "chat") and extract topic from the message (use "None" if unclear). Output ONLY JSON: {"intent": "...", "topic": "..."}"""},
            {"role": "user", "content": " ".join([msg.content for msg in history[-2:]]) }  # Last 2 for minimal context
        ]
        retry_prompt = self.tokenizer.apply_chat_template(
            retry_messages, tokenize=False, add_generation_prompt=True
        )
        retry_outputs = self.generator(
            retry_prompt,
            max_new_tokens=30,
            do_sample=False,
            pad_token_id=self.tokenizer.eos_token_id,
            eos_token_id=self.tokenizer.eos_token_id,
        )
        retry_result = retry_outputs[0]['generated_text']
        retry_parsed = self._extract_json_from_generation(retry_result)
        if retry_parsed:
            print(f"Parsed from retry: {retry_parsed}")
            return retry_parsed
        
        # Ultimate fallback
        print("Model parsing failed, defaulting to chat")
        return {"intent": "chat", "topic": "None"}