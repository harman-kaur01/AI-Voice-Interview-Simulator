from datetime import datetime, timezone
import re

from app.models.interview_model import (
    create_interview,
    get_interview,
    update_interview,
    save_interview_answer
)

from app.ai.question_generator import generate_questions
from app.ai.answer_evaluator import evaluate_answer


# CREATE INTERVIEW
def create_new_interview(interview_data, user_id):
    interview = {
        "user_id": user_id,
        "job_role": interview_data.job_role,
        "experience_level": interview_data.experience_level,
        "interview_type": interview_data.interview_type,
        "duration_minutes": interview_data.duration_minutes,
        "difficulty": interview_data.difficulty
    }

    interview_id = create_interview(interview)

    return {
        "message": "Interview created successfully!",
        "interview_id": interview_id
    }


# GENERATE QUESTIONS
def generate_interview_questions(interview_id, user_id):
    interview = get_interview(interview_id)

    if interview is None or interview["user_id"] != user_id:
        return None

    questions = generate_questions(
        job_role=interview["job_role"],
        experience_level=interview["experience_level"],
        interview_type=interview["interview_type"],
        difficulty=interview["difficulty"]
    )

    update_interview(
        interview_id,
        {
            "questions": questions,
            "status": "ready"
        }
    )

    return {
        "message": "Interview questions generated successfully!",
        "questions": questions
    }


# START INTERVIEW

# START INTERVIEW
def start_interview(interview_id, user_id):
    interview = get_interview(interview_id)

    if interview is None or interview["user_id"] != user_id:
        return None

    if not interview.get("questions"):
        return None

    raw_questions = interview["questions"]

    if isinstance(raw_questions, list):
        raw_questions = "\n".join(raw_questions)

    # Split numbered questions, even if they appear on the same line
    questions = re.split(
        r"(?=\b[1-5]\.\s)",
        raw_questions.strip()
    )

    questions = [
        re.sub(r"^\s*\d+\.\s*", "", q.strip())
        for q in questions
        if q.strip()
    ]

    if not questions:
        return None

    update_interview(
        interview_id,
        {
            "questions": questions,
            "current_question_index": 0,
            "current_question": questions[0],
            "current_is_follow_up": False,
            "status": "in_progress",
            "answers": []
        }
    )

    return {
        "message": "Interview started successfully!",
        "question_number": 1,
        "total_questions": len(questions),
        "question": questions[0]
    }

# SUBMIT ANSWER AND ADAPTIVE EVALUATION
def submit_interview_answer(interview_id, user_id, answer):

    interview = get_interview(interview_id)

    if interview is None or interview["user_id"] != user_id:
        return None

    if interview.get("status") != "in_progress":
        return None

    questions = interview.get("questions", [])
    index = interview.get("current_question_index", 0)

    if index >= len(questions):
        return None

    is_follow_up = interview.get("current_is_follow_up", False)

    current_question = (
        interview.get("current_question")
        or questions[index]
    )

    # Evaluate answer using OpenAI
    evaluation = evaluate_answer(
        question=current_question,
        answer=answer,
        job_role=interview["job_role"],
        is_follow_up=is_follow_up
    )

    answer_data = {
        "question": current_question,
        "answer": answer,
        "is_follow_up": is_follow_up,
        "evaluation": evaluation,
        "answered_at": datetime.now(timezone.utc)
    }

    # Check whether AI generated a follow-up
    follow_up_question = evaluation.get("follow_up_question")

    # CASE 1: Ask follow-up question
    if not is_follow_up and follow_up_question:

        saved = save_interview_answer(
            interview_id,
            answer_data,
            index,
            "in_progress",
            follow_up_question,
            True
        )

        if not saved:
            return None

        return {
            "message": "Your answer was evaluated. Here is a follow-up question!",
            "status": "in_progress",
            "evaluation": evaluation,
            "question_type": "follow_up",
            "next_question": follow_up_question
        }

    # CASE 2: Move to next main question
    next_index = index + 1

    status = (
        "in_progress"
        if next_index < len(questions)
        else "completed"
    )

    next_question = (
        questions[next_index]
        if status == "in_progress"
        else None
    )

    saved = save_interview_answer(
        interview_id,
        answer_data,
        next_index,
        status,
        next_question,
        False
    )

    if not saved:
        return None

    if status == "completed":
        return {
            "message": "Interview completed successfully!",
            "status": "completed",
            "total_answered": next_index,
            "evaluation": evaluation
        }

    return {
        "message": "Answer evaluated successfully!",
        "status": "in_progress",
        "evaluation": evaluation,
        "question_type": "main",
        "question_number": next_index + 1,
        "total_questions": len(questions),
        "next_question": next_question
    }