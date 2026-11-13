from pydantic import BaseModel, Field


# Registration Schema
class UserRegister(BaseModel):
    name: str
    email: str
    password: str = Field(min_length=6)
    role: str = "job-seeker"


# Login Schema
class UserLogin(BaseModel):
    email: str
    password: str