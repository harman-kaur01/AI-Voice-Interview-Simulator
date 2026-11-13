import json
from openai import OpenAI
from app.config.settings import OPENAI_API_KEY

client = OpenAI(api_key=OPENAI_API_KEY)


def evaluate_answer(question, answer, job_role, is_follow_up=False):

    prompt = f"""
    You are an experienced technical interviewer.

    Evaluate the candidate's answer.

    Job Role: {job_role}
    Question: {question}
    Candidate Answer: {answer}

    Evaluate based on:
    1. Technical correctness
    2. Understanding of the topic
    3. Completeness of the answer

    Return ONLY valid JSON:

    {{
        "score": 8,
        "feedback": "Your explanation is good.",
        "strengths": ["Good understanding"],
        "improvements": ["Add a practical example"],
        "suggested_answer": "A better version of the answer.",
        "follow_up_question": null
    }}

    Adaptive interview rules:

    - Score must be between 0 and 10.
    - Be fair to fresher candidates.
    - If the answer is incorrect, incomplete,
      or scores below 7, create ONE relevant
      follow-up question.
    - The follow-up must test the weak area.
    - If the answer is good and complete,
      return null for follow_up_question.
    - If this is already a follow-up question,
      always return null for follow_up_question.
    - Keep feedback simple and helpful.
    """

    if is_follow_up:
        prompt += "\nThis is already a follow-up question. Do not generate another."

    response = client.responses.create(
        model="gpt-5-mini",
        input=prompt
    )

    result = json.loads(response.output_text)

    return result