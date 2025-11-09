from langgraph.graph import StateGraph, END
from langchain_core.messages import AIMessage
from .graph_state import AgentState
from langchain_google_genai import ChatGoogleGenerativeAI
from .config import GEMINI_API_KEY
from .tools.service_tools import DeepAnalysisTool, FakeNewsCheckTool, ExtractContentTool, SummarizeTool
from .tools.user_profile_tool import UserProfileTool
from .tools.router_tool import get_router
from .tools.news_fetcher_tool import NewsFetcherTool

# --- 1. Initialize Tools ---
news_fetcher_tool = NewsFetcherTool()
deep_analysis_tool = DeepAnalysisTool()
fake_news_check_tool = FakeNewsCheckTool()
extract_content_tool = ExtractContentTool()
summarize_tool = SummarizeTool()
user_profile_tool = UserProfileTool()

# --- 2. Define Graph Nodes ---
def router(state: AgentState):
    router = get_router()
    query = state["messages"][-1].content
    result = router.invoke({"query": query})
    return {"next_node": result.tool_name, "current_topic": result.topic}

def chat(state: AgentState):
    llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", google_api_key=GEMINI_API_KEY)
    response = llm.invoke(state["messages"])
    return {"messages": [response]}

def call_deep_analysis(state: AgentState):
    print("--- Calling Deep Analysis Tool ---")
    article = state.get("current_article")
    if not article:
        return {"messages": [AIMessage(content="Please fetch an article first.")]}
    result = deep_analysis_tool.run(article)
    return {"messages": [AIMessage(content=str(result))]}

def call_fake_news_check(state: AgentState):
    print("--- Calling Fake News Check Tool ---")
    article = state.get("current_article")
    if not article:
        return {"messages": [AIMessage(content="Please fetch an article first.")]}
    result = fake_news_check_tool.run(article)
    return {"messages": [AIMessage(content=str(result))]}

# def call_social_post(state: AgentState):
#     article = state.get("current_article")
#     if not article:
#         return {"messages": [AIMessage(content="Please fetch an article first.")]}
#     result = social_post_tool.run(article)
#     return {"messages": [AIMessage(content=str(result))]}

def call_extract_content(state: AgentState):
    query = state["messages"][-1].content
    result = extract_content_tool.run(query)
    return {"messages": [AIMessage(content=str(result))]}

def call_summarize(state: AgentState):
    print("--- Calling Summarize Tool ---")
    article = state.get("current_article")
    if not article:
        return {"messages": [AIMessage(content="Please fetch an article first.")]}
    result = summarize_tool.run(article)
    return {"messages": [AIMessage(content=str(result))]}

def fetch_news(state: AgentState):
    topic = state.get("current_topic")
    if not topic:
        return {"messages": [AIMessage(content="Please specify a topic to fetch news about.")]}
    
    result = news_fetcher_tool.run(topic)
    
    articles = result.get("articles", [])
    if not articles:
        return {"messages": [AIMessage(content=f"I couldn't find any articles about '{topic}'.")]}
        
    article = articles[0]
    title = article.get("title", "No Title")
    content = article.get("content", "No Content")
    
    response_message = f"**{title}**\n\n{content}"
    
    return {"current_article": content, "messages": [AIMessage(content=response_message)]}

# --- 3. Define Conditional Edges ---
def decide_next_node(state):
    return state.get("next_node", "chat")

# --- 4. Build the Graph ---
workflow = StateGraph(AgentState)

workflow.add_node("router", router)
workflow.add_node("chat", chat)
workflow.add_node("deep_analysis", call_deep_analysis)
workflow.add_node("fake_news_check", call_fake_news_check)
# workflow.add_node("social_post", call_social_post)
workflow.add_node("extract_content", call_extract_content)
workflow.add_node("summarize", call_summarize)
workflow.add_node("fetch_news", fetch_news)

workflow.set_entry_point("router")

workflow.add_conditional_edges(
    "router",
    decide_next_node,
    {
        "chat": "chat",
        "deep_analysis": "deep_analysis",
        "fake_news_check": "fake_news_check",
        # "social_post": "social_post",
        "extract_content": "extract_content",
        "summarize": "summarize",
        "fetch_news": "fetch_news",
    }
)

workflow.add_edge('chat', END)
workflow.add_edge('deep_analysis', END)
workflow.add_edge('fake_news_check', END)
# workflow.add_edge('social_post', END)
workflow.add_edge('extract_content', END)
workflow.add_edge('summarize', END)
workflow.add_edge('fetch_news', END)

app = workflow.compile()
