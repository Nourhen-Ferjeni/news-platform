from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, AIMessage
from .graph_state import AgentState
from .tools.analysis_tool import AnalysisTool
from .tools.chat_tool import ChatTool
from .tools.news_fetcher_tool import NewsFetcherTool
from .tools.router_tool import RouterTool

# --- 1. Initialize Tools ---
analysis_tool = AnalysisTool()
chat_tool = ChatTool()
news_fetcher_tool = NewsFetcherTool()
router_tool = RouterTool()

# --- 2. Define Graph Nodes ---
def route_message(state: AgentState):
    """The primary router node."""
    last_message = state['messages'][-1].content
    router_output = router_tool.run(last_message)
    
    intent = router_output.get("intent", "chat")
    topic = router_output.get("topic")
    
    print(f"Router decided: intent='{intent}', topic='{topic}'")
    
    return {
        "next_node": intent,
        "current_topic": topic
    }

def call_chat_tool(state: AgentState):
    """Node for handling casual conversation."""
    last_message = state['messages'][-1].content
    history = state['messages']
    response = chat_tool.run(last_message, history)
    return {"messages": [AIMessage(content=response)]}

def call_news_fetcher_tool(state: AgentState):
    """Node for fetching a news article."""
    topic = state.get('current_topic')
    if not topic or topic == "None":
        response = "You asked for news, but didn't specify a topic. Please try again, for example: 'fetch news about Apple'."
        return {"messages": [AIMessage(content=response)]}
        
    article = news_fetcher_tool.run(topic)
    response = f"I've fetched an article about '{topic}'. You can now ask me to analyze it."
    return {"messages": [AIMessage(content=response)], "current_article": article}

def call_analysis_tool(state: AgentState):
    """Node for running the full analysis pipeline."""
    article = state.get('current_article')
    if not article:
        response = "There is no article to analyze. Please fetch one first by asking for 'news about [topic]'."
        return {"messages": [AIMessage(content=response)]}
    
    analysis_result = analysis_tool.run(article)
    return {"messages": [AIMessage(content=analysis_result)]}

# --- 3. Define Conditional Edges ---
def decide_next_node(state):
    """Conditional logic to route to the correct tool node."""
    return state.get("next_node", "chat")

# --- 4. Build the Graph ---
workflow = StateGraph(AgentState)

workflow.add_node("router", route_message)
workflow.add_node("chat", call_chat_tool)
workflow.add_node("fetch_news", call_news_fetcher_tool)
workflow.add_node("analyze", call_analysis_tool)

workflow.set_entry_point("router")

workflow.add_conditional_edges(
    "router",
    decide_next_node,
    {
        "chat": "chat",
        "fetch_news": "fetch_news",
        "analyze": "analyze",
    }
)

# After a tool is called, the conversation ends for this turn.
workflow.add_edge('chat', END)
workflow.add_edge('fetch_news', END)
workflow.add_edge('analyze', END)

# Compile the graph into a runnable app
app = workflow.compile()

print("LangGraph app compiled successfully.")
