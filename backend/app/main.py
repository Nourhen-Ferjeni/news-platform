from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from . import models, schemas, crud, security
from .services import fake_news_checker, social_poster, deep_analyzer, content_processor, model_loader
from .database import engine, SessionLocal
from . import graph
from langchain_core.messages import HumanMessage
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from .security import SECRET_KEY, ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# This line tells SQLAlchemy to create all the tables defined in our models.
# It will create the `database.db` file and the `users` table.
models.Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load the models from the instance within the module
    model_loader.model_loader.load_models()
    yield
    # Clean up the models and release the resources
    print("Shutting down and cleaning up.")

app = FastAPI(
    title="Unified News Agent Backend",
    lifespan=lifespan,
    description="A single API for all news processing, analysis, and agentic chat features.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get a DB session for each request.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    """A simple endpoint to confirm the server is running."""
    return {"status": "ok", "message": "Welcome to the Unified Backend!"}

@app.post("/register", response_model=schemas.User)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Endpoint to register a new user."""
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.post("/login", response_model=schemas.Token)
def login_for_access_token(user_credentials: schemas.UserCreate, db: Session = Depends(get_db)):
    """Endpoint to login a user and get an access token."""
    user = crud.get_user_by_email(db, email=user_credentials.email)
    if not user or not security.verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = security.create_access_token(
        data={"sub": user.email}
    )
    return {"access_token": access_token, "token_type": "bearer"}

# --- Service Endpoints ---

@app.post("/deep-analysis")
async def deep_analysis(request: dict):
    text = request.get("text")
    if not text:
        raise HTTPException(status_code=400, detail="Text not provided")
    
    # Pass the pre-loaded models to the analysis tool
    analysis_tool = deep_analyzer.AnalysisTool(
        ner_model=model_loader.model_loader.ner_model,
        ner_tokenizer=model_loader.model_loader.ner_tokenizer,
        llm_model=model_loader.model_loader.llm_model,
        llm_tokenizer=model_loader.model_loader.llm_tokenizer,
        generator=model_loader.model_loader.generator,
        device=model_loader.model_loader.device,
        has_gpu=model_loader.model_loader.has_gpu
    )
    return analysis_tool.run(text)

@app.post("/check-fake-news")
async def check_fake_news(request: dict):
    claim = request.get("claim")
    if not claim:
        raise HTTPException(status_code=400, detail="Claim not provided")
    return fake_news_checker.verify_claim(claim)

# @app.post("/generate-post")
# async def generate_post(request: dict):
#     text = request.get("text")
#     if not text:
#         raise HTTPException(status_code=400, detail="Text not provided")
#     return social_poster.full_pipeline(text)

# @app.post("/share-post")
# async def share_post(request: dict):
#     # TODO: Implement this endpoint
#     return {"status": "not_implemented"}

@app.post("/extract")
async def extract(request: dict):
    url = request.get("url")
    if not url:
        raise HTTPException(status_code=400, detail="URL not provided")
    return content_processor.extract_content(url)

@app.post("/summarize")
async def summarize(request: dict):
    text = request.get("text")
    if not text:
        raise HTTPException(status_code=400, detail="Text not provided")
    return content_processor.summarize_text(text)

# --- In-memory state ---
agent_state = {}

# --- Chat Endpoint ---

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = crud.get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception
    return user

@app.get("/personalized-news")
async def personalized_news(current_user: models.User = Depends(get_current_user)):
    interests = current_user.profile.get("interests", [])
    if not interests:
        interests = ["technology", "world", "business"]
    
    all_articles = []
    for interest in interests:
        news = graph.news_fetcher_tool.run(f"{interest}&pageSize=5")
        all_articles.extend(news.get("articles", []))
        
    # Remove duplicates
    seen_titles = set()
    unique_articles = []
    for article in all_articles:
        if article["title"] not in seen_titles:
            unique_articles.append(article)
            seen_titles.add(article["title"])
            
    return {"news": unique_articles}

@app.post("/chat")
async def chat(request: dict, current_user: models.User = Depends(get_current_user)):
    global agent_state
    message = request.get("message")
    if not message:
        raise HTTPException(status_code=400, detail="Message not provided")

    # Get the current state for the user, or create a new one
    user_id = str(current_user.id)
    if user_id not in agent_state:
        agent_state[user_id] = {"messages": [], "current_article": None}

    # Update conversation history
    agent_state[user_id]["messages"].append(HumanMessage(content=message))
    conversation_history = "\n".join([msg.content for msg in agent_state[user_id]["messages"]])

    # Run the graph
    final_state = graph.app.invoke(agent_state[user_id])
    
    # Update user profile if the fetch_news node was called
    if final_state.get("next_node") == "fetch_news":
        import json
        print("Updating user profile...")
        user_profile_tool = graph.user_profile_tool
        user_profile_tool.run(json.dumps({"user_id": current_user.id, "conversation_history": conversation_history}))
    agent_state[user_id] = final_state

    return {"reply": final_state["messages"][-1].content}
