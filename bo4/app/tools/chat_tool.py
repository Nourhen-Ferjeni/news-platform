from ctransformers import AutoModelForCausalLM
from config import TINYLLAMA_MODEL_PATH

class ChatTool:
    def __init__(self):
        """
        Initializes the Casual Chat Tool with the TinyLlama model.
        """
        try:
            self.llm = AutoModelForCausalLM.from_pretrained(
                ".",
                model_file=TINYLLAMA_MODEL_PATH,
                model_type="llama",
                gpu_layers=5,
            )
            print("Chat model (TinyLlama) loaded successfully.")
        except Exception as e:
            print(f"Error loading chat model: {e}")
            self.llm = None

    def run(self, user_input: str, history: list) -> str:
        """
        Runs the casual chat model.

        Args:
            user_input (str): The latest message from the user.
            history (list): The conversation history.

        Returns:
            str: The model's response.
        """
        if not self.llm:
            return "The chat model is not available."

        # Format the conversation history for the model
        prompt = ""
        for msg in history:
            if msg.type == "human":
                prompt += f"user: {msg.content}\n"
            elif msg.type == "ai":
                prompt += f"assistant: {msg.content}\n"
        
        prompt += f"user: {user_input}\nassistant:"
        
        response = self.llm(prompt, max_new_tokens=10, temperature=0.7)
        
        return response
