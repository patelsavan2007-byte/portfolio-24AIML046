import request from "supertest";
import app from "../app.js";

/**
 * Practical 13: AI Route Automated Tests
 * Tests validation, graceful degradation fallback, and rate limiting.
 */
describe("AI Description Generation API Tests", () => {
  // Test 1: Validation - Rejects empty title with 400
  test("POST /api/ai/generate-description returns 400 when title is missing", async () => {
    const res = await request(app)
      .post("/api/ai/generate-description")
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.message).toMatch(/title is required/i);
  });

  // Test 2: Validation - Rejects titles over 200 characters with 400
  test("POST /api/ai/generate-description returns 400 when title exceeds 200 chars", async () => {
    const longTitle = "a".repeat(201);
    const res = await request(app)
      .post("/api/ai/generate-description")
      .send({ title: longTitle });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.message).toMatch(/200 characters or fewer/i);
  });

  // Test 3: Graceful degradation - Returns 200 with fallback when key is placeholder or invalid
  test("POST /api/ai/generate-description returns 200 with fallback flag when key is missing or placeholder", async () => {
    const res = await request(app)
      .post("/api/ai/generate-description")
      .send({ title: "Write Docker Compose file" });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("fallback");
    expect(res.body).toHaveProperty("description");
    expect(res.body).toHaveProperty("message");
  });

  // Test 4: In-Memory Rate Limiting - Returns rateLimited flag on immediate second request
  test("POST /api/ai/generate-description rate limits repeated requests within 1 minute", async () => {
    const title = "Unique Task For Rate Limit Test";
    // First request
    await request(app)
      .post("/api/ai/generate-description")
      .send({ title });

    // Immediate second request
    const res2 = await request(app)
      .post("/api/ai/generate-description")
      .send({ title });

    expect(res2.statusCode).toBe(200);
    expect(res2.body.fallback).toBe(true);
    expect(res2.body.rateLimited).toBe(true);
    expect(res2.body.message).toMatch(/Rate limit/i);
  });
});
