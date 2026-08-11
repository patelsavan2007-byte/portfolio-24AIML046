import { useState, useEffect, useCallback } from "react";
import "./TaskManager.css";

const API = "/api/tasks";

const emptyForm = { title: "", description: "", status: "pending", priority: "medium" };

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`tm-toast tm-toast-${type}`}>
      <span className="tm-toast-icon">
        {type === "success" ? "✓" : type === "error" ? "✕" : "!"}
      </span>
      <span className="tm-toast-msg">{message}</span>
      <button className="tm-toast-close" onClick={onClose}>×</button>
    </div>
  );
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
  const [toasts, setToasts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({ open: false, variant: "", title: "", message: "", onConfirm: null });

  const showToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const openConfirm = (variant, title, message, onConfirm) => {
    setConfirmModal({ open: true, variant, title, message, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmModal({ open: false, variant: "", title: "", message: "", onConfirm: null });
  };

  const fetchTasks = async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}?page=${page}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error?.message || "Failed to fetch tasks");
      }
      const data = await res.json();
      const tasksFromResponse = Array.isArray(data.data)
        ? data.data
        : Array.isArray(data.tasks)
        ? data.tasks
        : [];

      setTasks(tasksFromResponse);
      setCurrentPage(data.currentPage ?? page);
      setTotalPages(data.totalPages ?? 1);
      setTotalItems(data.totalItems ?? tasksFromResponse.length);
    } catch (err) {
      setTasks([]);
      setCurrentPage(1);
      setTotalPages(1);
      setTotalItems(0);
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks(1);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const doSubmit = async (method, url, body) => {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error?.message || "Request failed");
    }
    return res;
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
            await doSubmit("PUT", `${API}/${editId}`, form);
            showToast("Task updated successfully!", "success");
            setForm(emptyForm);
            setEditId(null);
            fetchTasks(currentPage);
          } catch (err) {
            showToast(err.message, "error");
          }
        }
      );
      return;
    }

    try {
      await doSubmit("POST", API, form);
      showToast("Task created successfully!", "success");
      setForm(emptyForm);
      fetchTasks(1);
    } catch (err) {
      showToast(err.message, "error");
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
          const res = await fetch(`${API}/${id}`, { method: "DELETE" });
          if (!res.ok) throw new Error("Failed to delete task");
          showToast(`Task "${title}" deleted successfully!`, "success");
          fetchTasks();
        } catch (err) {
          showToast(err.message, "error");
        }
      }
    );
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setEditId(null);
  };

  return (
    <section id="tasks" className="section-block tasks-sec">
      <div className="tm-container">
        <span className="section-title-tag">Task Management</span>
        <h2 className="section-title">My Tasks</h2>
        <p className="section-desc">
          Create, update, and manage your tasks with the REST API backend.
        </p>

        {/* Toast container */}
        <div className="tm-toast-container">
          {toasts.map((t) => (
            <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
          ))}
        </div>

        {/* Confirmation modal */}
        {confirmModal.open && (
          <ConfirmModal
            title={confirmModal.title}
            message={confirmModal.message}
            variant={confirmModal.variant}
            onConfirm={confirmModal.onConfirm}
            onCancel={closeConfirm}
          />
        )}

        {/* Form */}
        <form className="tm-form" onSubmit={handleSubmit}>
          <div className="tm-form-row">
            <input
              type="text"
              name="title"
              placeholder="Task title *"
              value={form.title}
              onChange={handleChange}
              className="tm-input"
              required
            />
            <input
              type="text"
              name="description"
              placeholder="Description"
              value={form.description}
              onChange={handleChange}
              className="tm-input"
            />
          </div>
          <div className="tm-form-row">
            <select name="status" value={form.status} onChange={handleChange} className="tm-select">
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <select name="priority" value={form.priority} onChange={handleChange} className="tm-select">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <button type="submit" className="tm-btn tm-btn-primary">
              {editId ? "Update Task" : "Add Task"}
            </button>
            {editId && (
              <button type="button" className="tm-btn tm-btn-cancel" onClick={handleCancel}>
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* Task list */}
        {loading ? (
          <p className="tm-loading">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="tm-empty">No tasks yet. Create one above!</p>
        ) : (
          <>
            <div className="tm-list">
              {tasks.map((task) => (
                <div key={task.id} className={`tm-card tm-card-${task.priority}`}>
                  <div className="tm-card-header">
                    <h4 className="tm-card-title">{task.title}</h4>
                    <span className="tm-badge">#{task.id}</span>
                  </div>
                  {task.description && <p className="tm-card-desc">{task.description}</p>}
                  <div className="tm-card-meta">
                    <span className={`tm-status tm-status-${task.status}`}>{task.status}</span>
                    <span className={`tm-priority tm-priority-${task.priority}`}>{task.priority}</span>
                    <span className="tm-date">{new Date(task.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="tm-card-actions">
                    <button className="tm-btn tm-btn-edit" onClick={() => handleEdit(task)}>
                      Edit
                    </button>
                    <button className="tm-btn tm-btn-delete" onClick={() => handleDelete(task.id, task.title)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="tm-pagination-summary">
              Showing {tasks.length} of {totalItems} tasks
            </div>
            {totalPages > 1 && (
              <div className="tm-pagination">
                <button
                  type="button"
                  className="tm-page-btn"
                  disabled={currentPage === 1}
                  onClick={() => fetchTasks(currentPage - 1)}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                  .filter((page) => {
                    if (totalPages <= 7) return true;
                    if (page <= 3 || page > totalPages - 3) return true;
                    return Math.abs(page - currentPage) <= 1;
                  })
                  .reduce((acc, page, index, array) => {
                    const prev = array[index - 1];
                    if (prev && page - prev > 1) acc.push("...");
                    acc.push(page);
                    return acc;
                  }, [])
                  .map((page, index) =>
                    page === "..." ? (
                      <span key={`dots-${index}`} className="tm-page-dots">{page}</span>
                    ) : (
                      <button
                        key={page}
                        type="button"
                        className={`tm-page-btn ${page === currentPage ? "tm-page-btn-active" : ""}`}
                        onClick={() => fetchTasks(page)}
                        disabled={page === currentPage}
                      >
                        {page}
                      </button>
                    )
                  )}
                <button
                  type="button"
                  className="tm-page-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => fetchTasks(currentPage + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default TaskManager;
