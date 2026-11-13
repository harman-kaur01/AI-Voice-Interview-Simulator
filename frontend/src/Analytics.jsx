import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import "./Analytics.css";

const API_URL = "http://127.0.0.1:8000";

function Analytics({ token }) {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/interviews/history`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Unable to load interview history."
          );
        }

        setInterviews(
          Array.isArray(data) ? data : data.interviews || []
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadAnalytics();
    } else {
      setError("Please enter your JWT token first.");
      setLoading(false);
    }
  }, [token]);

  if (loading) {
    return (
      <div className="analytics-state">
        <div className="loading-spinner"></div>
        <h3>Preparing your analytics...</h3>
        <p>Fetching your interview performance.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-state analytics-error">
        <div className="state-icon">!</div>
        <h3>Unable to load analytics</h3>
        <p>{error}</p>
      </div>
    );
  }

  const completedInterviews = interviews.filter(
    (item) => item.status === "completed"
  );

  const scoredInterviews = completedInterviews.filter(
    (item) => item.report?.average_score !== undefined
  );

  const scores = scoredInterviews.map((item) =>
    Number(item.report.average_score)
  );

  const averageScore =
    scores.length > 0
      ? (
          scores.reduce((total, score) => total + score, 0) /
          scores.length
        ).toFixed(1)
      : "0.0";

  const chartData = scoredInterviews.map((item, index) => ({
    name: item.job_role || `Interview ${index + 1}`,
    score: Number(item.report.average_score),
  }));

  const strengths = scoredInterviews.flatMap(
    (item) => item.report?.strengths || []
  );

  const improvements = scoredInterviews.flatMap(
    (item) => item.report?.improvements || []
  );

  const strengthData = [
    { name: "Strengths", value: strengths.length },
    { name: "Improvements", value: improvements.length },
  ].filter((item) => item.value > 0);

  const COLORS = ["#16a34a", "#f59e0b"];

  return (
    <div className="analytics-page">

      {/* PAGE HEADING */}
      <div className="analytics-heading">
        <div>
          <span className="analytics-label">YOUR PERFORMANCE</span>
          <h2>Performance Analytics</h2>
          <p>
            Understand your progress, track your scores and improve
            your interview skills.
          </p>
        </div>

        <div className="analytics-heading-icon">📊</div>
      </div>

      {/* STATISTICS */}
      <div className="analytics-stats">

        <div className="analytics-stat-card">
          <div className="analytics-stat-top">
            <span>Total Interviews</span>
            <div className="analytics-icon blue-icon">📚</div>
          </div>

          <h3>{interviews.length}</h3>
          <p>All your practice sessions</p>
        </div>

        <div className="analytics-stat-card">
          <div className="analytics-stat-top">
            <span>Completed Interviews</span>
            <div className="analytics-icon green-icon">✓</div>
          </div>

          <h3>{completedInterviews.length}</h3>
          <p>Successfully completed</p>
        </div>

        <div className="analytics-stat-card">
          <div className="analytics-stat-top">
            <span>Average Score</span>
            <div className="analytics-icon purple-icon">⭐</div>
          </div>

          <h3>{averageScore}<small>/10</small></h3>
          <p>Across scored interviews</p>
        </div>

        <div className="analytics-stat-card">
          <div className="analytics-stat-top">
            <span>Scored Interviews</span>
            <div className="analytics-icon orange-icon">🎯</div>
          </div>

          <h3>{scoredInterviews.length}</h3>
          <p>Reports available</p>
        </div>

      </div>

      {/* EMPTY STATE */}
      {scoredInterviews.length === 0 ? (
        <div className="analytics-empty">
          <div className="empty-chart-icon">📈</div>
          <h3>Your analytics will appear here</h3>
          <p>
            Complete an AI interview to see your scores, performance
            charts, strengths and improvement areas.
          </p>
        </div>
      ) : (
        <>

          {/* SCORE CHARTS */}
          <div className="analytics-chart-grid">

            <div className="analytics-chart-card">
              <div className="chart-heading">
                <div>
                  <h3>Interview Scores</h3>
                  <p>Compare your performance across interviews.</p>
                </div>
                <span className="chart-icon">📊</span>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={chartData}
                  margin={{ top: 15, right: 10, left: -15, bottom: 10 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#edf0f7"
                  />

                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    domain={[0, 10]}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip />

                  <Bar
                    dataKey="score"
                    name="Score"
                    fill="#5265e8"
                    radius={[8, 8, 0, 0]}
                    barSize={45}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="analytics-chart-card">
              <div className="chart-heading">
                <div>
                  <h3>Score Progress</h3>
                  <p>See how your scores change over time.</p>
                </div>
                <span className="chart-icon">📈</span>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={chartData}
                  margin={{ top: 15, right: 10, left: -15, bottom: 10 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#edf0f7"
                  />

                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    domain={[0, 10]}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="score"
                    name="Score"
                    stroke="#16a37a"
                    strokeWidth={3}
                    dot={{ r: 5, fill: "#16a37a" }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

          </div>

          {/* STRENGTHS PIE CHART */}
          <div className="analytics-chart-card pie-chart-card">
            <div className="chart-heading">
              <div>
                <h3>Strengths vs Improvements</h3>
                <p>A breakdown of your AI evaluation feedback.</p>
              </div>
              <span className="chart-icon">🎯</span>
            </div>

            {strengthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={strengthData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={105}
                    innerRadius={60}
                    paddingAngle={5}
                    label
                  >
                    {strengthData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p>No strengths or improvements recorded yet.</p>
            )}
          </div>

          {/* STRENGTHS AND IMPROVEMENTS */}
          <div className="analytics-lists">

            <div className="analytics-list-card">
              <div className="list-heading">
                <div className="list-icon strength-icon">✓</div>
                <div>
                  <h3>Your Strengths</h3>
                  <p>Things you are doing well.</p>
                </div>
              </div>

              {strengths.length > 0 ? (
                <ul>
                  {[...new Set(strengths)].map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>No strengths recorded yet.</p>
              )}
            </div>

            <div className="analytics-list-card">
              <div className="list-heading">
                <div className="list-icon improvement-icon">↗</div>
                <div>
                  <h3>Areas to Improve</h3>
                  <p>Skills you should focus on.</p>
                </div>
              </div>

              {improvements.length > 0 ? (
                <ul>
                  {[...new Set(improvements)].map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>No improvement areas recorded yet.</p>
              )}
            </div>

          </div>

        </>
      )}

    </div>
  );
}

export default Analytics;