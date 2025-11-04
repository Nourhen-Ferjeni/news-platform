from typing import List, TypedDict, Optional
from langchain_core.messages import BaseMessage

class AgentState(TypedDict):
    """
    Represents the state of our LangGraph agent.
    """
    # The conversation history
    messages: List[BaseMessage]
    
    # The current news article being discussed, if any
    current_article: Optional[str]
    
    # The topic extracted by the router for news fetching
    current_topic: Optional[str]
