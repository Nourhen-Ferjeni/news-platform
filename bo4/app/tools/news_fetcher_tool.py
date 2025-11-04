import requests
from config import NEWS_API_KEY

class NewsFetcherTool:
    def run(self, topic: str) -> str:
        """
        Fetches a news article from the NewsData.io API on a given topic.
        """
        print(f"--- Fetching news about '{topic}' from NewsData.io ---")
        
        # The user's key is for newsdata.io, so using the correct endpoint.
        url = f"https://newsdata.io/api/1/news?q={topic}&apikey={NEWS_API_KEY}"
        
        try:
            response = requests.get(url)
            response.raise_for_status()  # Raise an exception for bad status codes
            
            data = response.json()
            
            if data.get("results") and data["results"]:
                # Return the title, description, and content of the first article
                first_article = data["results"][0]
                title = first_article.get('title', 'No Title')
                description = first_article.get('description', 'No Description')
                content = first_article.get('content', 'No Content')
                if content:
                    content = "\n".join(content.split('\n')[:6])
                return f"Title: {title}\n\nDescription: {description}\n\nContent: {content}"
            else:
                # Check for error message in response
                if data.get('message'):
                    return f"API Error: {data['message']}"
                return f"No articles found for '{topic}'."
                
        except requests.exceptions.RequestException as e:
            return f"Error fetching news: {e}"
        except (KeyError, IndexError):
            return "Error parsing the news article data."
