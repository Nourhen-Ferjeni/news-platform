# core/rag_pipeline.py
"""
Enhanced RAG Pipeline with LangChain:
Modern RAG implementation using LangChain framework.
"""

from agents.retriever_agent import retrieve_evidence, retrieve_evidence_fallback
from agents.memory_manager import save_verdict
from core.vectorstore import VectorStore
from core.langchain_manager import LangChainManager
from typing import Dict, List
from config import SIMILARITY_THRESHOLD
import numpy as np

def verify_claim(claim: str, top_k_web: int = 3, top_k_news: int = 2) -> Dict:
    """
    🎯 Enhanced RAG Pipeline with LangChain
    """
    print(f"\n[RAG Pipeline] 🔍 Verifying: \"{claim}\"")
    
    # === STEP 0: Semantic Cache Check ===
    vector_store = VectorStore()
    similar_claims = vector_store.search_similar(claim, top_k=1, threshold=SIMILARITY_THRESHOLD)
    
    if similar_claims:
        cached_claim = similar_claims[0]
        print(f"[RAG Pipeline] ✅ Semantic cache hit (similarity: {cached_claim['similarity']:.2f})")
        
        return {
            "claim": claim,
            "similar_claim": cached_claim["claim"],
            "verdict": {
                "claim": claim,
                "verdict": cached_claim["metadata"].get("verdict", "UNVERIFIED"),
                "confidence": cached_claim["metadata"].get("confidence", 0.5),
                "details": f"Result based on similar verification: \"{cached_claim['claim']}\""
            },
            "from_cache": True,
            "similarity_score": cached_claim["similarity"],
            "pipeline_type": "semantic_cache"
        }

    try:
        # === STEP 1: Evidence Retrieval ===
        print("[RAG Pipeline] 📥 Step 1 - Gathering evidence...")
        sources = retrieve_evidence(claim, top_k_web, top_k_news)
        
        # Fallback if no sources found
        if not sources:
            print("[RAG Pipeline] ⚠️ No sources found, using fallback...")
            sources = retrieve_evidence_fallback(claim, top_k_web, top_k_news)

        print(f"[RAG Pipeline] ✅ {len(sources)} sources retrieved")

        # === STEP 2: Process with LangChain ===
        return _process_with_langchain(claim, sources, vector_store)
    
    except Exception as e:
        print(f"[RAG Pipeline] ❌ Critical error: {e}")
        return _handle_error(claim, e)

def _process_with_langchain(claim: str, sources: List[Dict], vector_store: VectorStore) -> Dict:
    """Process claim using LangChain RAG pipeline."""
    print("[RAG Pipeline] 🚀 Using LangChain RAG pipeline...")
    
    try:
        # Initialize LangChain manager
        lc_manager = LangChainManager()
        
        # Convert sources to LangChain documents
        documents = lc_manager.create_documents_from_sources(sources)
        
        if not documents:
            return _handle_no_valid_sources(claim, vector_store)
        
        # Build retrieval chain
        lc_manager.build_retrieval_chain(documents)
        
        # Query the claim
        langchain_result = lc_manager.query_claim(claim)
        
        # Create final verdict structure
        final_verdict = {
            "claim": claim,
            "verdict": langchain_result["verdict"],
            "confidence": langchain_result["confidence"],
            "details": langchain_result["reasoning"]
        }
        
        # Save to memory systems
        _save_verdict_to_memory(claim, final_verdict, len(sources), vector_store)
        
        print(f"[RAG Pipeline] ✅ LangChain verdict: {final_verdict['verdict']} ({final_verdict['confidence'] * 100:.0f}%)")
        
        return {
            "claim": claim,
            "sources": langchain_result["sources"],
            "verdict": final_verdict,
            "from_cache": False,
            "pipeline_type": "langchain"
        }
        
    except Exception as e:
        print(f"[RAG Pipeline] ❌ LangChain error: {e}")
        return _handle_error(claim, e)

def _handle_no_sources(claim: str, vector_store: VectorStore) -> Dict:
    """Handle case when no sources are found."""
    result = {
        "claim": claim, 
        "error": "No sources found",
        "verdict": {
            "claim": claim,
            "verdict": "UNVERIFIED",
            "confidence": 0.0,
            "details": "No sources available for verification"
        }
    }
    vector_store.add_claim(claim, {
        "verdict": result["verdict"]["verdict"],
        "confidence": result["verdict"]["confidence"],
        "error": "no_sources",
        "sources_count": 0
    })
    return result

def _handle_no_valid_sources(claim: str, vector_store: VectorStore) -> Dict:
    """Handle case when sources exist but can't be processed."""
    result = {
        "claim": claim,
        "error": "Source analysis failed",
        "verdict": {
            "claim": claim,
            "verdict": "UNVERIFIED",
            "confidence": 0.0,
            "details": "Unable to analyze available sources"
        }
    }
    vector_store.add_claim(claim, {
        "verdict": result["verdict"]["verdict"],
        "confidence": result["verdict"]["confidence"],
        "error": "processing_failed",
        "sources_count": 0
    })
    return result

def _handle_error(claim: str, error: Exception) -> Dict:
    """Handle general errors."""
    return {
        "claim": claim,
        "error": str(error),
        "verdict": {
            "claim": claim,
            "verdict": "UNVERIFIED",
            "confidence": 0.0,
            "details": f"Error during verification: {str(error)}"
        }
    }

def _save_verdict_to_memory(claim: str, final_verdict: Dict, sources_count: int, vector_store: VectorStore):
    """Save verdict to both SQLite and vector store."""
    try:
        # SQLite database
        save_verdict(
            claim=final_verdict["claim"],
            verdict=final_verdict["verdict"],
            confidence=final_verdict["confidence"]
        )
        
        # Vector Store
        vector_store.add_claim(claim, {
            "verdict": final_verdict["verdict"],
            "confidence": final_verdict["confidence"],
            "sources_count": sources_count,
            "timestamp": np.datetime64('now')
        })
        
    except Exception as e:
        print(f"[RAG Pipeline] ❌ Error saving results: {e}")