import os
import uuid
from pathlib import Path
from io import BytesIO

import fitz
from docx import Document

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException

from app.utils.dependencies import get_current_user
from app.models.resume_model import save_resume
from app.models.resume_model import (
    save_resume,
    get_resume,
    save_generated_questions
)

from app.ai.question_generator import generate_resume_questions


router = APIRouter(
    prefix="/resumes",
    tags=["Resumes"]
)

UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):

    filename = Path(file.filename or "").name
    extension = Path(filename).suffix.lower()

    if extension not in [".pdf", ".docx"]:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are allowed"
        )

    file_content = await file.read()

    if not file_content:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty"
        )

    if len(file_content) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File size must be below 5 MB"
        )

    # Save uploaded file
    unique_filename = f"{uuid.uuid4().hex}{extension}"
    file_path = UPLOAD_DIR / unique_filename

    with open(file_path, "wb") as f:
        f.write(file_content)

    # Extract text from PDF
    if extension == ".pdf":

        pdf = fitz.open(
            stream=file_content,
            filetype="pdf"
        )

        extracted_text = "\n".join(
            page.get_text() for page in pdf
        )

        pdf.close()

    # Extract text from DOCX
    else:

        document = Document(BytesIO(file_content))

        extracted_text = "\n".join(
            paragraph.text
            for paragraph in document.paragraphs
        )

    if not extracted_text.strip():
        file_path.unlink(missing_ok=True)

        raise HTTPException(
            status_code=400,
            detail="No readable text found in resume"
        )

    # Save information in MongoDB
    resume_data = {
        "user_id": current_user["_id"],
        "filename": filename,
        "file_path": str(file_path),
        "extracted_text": extracted_text
    }

    resume_id = save_resume(resume_data)

    return {
        "message": "Resume uploaded successfully!",
        "resume_id": resume_id,
        "filename": filename,
        "extracted_text": extracted_text
    }
@router.post("/{resume_id}/generate-questions")
def generate_resume_questions_api(
    resume_id: str,
    current_user: dict = Depends(get_current_user)
):

    # Find candidate's resume
    resume = get_resume(
        resume_id,
        current_user["_id"]
    )

    if resume is None:
        raise HTTPException(
            status_code=404,
            detail="Resume not found"
        )

    # Generate personalized questions
    questions = generate_resume_questions(
        resume["extracted_text"]
    )

    if len(questions) != 5:
        raise HTTPException(
            status_code=500,
            detail="AI could not generate 5 questions. Please try again."
        )

    # Save questions in MongoDB
    save_generated_questions(
        resume_id,
        questions
    )

    return {
        "message": "Personalized questions generated successfully!",
        "questions": questions
    }