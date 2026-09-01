import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Extract token from either:
 * 1. Authorization: Bearer <token> header (for Postman / API clients)
 * 2. httpOnly cookie (for browser / frontend)
 */
function extractToken(req) {
  // Check Authorization header first (Postman / API testing)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  // Fall back to httpOnly cookie (browser)
  return req.cookies?.taskAuthToken || null;
}

export function requireTaskAuth(req, res, next) {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        error: {
          message: "Authentication required. Please log in.",
          status: 401,
        },
      });
    }

    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach user info to request
    next();
  } catch {
    return res.status(401).json({
      error: {
        message: "Invalid or expired token. Please log in again.",
        status: 401,
      },
    });
  }
}

// Optional: middleware to check auth but not require it (for filtering)
export function optionalTaskAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    }
  } catch {
    // Silently fail - not required
  }
  next();
}
