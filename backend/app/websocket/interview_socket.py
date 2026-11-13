from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import jwt, JWTError
from starlette.concurrency import run_in_threadpool

from app.config.settings import JWT_SECRET, JWT_ALGORITHM
from app.models.interview_model import get_interview
from app.services.interview_service import submit_interview_answer

router = APIRouter()


@router.websocket("/ws/interview/{interview_id}")
async def interview_websocket(
    websocket: WebSocket,
    interview_id: str
):
    await websocket.accept()

    try:
        # FIRST MESSAGE: AUTHENTICATION
        auth_data = await websocket.receive_json()

        token = auth_data.get("token")

        if not token:
            await websocket.send_json({
                "error": "Authentication token required"
            })
            await websocket.close()
            return

        try:
            payload = jwt.decode(
                token,
                JWT_SECRET,
                algorithms=[JWT_ALGORITHM]
            )
            user_id = payload.get("sub")

        except JWTError:
            await websocket.send_json({
                "error": "Invalid or expired token"
            })
            await websocket.close()
            return

        # CHECK INTERVIEW OWNERSHIP
        interview = get_interview(interview_id)

        if interview is None or interview["user_id"] != user_id:
            await websocket.send_json({
                "error": "Interview not found or access denied"
            })
            await websocket.close()
            return

        await websocket.send_json({
            "message": "Connected to AI interview successfully!"
        })

        # RECEIVE ANSWERS
        while True:
            data = await websocket.receive_json()

            answer = data.get("answer", "").strip()

            if not answer:
                await websocket.send_json({
                    "error": "Please provide an answer"
                })
                continue

            # RUN AI EVALUATION
            result = await run_in_threadpool(
                submit_interview_answer,
                interview_id,
                user_id,
                answer
            )

            if result is None:
                await websocket.send_json({
                    "error": "Unable to evaluate answer"
                })
                continue

            await websocket.send_json(result)

    except WebSocketDisconnect:
        print("Interview WebSocket disconnected!")