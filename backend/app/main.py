from fastapi import FastAPI
from app.config.database import connect_db
from app.routes.auth_routes import router as auth_router
from app.routes.interview_routes import router as interview_router
from fastapi.middleware.cors import CORSMiddleware
from app.websocket.interview_socket import router as websocket_router
from app.routes.resume_routes import router as resume_router

app = FastAPI(
    title="AI Voice Interview Simulator",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://ai-voice-interview-simulator-isrnu03n7-harman-kaur01.vercel.app",
    ],
    allow_origin_regex=r"https://ai-voice-interview-simulator-[a-z0-9-]+-harman-kaur01\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    connect_db()


app.include_router(auth_router)
app.include_router(interview_router)
app.include_router(websocket_router)
app.include_router(resume_router)


@app.get("/")
def home():
    return {
        "message": "AI Voice Interview Simulator API is running!"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }