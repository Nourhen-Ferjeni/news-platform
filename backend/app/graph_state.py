from typing import List, Optional
from langchain_core.messages import BaseMessage
from typing_extensions import TypedDict

class AgentState(TypedDict):
    messages: List[BaseMessage]
    current_article: Optional[str]
    current_topic: Optional[str]
    next_node: Optional[str]
