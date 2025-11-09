from langchain.tools import BaseTool
import requests
from ..config import NEWSAPI_KEY

class NewsFetcherTool(BaseTool):
    name: str = "news_fetcher_tool"
    description: str = "A tool to fetch news articles from the NewsAPI."

    def _run(self, query: str):
        url = f"https://newsapi.org/v2/everything?q={query}&pageSize=1&sortBy=relevancy&apiKey={NEWSAPI_KEY}"
        response = requests.get(url)
        return response.json()

    async def _arun(self, query: str):
        return self._run(query)
