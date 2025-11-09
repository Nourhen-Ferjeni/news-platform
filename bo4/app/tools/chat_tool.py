from app.llm_loader import llm_loader
from transformers import pipeline

class ChatTool:
    def __init__(self):
        """
        Initializes the Casual Chat Tool with the shared Llama3 model.
        """
        llm_loader.load_model()
        self.model = llm_loader.model
        self.tokenizer = llm_loader.tokenizer
        if self.model and self.tokenizer:
            self.generator = pipeline("text-generation", model=self.model, tokenizer=self.tokenizer)
        else:
            self.generator = None

    def run(self, user_input: str, history: list) -> str:
        """
        Runs the casual chat model.

        Args:
            user_input (str): The latest message from the user.
            history (list): The conversation history.

        Returns:
            str: The model's response.
        """
        if not self.generator:
            return "The chat model is not available."

        # Format the conversation history for the model
        messages = []
        for msg in history:
            if msg.type == "human":
                messages.append({"role": "user", "content": msg.content})
            elif msg.type == "ai":
                messages.append({"role": "assistant", "content": msg.content})
        
        prompt = self.tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        
        outputs = self.generator(prompt, max_new_tokens=50, do_sample=True, temperature=0.7, top_p=0.95)
        
        return outputs[0]['generated_text'][len(prompt):]
