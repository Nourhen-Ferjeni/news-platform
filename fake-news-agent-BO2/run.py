# run.py
"""
Main entry point for the Fact-Checking System.
Run with: streamlit run app.py
"""

import streamlit.web.cli as stcli
import sys
import os

if __name__ == "__main__":
    # Add current directory to Python path
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    
    # Run Streamlit app
    sys.argv = ["streamlit", "run", "app.py", "--server.port=8501", "--server.address=0.0.0.0"]
    sys.exit(stcli.main())