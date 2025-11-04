from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_core.messages import HumanMessage
from .graph_state import AgentState
from .graph import app

# Initialize FastAPI app
fastapi_app = FastAPI()

# Add CORS middleware to allow requests from the frontend
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for development
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# In-memory state for the conversation
# Note: This is a simple in-memory state and will be reset if the server restarts.
# For a production application, you would want a more persistent state management solution.
state = AgentState(messages=[], current_article=None, current_topic=None)

class ChatRequest(BaseModel):
    message: str

@fastapi_app.post("/chat")
async def chat(chat_request: ChatRequest):
    """
    Endpoint to interact with the LangGraph agent.
    """
    global state
    
    # Append the new user message to the state
    state["messages"].append(HumanMessage(content=chat_request.message))
    
    # Invoke the LangGraph app
    final_state = app.invoke(state)
    
    # Get the AI's response and the type of response
    ai_response = final_state['messages'][-1].content
    response_type = final_state.get("next_node", "chat")
    
    # Update the state for the next turn
    state = final_state
    
    return {"reply": ai_response, "type": response_type}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(fastapi_app, host="0.0.0.0", port=8000)
