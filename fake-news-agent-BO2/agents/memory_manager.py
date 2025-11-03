# agents/memory_manager.py
"""
Memory Manager Agent:
Handles persistent storage of fact-checking history using SQLite.
"""

import sqlite3
import os
from typing import List, Tuple, Dict

DB_PATH = "data/memory.db"
MEMORY_PATH = DB_PATH


def init_memory():
    """Initialize the local SQLite DB."""
    os.makedirs("data", exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            claim TEXT,
            verdict TEXT,
            confidence REAL,
            date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()


def save_verdict(claim: str, verdict: str, confidence: float):
    """Save the claim and its verdict in the local database."""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO history (claim, verdict, confidence) VALUES (?, ?, ?)",
        (claim, verdict, confidence)
    )
    conn.commit()
    conn.close()
    print(f"[Memory] Saved verdict for claim: {claim}")


def get_recent_history(limit: int = 5) -> List[Tuple]:
    """Retrieve recent claims from memory."""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute(
        "SELECT claim, verdict, confidence, date FROM history ORDER BY date DESC LIMIT ?",
        (limit,)
    )
    rows = cur.fetchall()
    conn.close()
    return rows


def load_memory(limit: int = 10) -> List[Tuple]:
    """Alias for get_recent_history for compatibility."""
    return get_recent_history(limit)


def load_memory_as_dict(limit: int = 10) -> List[Dict]:
    """Load memory as list of dictionaries for easier access."""
    rows = get_recent_history(limit)
    return [
        {
            'claim': row[0],
            'verdict': row[1],
            'confidence': row[2],
            'date': row[3]
        }
        for row in rows
    ]