from pydantic import BaseModel, Field

class AnswerSubmit(BaseModel):
    answer: str = Field(min_length=1)