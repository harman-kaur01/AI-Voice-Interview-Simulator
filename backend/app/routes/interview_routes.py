from fastapi import APIRouter, Depends

from app.schemas.interview_schema import InterviewCreate
from app.services.interview_service import (
    create_new_interview,
    generate_interview_questions
)
from app.utils.dependencies import get_current_user
from app.services.interview_service import (
    create_new_interview,
    generate_interview_questions,
    start_interview
)
from app.schemas.answer_schema import AnswerSubmit

from app.services.interview_service import submit_interview_answer
from app.services.report_service import generate_interview_report
from app.models.interview_model import get_user_interviews

router = APIRouter(
    prefix="/interviews",
    tags=["Interviews"]
)


# CREATE INTERVIEW API
@router.post("/create")
def create_interview(
    interview_data: InterviewCreate,
    current_user: dict = Depends(get_current_user)
):

    result = create_new_interview(
        interview_data,
        current_user["_id"]
    )

    return result
# GENERATE AI QUESTIONS API
@router.post("/{interview_id}/generate-questions")
def generate_questions_api(
    interview_id: str,
    current_user: dict = Depends(get_current_user)
):

    result = generate_interview_questions(
        interview_id,
        current_user["_id"]
    )

    if result is None:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=404,
            detail="Interview not found or access denied"
        )

    return result
# START INTERVIEW
@router.post("/{interview_id}/start")
def start_interview_api(
    interview_id: str,
    current_user: dict = Depends(get_current_user)
):

    result = start_interview(
        interview_id,
        current_user["_id"]
    )

    if result is None:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=404,
            detail="Interview not found or questions not generated"
        )

    return result
# SUBMIT INTERVIEW ANSWER
@router.post("/{interview_id}/answer")
def submit_answer_api(
    interview_id: str,
    answer_data: AnswerSubmit,
    current_user: dict = Depends(get_current_user)
):

    result = submit_interview_answer(
        interview_id,
        current_user["_id"],
        answer_data.answer
    )

    if result is None:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=400,
            detail="Unable to submit answer"
        )

    return result
@router.get("/{interview_id}/report")
def get_interview_report(
    interview_id: str,
    current_user: dict = Depends(get_current_user)
):

    result = generate_interview_report(
        interview_id,
        current_user["_id"]
    )

    if result is None:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=404,
            detail="Interview not found"
        )

    if "error" in result:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=400,
            detail=result["error"]
        )

    return result
@router.get("/history")
def get_interview_history(
    current_user: dict = Depends(get_current_user)
):

    interviews = get_user_interviews(
        current_user["_id"]
    )

    return {
        "message": "Interview history fetched successfully!",
        "total_interviews": len(interviews),
        "interviews": interviews
    }