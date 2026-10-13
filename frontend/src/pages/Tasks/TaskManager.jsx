import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { getCurrentUser, logout } from "../../services/authService";
import { fetchTasks as apiFetchTasks, createTask, updateTask, deleteTask } from "../../services/taskService";
import CachePerformancePanel from "./components/CachePerformancePanel";
import "./TaskManager.css";

// Supplementary: Component-level lazy loading for heavy analytics chart
const TaskStatsChart = lazy(() => import("./components/TaskStatsChart"));

const emptyForm = { title: "", description: "", status: "pending", priority: "medium" };

const STATUS_COLORS = {
  pending: "#eab308",
  "in-progress": "#3b82f6",
  completed: "#22c55e",
};

const STATUS_LABELS = {
  pending: "Pending",
  "in-progress": "In Progress",
  completed: "Completed",
};

function getStatusColor(status) {
  return STATUS_COLORS[status] || "#6b7280";
}

function getStatusLabel(status) {
  return STATUS_LABELS[status] || status;
}

function ConfirmModal({ title, message, onConfirm, onCancel, variant }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div className="tm-modal-overlay" onClick={onCancel}>
      <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
        <div className={`tm-modal-icon tm-modal-icon-${variant}`}>
          {variant === "delete" ? "🗑" : "✏️"}
        </div>
        <h3 className="tm-modal-title">{title}</h3>
        <p className="tm-modal-message">{message}</p>
        <div className="tm-modal-actions">
          <button className="tm-btn tm-btn-cancel" onClick={onCancel}>Cancel</button>
          <button className={`tm-btn tm-modal-confirm tm-modal-confirm-${variant}`} onClick={onConfirm}>
            {variant === "delete" ? "Yes, Delete" : "Yes, Update"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskManager() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [lastQueryInfo, setLastQueryInfo] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    variant: "",
    title: "",
    message: "",
    onConfirm: null,
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await getCurrentUser();
        setUser(response.data.user);
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
        setUser(null);
      }
    };
    checkAuth();
  }, []);

  const openConfirm = (variant, title, message, onConfirm) => {
    setConfirmModal({ open: true, variant, title, message, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmModal({ open: false, variant: "", title: "", message: "", onConfirm: null });
  };

  const fetchTasks = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const res = await apiFetchTasks(page, selectedStatus);

        const tasksFromResponse = Array.isArray(res.data.data)
          ? res.data.data
          : Array.isArray(res.data.tasks)
          ? res.data.tasks
          : [];

        const isHit = res.headers["x-cache"] === "HIT" || res.data.cached;
        setLastQueryInfo({
          cached: isHit,
          source: res.data.source || (isHit ? "node-cache" : "mongodb"),
          responseTimeMs: res.data.responseTimeMs,
          status: res.headers["x-cache"] || (isHit ? "HIT" : "MISS"),
        });

        setTasks(tasksFromResponse);
        setCurrentPage(res.data.currentPage ?? page);
        setTotalPages(res.data.totalPages ?? 1);
        setTotalItems(res.data.totalItems ?? tasksFromResponse.length);
      } catch (err) {
        if (err.response?.status === 401) {
          setIsAuthenticated(false);
        } else {
          toast.error(err.response?.data?.error?.message || "Failed to fetch tasks");
        }
      } finally {
        setLoading(false);
      }
    },
    [selectedStatus]
  );

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) fetchTasks(1);
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [selectedStatus, isAuthenticated, fetchTasks]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editId) {
      openConfirm(
        "update",
        "Update Task",
        `Are you sure you want to update task "${form.title}"?`,
        async () => {
          closeConfirm();
          try {
            await updateTask(editId, form);
            toast.success("Task updated successfully!");
            setForm(emptyForm);
            setEditId(null);
            fetchTasks(currentPage);
          } catch (err) {
            toast.error(err.response?.data?.error?.message || "Failed to update task");
          }
        }
      );
      return;
    }

    try {
      await createTask(form);
      toast.success("Task created successfully!");
      setForm(emptyForm);
      if (isAuthenticated) {
        fetchTasks(1);
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Failed to create task");
    }
  };

  const handleEdit = (task) => {
    setForm({ title: task.title, description: task.description, status: task.status, priority: task.priority });
    setEditId(task.id);
  };

  const handleDelete = (id, title) => {
    openConfirm(
      "delete",
      "Delete Task",
      `Are you sure you want to delete task "${title}"? This action cannot be undone.`,
      async () => {
        closeConfirm();
        try {
          await deleteTask(id);
          toast.success(`Task "${title}" deleted successfully!`);
          fetchTasks(currentPage);
        } catch (err) {
          toast.error(err.message || "Failed to delete task");
        }
      }
    );
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setEditId(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsAuthenticated(false);
      setUser(null);
      setTasks([]);
      toast.success("Logged out successfully!");
      navigate("/");
    } catch {
      toast.error("Failed to logout. Please try again.");
    }
  };

  return (
    <div className="task-manager">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="tm-header">
        <div className="tm-header-content">
          <div>
            <h1 className="tm-title">Task Manager</h1>
            {isAuthenticated && user && (
              <p className="tm-subtitle">Welcome, {user.firstName || user.email}!</p>
            )}
          </div>
          {isAuthenticated && (
            <button className="tm-btn-logout" onClick={handleLogout}>
              Logout
            </button>
          )}
        </div>
      </div>

      <div className="tm-container">
        {/* Auth Banner */}
        {!isAuthenticated && (
          <div className="tm-auth-banner">
            <div className="tm-banner-content">
              <p className="tm-banner-text">
                Create tasks publicly. <strong>Login to manage your personal tasks</strong>.
              </p>
              <div className="tm-banner-actions">
                <button className="tm-btn tm-btn-primary" onClick={() => navigate("/login")}>
                  Login
                </button>
                <button className="tm-btn tm-btn-secondary" onClick={() => navigate("/register")}>
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Task Form */}
        <div className="tm-form-section">
          <h2 className="tm-section-title">
            {editId ? "Edit Task" : "Create New Task"}
          </h2>
          <form onSubmit={handleSubmit} className="tm-form">
            <div className="tm-form-row">
              <input
                type="text"
                name="title"
                placeholder="Task title..."
                value={form.title}
                onChange={handleChange}
                required
                className="tm-input tm-input-title"
              />
            </div>

            <div className="tm-form-row">
              <textarea
                name="description"
                placeholder="Task description (optional)..."
                value={form.description}
                onChange={handleChange}
                className="tm-textarea"
                rows="3"
              />
            </div>

            <div className="tm-form-row">
              <select name="status" value={form.status} onChange={handleChange} className="tm-select">
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>

              <select name="priority" value={form.priority} onChange={handleChange} className="tm-select">
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>

            <div className="tm-form-actions">
              <button type="submit" className="tm-btn tm-btn-primary">
                {editId ? "Update Task" : "Create Task"}
              </button>
              {editId && (
                <button type="button" className="tm-btn tm-btn-secondary" onClick={handleCancel}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Tasks Section */}
        <div className="tm-tasks-section">
          {/* Practical 9: In-Memory Cache Performance Monitor & Benchmark */}
          <CachePerformancePanel
            onRefreshTasks={() => fetchTasks(currentPage)}
            lastQueryInfo={lastQueryInfo}
          />

          {/* Component-level Lazy Loaded Analytics Chart */}
          <Suspense fallback={<div className="tm-loading">Loading task analytics...</div>}>
            <TaskStatsChart tasks={tasks} />
          </Suspense>

          {/* Status Tabs */}
            <div className="tm-status-tabs">
              <button
                className={`tm-tab ${selectedStatus === "all" ? "tm-tab-active" : ""}`}
                onClick={() => {
                  setSelectedStatus("all");
                  setCurrentPage(1);
                }}
              >
                All Tasks ({totalItems})
              </button>
              {["pending", "in-progress", "completed"].map((status) => (
                <button
                  key={status}
                  className={`tm-tab ${selectedStatus === status ? "tm-tab-active" : ""}`}
                  onClick={() => {
                    setSelectedStatus(status);
                    setCurrentPage(1);
                  }}
                  style={selectedStatus === status ? { borderBottomColor: getStatusColor(status) } : {}}
                >
                  {getStatusLabel(status)}
                </button>
              ))}
            </div>

            {loading && <div className="tm-loading">Loading tasks...</div>}

            {!loading && tasks.length === 0 && (
              <div className="tm-empty-state">
                <div className="tm-empty-icon">📭</div>
                <p className="tm-empty-text">No tasks found</p>
                <p className="tm-empty-subtext">
                  {selectedStatus === "all"
                    ? "Create your first task to get started!"
                    : `No ${selectedStatus.replace("-", " ")} tasks yet.`}
                </p>
              </div>
            )}

            {!loading && tasks.length > 0 && (
              <>
                <div className="tm-tasks-grid">
                  {tasks.map((task) => (
                    <div key={task.id} className="tm-task-card">
                      <div className="tm-card-header">
                        <div className="tm-card-title-section">
                          <h3 className="tm-card-title">{task.title}</h3>
                          <span
                            className="tm-status-badge"
                            style={{ backgroundColor: getStatusColor(task.status) }}
                          >
                            {getStatusLabel(task.status)}
                          </span>
                        </div>
                        <span className={`tm-priority-badge tm-priority-${task.priority}`}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                      </div>

                      {task.description && (
                        <p className="tm-card-description">{task.description}</p>
                      )}

                      <div className="tm-card-meta">
                        <span className="tm-card-date">
                          Created: {new Date(task.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="tm-card-actions">
                        <button
                          className="tm-btn-action tm-btn-edit"
                          onClick={() => handleEdit(task)}
                          title="Edit task"
                        >
                          Edit
                        </button>
                        <button
                          className="tm-btn-action tm-btn-delete"
                          onClick={() => handleDelete(task.id, task.title)}
                          title="Delete task"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="tm-pagination">
                    <button
                      className="tm-btn-page"
                      disabled={currentPage === 1}
                      onClick={() => {
                        setCurrentPage(currentPage - 1);
                        fetchTasks(currentPage - 1);
                      }}
                    >
                      Previous
                    </button>

                    <div className="tm-page-info">
                      Page {currentPage} of {totalPages}
                    </div>

                    <button
                      className="tm-btn-page"
                      disabled={currentPage === totalPages}
                      onClick={() => {
                        setCurrentPage(currentPage + 1);
                        fetchTasks(currentPage + 1);
                      }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Confirmation Modal */}
      {confirmModal.open && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          variant={confirmModal.variant}
          onConfirm={confirmModal.onConfirm}
          onCancel={closeConfirm}
        />
      )}
    </div>
  );
}

export default TaskManager;
