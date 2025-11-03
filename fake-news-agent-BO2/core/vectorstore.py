# core/vectorstore.py
"""
FAISS Vector Store:
Handles embeddings storage and semantic search for RAG workflow.
"""

import os
import pickle
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Tuple, Optional
from config import VECTOR_DB_PATH, METADATA_DB_PATH, EMBEDDING_DIM, SIMILARITY_THRESHOLD

class VectorStore:
    def __init__(self):
        os.makedirs("data/embeddings", exist_ok=True)
        
        # Initialize model with explicit device handling
        try:
            self.model = SentenceTransformer(
                "all-MiniLM-L6-v2",
                device='cpu'  # Force CPU to avoid meta tensor issues
            )
        except Exception as e:
            print(f"[VectorStore] Error loading model: {e}")
            # Fallback to simpler approach
            self._initialize_fallback_model()
        
        self.index = None
        self.metadata = {}
        self._load_index()

    def _initialize_fallback_model(self):
        """Fallback initialization for SentenceTransformer"""
        try:
            # Alternative approach with explicit device mapping
            import torch
            from sentence_transformers import SentenceTransformer
            
            # Clear any cached models
            torch.cuda.empty_cache() if torch.cuda.is_available() else None
            
            self.model = SentenceTransformer("all-MiniLM-L6-v2")
            # Force model to CPU
            self.model.to('cpu')
            print("[VectorStore] ✅ Model loaded with CPU fallback")
            
        except Exception as e:
            print(f"[VectorStore] ❌ Critical error loading model: {e}")
            raise

    def _load_index(self):
        """Load existing FAISS index or create new one."""
        if os.path.exists(VECTOR_DB_PATH) and os.path.exists(METADATA_DB_PATH):
            try:
                # Load FAISS index
                self.index = faiss.read_index(VECTOR_DB_PATH)
                # Load metadata
                with open(METADATA_DB_PATH, "rb") as f:
                    self.metadata = pickle.load(f)
                print(f"[VectorStore] ✅ Index loaded with {len(self.metadata)} claims")
            except Exception as e:
                print(f"[VectorStore] ❌ Error loading index: {e}")
                self._create_new_index()
        else:
            self._create_new_index()

    def _create_new_index(self):
        """Create new FAISS index."""
        self.index = faiss.IndexFlatIP(EMBEDDING_DIM)
        self.metadata = {}
        print("[VectorStore] 📝 New FAISS index created")

    def _save_index(self):
        """Save FAISS index and metadata."""
        try:
            if self.index is not None:
                faiss.write_index(self.index, VECTOR_DB_PATH)
            with open(METADATA_DB_PATH, "wb") as f:
                pickle.dump(self.metadata, f)
        except Exception as e:
            print(f"[VectorStore] ❌ Error saving index: {e}")

    def add_claim(self, claim: str, metadata: Dict, embedding: Optional[np.ndarray] = None):
        """Add claim with metadata to FAISS index."""
        try:
            if embedding is None:
                embedding = self.model.encode([claim])[0]
            
            # Normalize embedding for cosine similarity
            embedding = embedding / np.linalg.norm(embedding)
            embedding = embedding.reshape(1, -1).astype('float32')
            
            # Add to FAISS
            if self.index is None:
                self._create_new_index()
            
            self.index.add(embedding)
            
            # Store metadata
            claim_id = len(self.metadata)
            self.metadata[claim_id] = {
                "claim": claim,
                "metadata": metadata,
                "timestamp": np.datetime64('now')
            }
            
            self._save_index()
            print(f"[VectorStore] ✅ Claim added: {claim[:60]}...")
            
        except Exception as e:
            print(f"[VectorStore] ❌ Error adding claim: {e}")

    def search_similar(self, query: str, top_k: int = 3, threshold: float = SIMILARITY_THRESHOLD) -> List[Dict]:
        """Search for similar claims using FAISS semantic search."""
        if self.index is None or len(self.metadata) == 0:
            return []
        
        try:
            # Encode and normalize query
            query_embedding = self.model.encode([query])[0]
            query_embedding = query_embedding / np.linalg.norm(query_embedding)
            query_embedding = query_embedding.reshape(1, -1).astype('float32')
            
            # FAISS search
            similarities, indices = self.index.search(query_embedding, top_k)
            
            results = []
            for i, (similarity, idx) in enumerate(zip(similarities[0], indices[0])):
                if idx < len(self.metadata) and similarity >= threshold:
                    metadata_info = self.metadata.get(idx)
                    if metadata_info:
                        results.append({
                            "claim": metadata_info["claim"],
                            "similarity": float(similarity),
                            "metadata": metadata_info["metadata"],
                            "claim_id": idx
                        })
            
            # Sort by similarity (descending)
            results.sort(key=lambda x: x["similarity"], reverse=True)
            return results
            
        except Exception as e:
            print(f"[VectorStore] ❌ Error in similarity search: {e}")
            return []

    def get_claim_count(self) -> int:
        """Get total number of claims in vector store."""
        return len(self.metadata) if self.metadata else 0

    def clear_all(self):
        """Clear all vectors (for testing purposes)."""
        self._create_new_index()
        self._save_index()
        print("[VectorStore] ♻️ All vectors cleared")