from sqlalchemy import Column, Integer, String, JSON
from .database import Base

class User(Base):
    """
    Database model for a user.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    # This column will store the user's profile, including their interests.
    # The JSON type is perfect for storing flexible data like a list of topics.
    profile = Column(JSON, nullable=True)
