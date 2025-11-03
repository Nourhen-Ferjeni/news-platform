# core/langchain_manager.py
"""
LangChain Integration Manager:
Provides modern RAG components using LangChain framework.
"""

import os
import pandas as pd
import re
from typing import List, Dict, Any
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from config import GEMINI_API_KEY, EMBEDDING_MODEL, CHUNK_SIZE, CHUNK_OVERLAP

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