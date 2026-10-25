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
 * Generates a concise, practical task description (2-3 sentences) using either:
 * - Google Gemini API (gemini-1.5-flash via fetch) if GEMINI_API_KEY is configured
 * - OpenAI (gpt-4o-mini via official SDK) if OPENAI_API_KEY is configured
 *
 * Features:
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

  // 3. Graceful degradation: Check available API keys
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const openAiKey = process.env.OPENAI_API_KEY?.trim();

  const isGeminiConfigured = geminiKey && !geminiKey.includes("your_") && geminiKey.length > 5;
  const isOpenAiConfigured = openAiKey && !openAiKey.includes("your_") && openAiKey.length > 5;

  if (!isGeminiConfigured && !isOpenAiConfigured) {
    console.warn("[AI Route] No valid GEMINI_API_KEY or OPENAI_API_KEY configured. Providing graceful fallback response.");
    return res.status(200).json({
      description: "",
      fallback: true,
      message: "AI suggestion is unavailable right now. You can write the description manually.",
    });
  }

  // 4. Call AI Provider with 10-second timeout guard
  try {
    let description = "";

    // Priority 1: Google Gemini API (via native fetch)
    if (isGeminiConfigured) {
      const modelsToTry = [
        "gemini-1.5-flash",
        "gemini-2.0-flash",
        "gemini-2.5-flash",
        "gemini-3.8-flash",
      ];
      let lastErrorMessage = "Failed to generate description from Gemini.";

      for (const model of modelsToTry) {
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
          const response = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `You are a concise assistant for a task management application. Write a short, practical task description (2-3 sentences) for: ${cleanTitle}. Do not include markdown headers, quotes, or conversational filler.`,
                    },
                  ],
                },
              ],
              generationConfig: {
                maxOutputTokens: 150,
                temperature: 0.7,
              },
            }),
            signal: AbortSignal.timeout(10000), // 10-second timeout
          });

          const data = await response.json();
          if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
            description = data.candidates[0].content.parts[0].text.trim();
            break;
          } else if (data.error?.message) {
            lastErrorMessage = data.error.message;
          }
        } catch (modelErr) {
          lastErrorMessage = modelErr.message;
        }
      }

      if (!description) {
        throw new Error(lastErrorMessage);
      }
    }
    // Priority 2: OpenAI API (gpt-4o-mini via SDK)
    else if (isOpenAiConfigured) {
      const client = new OpenAI({
        apiKey: openAiKey,
        timeout: 10000,
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
        { timeout: 10000 }
      );

      description = completion.choices[0]?.message?.content?.trim() || "";
    }

    if (!description) {
      throw new Error("No description generated by AI provider.");
    }

    return res.status(200).json({
      description,
      fallback: false,
    });
  } catch (error) {
    // Graceful degradation: Catches 401, quota limits, network timeouts, invalid keys
    console.error(`[AI Route] API call failed: ${error.message}`);
    return res.status(200).json({
      description: "",
      fallback: true,
      message: "AI suggestion is unavailable right now. You can write the description manually.",
    });
  }
});

export default router;
