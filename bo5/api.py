# api.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from pipeline import full_pipeline
from fastapi.middleware.cors import CORSMiddleware
from social_share import share_to_facebook
from fastapi.staticfiles import StaticFiles
import os
import traceback
import logging

app = FastAPI(title="AI Social Media Post API")

# Configuration CORS complète
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/generated", StaticFiles(directory="generated"), name="generated")

# Hard-coded Facebook credentials
FB_PAGE_ID = "901859723003885"
FB_ACCESS_TOKEN = "EAAWQ1oUeq9wBP0GPwL2e4LkSHyyvceh5DdGoNKVks3aQJcvGXRbQl78P6dAU2a9nDvFoozkEjbYgWNs6HWPwASiRmsTGxrABpqCXOWV3EuxXPKLbvGzkKoWEYIltH7gxDt7u1fVxZCkzZAfyzC6PzZBcLJd1M7gyZCfxXYBRteLgkNYd6C03XaCXaoKzkDfgogmwmwiEMeBMAkfGYcAL00WV7A7SKZAXJZB15wlIEZD"

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
        print(f"🟦 Generating post for text: {request.article_text[:100]}...")
        result = full_pipeline(request.article_text)
        print(f"🟩 Post generated successfully: {result.keys()}")
        
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
        print(f"❌ Error in generate_post: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/share_post")
async def share_post(request: SharePostRequest):
    try:
        share_text = f"{request.text}\n{request.emojis} {request.hashtags}"
        print(f"🟦 Sharing to Facebook: {share_text[:100]}...")
        
        fb_resp = share_to_facebook(
            FB_PAGE_ID,
            FB_ACCESS_TOKEN,
            share_text,
            image_path=request.image_path
        )

        print(f"🟩 Facebook response: {fb_resp}")

        # Handle structured error returned by share_to_facebook
        if isinstance(fb_resp, dict) and fb_resp.get("status") == "error":
            detail = fb_resp.get("error") or fb_resp.get("response") or fb_resp
            print(f"❌ Facebook share error: {detail}")
            # 502 Bad Gateway: upstream API error
            raise HTTPException(status_code=502, detail=f"Facebook API error: {detail}")

        if fb_resp.get("id"):
            return {"facebook_post_id": fb_resp["id"]}
        else:
            return {"facebook_post_id": None, "response": fb_resp}

    except Exception as e:
        print(f"❌ Error in share_post: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8080)