# app.py
import streamlit as st
import pandas as pd
from core.rag_pipeline import verify_claim
from agents.memory_manager import init_memory, load_memory_as_dict
import re

# Initialization

init_memory()

# Page configuration
st.set_page_config(
    page_title="AI Fact-Checking System",
    page_icon="🔍",
    layout="wide"
)

# Header
st.title("🔍 AI Fact-Checking System")
st.markdown("Verify information authenticity with our AI-powered RAG system")

# Sidebar for history
with st.sidebar:
    st.header("📊 Verification History")
    
    history = load_memory_as_dict(limit=10)
    
    if history:
        for item in history:
            confidence_color = "🟢" if item['confidence'] > 0.7 else "🟡" if item['confidence'] > 0.4 else "🔴"
            st.write(f"**{item['claim'][:50]}...**")
            st.write(f"{confidence_color} {item['verdict']} ({item['confidence']*100:.0f}%)")
            st.write(f"_{item['date'].split()[0]}_")
            st.write("---")
    else:
        st.info("No verification history yet")

def format_verdict_details(details_text):
    """Format verdict details with compact professional styling"""
    # Nettoyer le texte de base
    details_text = re.sub(r'\*\*', '', details_text)
    details_text = re.sub(r'\*', '', details_text)
    details_text = re.sub(r'#+\s*', '', details_text)
    details_text = re.sub(r'- ', '', details_text)
    
    # Séparer les sections clairement
    lines = details_text.split('\n')
    formatted_sections = []
    
    current_section = ""
    current_title = ""
    section_config = {
        "justification": {"icon": "🔍", "color": "#17a2b8", "bg_color": "#d1ecf1"},
        "key_evidence": {"icon": "📊", "color": "#28a745", "bg_color": "#d4edda"},
        "convincing_source": {"icon": "✅", "color": "#ffc107", "bg_color": "#fff3cd"}
    }
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Détecter les titres de sections
        if line.lower().startswith('justification:'):
            if current_section and current_title:
                formatted_sections.append((current_title, current_section.strip()))
            current_title = "Justification"
            current_section = line.split(':', 1)[1].strip() + " "
            
        elif line.lower().startswith('key_evidence:'):
            if current_section and current_title:
                formatted_sections.append((current_title, current_section.strip()))
            current_title = "Key Evidence"
            current_section = line.split(':', 1)[1].strip() + " "
            
        elif line.lower().startswith('convincing_source:'):
            if current_section and current_title:
                formatted_sections.append((current_title, current_section.strip()))
            current_title = "Most Convincing Source"
            current_section = line.split(':', 1)[1].strip() + " "
            
        elif line.lower().startswith('verdict:') or line.lower().startswith('confidence:'):
            continue
            
        else:
            current_section += line + " "
    
    # Ajouter la dernière section
    if current_section and current_title:
        formatted_sections.append((current_title, current_section.strip()))
    
    # Si on n'a pas pu parser les sections
    if not formatted_sections:
        clean_text = re.sub(r'\s+', ' ', details_text)
        clean_text = re.sub(r'\n\s*\n', '\n\n', clean_text)
        return clean_text.strip()
    
    # Construire l'affichage compact avec moins d'espace entre les sections
    result = ""
    for title, content in formatted_sections:
        config_key = title.lower().replace(' ', '_').replace('most_', '')
        config = section_config.get(config_key, {"icon": "📄", "color": "#6c757d", "bg_color": "#f8f9fa"})
        
        result += f"""
        <div style='
            background: {config['bg_color']}; 
            padding: 15px; 
            border-radius: 8px; 
            border-left: 4px solid {config['color']};
            margin-bottom: 5px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        '>
            <div style='display: flex; align-items: flex-start; margin-bottom: 8px;'>
                <span style='font-size: 1.2em; margin-right: 8px; margin-top: 2px;'>{config['icon']}</span>
                <h4 style='margin: 0; color: {config['color']}; font-weight: bold; font-size: 1em;'>{title}</h4>
            </div>
            <div style='color: #495057; line-height: 1.5; font-size: 0.92em; margin: 0;'>
                {content}
            </div>
        </div>
        """
    
    return result.strip()

def format_source_summary(summary_text):
    """Format source summary for professional display"""
    # Nettoyer le markdown
    summary_text = re.sub(r'\*\*', '', summary_text)
    summary_text = re.sub(r'\*', '', summary_text)
    summary_text = re.sub(r'#+\s*', '', summary_text)
    
    # Améliorer la structure du résumé
    summary_text = re.sub(r'Key Claims Made:', '<strong>Main Claims:</strong><br>', summary_text, flags=re.IGNORECASE)
    summary_text = re.sub(r'Potential Weaknesses or Bias Indicators:', '<br><strong>Considerations:</strong><br>', summary_text, flags=re.IGNORECASE)
    summary_text = re.sub(r'Summary:', '', summary_text, flags=re.IGNORECASE)
    summary_text = re.sub(r'Analysis:', '', summary_text, flags=re.IGNORECASE)
    
    # Nettoyer l'espacement
    summary_text = re.sub(r'\s+', ' ', summary_text)
    summary_text = re.sub(r'\n\s*\n', '<br><br>', summary_text)
    
    return summary_text.strip()

# Main section
tab1, tab2 = st.tabs(["🔎 Verify Claim", "📈 System Analytics"])

with tab1:
    st.header("Verify Information Claim")
    
    claim = st.text_area(
        "Enter the claim to verify:",
        placeholder="Example: COVID vaccines cause infertility...",
        height=100,
        key="claim_input"
    )
    
    # Retrieval parameters
    top_k_web = 3
    top_k_news = 2
    
    # Centered verification button
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        verify_btn = st.button("🚀 Verify Claim", type="primary", use_container_width=True)

    # Verification process
    if verify_btn and claim:
        if len(claim.strip()) < 10:
            st.warning("⚠️ Please enter a more detailed claim (at least 10 characters)")
        else:
            with st.spinner("🔍 AI analysis in progress..."):
                try:
                    # Store claim in session state
                    st.session_state.claim = claim
                    
                    # Claim verification using LangChain pipeline
                    result = verify_claim(claim, top_k_web, top_k_news)
                    
                    # Store result in session state
                    st.session_state.last_result = result
                    
                    # Display results
                    if result.get('from_cache'):
                        st.success("✅ Instant result (semantic cache)!")
                        st.info(f"📋 Based on similar claim: **{result['similar_claim']}**")
                    else:
                        st.success("✅ Analysis completed!")
                    
                    # Verdict display
                    verdict = result['verdict']['verdict']
                    confidence = result['verdict']['confidence']
                    details = result['verdict']['details']
                    
                    # Main verdict display
                    st.markdown("---")
                    st.markdown("## 🎯 Final Verdict")
                    
                    col1, col2 = st.columns([1, 2])
                    
                    with col1:
                        # Enhanced verdict badge with better styling
                        verdict_config = {
                            "TRUE": {"color": "#28a745", "bg_gradient": ["#d4edda", "#c3e6cb"], "text_color": "#155724", "icon": "✅"},
                            "FALSE": {"color": "#dc3545", "bg_gradient": ["#f8d7da", "#f5c6cb"], "text_color": "#721c24", "icon": "❌"},
                            "PARTIALLY TRUE": {"color": "#ffc107", "bg_gradient": ["#fff3cd", "#ffeaa7"], "text_color": "#856404", "icon": "⚠️"},
                            "UNVERIFIED": {"color": "#17a2b8", "bg_gradient": ["#d1ecf1", "#bee5eb"], "text_color": "#0c5460", "icon": "🔵"}
                        }
                        
                        config = verdict_config.get(verdict, verdict_config["UNVERIFIED"])
                        
                        st.markdown(f"""
                            <div style='
                                background: linear-gradient(135deg, {config['bg_gradient'][0]}, {config['bg_gradient'][1]}); 
                                padding: 30px; 
                                border-radius: 15px; 
                                border-left: 6px solid {config['color']}; 
                                box-shadow: 0 6px 12px rgba(0,0,0,0.1);
                                text-align: center;
                                margin-bottom: 20px;
                            '>
                                <div style='font-size: 3em; margin-bottom: 10px;'>{config['icon']}</div>
                                <h2 style='color: {config['text_color']}; margin: 0; font-weight: bold;'>VERDICT: {verdict}</h2>
                            </div>
                        """, unsafe_allow_html=True)
                        
                        # Enhanced confidence meter
                        st.markdown("### 📈 Confidence Level")
                        if confidence > 0.8:
                            confidence_color = "#28a745"
                            confidence_label = "High Confidence"
                            emoji = "🎯"
                            bg_color = "#d4edda"
                        elif confidence > 0.6:
                            confidence_color = "#ffc107"
                            confidence_label = "Medium Confidence"
                            emoji = "📊"
                            bg_color = "#fff3cd"
                        else:
                            confidence_color = "#dc3545"
                            confidence_label = "Low Confidence"
                            emoji = "⚠️"
                            bg_color = "#f8d7da"
                            
                        st.markdown(f"""
                            <div style='
                                text-align: center; 
                                background-color: {bg_color}; 
                                padding: 25px; 
                                border-radius: 12px; 
                                border: 3px solid {confidence_color};
                                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                            '>
                                <div style='color: {confidence_color}; font-size: 3.5em; font-weight: bold; margin: 0;'>{confidence*100:.0f}%</div>
                                <div style='color: {confidence_color}; font-weight: bold; font-size: 1.3em; margin-top: 10px;'>
                                    {emoji} {confidence_label}
                                </div>
                            </div>
                        """, unsafe_allow_html=True)

                    with col2:
                        st.markdown("### 📋 Analysis Details")
                        
                        # Format and display details with compact styling
                        formatted_details = format_verdict_details(details)
                        
                        # Display in a compact professional layout
                        st.markdown(
                            f"""
                            <div style='
                                background: linear-gradient(135deg, #f8f9fa, #e9ecef); 
                                padding: 20px; 
                                border-radius: 10px; 
                                border-left: 4px solid #007bff;
                                box-shadow: 0 2px 6px rgba(0,0,0,0.06);
                            '>
                                {formatted_details.replace(chr(10), '<br>')}
                            </div>
                            """, 
                            unsafe_allow_html=True
                        )

                    # Display sources if available with enhanced design
                    if 'sources' in result and result['sources'] and not result.get('from_cache'):
                        st.markdown("---")
                        st.markdown("## 📚 Consulted Sources")
                        
                        for i, source in enumerate(result['sources'], 1):
                            with st.expander(f"📄 {source.get('title', 'Untitled')} • {source.get('source', 'Unknown')}", expanded=False):
                                col_a, col_b = st.columns([1, 3])
                                
                                with col_a:
                                    st.markdown("**🔗 Source Information**")
                                    if source.get('link'):
                                        st.markdown(f"""
                                            <div style='background: #e7f3ff; padding: 15px; border-radius: 8px; margin-bottom: 10px;'>
                                                <strong>URL:</strong><br>
                                                <a href="{source.get('link')}" target="_blank" style='color: #007bff; word-break: break-all;'>
                                                    {source.get('link')}
                                                </a>
                                            </div>
                                        """, unsafe_allow_html=True)
                                        
                                    if source.get('source'):
                                        st.markdown(f"""
                                            <div style='background: #f8f9fa; padding: 15px; border-radius: 8px;'>
                                                <strong>Source Type:</strong><br>
                                                {source.get('source', 'Unknown')}
                                            </div>
                                        """, unsafe_allow_html=True)
                                
                                with col_b:
                                    summary = source.get('summary', source.get('content_preview', 'No summary available'))
                                    clean_summary = format_source_summary(summary)
                                    
                                    st.markdown("**📝 Summary**")
                                    st.markdown(f"""
                                        <div style='
                                            background: white; 
                                            padding: 20px; 
                                            border-radius: 8px; 
                                            border-left: 4px solid #28a745;
                                            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                                        '>
                                            {clean_summary.replace(chr(10), '<br>')}
                                        </div>
                                    """, unsafe_allow_html=True)

                    # Enhanced detailed analysis section
                    if 'verdict' in result:
                        verdict_data = result['verdict']
                        if verdict_data.get('key_evidence') or verdict_data.get('convincing_source'):
                            st.markdown("---")
                            st.markdown("## 🔍 Detailed Analysis")
                            
                            analysis_col1, analysis_col2 = st.columns(2)
                            
                            with analysis_col1:
                                if verdict_data.get('key_evidence'):
                                    st.markdown("#### 📊 Key Evidence")
                                    clean_evidence = re.sub(r'\*\*', '', verdict_data['key_evidence'])
                                    clean_evidence = re.sub(r'\*', '', clean_evidence)
                                    st.markdown(f"""
                                        <div style='
                                            background: linear-gradient(135deg, #fff3cd, #ffeaa7); 
                                            padding: 20px; 
                                            border-radius: 10px; 
                                            border-left: 4px solid #ffc107;
                                            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                                        '>
                                            {clean_evidence}
                                        </div>
                                    """, unsafe_allow_html=True)
                            
                            with analysis_col2:
                                if verdict_data.get('convincing_source'):
                                    st.markdown("#### ✅ Most Convincing Source")
                                    clean_source = re.sub(r'\*\*', '', verdict_data['convincing_source'])
                                    clean_source = re.sub(r'\*', '', clean_source)
                                    st.markdown(f"""
                                        <div style='
                                            background: linear-gradient(135deg, #d4edda, #c3e6cb); 
                                            padding: 20px; 
                                            border-radius: 10px; 
                                            border-left: 4px solid #28a745;
                                            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                                        '>
                                            {clean_source}
                                        </div>
                                    """, unsafe_allow_html=True)
                    
                except Exception as e:
                    st.error(f"❌ Error during verification: {str(e)}")
                    st.info("💡 Please check your API keys and internet connection")

    # Display last result if available (for page refresh)
    elif 'last_result' in st.session_state and st.session_state.last_result:
        result = st.session_state.last_result
        st.info("📋 Displaying last verification result")
        
        # Quick verdict display
        verdict = result['verdict']['verdict']
        confidence = result['verdict']['confidence']
        
        col1, col2 = st.columns(2)
        with col1:
            st.metric("Verdict", verdict)
        with col2:
            st.metric("Confidence", f"{confidence*100:.0f}%")

with tab2:
    st.header("📈 System Analytics")
    
    history = load_memory_as_dict(limit=50)
    
    if history:
        # System Metrics
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric("Total Verifications", len(history))
        
        with col2:
            try:
                from core.vectorstore import VectorStore
                vector_store = VectorStore()
                st.metric("Claims in FAISS", vector_store.get_claim_count())
            except Exception as e:
                st.metric("Claims in FAISS", "Error")
        
        with col3:
            cache_hits = len([h for h in history if h.get('from_cache')])
            st.metric("Cache Hits", cache_hits)
            
        with col4:
            avg_confidence = pd.DataFrame(history)['confidence'].mean() * 100
            st.metric("Average Confidence", f"{avg_confidence:.1f}%")
        
        # Performance Visualization
        st.subheader("🎯 System Performance")
        
        # Verdict distribution
        verdict_counts = pd.DataFrame(history)['verdict'].value_counts()
        if not verdict_counts.empty:
            st.bar_chart(verdict_counts)
        else:
            st.info("No verdict data available for chart")
        
        # Additional analytics
        st.subheader("System Insights")
        df = pd.DataFrame(history)
        
        if not df.empty:
            # Confidence distribution
            col1, col2 = st.columns(2)
            with col1:
                high_conf = len(df[df['confidence'] > 0.7])
                st.metric("High Confidence Verdicts", high_conf)
            with col2:
                need_review = len(df[df['confidence'] < 0.4])
                st.metric("Need Review", need_review)
            
            # Recent activity table
            st.subheader("📊 Recent Activity")
            display_history = history[:10]
            history_df = pd.DataFrame(display_history)
            
            if not history_df.empty:
                # Format confidence as percentage
                history_df['confidence'] = (history_df['confidence'] * 100).round(1).astype(str) + '%'
                
                # Format date
                history_df['date'] = pd.to_datetime(history_df['date']).dt.strftime('%Y-%m-%d %H:%M')
                
                # Display table
                st.dataframe(
                    history_df[['claim', 'verdict', 'confidence', 'date']],
                    use_container_width=True,
                    column_config={
                        "claim": "Claim",
                        "verdict": "Verdict", 
                        "confidence": "Confidence",
                        "date": "Date"
                    }
                )
        
    else:
        st.info("📊 No analytics data available yet")
        st.markdown("""
        ### 🚀 Get Started
        - Go to the **Verify Claim** tab
        - Enter a claim to verify
        - View analytics here after first verification
        """)

# Footer
st.markdown("---")
st.markdown(
    """
    <div style='text-align: center; color: #666;'>
        <p>🔍 AI Fact-Checking System | Powered by LangChain & Gemini</p>
    </div>
    """,
    unsafe_allow_html=True
)

# Instructions collapsible section
with st.expander("📖 How to use this system"):
    st.markdown("""
    ### 🔍 Verification Process
    
    1. **Enter a Claim**: Type the statement you want to verify in the text area
    2. **Click Verify**: The system will analyze the claim against multiple sources using AI
    3. **Review Results**: Check the verdict, confidence, and consulted sources
    
    ### 📊 Understanding Results
    
    - **✅ TRUE**: The claim is supported by evidence
    - **❌ FALSE**: The claim is contradicted by evidence  
    - **⚠️ PARTIALLY TRUE**: The claim contains both true and false elements
    - **🔵 UNVERIFIED**: Insufficient evidence to determine truthfulness
    
    ### 💡 Tips for Best Results
    
    - Be specific with your claims
    - Use complete sentences for better context
    - Check multiple sources for comprehensive verification
    """)