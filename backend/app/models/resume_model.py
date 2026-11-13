from datetime import datetime, timezone
from bson import ObjectId
from app.config.database import database

resume_collection = database["resumes"]


def save_resume(resume_data):
    resume_data["uploaded_at"] = datetime.now(timezone.utc)

    result = resume_collection.insert_one(resume_data)

    return str(result.inserted_id)


def get_resume(resume_id, user_id):
    if not ObjectId.is_valid(resume_id):
        return None

    return resume_collection.find_one({
        "_id": ObjectId(resume_id),
        "user_id": user_id
    })


def save_generated_questions(resume_id, questions):
    result = resume_collection.update_one(
        {"_id": ObjectId(resume_id)},
        {
            "$set": {
                "generated_questions": questions
            }
        }
    )

    return result.modified_count > 0