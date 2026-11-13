from app.models.user_model import user_collection, create_user

from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token
)


# REGISTER USER
def register_user(user_data):

    existing_user = user_collection.find_one({
        "email": user_data.email
    })

    if existing_user:
        return None

    hashed_password = hash_password(user_data.password)

    new_user = {
        "name": user_data.name,
        "email": user_data.email,
        "password": hashed_password,
        "role": user_data.role
    }

    create_user(new_user)

    return {
        "message": "User registered successfully!"
    }


# LOGIN USER
def login_user(user_data):

    # Find user by email
    user = user_collection.find_one({
        "email": user_data.email
    })

    # Check if user exists
    if not user:
        return None

    # Verify password
    if not verify_password(
        user_data.password,
        user["password"]
    ):
        return None

    # Generate JWT token
    token = create_access_token({
        "sub": str(user["_id"]),
        "email": user["email"],
        "role": user["role"]
    })

    return {
        "message": "Login successful!",
        "access_token": token,
        "token_type": "bearer"
    }