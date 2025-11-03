# scripts/poc_run.py
from core.rag_pipeline import verify_claim
import json

if __name__ == "__main__":
    # Remplace par une claim d'exemple
    claim = "The Eiffel Tower was originally intended to be a temporary structure built for 1889 only."
    print("Running PoC for claim:\n", claim)
    result = verify_claim(claim, top_k_web=2, top_k_news=1)
    print("\n=== RESULT ===\n")
    print(json.dumps(result, indent=2, ensure_ascii=False))
