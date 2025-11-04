# api.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from pipeline import full_pipeline
from fastapi.middleware.cors import CORSMiddleware
from social_share import share_to_facebook  # working version from app-ui.py
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(title="AI Social Media Post API")
origins = [
    "http://localhost:3000",  
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # allow all methods like POST, GET, OPTIONS
    allow_headers=["*"],
)


app.mount("/generated", StaticFiles(directory="generated"), name="generated")
# Hard-coded Facebook credentials
FB_PAGE_ID = "901859723003885"
FB_ACCESS_TOKEN = "EAAWQ1oUeq9wBPZBLmReJQNUfWlN9zrpuZClU2cy2AWQDFzbCb3VrLWZBxPjZBVXXfsMoEvGkhZB43rIDO55xhWrQdKwMM0xQUYyxt4pnu9siNW2XAGbp540hmZC5wU9ECcDrE2JHRicUXuxmvB72Xi8ZA5JcS4iFH3GEz8syZCkAY3WK3KVZCnqIlBQ0J6g4V6Tnp4WFGaP4WOWS7JyJcm2VLVeqLOEgWrU0NAEuTfsJDZCoFz"

# ---------------------------
# Request models
# ---------------------------
class GeneratePostRequest(BaseModel):
    article_text: str

class SharePostRequest(BaseModel):
    text: str
    emojis: str
    hashtags: str
    image_path: str

# ---------------------------
# Endpoints
# ---------------------------

@app.post("/generate_post")
async def generate_post(request: GeneratePostRequest):
    if not request.article_text.strip():
        raise HTTPException(status_code=400, detail="Text input cannot be empty")
    try:
        result = full_pipeline(request.article_text)
        response_data = {
            "text": result["text"],
            "summary": result["summary"],
            "keywords": result["keywords"],
            "emojis": result["emojis"],
            "hashtags": result["hashtags"],
            "prompt": result["prompt"],
            "image_path": result["image_path"]
        }
        return JSONResponse(content=response_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/share_post")
async def share_post(request: SharePostRequest):
    try:
        share_text = f"{request.text}\n{request.emojis} {request.hashtags}"
        fb_resp = share_to_facebook(
            FB_PAGE_ID, 
            FB_ACCESS_TOKEN, 
            share_text, 
            image_path=request.image_path
        )

        if fb_resp.get("id"):
            return {"facebook_post_id": fb_resp["id"]}
        else:
            return {"facebook_post_id": None, "response": fb_resp}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
