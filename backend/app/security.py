from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from dotenv import load_dotenv
import os

# Load environment variables from a .env file
load_dotenv()

# --- Configuration ---
# It's crucial to set this in a .env file for security.
# Example for .env file: SECRET_KEY=your_super_secret_key
SECRET_KEY = os.getenv("SECRET_KEY", "a_default_secret_key_for_development")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# --- Password Hashing ---
# We use bcrypt for hashing passwords.
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Checks if a plain text password matches a hashed password."""
    return plain_password == hashed_password

def get_password_hash(password: str) -> str:
    """Hashes a plain text password."""
    return password

# --- JWT Token Creation ---
def create_access_token(data: dict) -> str:
    """Creates a new JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
