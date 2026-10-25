import { Router } from "express";
import OpenAI from "openai";

const router = Router();

// ============================================================================
// Practical 13: Simple In-Memory Rate Limiter
// Limit: Maximum 1 AI request per task/title per 60 seconds
// Keeps track of timestamps per unique task title or ID without external packages
// ============================================================================
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute in milliseconds

// Helper to clean up expired entries periodically to prevent memory growth
function pruneRateLimitMap() {
  const now = Date.now();
  for (const [key, timestamp] of rateLimitMap.entries()) {
    if (now - timestamp > RATE_LIMIT_WINDOW_MS) {
      rateLimitMap.delete(key);
    }
  }
}

/**
 * POST /api/ai/generate-description
 * Body: { title: string, taskId?: string }
 *
 * Generates a concise, practical task description (2-3 sentences) using OpenAI (gpt-4o-mini).
 * Incorporates:
 * 1. Request validation (title required, max 200 chars).
 * 2. In-memory rate limiting (max 1 request per task/title per minute).
 * 3. 10-second request timeout to prevent hanging connections.
 * 4. Graceful degradation: Catches all errors (missing key, network, quota, 401)
 *    and returns status 200 with fallback: true so the core app never crashes.
 */
router.post("/generate-description", async (req, res) => {
  const { title, taskId } = req.body;

  // 1. Input Validation: Title must be a non-empty string under 200 characters
  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return res.status(400).json({
      error: {
        message: "Task title is required to generate an AI description.",
        status: 400,
      },
    });
  }

  const cleanTitle = title.trim();
  if (cleanTitle.length > 200) {
    return res.status(400).json({
      error: {
        message: "Task title must be 200 characters or fewer.",
        status: 400,
      },
    });
  }

  // 2. Simple In-Memory Rate Limiter check (1 request per task/title per minute)
  pruneRateLimitMap();
  const rateLimitKey = taskId ? `task_${taskId}` : `title_${cleanTitle.toLowerCase()}`;
  const now = Date.now();
  const lastRequestTime = rateLimitMap.get(rateLimitKey);

  if (lastRequestTime && now - lastRequestTime < RATE_LIMIT_WINDOW_MS) {
    const remainingSeconds = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - lastRequestTime)) / 1000);
    return res.status(200).json({
      description: "",
      fallback: true,
      rateLimited: true,
      message: `Rate limit: Please wait ${remainingSeconds}s before requesting another AI description for this task.`,
    });
  }

  // Record timestamp for rate limiting
  rateLimitMap.set(rateLimitKey, now);

  // 3. Graceful degradation: Check if API key is present and not a dummy placeholder
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "your_openai_api_key_here" || apiKey.trim() === "") {
    console.warn("[AI Route] No valid OPENAI_API_KEY configured. Providing graceful fallback response.");
    return res.status(200).json({
      description: "",
      fallback: true,
      message: "AI suggestion is unavailable right now. You can write the description manually.",
    });
  }

  // 4. Call OpenAI API with timeout and robust error catching
  try {
    // Initialize OpenAI client with a 10-second timeout guard
    const client = new OpenAI({
      apiKey: apiKey.trim(),
      timeout: 10000, // 10 seconds timeout
    });

    const completion = await client.chat.completions.create(
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant for a task management app. Write a short, practical task description (2-3 sentences) based on the user's task title. Do not include quotes, markdown headings, or conversational filler.",
          },
          {
            role: "user",
            content: `Write a short, practical task description (2-3 sentences) for: ${cleanTitle}`,
          },
        ],
        max_tokens: 150,
        temperature: 0.7,
      },
      { timeout: 10000 } // 10-second timeout option
    );

    const description = completion.choices[0]?.message?.content?.trim() || "";

    return res.status(200).json({
      description,
      fallback: false,
    });
  } catch (error) {
    // Practical 13 Graceful Degradation:
    // On ANY failure (invalid key, network timeout, rate limit, quota exceeded),
    // return status 200 with fallback: true so the user is never blocked from creating tasks.
    console.error(`[AI Route] API call failed: ${error.message}`);
    return res.status(200).json({
      description: "",
      fallback: true,
      message: "AI suggestion is unavailable right now. You can write the description manually.",
    });
  }
});

export default router;
