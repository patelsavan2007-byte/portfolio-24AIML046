import jwt from "jsonwebtoken";
import { TaskUser, validateRegisterBody, validateLoginBody } from "../models/TaskUser.js";
import { logActivity } from "../middleware/activityLogger.js";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn("WARNING: JWT_SECRET is not set. Using insecure fallback. Set JWT_SECRET in .env.");
}
const JWT_EXPIRY = "1h";

// Cookie options for the auth token
function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 1000, // 1 hour (matches JWT expiry)
  };
}

// Helper: Generate JWT
function generateToken(userId) {
  return jwt.sign({ userId, id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export async function register(req, res, next) {
  try {
    const errors = validateRegisterBody(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        error: { message: errors.join(" "), status: 400 },
      });
    }

    const { email, password, firstName, lastName } = req.body;

    const existingUser = await TaskUser.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        error: { message: "Email already registered.", status: 409 },
      });
    }

    const user = await TaskUser.create({
      email: email.toLowerCase(),
      password,
      firstName: firstName || "",
      lastName: lastName || "",
      authMethod: "local",
    });

    const token = generateToken(user._id.toString());
    res.cookie("taskAuthToken", token, getCookieOptions());
    logActivity("REGISTER", { email, authMethod: "local" }, req.ip);

    res.status(201).json({
      message: "Registration successful.",
      user: user.toJSON(),
      token,
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const errors = validateLoginBody(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        error: { message: errors.join(" "), status: 400 },
      });
    }

    const { email, password } = req.body;

    const user = await TaskUser.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user || user.authMethod !== "local") {
      return res.status(401).json({
        error: { message: "Invalid email or password.", status: 401 },
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: { message: "Invalid email or password.", status: 401 },
      });
    }

    const token = generateToken(user._id.toString());
    res.cookie("taskAuthToken", token, getCookieOptions());
    logActivity("LOGIN", { email, authMethod: "local" }, req.ip);

    res.status(200).json({
      message: "Login successful.",
      user: user.toJSON(),
      token,
    });
  } catch (err) {
    next(err);
  }
}

export async function loginWithGoogle(req, res, next) {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        error: { message: "Google ID token is required.", status: 400 },
      });
    }

    let decoded;
    try {
      const parts = idToken.split(".");
      if (parts.length !== 3) {
        throw new Error("Invalid token format");
      }

      const payload = JSON.parse(
        Buffer.from(parts[1], "base64").toString("utf-8")
      );
      decoded = payload;
    } catch {
      return res.status(401).json({
        error: { message: "Invalid Google token.", status: 401 },
      });
    }

    const { sub: googleId, email, given_name: firstName, family_name: lastName, picture: avatar } = decoded;

    if (!googleId || !email) {
      return res.status(400).json({
        error: { message: "Invalid Google token payload.", status: 400 },
      });
    }

    let user = await TaskUser.findOne({
      $or: [{ googleId }, { email: email.toLowerCase() }],
    });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        user.authMethod = "google";
      }
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (avatar) user.avatar = avatar;
      await user.save();
    } else {
      user = await TaskUser.create({
        email: email.toLowerCase(),
        googleId,
        firstName: firstName || "",
        lastName: lastName || "",
        avatar: avatar || null,
        authMethod: "google",
      });
    }

    const token = generateToken(user._id.toString());
    res.cookie("taskAuthToken", token, getCookieOptions());
    logActivity("LOGIN_GOOGLE", { email, googleId }, req.ip);

    res.status(200).json({
      message: "Google authentication successful.",
      user: user.toJSON(),
      token,
    });
  } catch (err) {
    next(err);
  }
}

export function logout(req, res) {
  res.clearCookie("taskAuthToken", getCookieOptions());
  logActivity("LOGOUT", {}, req.ip);
  res.status(200).json({ message: "Logout successful." });
}

export async function getMe(req, res, next) {
  try {
    const user = await TaskUser.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        error: { message: "User not found.", status: 404 },
      });
    }
    res.status(200).json({ user: user.toJSON() });
  } catch (err) {
    next(err);
  }
}
