from app.ai.question_generator import generate_questions

questions = generate_questions(
    job_role="Python Developer",
    experience_level="Fresher",
    interview_type="Technical",
    difficulty="Medium"
)

print("\nAI GENERATED INTERVIEW QUESTIONS:\n")
print(questions)