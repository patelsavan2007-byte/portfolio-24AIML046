import "./TaskStatsChart.css";

function TaskStatsChart({ tasks = [] }) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const inProgress = tasks.filter((t) => t.status === "in-progress").length;
  const pending = tasks.filter((t) => t.status === "pending").length;

  const highPriority = tasks.filter((t) => t.priority === "high").length;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="task-stats-card" id="task-stats-analytics">
      <div className="stats-header">
        <div className="stats-title-group">
          <span className="stats-tag">Analytics &amp; Performance</span>
          <h3 className="stats-title">Task Productivity Overview</h3>
        </div>
        <div className="completion-badge">
          <span className="completion-number">{completionRate}%</span>
          <span className="completion-text">Completed</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="stats-progress-track">
        <div
          className="stats-progress-fill"
          style={{ width: `${completionRate}%` }}
        ></div>
      </div>

      {/* Metric Breakdown Grid */}
      <div className="stats-metrics-grid">
        <div className="metric-box metric-completed">
          <span className="metric-count">{completed}</span>
          <span className="metric-label">Completed</span>
        </div>
        <div className="metric-box metric-progress">
          <span className="metric-count">{inProgress}</span>
          <span className="metric-label">In Progress</span>
        </div>
        <div className="metric-box metric-pending">
          <span className="metric-count">{pending}</span>
          <span className="metric-label">Pending</span>
        </div>
        <div className="metric-box metric-high">
          <span className="metric-count">{highPriority}</span>
          <span className="metric-label">High Priority</span>
        </div>
      </div>
    </div>
  );
}

// Default export required for React.lazy()
export default TaskStatsChart;
