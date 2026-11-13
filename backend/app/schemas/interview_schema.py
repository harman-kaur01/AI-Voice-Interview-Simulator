from pydantic import BaseModel, Field
from typing import Literal


class InterviewCreate(BaseModel):

    job_role: str

    experience_level: Literal[
        "Fresher",
        "0-2 years",
        "2-5 years",
        "5+ years"
    ]

    interview_type: Literal[
        "Technical",
        "HR",
        "Mixed"
    ]

    duration_minutes: int = Field(
        default=30,
        ge=5,
        le=120
    )

    difficulty: Literal[
        "Easy",
        "Medium",
        "Hard"
    ] = "Medium"