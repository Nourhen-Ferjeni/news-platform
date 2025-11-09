from sqlalchemy.orm import Session
from . import models, schemas

def get_user_by_email(db: Session, email: str):
    """
    Fetches a user from the database by their email address.
    """
    return db.query(models.User).filter(models.User.email == email).first()

def get_user(db: Session, user_id: int):
    """
    Fetches a user from the database by their ID.
    """
    return db.query(models.User).filter(models.User.id == user_id).first()

def create_user(db: Session, user: schemas.UserCreate):
    """
    Creates a new user in the database.
    """
    db_user = models.User(email=user.email, hashed_password=user.password, profile={})
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
