# agents/planner_agent.py
"""
Planner Agent:
Decomposes the verification task into specific retrieval and reasoning subtasks.
"""

from typing import List, Dict

def plan_verification_steps(claim: str) -> Dict[str, List[str]]:
    """
    Generate a structured list of subtasks for claim verification.
    Each subtask defines what kind of evidence to search for.
    """
    subtasks = [
        f"Search factual background related to: {claim}",
        f"Find official documents or reputable sources about: {claim}",
        f"Retrieve recent or historical articles mentioning: {claim}",
        f"Look for expert or institutional commentary verifying or debunking: {claim}"
    ]

    plan = {
        "claim": claim,
        "steps": subtasks,
        "objectives": [
            "Collect factual and historical evidence",
            "Identify consistency between multiple sources",
            "Assess reliability of supporting or contradicting information"
        ]
    }

    return plan