# AI Voice Interview Simulator 🎙️

An AI-powered mock interview platform that helps candidates prepare for technical interviews through voice-based conversations, AI-generated questions, and instant performance feedback.

## 🌐 Live Demo

**Live Website:** ai-voice-interview-simulator.vercel.app

**GitHub Repository:** harman-kaur01/AI-Voice-Interview-Simulator

## 🚀 Features

- **User Authentication:** Secure registration and login using JWT.
- **AI Question Generation:** Generates interview questions based on job role, experience level, interview type, and difficulty.
- **Resume-Based Interviews:** Upload a resume to generate personalized interview questions.
- **Voice-Based Interviews:** Answer questions using speech recognition.
- **Text-to-Speech:** Listen to interview questions using browser speech synthesis.
- **AI Answer Evaluation:** Evaluates answers and provides scores and detailed feedback.
- **Adaptive Follow-up Questions:** Generates follow-up questions based on candidate responses.
- **Performance Reports:** Displays scores, strengths, weaknesses, and suggested answers.
- **Interview History:** Saves previous interviews and reports.
- **Analytics Dashboard:** Visualizes interview performance and progress.

## 🛠️ Tech Stack

### Frontend
- React.js
- Vite
- JavaScript
- CSS
- Web Speech API
- Recharts

### Backend
- Python
- FastAPI
- REST APIs
- WebSockets
- JWT Authentication

### AI Integration
- OpenAI API
- GPT-5-mini

### Database
- MongoDB Atlas

### Deployment
- Vercel — Frontend
- Render — Backend

## 🏗️ Project Structure

```text
AI-Voice-Interview-Simulator/
│
├── backend/
│   ├── app/
│   │   ├── config/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── websocket/
│   │   └── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── components/
│   └── package.json
│
└── README.md
```

## ⚙️ Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/harman-kaur01/AI-Voice-Interview-Simulator
cd AI-Voice-Interview-Simulator
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
```

Activate the virtual environment on Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file inside the backend folder:

```env
MONGODB_URL=your_mongodb_connection_string
DATABASE_NAME=your_database_name
JWT_SECRET=your_secret_key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
OPENAI_API_KEY=your_openai_api_key
```

Start the backend:

```bash
uvicorn app.main:app --reload
```

Backend documentation:

`http://127.0.0.1:8000/docs`

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
```

Create a `.env` file inside the frontend folder:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Start the frontend:

```bash
npm run dev
```

Open:

`http://localhost:5173`

## 🔄 How It Works

1. The user registers and logs in.
2. The user selects interview preferences.
3. The backend generates questions using the OpenAI API.
4. Questions are delivered through the interview interface.
5. The candidate answers using voice or text.
6. The backend evaluates answers using AI.
7. Follow-up questions are generated when appropriate.
8. The final report displays performance scores and improvement suggestions.
9. Interview history and reports are stored in MongoDB.

## 🔐 Security

- JWT-based authentication.
- Password hashing.
- Protected API endpoints.
- Environment variables for sensitive credentials.

Never commit `.env` files or API keys to GitHub.

## 🎯 Project Objective

The goal of this project is to make interview preparation more interactive and accessible by combining Generative AI, voice technology, and personalized performance analysis.

## 👩‍💻 Author

**Harman Kaur**

GitHub: harman-kaur01