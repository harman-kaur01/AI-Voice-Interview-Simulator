from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from bson import ObjectId

from app.config.settings import JWT_SECRET, JWT_ALGORITHM
from app.models.user_model import user_collection


# Extract Bearer token from request
bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
):
    # Error response for invalid token
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Decode JWT token
        token = credentials.credentials

        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM]
        )

        # Get user ID from token
        user_id = payload.get("sub")

        if user_id is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    # Validate MongoDB ID
    if not ObjectId.is_valid(user_id):
        raise credentials_exception

    # Find user in MongoDB
    user = user_collection.find_one({
        "_id": ObjectId(user_id)
    })

    if user is None:
        raise credentials_exception

    # Never return password
    user.pop("password", None)

    user["_id"] = str(user["_id"])

    return user