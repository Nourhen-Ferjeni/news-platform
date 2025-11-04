from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .tools.analysis_tool import AnalysisTool

# Initialize FastAPI app
fastapi_app = FastAPI()

# Add CORS middleware to allow requests from the frontend
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for development
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Initialize the AnalysisTool
analysis_tool = AnalysisTool()

class AnalysisRequest(BaseModel):
    article_text: str

@fastapi_app.post("/analyze")
async def analyze(analysis_request: AnalysisRequest):
    """
    Endpoint to analyze an article.
    """
    words = analysis_request.article_text.split()
    truncated_text = " ".join(words[:300])
    analysis_result = analysis_tool.run(truncated_text)
    return {"analysis": analysis_result}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(fastapi_app, host="0.0.0.0", port=8001)
