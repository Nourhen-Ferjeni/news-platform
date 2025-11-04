import sys
import os
from fastapi import FastAPI
from pydantic import BaseModel

# Add the root directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.tools.news_fetcher_tool import NewsFetcherTool

# --- API Setup ---
app = FastAPI()
news_fetcher_tool = NewsFetcherTool()

class NewsRequest(BaseModel):
    topic: str

@app.post("/fetch_news/")
def run_fetch_news(request: NewsRequest):
    """
    Endpoint to fetch a news article on a given topic.
    """
    result = news_fetcher_tool.run(request.topic)
    return {"article": result}

# To run this API:
# uvicorn test_apis.news_fetcher_api:app --host 0.0.0.0 --port 8002
