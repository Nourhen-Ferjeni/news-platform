from langchain_core.prompts import ChatPromptTemplate
from langchain_core.pydantic_v1 import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from ..config import GEMINI_API_KEY

class RouteQuery(BaseModel):
    """Route a user query to the most relevant tool."""
    tool_name: str = Field(..., description="The name of the tool to use.")
    topic: str = Field(None, description="The topic to fetch news about, if the tool is fetch_news.")

def get_router():
    llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", google_api_key=GEMINI_API_KEY)
    
    structured_llm = llm.with_structured_output(RouteQuery)
    
    system = """You are an expert at routing a user query to the appropriate tool.
    Based on the user's query, select the best tool to use.
    If the user is asking to fetch news, you must also extract the topic of the news they are asking for.
    The available tools are:
    - deep_analysis: For in-depth analysis of an article.
    - fake_news_check: To check for fake news in a claim.
    - extract_content: To extract the main content from a URL.
    - summarize: To summarize a text.
    - fetch_news: To fetch a news article from the web.
    - chat: For all other queries.
    """
    
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system),
            ("human", "{query}"),
        ]
    )
    
    router = prompt | structured_llm
    return router
