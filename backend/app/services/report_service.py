from app.models.interview_model import get_interview, update_interview


def generate_interview_report(interview_id, user_id):

    # Get interview details
    interview = get_interview(interview_id)

    if interview is None or interview["user_id"] != user_id:
        return None

    if interview.get("status") != "completed":
        return {
            "error": "Complete the interview before generating a report."
        }

    answers = interview.get("answers", [])

    if not answers:
        return {
            "error": "No answers found for this interview."
        }

    scores = []
    strengths = []
    improvements = []
    question_reports = []

    for item in answers:

        evaluation = item.get("evaluation", {})

        score = evaluation.get("score", 0)

        scores.append(float(score))

        strengths.extend(
            evaluation.get("strengths", [])
        )

        improvements.extend(
            evaluation.get("improvements", [])
        )

        question_reports.append({
            "question": item.get("question"),
            "answer": item.get("answer"),
            "score": score,
            "feedback": evaluation.get("feedback"),
            "suggested_answer": evaluation.get("suggested_answer")
        })

    # Calculate average score
    average_score = round(
        sum(scores) / len(scores), 2
    )

    # Performance rating
    if average_score >= 8:
        rating = "Excellent"
    elif average_score >= 6:
        rating = "Good"
    elif average_score >= 4:
        rating = "Average"
    else:
        rating = "Needs Improvement"

    report = {
        "total_answers": len(answers),
        "average_score": average_score,
        "rating": rating,
        "strengths": list(set(strengths)),
        "improvements": list(set(improvements)),
        "question_reports": question_reports
    }

    # Save report in MongoDB
    update_interview(
        interview_id,
        {"report": report}
    )

    return {
        "message": "Interview report generated successfully!",
        "report": report
    }