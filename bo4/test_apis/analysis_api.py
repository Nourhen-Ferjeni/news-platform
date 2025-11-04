import sys
import os
from fastapi import FastAPI, Response
from pydantic import BaseModel

# Add the root directory to the Python path to allow importing from 'app'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.tools.analysis_tool import AnalysisTool

# --- API Setup ---
app = FastAPI()
analysis_tool = AnalysisTool()

class AnalysisRequest(BaseModel):
    article: str

@app.post("/analyze/")
def run_analysis(request: AnalysisRequest):
    """
    Endpoint to run the full analysis pipeline on a given article.
    """
    prompt = analysis_tool.run(request.article)
    return Response(content=prompt, media_type="text/plain")

# To run this API:
# uvicorn test_apis.analysis_api:app --host 0.0.0.0 --port 8000
