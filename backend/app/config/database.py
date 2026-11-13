from pymongo import MongoClient
from app.config.settings import MONGODB_URL, DATABASE_NAME

client = MongoClient(MONGODB_URL)

database = client[DATABASE_NAME]


def connect_db():
    try:
        client.admin.command("ping")
        print("MongoDB connected successfully!")
    except Exception as e:
        print("MongoDB connection failed:", e)