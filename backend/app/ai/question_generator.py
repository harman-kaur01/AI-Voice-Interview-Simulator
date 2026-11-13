from openai import OpenAI
from app.config.settings import OPENAI_API_KEY


# Initialize OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY)


def generate_questions(
    job_role,
    experience_level,
    interview_type,
    difficulty
):

    prompt = f"""
    You are an experienced technical interviewer.

    Generate 5 interview questions using these details:

    Job Role: {job_role}
    Experience Level: {experience_level}
    Interview Type: {interview_type}
    Difficulty: {difficulty}

    Rules:
    1. Generate relevant interview questions.
    2. Keep questions clear and professional.
    3. Ask one question at a time in the actual interview.
    4. Do not provide answers.

    Return only the numbered questions.
    """

    response = client.responses.create(
        model="gpt-5-mini",
        input=prompt
    )

    return response.output_text

def generate_resume_questions(resume_text):

    prompt = f"""
    You are an experienced technical interviewer.

    Analyze the candidate's resume.

    Generate exactly 5 personalized interview questions
    based on the candidate's actual:

    - Technical skills
    - Projects
    - Work experience
    - Education

    Include practical questions wherever possible.

    Do not ask generic questions unrelated to the resume.

    Resume:
    {resume_text[:12000]}

    Return only 5 numbered questions.
    """

    response = client.responses.create(
        model="gpt-5-mini",
        input=prompt
    )

    import re

    questions = [
        re.sub(r"^\s*\d+[\.)]\s*", "", line).strip()
        for line in response.output_text.splitlines()
        if line.strip()
    ]

    return questions