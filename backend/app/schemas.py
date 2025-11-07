from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    """
    Schema for creating a new user.
    Ensures the email is a valid email format and we receive a password.
    """
    email: EmailStr
    password: str

class User(BaseModel):
    """
    Schema for returning user information.
    We never want to return the password, so it's omitted here.
    """
    id: int
    email: EmailStr

    class Config:
        orm_mode = True

class Token(BaseModel):
    """
    Schema for the authentication token.
    """
    access_token: str
    token_type: str
