import sys
import os
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

# Add the root directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.tools.chat_tool import ChatTool

# --- API Setup ---
app = FastAPI()
chat_tool = ChatTool()

class ChatRequest(BaseModel):
    user_input: str
    history: List[dict] = [] # Expects a list of message dicts

@app.post("/chat/")
def run_chat(request: ChatRequest):
    """
    Endpoint to run the casual chat model.
    """
    # Note: The placeholder tool doesn't use history, but a real one would.
    result = chat_tool.run(request.user_input, request.history)
    return {"response": result}

# To run this API:
# uvicorn test_apis.chat_api:app --host 0.0.0.0 --port 8001
