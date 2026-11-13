from fastapi import APIRouter, HTTPException

from app.schemas.user_schema import UserRegister, UserLogin

from app.services.auth_service import register_user, login_user

from fastapi import Depends
from app.utils.dependencies import get_current_user


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# REGISTER API
@router.post("/register")
def register(user: UserRegister):

    result = register_user(user)

    if result is None:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    return result


# LOGIN API
@router.post("/login")
def login(user: UserLogin):

    result = login_user(user)

    if result is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    return result
# PROTECTED PROFILE API
@router.get("/profile")
def get_profile(current_user: dict = Depends(get_current_user)):
    return {
        "message": "Profile fetched successfully!",
        "user": current_user
    }