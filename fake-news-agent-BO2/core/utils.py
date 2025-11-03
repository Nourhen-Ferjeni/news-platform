# core/utils.py
"""
Utility functions for formatting, cleaning, and displaying fact-checking data.
"""

import re
import json
from typing import Dict, List


def clean_text(text: str) -> str:
    """Remove HTML tags, excessive whitespace, and control characters."""
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def truncate_text(text: str, max_len: int = 500) -> str:
    """Shorten text for preview or summarization."""
    return text[:max_len] + "..." if len(text) > max_len else text


def print_sources(sources: List[Dict]):
    """Pretty-print the list of retrieved sources."""
    print("\n🔍 Retrieved Sources:")
    for i, s in enumerate(sources, 1):
        print(f"{i}. {s.get('title')} ({s.get('source')})")
        print(f"   Link: {s.get('link')}")
        print(f"   Snippet: {truncate_text(s.get('snippet', ''))}\n")


def export_result_to_json(result: Dict, file_path: str):
    """Save final pipeline result as a JSON file."""
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    print(f"[Utils] ✅ Result saved to {file_path}")