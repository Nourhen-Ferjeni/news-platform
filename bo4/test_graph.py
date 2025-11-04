import asyncio
from langchain_core.messages import HumanMessage
from app.graph import app

async def run_test_cases():
    """
    Runs a series of test cases to validate the graph's functionality.
    """
    print("--- Running Graph Test Cases ---")

    # Test Case 1: Simple Chat
    print("\n--- Test Case 1: Simple Chat ---")
    chat_input = {"messages": [HumanMessage(content="Hello, how are you?")]}
    chat_output = app.invoke(chat_input)
    print(f"Input: {chat_input}")
    print(f"Output: {chat_output['messages'][-1].content}")

    # Test Case 2: Fetch News (Success)
    print("\n--- Test Case 2: Fetch News (Success) ---")
    fetch_news_input = {"messages": [HumanMessage(content="fetch news about python")]}
    fetch_news_output = app.invoke(fetch_news_input)
    print(f"Input: {fetch_news_input}")
    print(f"Output: {fetch_news_output['messages'][-1].content}")
    
    # Test Case 3: Fetch News (No Topic)
    print("\n--- Test Case 3: Fetch News (No Topic) ---")
    fetch_news_no_topic_input = {"messages": [HumanMessage(content="fetch news")]}
    fetch_news_no_topic_output = app.invoke(fetch_news_no_topic_input)
    print(f"Input: {fetch_news_no_topic_input}")
    print(f"Output: {fetch_news_no_topic_output['messages'][-1].content}")

    # Test Case 4: Analyze Article (Success)
    print("\n--- Test Case 4: Analyze Article (Success) ---")
    # First, fetch an article to have something to analyze
    analysis_step1_input = {"messages": [HumanMessage(content="fetch news about technology")]}
    analysis_step1_output = app.invoke(analysis_step1_input)
    
    # Now, use the state from the previous step to call the analysis tool
    analysis_step2_input = {
        "messages": [
            HumanMessage(content="analyze the article")
        ],
        "current_article": analysis_step1_output.get("current_article")
    }
    analysis_step2_output = app.invoke(analysis_step2_input)
    print(f"Input: {analysis_step2_input['messages']}")
    print(f"Output: {analysis_step2_output['messages'][-1].content}")

    # Test Case 5: Analyze Article (No Article)
    print("\n--- Test Case 5: Analyze Article (No Article) ---")
    analyze_no_article_input = {"messages": [HumanMessage(content="analyze the article")]}
    analyze_no_article_output = app.invoke(analyze_no_article_input)
    print(f"Input: {analyze_no_article_input}")
    print(f"Output: {analyze_no_article_output['messages'][-1].content}")

    print("\n--- Test Cases Complete ---")

if __name__ == "__main__":
    asyncio.run(run_test_cases())
