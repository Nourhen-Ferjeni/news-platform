# agents/retriever_agent.py
"""
Retriever Agent:
Fetches information from web and news sources using SerpAPI and NewsAPI.
"""

import os
import requests
from typing import List, Dict
from config import SERPAPI_API_KEY, NEWSAPI_KEY


def retrieve_from_serpapi(query: str, num_results: int = 3) -> List[Dict]:
    """Retrieve search results from Google via SerpAPI."""
    try:
        # Utiliser requests directement avec l'API SerpAPI
        params = {
            "engine": "google",
            "q": query,
            "api_key": SERPAPI_API_KEY,
            "num": num_results,
        }
        
        response = requests.get(
            "https://serpapi.com/search",
            params=params,
            timeout=10
        )
        data = response.json()
        results = data.get("organic_results", [])
        
        return [
            {
                "title": r.get("title"),
                "link": r.get("link"),
                "snippet": r.get("snippet"),
                "source": "serpapi"
            }
            for r in results
        ]
    except Exception as e:
        print(f"[Retriever] SerpAPI error: {e}")
        return []


def retrieve_from_newsapi(query: str, num_results: int = 3) -> List[Dict]:
    """Retrieve articles from NewsAPI."""
    try:
        url = (
            f"https://newsapi.org/v2/everything?q={query}"
            f"&pageSize={num_results}&sortBy=relevancy&apiKey={NEWSAPI_KEY}"
        )
        response = requests.get(url, timeout=10)
        data = response.json()
        articles = data.get("articles", [])
        return [
            {
                "title": a.get("title"),
                "link": a.get("url"),
                "snippet": a.get("description", ""),
                "source": "newsapi"
            }
            for a in articles
        ]
    except Exception as e:
        print(f"[Retriever] NewsAPI error: {e}")
        return []


def retrieve_evidence(claim: str, top_k_web=3, top_k_news=2) -> List[Dict]:
    """Combine both retrieval sources."""
    serp_results = retrieve_from_serpapi(claim, top_k_web)
    news_results = retrieve_from_newsapi(claim, top_k_news)
    combined = serp_results + news_results
    print(f"[Retriever] Retrieved {len(combined)} results for claim: {claim}")
    return combined


# Fallback function for when APIs are not available
def retrieve_evidence_fallback(claim: str, top_k_web=3, top_k_news=2) -> List[Dict]:
    """Fallback retrieval with mock data for testing."""
    print(f"[Retriever] Using fallback retrieval for: {claim}")
    
    mock_sources = [
        {
            "title": f"Fact-checking analysis: {claim}",
            "link": "https://www.snopes.com/search/",
            "snippet": f"This appears to be a claim about {claim.split()[0] if claim.split() else 'the topic'}. Further verification is needed from reliable sources.",
            "source": "mock_data"
        },
        {
            "title": f"News coverage: {claim}",
            "link": f"https://www.google.com/search?q={claim.replace(' ', '+')}",
            "snippet": "Various sources have discussed this topic. Check official statements and expert opinions for accurate information.",
            "source": "mock_data"
        }
    ]
    
    return mock_sources[:top_k_web]