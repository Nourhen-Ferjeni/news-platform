from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from . import models, schemas, crud, security
from .database import engine, SessionLocal

# This line tells SQLAlchemy to create all the tables defined in our models.
# It will create the `database.db` file and the `users` table.
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Unified News Agent Backend",
    description="A single API for all news processing, analysis, and agentic chat features.",
    version="1.0.0",
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
    # TODO: Implement this endpoint
    return {"status": "not_implemented"}

@app.post("/check-fake-news")
async def check_fake_news(request: dict):
    # TODO: Implement this endpoint
    return {"status": "not_implemented"}

@app.post("/generate-post")
async def generate_post(request: dict):
    # TODO: Implement this endpoint
    return {"status": "not_implemented"}

@app.post("/share-post")
async def share_post(request: dict):
    # TODO: Implement this endpoint
    return {"status": "not_implemented"}

@app.post("/extract")
async def extract(request: dict):
    # TODO: Implement this endpoint
    return {"status": "not_implemented"}

@app.post("/summarize")
async def summarize(request: dict):
    # TODO: Implement this endpoint
    return {"status": "not_implemented"}
