import request from "supertest";
import app from "../app.js";

/**
 * Practical 12: Automated Backend API Tests
 * Tests run against in-memory fallback store without requiring an active MongoDB connection.
 */

describe("Tasks API Integration Tests", () => {
  // Test 1 (Deliberately broken for Practical 12 CI demo): Expected 404 instead of 200
  test("GET /tasks returns status 200", async () => {
    const res = await request(app).get("/tasks");
    // DELIBERATE FAILURE: Expecting 404 will fail because GET /tasks actually returns 200
    expect(res.statusCode).toBe(404);
    expect(res.body).toBeDefined();
    // Verify response contains data array from task listing
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // Test 2 (Lab Assignment Supplementary): Verify GET /tasks/:id returns 200 for a valid task
  test("GET /tasks/:id returns status 200 and task details", async () => {
    const taskId = "650000000000000000000001";
    const res = await request(app).get(`/tasks/${taskId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("task");
    expect(res.body.task).toHaveProperty("title");
  });

  // Test 3: Verify POST /tasks creates a new task and returns 201 Created
  test("POST /tasks creates a task and returns status 201", async () => {
    const newTask = {
      title: "CI/CD Automated Test Task",
      description: "Testing GitHub Actions pipeline",
      status: "pending",
      priority: "high",
    };
    const res = await request(app).post("/tasks").send(newTask);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("title", "CI/CD Automated Test Task");
  });
});
