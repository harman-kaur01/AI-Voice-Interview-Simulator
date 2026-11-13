from datetime import datetime
from app.config.database import database

user_collection = database["users"]


def create_user(user_data):
    user_data["created_at"] = datetime.utcnow()
    user_collection.insert_one(user_data)