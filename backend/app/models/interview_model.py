from datetime import datetime, timezone
from bson import ObjectId

from app.config.database import database


# MongoDB collection
interview_collection = database["interviews"]


# Create interview
def create_interview(interview_data):

    interview_data["created_at"] = datetime.now(timezone.utc)
    interview_data["status"] = "created"

    result = interview_collection.insert_one(interview_data)

    return str(result.inserted_id)


# Find interview by ID
def get_interview(interview_id):

    if not ObjectId.is_valid(interview_id):
        return None

    return interview_collection.find_one({
        "_id": ObjectId(interview_id)
    })


# Update interview
def update_interview(interview_id, update_data):

    if not ObjectId.is_valid(interview_id):
        return None

    result = interview_collection.update_one(
        {"_id": ObjectId(interview_id)},
        {"$set": update_data}
    )

    return result.modified_count

# SAVE INTERVIEW ANSWER
def save_interview_answer(
    interview_id,
    answer_data,
    next_index,
    status,
    next_question=None,
    is_follow_up=False
):
    if not ObjectId.is_valid(interview_id):
        return False

    result = interview_collection.update_one(
        {"_id": ObjectId(interview_id)},
        {
            "$push": {"answers": answer_data},
            "$set": {
                "current_question_index": next_index,
                "current_question": next_question,
                "current_is_follow_up": is_follow_up,
                "status": status
            }
        }
    )

    return result.modified_count > 0

def get_user_interviews(user_id):

    interviews = interview_collection.find(
        {"user_id": user_id}
    ).sort("_id", -1)

    result = []

    for interview in interviews:

        interview["_id"] = str(interview["_id"])

        # Avoid sending all answers in history
        interview.pop("answers", None)
        interview.pop("questions", None)

        result.append(interview)

    return result