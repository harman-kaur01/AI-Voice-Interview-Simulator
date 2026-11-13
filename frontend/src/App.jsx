import { useState, useRef } from "react";
import "./App.css";
import Analytics from "./Analytics";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function App() {
  // AUTHENTICATION
  const [token, setToken] = useState("");

  // INTERVIEW CONFIGURATION
  const [interviewId, setInterviewId] = useState("");
  const [resumeId, setResumeId] = useState("");
  const [resumeName, setResumeName] = useState("");

  const [jobRole, setJobRole] = useState("Python Developer");
  const [experienceLevel, setExperienceLevel] = useState("Fresher");
  const [interviewType, setInterviewType] = useState("Technical");
  const [difficulty, setDifficulty] = useState("Medium");
  const [duration, setDuration] = useState(30);

  // NAVIGATION
  const [page, setPage] = useState("dashboard");

  // DASHBOARD
  const [history, setHistory] = useState([]);
  const [report, setReport] = useState(null);

  // LIVE INTERVIEW
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState(null);

  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);

  // WEBSOCKET
  const [socket, setSocket] = useState(null);
  const [wsStatus, setWsStatus] = useState("Disconnected");

  const recognitionRef = useRef(null);

  // COMMON HEADERS
  const getHeaders = () => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  });

  // NAVIGATION HELPERS
  const openHistory = () => {
    setPage("dashboard");

    setTimeout(() => {
      document
        .getElementById("history-section")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const openPage = (selectedPage) => {
    setPage(selectedPage);
    setMessage("");
  };

  // SPEAK QUESTION
  const speakQuestion = (text) => {
    if (!text) return;

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-IN";
    speech.rate = 0.9;

    window.speechSynthesis.speak(speech);
  };

  // FETCH INTERVIEW HISTORY
  const fetchHistory = async () => {
    try {
      if (!token.trim()) {
        setMessage("Please enter your JWT token.");
        return;
      }

      setLoading(true);

      const response = await fetch(
        `${API_URL}/interviews/history`,
        {
          headers: getHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to fetch history");
      }

      setHistory(data.interviews || []);
      setMessage("Interview history updated successfully!");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // VIEW INTERVIEW REPORT
  const viewReport = async (id) => {
    try {
      setLoading(true);
      setReport(null);

      const response = await fetch(
        `${API_URL}/interviews/${id}/report`,
        {
          headers: getHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to fetch report");
      }

      setReport(data.report);
      setPage("report");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // UPLOAD RESUME
  const uploadResume = async (event) => {
    const file = event.target.files[0];

    if (!file) return;

    try {
      if (!token.trim()) {
        throw new Error("Please enter your JWT token first.");
      }

      const extension = file.name.split(".").pop().toLowerCase();

      if (!["pdf", "docx"].includes(extension)) {
        throw new Error("Only PDF and DOCX files are allowed.");
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Resume must be smaller than 5 MB.");
      }

      setLoading(true);
      setResumeId("");
      setResumeName("");

      setMessage("Uploading resume...");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${API_URL}/resumes/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Resume upload failed");
      }

      setResumeId(data.resume_id);
      setResumeName(data.filename);

      setMessage("Resume uploaded! Generating personalized questions...");

      const questionResponse = await fetch(
        `${API_URL}/resumes/${data.resume_id}/generate-questions`,
        {
          method: "POST",
          headers: getHeaders(),
        }
      );

      const questionData = await questionResponse.json();

      if (!questionResponse.ok) {
        throw new Error(
          questionData.detail || "Question generation failed"
        );
      }

      setMessage(
        "Resume uploaded and personalized questions generated successfully!"
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  // CREATE NEW INTERVIEW
  const createNewInterview = async () => {
    try {
      if (!token.trim()) {
        throw new Error("Please enter your JWT token.");
      }

      if (duration < 5 || duration > 120) {
        throw new Error("Duration must be between 5 and 120 minutes.");
      }

      setLoading(true);
      setMessage("Creating your interview...");

      const response = await fetch(
        `${API_URL}/interviews/create`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            job_role: jobRole,
            experience_level: experienceLevel,
            interview_type: interviewType,
            duration_minutes: Number(duration),
            difficulty: difficulty,
            resume_id: resumeId || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Interview creation failed");
      }

      const newInterviewId = data.interview_id;
      setInterviewId(newInterviewId);

      setMessage("Generating interview questions...");

      const questionResponse = await fetch(
        `${API_URL}/interviews/${newInterviewId}/generate-questions`,
        {
          method: "POST",
          headers: getHeaders(),
        }
      );

      const questionData = await questionResponse.json();

      if (!questionResponse.ok) {
        throw new Error(
          questionData.detail || "Question generation failed"
        );
      }

      setMessage(
        "Interview created and questions generated successfully!"
      );

      await fetchHistory();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // START INTERVIEW
  const startInterview = async () => {
    try {
      if (!token.trim() || !interviewId.trim()) {
        throw new Error("Please enter your token and interview ID.");
      }

      setLoading(true);
      setMessage("Starting your interview...");

      const response = await fetch(
        `${API_URL}/interviews/${interviewId}/start`,
        {
          method: "POST",
          headers: getHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to start interview");
      }

      setQuestion(data.question);
      setStarted(true);
      setCompleted(false);
      setEvaluation(null);
      setAnswer("");
      setReport(null);

      setPage("interview");
      speakQuestion(data.question);

      setMessage("Interview started successfully!");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // SPEECH TO TEXT
  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMessage("Please use Google Chrome or Microsoft Edge.");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setListening(true);
      setMessage("Listening... Speak your answer.");
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;

      setAnswer((previous) =>
        previous ? previous + " " + transcript : transcript
      );
    };

    recognition.onerror = (event) => {
      setMessage("Microphone error: " + event.error);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // CONNECT WEBSOCKET
  const connectWebSocket = () => {
    if (!token.trim() || !interviewId.trim()) {
      setMessage("Please enter your token and interview ID.");
      return;
    }

    if (
      socket &&
      (socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING)
    ) {
      setMessage("WebSocket is already connected.");
      return;
    }

    setMessage("Connecting to AI interviewer...");
    setWsStatus("Connecting");

    // Automatically use ws:// locally and wss:// on Render
    const WS_URL = API_URL.replace(/^http/, "ws");

    const ws = new WebSocket(
      `${WS_URL}/ws/interview/${interviewId}`
    );

    ws.onopen = () => {
      ws.send(JSON.stringify({ token }));
    };

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      if (data.error) {
        setMessage(data.error);
        setWsStatus("Error");
        setLoading(false);
        return;
      }

      if (
        data.message ===
        "Connected to AI interview successfully!"
      ) {
        setSocket(ws);
        setWsStatus("Connected");
        setMessage("WebSocket connected successfully!");
        return;
      }

      if (data.evaluation) {
        setEvaluation(data.evaluation);
        setAnswer("");
        setLoading(false);

        if (data.status === "completed") {
          setCompleted(true);
          setQuestion("");
          setMessage("Congratulations! Interview completed!");

          ws.close();

          await fetchHistory();
          await viewReport(interviewId);
        } else {
          setQuestion(data.next_question);
          speakQuestion(data.next_question);

          if (data.question_type === "follow_up") {
            setMessage("AI generated a follow-up question!");
          } else {
            setMessage(
              "Answer evaluated! Here is your next question."
            );
          }
        }
      }
    };

    ws.onerror = () => {
      setWsStatus("Connection Error");
      setMessage("WebSocket connection failed.");
      setLoading(false);
    };

    ws.onclose = () => {
      setWsStatus("Disconnected");
      setSocket(null);
    };
  };

  // SUBMIT ANSWER
  const submitAnswer = () => {
    if (!answer.trim()) {
      setMessage("Please enter your answer.");
      return;
    }

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setMessage("Please connect to the AI interview first.");
      return;
    }

    setLoading(true);
    setMessage("AI is evaluating your answer...");

    socket.send(JSON.stringify({ answer }));
  };

  // DASHBOARD STATISTICS
  const completedInterviews = history.filter(
    (item) => item.status === "completed"
  );

  const scoredInterviews = completedInterviews.filter(
    (item) => item.report?.average_score !== undefined
  );

  const averageScore =
    scoredInterviews.length > 0
      ? (
          scoredInterviews.reduce(
            (total, item) =>
              total + Number(item.report.average_score),
            0
          ) / scoredInterviews.length
        ).toFixed(1)
      : "0.0";

  // SIDEBAR
  const navigationItems = [
    { id: "dashboard", icon: "▦", label: "Dashboard" },
    { id: "new", icon: "＋", label: "Create Interview" },
    { id: "history", icon: "▤", label: "My Interviews" },
    { id: "analytics", icon: "▥", label: "Analytics" },
  ];

  return (
    <div className="app-shell">

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">AI</div>

          <div>
            <h2>Interview<span>AI</span></h2>
            <p>VOICE SIMULATOR</p>
          </div>
        </div>

        <div className="sidebar-label">WORKSPACE</div>

        <nav className="sidebar-nav">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${
                page === item.id ||
                (item.id === "history" &&
                  (page === "report" || page === "dashboard"))
                  ? item.id === "dashboard" && page !== "dashboard"
                    ? ""
                    : "active"
                  : ""
              }`}
              onClick={() => {
                if (item.id === "history") {
                  openHistory();
                } else {
                  openPage(item.id);
                }
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <div className="help-icon">✦</div>
            <h4>Ready to improve?</h4>
            <p>Practice regularly to build interview confidence.</p>
            <button onClick={() => openPage("new")}>
              Start practicing
            </button>
          </div>

          <div className="sidebar-footer">
            <div className="user-avatar">U</div>
            <div>
              <strong>Job Seeker</strong>
              <span>Personal workspace</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="main-area">

        {/* TOPBAR */}
        <header className="topbar">
          <div>
            <h3>
              {page === "dashboard" && "Dashboard"}
              {page === "new" && "Create Interview"}
              {page === "analytics" && "Performance Analytics"}
              {page === "interview" && "Live Interview"}
              {page === "report" && "Interview Report"}
            </h3>
            <p>AI-powered interview preparation platform</p>
          </div>

          <div className="topbar-actions">
            <div className="connection-indicator">
              <span className="online-dot"></span>
              AI Platform
            </div>

            <button
              className="refresh-button"
              onClick={fetchHistory}
              disabled={loading}
            >
              ↻ Refresh
            </button>
          </div>
        </header>

        {/* TOKEN AUTHENTICATION */}
        <section className="auth-card">
          <div className="auth-heading">
            <div className="auth-icon">🔐</div>
            <div>
              <strong>Authentication</strong>
              <span>Enter your JWT access token to connect your account.</span>
            </div>
          </div>

          <input
            type="password"
            placeholder="Paste your JWT access token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </section>

        {/* GLOBAL MESSAGE */}
        {message && (
          <div className="message">
            <span>●</span>
            {message}
            <button
              className="message-close"
              onClick={() => setMessage("")}
            >
              ×
            </button>
          </div>
        )}

        {/* DASHBOARD */}
        {page === "dashboard" && (
          <main className="dashboard">

            <section className="hero-section">
              <div className="hero-content">
                <span className="hero-tag">✦ YOUR AI CAREER ASSISTANT</span>
                <h1>Welcome back! 👋</h1>
                <p>
                  Build confidence, improve your skills, and prepare
                  for your next interview with AI.
                </p>

                <button
                  className="hero-button"
                  onClick={() => openPage("new")}
                >
                  + Start New Interview
                </button>
              </div>

              <div className="hero-illustration">
                <div className="hero-circle">🎤</div>
                <div className="floating-card">
                  <span>✦</span>
                  AI Interview Practice
                </div>
              </div>
            </section>

            {/* STATISTICS */}
            <section className="stats-container">
              <div className="stat-card stat-blue">
                <div className="stat-top">
                  <span>Total Interviews</span>
                  <div className="stat-icon">▤</div>
                </div>
                <h1>{history.length}</h1>
                <p>All your practice sessions</p>
              </div>

              <div className="stat-card stat-green">
                <div className="stat-top">
                  <span>Completed Interviews</span>
                  <div className="stat-icon">✓</div>
                </div>
                <h1>{completedInterviews.length}</h1>
                <p>Successfully completed</p>
              </div>

              <div className="stat-card stat-purple">
                <div className="stat-top">
                  <span>Average Score</span>
                  <div className="stat-icon">★</div>
                </div>
                <h1>{averageScore}<small>/10</small></h1>
                <p>Your overall performance</p>
              </div>
            </section>

            {/* QUICK ACTIONS */}
            <section className="quick-actions">
              <div>
                <h2>Quick Actions</h2>
                <p>What would you like to do today?</p>
              </div>

              <div className="quick-action-grid">
                <button
                  className="quick-action"
                  onClick={() => openPage("new")}
                >
                  <span className="quick-icon blue-icon">＋</span>
                  <div>
                    <strong>Create Interview</strong>
                    <p>Start a new AI session</p>
                  </div>
                  <span className="arrow">→</span>
                </button>

                <button
                  className="quick-action"
                  onClick={() => openPage("analytics")}
                >
                  <span className="quick-icon purple-icon">▥</span>
                  <div>
                    <strong>View Analytics</strong>
                    <p>Track your performance</p>
                  </div>
                  <span className="arrow">→</span>
                </button>
              </div>
            </section>

            {/* INTERVIEW HISTORY */}
            <section className="history-section" id="history-section">
              <div className="section-heading">
                <div>
                  <h2>Recent Interviews</h2>
                  <p>Review your previous interview sessions.</p>
                </div>

                <button
                  className="outline-button"
                  onClick={fetchHistory}
                  disabled={loading}
                >
                  ↻ Refresh History
                </button>
              </div>

              {history.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <h3>No interviews yet</h3>
                  <p>
                    Your interview history will appear here.
                    Start your first AI interview today!
                  </p>

                  <button onClick={() => openPage("new")}>
                    Create Your First Interview
                  </button>
                </div>
              ) : (
                <div className="history-grid">
                  {history.map((item) => (
                    <div className="history-card" key={item._id}>
                      <div className="history-card-top">
                        <div className="job-icon">💼</div>

                        <span
                          className={`status ${
                            item.status === "completed"
                              ? "status-completed"
                              : "status-pending"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <h3>{item.job_role}</h3>

                      <p>
                        <strong>Experience:</strong>{" "}
                        {item.experience_level}
                      </p>

                      <p>
                        <strong>Type:</strong> {item.interview_type}
                      </p>

                      <p>
                        <strong>Difficulty:</strong> {item.difficulty}
                      </p>

                      <div className="history-score">
                        <span>Performance Score</span>
                        <strong>
                          {item.report?.average_score !== undefined
                            ? `${item.report.average_score}/10`
                            : "—"}
                        </strong>
                      </div>

                      {item.status === "completed" && (
                        <button
                          className="report-button"
                          onClick={() => viewReport(item._id)}
                        >
                          View Full Report →
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </main>
        )}

        {/* CREATE INTERVIEW */}
        {page === "new" && (
          <main className="page-content">
            <div className="page-intro">
              <span className="page-tag">INTERVIEW SETUP</span>
              <h1>Create Your AI Interview</h1>
              <p>
                Customize your interview and let AI help you prepare.
              </p>
            </div>

            <div className="interview-card">
              <div className="form-heading">
                <div className="form-icon">⚙</div>
                <div>
                  <h2>Interview Configuration</h2>
                  <p>Choose your preferred interview settings.</p>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Job Role</label>
                  <input
                    type="text"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    placeholder="e.g. Python Developer"
                  />
                </div>

                <div className="form-group">
                  <label>Experience Level</label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                  >
                    <option>Fresher</option>
                    <option>0-2 years</option>
                    <option>2-5 years</option>
                    <option>5+ years</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Interview Type</label>
                  <select
                    value={interviewType}
                    onChange={(e) => setInterviewType(e.target.value)}
                  >
                    <option>Technical</option>
                    <option>HR</option>
                    <option>Mixed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                  >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>
              </div>

              {/* RESUME UPLOAD */}
              <div className="resume-section">
                <div className="resume-heading">
                  <div className="resume-icon">📄</div>
                  <div>
                    <h3>Upload Your Resume</h3>
                    <p>
                      Get personalized questions based on your resume.
                    </p>
                  </div>
                </div>

                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={uploadResume}
                  disabled={loading}
                />

                <small>Supported formats: PDF, DOCX · Maximum 5 MB</small>

                {resumeName && (
                  <div className="resume-success">
                    <strong>✓ {resumeName}</strong>
                    <p>Resume ID: {resumeId}</p>
                  </div>
                )}
              </div>

              <button
                className="primary-button"
                onClick={createNewInterview}
                disabled={loading || !token.trim()}
              >
                {loading ? "Please wait..." : "Create AI Interview →"}
              </button>

              {interviewId && (
                <div className="created-interview">
                  <h3>🎉 Interview Created Successfully!</h3>
                  <p>Your Interview ID:</p>

                  <input type="text" value={interviewId} readOnly />

                  <button
                    className="primary-button"
                    onClick={startInterview}
                    disabled={loading}
                  >
                    Start Interview →
                  </button>
                </div>
              )}
            </div>
          </main>
        )}

        {/* LIVE INTERVIEW */}
        {page === "interview" && (
          <main className="page-content">
            <div className="page-intro">
              <span className="page-tag">LIVE SESSION</span>
              <h1>Your AI Interview</h1>
              <p>Answer questions and receive instant AI feedback.</p>
            </div>

            <div className="interview-card live-interview-card">
              {!completed && (
                <>
                  <div className="live-header">
                    <div>
                      <span className="live-dot"></span>
                      LIVE INTERVIEW
                    </div>
                    <span className="connection-badge">
                      {wsStatus}
                    </span>
                  </div>

                  <div className="question-box">
                    <span className="question-label">
                      AI INTERVIEWER
                    </span>
                    <h3>Interview Question</h3>
                    <p>{question}</p>

                    <button
                      className="outline-button"
                      onClick={() => speakQuestion(question)}
                    >
                      🔊 Hear Question Again
                    </button>
                  </div>

                  <div className="answer-section">
                    <h3>Your Answer</h3>

                    <textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Speak or type your answer here..."
                      disabled={loading}
                    />
                  </div>

                  <div className="websocket-section">
                    <div>
                      <h3>AI Connection</h3>
                      <p>Connection Status: {wsStatus}</p>
                    </div>

                    <button
                      className="outline-button"
                      onClick={connectWebSocket}
                      disabled={
                        wsStatus === "Connected" ||
                        wsStatus === "Connecting"
                      }
                    >
                      Connect to AI
                    </button>
                  </div>

                  <div className="buttons">
                    <button
                      onClick={startListening}
                      disabled={listening || loading}
                    >
                      🎤 {listening ? "Listening..." : "Start Speaking"}
                    </button>

                    <button
                      className="secondary-button"
                      onClick={() => recognitionRef.current?.stop()}
                      disabled={!listening}
                    >
                      ⏹ Stop
                    </button>

                    <button
                      className="primary-button"
                      onClick={submitAnswer}
                      disabled={
                        loading ||
                        listening ||
                        !answer.trim() ||
                        wsStatus !== "Connected"
                      }
                    >
                      {loading ? "Evaluating..." : "Submit Answer →"}
                    </button>
                  </div>
                </>
              )}

              {evaluation && (
                <div className="evaluation">
                  <h2>AI Evaluation</h2>
                  <div className="evaluation-score">
                    {evaluation.score}<small>/10</small>
                  </div>

                  <p>{evaluation.feedback}</p>

                  <h3>💪 Strengths</h3>
                  <ul>
                    {evaluation.strengths?.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>

                  <h3>📈 Areas to Improve</h3>
                  <ul>
                    {evaluation.improvements?.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>

                  <h3>Suggested Answer</h3>
                  <p>{evaluation.suggested_answer}</p>
                </div>
              )}

              {completed && (
                <div className="completed-section">
                  <div className="completed-icon">✓</div>
                  <h2>Interview Completed!</h2>
                  <p>
                    Congratulations! You have successfully completed
                    your AI interview.
                  </p>

                  <button
                    className="primary-button"
                    onClick={() => openPage("dashboard")}
                  >
                    Go to Dashboard
                  </button>
                </div>
              )}
            </div>
          </main>
        )}

        {/* ANALYTICS */}
        {page === "analytics" && (
          <main className="page-content analytics-wrapper">
            <div className="page-intro">
              <span className="page-tag">YOUR PROGRESS</span>
              <h1>Performance Analytics</h1>
              <p>
                Understand your strengths and track your interview progress.
              </p>
            </div>

            <Analytics token={token} />
          </main>
        )}

        {/* REPORT */}
        {page === "report" && report && (
          <main className="page-content">
            <div className="page-intro">
              <span className="page-tag">PERFORMANCE REVIEW</span>
              <h1>Interview Performance Report</h1>
              <p>Review your AI evaluation and suggested improvements.</p>
            </div>

            <div className="interview-card report-section">
              <div className="stats-container">
                <div className="stat-card stat-blue">
                  <span>Average Score</span>
                  <h1>{report.average_score}/10</h1>
                </div>

                <div className="stat-card stat-purple">
                  <span>Performance</span>
                  <h1>{report.rating}</h1>
                </div>

                <div className="stat-card stat-green">
                  <span>Total Answers</span>
                  <h1>{report.total_answers}</h1>
                </div>
              </div>

              <section className="report-detail">
                <h3>💪 Your Strengths</h3>
                <ul>
                  {report.strengths?.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </section>

              <section className="report-detail">
                <h3>📈 Areas to Improve</h3>
                <ul>
                  {report.improvements?.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </section>

              <section className="report-detail">
                <h3>Question-wise Performance</h3>

                {report.question_reports?.map((item, index) => (
                  <div className="history-card report-question" key={index}>
                    <h4>Question {index + 1}</h4>

                    <p><strong>{item.question}</strong></p>

                    <p>
                      <strong>Your Answer:</strong> {item.answer}
                    </p>

                    <p>
                      <strong>Score:</strong> {item.score}/10
                    </p>

                    <p>
                      <strong>Feedback:</strong> {item.feedback}
                    </p>

                    <p>
                      <strong>Suggested Answer:</strong>{" "}
                      {item.suggested_answer}
                    </p>
                  </div>
                ))}
              </section>

              <button
                className="primary-button"
                onClick={() => openPage("dashboard")}
              >
                ← Back to Dashboard
              </button>
            </div>
          </main>
        )}

        {/* FOOTER */}
        <footer className="app-footer">
          <p>InterviewAI © 2026 · Powered by Artificial Intelligence</p>
        </footer>
      </div>
    </div>
  );
}

export default App;