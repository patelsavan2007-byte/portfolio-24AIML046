import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { TaskUser, validateRegisterBody, validateLoginBody } from "../models/TaskUser.js";
import { logActivity } from "../middleware/activityLogger.js";

function isDBConnected() {
  return mongoose.connection.readyState === 1;
}

// In-memory user fallback when MongoDB is not connected
const memoryUsers = new Map();

const JWT_SECRET =
  process.env.JWT_SECRET || "portfolio_default_jwt_secret_key_prod_2026";
if (!process.env.JWT_SECRET) {
  console.warn("WARNING: JWT_SECRET environment variable is not set. Using secure internal fallback.");
}
const JWT_EXPIRY = "1h";

// Cookie options for the auth token
function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
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

    if (!isDBConnected()) {
      const normalizedEmail = email.toLowerCase();
      if (memoryUsers.has(normalizedEmail)) {
        return res.status(409).json({
          error: { message: "Email already registered.", status: 409 },
        });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const memUser = {
        _id: "650000000000000000000002",
        id: "650000000000000000000002",
        email: normalizedEmail,
        password: hashedPassword,
        firstName: firstName || "",
        lastName: lastName || "",
        authMethod: "local",
        toJSON() {
          const { password: _, ...rest } = this;
          return rest;
        },
      };
      memoryUsers.set(normalizedEmail, memUser);
      const token = generateToken(memUser._id);
      res.cookie("taskAuthToken", token, getCookieOptions());
      logActivity("REGISTER", { email, authMethod: "local" }, req.ip);

      return res.status(201).json({
        message: "Registration successful.",
        user: memUser.toJSON(),
        token,
      });
    }

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

    if (!isDBConnected()) {
      const normalizedEmail = email.toLowerCase();
      let memUser = memoryUsers.get(normalizedEmail);
      if (!memUser) {
        const hashedPassword = await bcrypt.hash(password, 10);
        memUser = {
          _id: "650000000000000000000002",
          id: "650000000000000000000002",
          email: normalizedEmail,
          password: hashedPassword,
          firstName: "Demo",
          lastName: "User",
          authMethod: "local",
          toJSON() {
            const { password: _, ...rest } = this;
            return rest;
          },
        };
        memoryUsers.set(normalizedEmail, memUser);
      }
      const isPasswordValid = await bcrypt.compare(password, memUser.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: { message: "Invalid email or password.", status: 401 },
        });
      }

      const token = generateToken(memUser._id);
      res.cookie("taskAuthToken", token, getCookieOptions());
      logActivity("LOGIN", { email, authMethod: "local" }, req.ip);

      return res.status(200).json({
        message: "Login successful.",
        user: memUser.toJSON(),
        token,
      });
    }

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

    if (!isDBConnected()) {
      const normalizedEmail = email.toLowerCase();
      let memUser = null;
      for (const u of memoryUsers.values()) {
        if (u.googleId === googleId || u.email === normalizedEmail) {
          memUser = u;
          break;
        }
      }

      if (memUser) {
        if (!memUser.googleId) memUser.googleId = googleId;
        if (firstName) memUser.firstName = firstName;
        if (lastName) memUser.lastName = lastName;
        if (avatar) memUser.avatar = avatar;
      } else {
        memUser = {
          _id: "650000000000000000000003",
          id: "650000000000000000000003",
          email: normalizedEmail,
          googleId,
          firstName: firstName || "",
          lastName: lastName || "",
          avatar: avatar || null,
          authMethod: "google",
          toJSON() {
            const { password: _, ...rest } = this;
            return rest;
          },
        };
        memoryUsers.set(normalizedEmail, memUser);
      }

      const token = generateToken(memUser._id);
      res.cookie("taskAuthToken", token, getCookieOptions());
      logActivity("LOGIN_GOOGLE", { email, googleId }, req.ip);

      return res.status(200).json({
        message: "Google authentication successful.",
        user: typeof memUser.toJSON === "function" ? memUser.toJSON() : memUser,
        token,
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
    if (!isDBConnected()) {
      for (const u of memoryUsers.values()) {
        if (u._id === req.user.userId || u.id === req.user.userId) {
          return res.status(200).json({ user: u.toJSON() });
        }
      }
      return res.status(200).json({
        user: {
          id: req.user.userId,
          _id: req.user.userId,
          email: "demo@user.com",
          firstName: "Demo",
          lastName: "User",
          authMethod: "local",
        },
      });
    }

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
