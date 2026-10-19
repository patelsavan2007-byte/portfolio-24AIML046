import { EventEmitter } from "events";

/**
 * TaskEvents class extending Node.js built-in EventEmitter
 * Practical 10: Asynchronous Processing with Event-Driven Architecture
 * Decouples background processing and notification tasks from API request-response cycle.
 */
class TaskEvents extends EventEmitter {}

// Export a single instance (singleton pattern)
const taskEvents = new TaskEvents();

export { TaskEvents };
export default taskEvents;
