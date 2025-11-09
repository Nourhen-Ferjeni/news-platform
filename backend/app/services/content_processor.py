# backend/app/services/content_processor.py
import re
import requests
from ..config import HUGGINGFACE_API_KEY

def extract_content(url: str) -> dict:
    print("--- Calling Extract Content Service ---")
    """
    Extracts the main content from a URL.
    """
    try:
        resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
        raw_html = resp.text

        html = re.sub(r'<script[\s\S]*?<\/script>', '', raw_html, flags=re.IGNORECASE)
        html = re.sub(r'<style[\s\S]*?<\/style>', '', html, flags=re.IGNORECASE)
        html = re.sub(r'<noscript[\s\S]*?<\/noscript>', '', html, flags=re.IGNORECASE)
        html = re.sub(r'<(header|footer|nav|aside)[^>]*>[\s\S]*?<\/\1>', '', html, flags=re.IGNORECASE)

        article_match = re.search(r'<article[^>]*>([\s\S]*?)<\/article>', html, re.IGNORECASE)
        scope = article_match.group(1) if article_match else html

        raw_paragraphs = re.findall(r'<p[^>]*>([\s\S]*?)<\/p>', scope, re.IGNORECASE)

        junk_pattern = re.compile(r'(subscribe|newsletter|cookie|privacy|terms|signin|sign\s?in|log\s?in|advertis|copyright|©|share\s|follow\s|related\s(stories|articles))', re.IGNORECASE)
        paragraphs = [re.sub(r'<[^>]+>', ' ', p).replace('&[^;]+;', ' ').replace(r'\s+', ' ').strip() for p in raw_paragraphs]
        paragraphs = [p for p in paragraphs if len(p) >= 60 and not junk_pattern.search(p)]

        if not paragraphs:
            return {"error": "Could not extract sufficient article text."}

        text = "\n\n".join(paragraphs)

        if not text or len(text.split(" ")) < 50:
            return {"error": "Could not extract sufficient article text."}

        return {"text": text}
    except Exception as e:
        return {"error": f"Failed to extract article: {e}"}

def summarize_text(text: str, max_length: int = 150, min_length: int = 50) -> dict:
    print("--- Calling Summarize Text Service ---")
    """
    Summarizes text using Hugging Face Inference API.
    """
    if not HUGGINGFACE_API_KEY:
        print("HUGGINGFACE_API_KEY is not set.")
        return {"error": "Missing HUGGINGFACE_API_KEY in environment."}

    try:
        print("Preparing text for summarization...")
        normalized = re.sub(r'\s+', ' ', text).strip()
        truncated = normalized[:1200]
        print(f"Truncated text length: {len(truncated)} characters")

        print("Sending request to Hugging Face API...")
        response = requests.post(
            "https://router.huggingface.co/hf-inference/models/sshleifer/distilbart-cnn-12-6",
            headers={"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"},
            json={
                
                "inputs": truncated,
                "parameters": {
                    "max_length": min(max_length, 120),
                    "min_length": min(min_length, 60),
                    "do_sample": False,
                },  
            },
            timeout=30,
        )
        print(f"Received response with status code: {response.status_code}")

        if response.status_code != 200:
            error_detail = response.text
            print(f"Summarization failed with status {response.status_code}: {error_detail}")
            return {"error": f"Summarization failed: {error_detail}"}

        result = response.json()
        summary_text = result[0].get("summary_text") if isinstance(result, list) and result else None

        if not summary_text:
            print("Summarization failed: 'summary_text' not in response.")
            return {"error": "Summarization failed to produce content."}

        print("Summarization successful.")
        return {"summary": summary_text}
    except requests.exceptions.RequestException as e:
        print(f"A network error occurred: {e}")
        return {"error": f"Summarization failed due to a network error: {e}"}
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return {"error": f"Summarization failed: {e}"}
