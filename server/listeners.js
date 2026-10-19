import taskEvents from "./events.js";

/**
 * Practical 10: Event Listeners for Background Task Processing
 * Registers event listeners on taskEvents instance at server startup.
 */

// 1. Listener for 'task-created' event
taskEvents.on("task-created", (task) => {
  try {
    // Validate task payload - throws error if missing or without title to demonstrate error handling
    if (!task || !task.title) {
      throw new Error("Task title is required for notification processing");
    }

    // Determine assigned user (support ObjectId, string, or unassigned fallback)
    const assignedUser = task.userId
      ? (typeof task.userId === "object" && task.userId._id ? task.userId._id : task.userId)
      : (task.assignedTo || task.assignedUser || "Unassigned");

    const isoTime = new Date().toISOString();
    console.log(
      `[Notification] Task "${task.title}" created at ${isoTime}, assigned to ${assignedUser}`
    );

    // Simulated slow notification handler (e.g. sending email, push alert, or third-party webhook)
    // Executes asynchronously via setTimeout (2 seconds) without blocking the main API response
    setTimeout(() => {
      try {
        const finishTime = new Date().toISOString();
        console.log(`[Notification] Handler finished at ${finishTime}`);
      } catch (innerErr) {
        taskEvents.emit("task-error", innerErr);
      }
    }, 2000);
  } catch (err) {
    // Catch synchronous error inside handler and dispatch custom 'task-error' event
    taskEvents.emit("task-error", err);
  }
});

// 2. Listener for 'task-deleted' event (Supplementary requirement)
taskEvents.on("task-deleted", (task) => {
  try {
    const title = task?.title || "Unknown Task";
    const id = task?.id || task?._id || "N/A";
    const isoTime = new Date().toISOString();
    console.log(`[Notification] Task "${title}" (ID: ${id}) deleted at ${isoTime}`);
  } catch (err) {
    taskEvents.emit("task-error", err);
  }
});

// 3. Listener for custom 'task-error' event (Supplementary requirement)
taskEvents.on("task-error", (error) => {
  const isoTime = new Date().toISOString();
  console.error(`[Notification] Error in task processing at ${isoTime}: ${error.message}`);
});

// 4. Register listener for Node's reserved 'error' event to prevent unhandled exception crashes
taskEvents.on("error", (error) => {
  const isoTime = new Date().toISOString();
  console.error(`[Notification] Unhandled EventEmitter error at ${isoTime}: ${error.message}`);
});

console.log("[Events] Registered background listeners for task-created, task-deleted, task-error");
