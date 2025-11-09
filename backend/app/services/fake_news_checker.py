# backend/app/services/fake_news_checker.py
"""
LangChain Integration Manager:
Provides modern RAG components using LangChain framework.
"""

import os
import pandas as pd
import re
from typing import List, Dict, Any, Optional
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
import pickle
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
import requests
from ..config import GEMINI_API_KEY, EMBEDDING_MODEL, CHUNK_SIZE, CHUNK_OVERLAP, VECTOR_DB_PATH, METADATA_DB_PATH, EMBEDDING_DIM, SIMILARITY_THRESHOLD, SERPAPI_API_KEY, NEWSAPI_KEY

def retrieve_from_serpapi(query: str, num_results: int = 3) -> List[Dict]:
    """Retrieve search results from Google via SerpAPI."""
    try:
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

class LangChainManager:
    def __init__(self):
        # Initialize embeddings with explicit device
        self.embeddings = HuggingFaceEmbeddings(
            model_name=EMBEDDING_MODEL,
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': True}
        )
        
        # Initialize LLM
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=GEMINI_API_KEY,
            temperature=0.1
        )
        
        # Initialize text splitter
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP,
            length_function=len
        )
        
        self.vector_store = None
        self.qa_chain = None

    def create_documents_from_sources(self, sources: List[Dict]) -> List[Document]:
        """Convert retrieved sources to LangChain Documents."""
        documents = []
        
        for source in sources:
            content = f"""
            Title: {source.get('title', 'No title')}
            Snippet: {source.get('snippet', 'No snippet')}
            Content: {source.get('content', 'No content')}
            Source: {source.get('source', 'Unknown')}
            URL: {source.get('link', 'No URL')}
            """
            
            metadata = {
                "title": source.get('title', ''),
                "source": source.get('source', ''),
                "url": source.get('link', ''),
                "link": source.get('link', ''),
                "snippet": source.get('snippet', ''),
                "retrieval_date": str(pd.Timestamp.now())
            }
            
            documents.append(Document(page_content=content, metadata=metadata))
        
        return documents

    def build_retrieval_chain(self, documents: List[Document]):
        """Build LangChain retrieval QA chain."""
        # Split documents into chunks
        chunks = self.text_splitter.split_documents(documents)
        
        if not chunks:
            raise ValueError("No documents to process after splitting")
        
        # Create vector store
        self.vector_store = FAISS.from_documents(chunks, self.embeddings)
        
        # Create enhanced prompt for fact-checking
        prompt_template = """
You are a professional fact-checking assistant. Analyze the following context and question to provide a truthful verdict.

CONTEXT:
{context}

CLAIM TO VERIFY: {question}

INSTRUCTIONS:
1. Analyze the claim against the provided context
2. Determine if the claim is: TRUE, FALSE, PARTIALLY TRUE, or UNVERIFIED
3. Provide a confidence score (0-100%)
4. Explain your reasoning based on the evidence
5. Mention which sources were most convincing and why
6. Be concise and direct in your response

Format your response EXACTLY as follows:
VERDICT: [TRUE/FALSE/PARTIALLY_TRUE/UNVERIFIED]
CONFIDENCE: [0-100]%
JUSTIFICATION: [2-3 sentence explanation of why this verdict was reached]
KEY_EVIDENCE: [List the most relevant evidence with sources]
CONVINCING_SOURCE: [Which source was most convincing and why]

IMPORTANT: 
- Keep each section on its own line
- Do not use markdown formatting
- Be clear and structured

RESPONSE:
"""
        
        PROMPT = PromptTemplate(
            template=prompt_template,
            input_variables=["context", "question"]
        )
        
        # Create retrieval chain
        self.qa_chain = RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff",
            retriever=self.vector_store.as_retriever(
                search_type="similarity",
                search_kwargs={"k": 4}
            ),
            chain_type_kwargs={"prompt": PROMPT},
            return_source_documents=True
        )
        
        return self.qa_chain

    def query_claim(self, claim: str) -> Dict[str, Any]:
        """Query the retrieval chain for claim verification."""
        if not self.qa_chain:
            raise ValueError("Retrieval chain not built. Call build_retrieval_chain first.")
        
        try:
            result = self.qa_chain.invoke({"query": claim})
            return self._parse_langchain_response(result)
        except Exception as e:
            print(f"[LangChain] Error querying claim: {e}")
            return {
                "verdict": "UNVERIFIED",
                "confidence": 0.0,
                "reasoning": f"Error during verification: {str(e)}",
                "sources": []
            }

    def _parse_langchain_response(self, result: Dict) -> Dict[str, Any]:
        """Parse LangChain response into structured format with enhanced formatting."""
        response_text = result["result"]
        source_documents = result.get("source_documents", [])
        
        # Parse verdict from response
        verdict = "UNVERIFIED"
        confidence = 0.5
        reasoning = response_text
        justification = ""
        key_evidence = ""
        convincing_source = ""
        
        # Enhanced parsing for structured response
        lines = response_text.split('\n')
        current_section = ""
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            line_lower = line.lower()
            
            if 'verdict:' in line_lower:
                verdict_part = line.split(':', 1)[1].strip()
                if 'true' in line_lower and 'false' not in line_lower and 'partially' not in line_lower:
                    verdict = "TRUE"
                elif 'false' in line_lower:
                    verdict = "FALSE"
                elif 'partially' in line_lower:
                    verdict = "PARTIALLY TRUE"
                current_section = "verdict"
                    
            elif 'confidence:' in line_lower:
                match = re.search(r'(\d+)%', line)
                if match:
                    confidence = int(match.group(1)) / 100
                current_section = "confidence"
                    
            elif 'justification:' in line_lower:
                justification = line.split(':', 1)[1].strip()
                current_section = "justification"
                
            elif 'key_evidence:' in line_lower:
                key_evidence = line.split(':', 1)[1].strip()
                current_section = "key_evidence"
                
            elif 'convincing_source:' in line_lower:
                convincing_source = line.split(':', 1)[1].strip()
                current_section = "convincing_source"
                
            else:
                # Continue adding to current section
                if current_section == "justification":
                    justification += " " + line
                elif current_section == "key_evidence":
                    key_evidence += " " + line
                elif current_section == "convincing_source":
                    convincing_source += " " + line
        
        # Build enhanced reasoning with clean formatting
        enhanced_reasoning = ""
        if justification:
            enhanced_reasoning += f"JUSTIFICATION: {justification}\n\n"
        if key_evidence:
            # Clean up key evidence formatting
            key_evidence = re.sub(r'\*', '', key_evidence)
            key_evidence = re.sub(r'\s+', ' ', key_evidence).strip()
            enhanced_reasoning += f"KEY_EVIDENCE: {key_evidence}\n\n"
        if convincing_source:
            enhanced_reasoning += f"CONVINCING_SOURCE: {convincing_source}"

        if not enhanced_reasoning:
            # Clean up raw reasoning
            enhanced_reasoning = re.sub(r'\*\*.*?\*\*', '', reasoning)
            enhanced_reasoning = re.sub(r'#+\s*', '', enhanced_reasoning)
            enhanced_reasoning = re.sub(r'\*', '', enhanced_reasoning)
            enhanced_reasoning = re.sub(r'\s+', ' ', enhanced_reasoning).strip()

        # Process source documents
        sources = []
        for doc in source_documents:
            url = doc.metadata.get("url", doc.metadata.get("link", ""))
            snippet = doc.metadata.get("snippet", doc.page_content[:200] + "...")
            
            sources.append({
                "title": doc.metadata.get("title", "Unknown"),
                "link": url,
                "source": doc.metadata.get("source", "Unknown"),
                "summary": self._generate_clean_summary(doc.page_content, snippet),
                "snippet": snippet,
                "content_preview": doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content
            })
        
        return {
            "verdict": verdict,
            "confidence": confidence,
            "reasoning": enhanced_reasoning,
            "justification": justification,
            "key_evidence": key_evidence,
            "convincing_source": convincing_source,
            "sources": sources,
            "raw_response": response_text
        }

    def _generate_clean_summary(self, content: str, snippet: str) -> str:
        """Generate a clean, well-formatted summary without markdown."""
        prompt = f"""
        Based on the following content from a web source, provide a clean, well-formatted summary for fact-checking purposes.
        
        CONTENT:
        {content[:1200]}
        
        Please provide a summary with:
        - A brief 2-3 sentence overview of the main points
        - Key claims or facts mentioned
        - Any important context or limitations
        
        Format your response in clean, natural language without any markdown, asterisks, or special formatting.
        Use clear, concise sentences and proper punctuation.
        """
        
        try:
            if self.llm:
                response = self.llm.invoke(prompt)
                summary = response.content.strip()
                
                # Clean any remaining markdown
                summary = re.sub(r'\*\*', '', summary)
                summary = re.sub(r'\*', '', summary)
                summary = re.sub(r'#+\s*', '', summary)
                summary = re.sub(r'- ', '', summary)
                summary = re.sub(r'\n+', '\n', summary)
                
                return summary
        except Exception as e:
            print(f"[LangChain] Error generating clean summary: {e}")
        
        # Fallback to clean snippet-based summary
        clean_snippet = re.sub(r'\*\*', '', snippet)
        clean_snippet = re.sub(r'\*', '', clean_snippet)
        return f"{clean_snippet[:200]}..." if clean_snippet else "No summary available"

    def save_vector_store(self, path: str):
        """Save the FAISS vector store to disk."""
        if self.vector_store:
            self.vector_store.save_local(path)

    def load_vector_store(self, path: str):
        """Load FAISS vector store from disk."""
        if os.path.exists(path):
            self.vector_store = FAISS.load_local(
                path, 
                self.embeddings, 
                allow_dangerous_deserialization=True
            )
            
            # Rebuild QA chain with loaded vector store
            self.qa_chain = RetrievalQA.from_chain_type(
                llm=self.llm,
                chain_type="stuff",
                retriever=self.vector_store.as_retriever(search_kwargs={"k": 4}),
                return_source_documents=True
            )

# --- Main Verification Pipeline ---

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
        # SQLite database (from old project, we will replace this with our new DB)
        # save_verdict(
        #     claim=final_verdict["claim"],
        #     verdict=final_verdict["verdict"],
        #     confidence=final_verdict["confidence"]
        # )
        
        # Vector Store
        vector_store.add_claim(claim, {
            "verdict": final_verdict["verdict"],
            "confidence": final_verdict["confidence"],
            "sources_count": sources_count,
            "timestamp": np.datetime64('now')
        })
        
    except Exception as e:
        print(f"[RAG Pipeline] ❌ Error saving results: {e}")
