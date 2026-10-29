import mongoose from "mongoose";

let cachedPromise = null;

export async function connectDB() {
  // Practical 12: Guard DB connection during tests so no real MongoDB instance is required
  if (process.env.NODE_ENV === "test") {
    return;
  }

  // Return existing active connection if already connected (vital for serverless reuse)
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (cachedPromise) {
    return cachedPromise;
  }

  // Practical 11: Support Docker Compose service name via MONGO_URI (mongodb://mongodb:27017/taskdb)
  // Fall back to MONGODB_URI (e.g., Atlas) or localhost for non-Docker local runs
  const MONGO_URI =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/taskdb";

  cachedPromise = (async () => {
    try {
      const sanitizedURI = MONGO_URI.replace(
        /(mongodb(?:\+srv)?:\/\/[^:]+:)[^@]+(@.*)/,
        "$1*****$2"
      );
      console.log(`Connecting to MongoDB: ${sanitizedURI}`);
      await mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log("MongoDB connected successfully.");
      return mongoose.connection;
    } catch (error) {
      console.error("MongoDB connection failed:", error.message);
    }

    // Fallback to local MongoDB only when not in serverless/cloud environment
    if (!process.env.VERCEL && !MONGO_URI.includes("127.0.0.1") && !MONGO_URI.includes("localhost")) {
      try {
        console.log("Attempting fallback connection to local MongoDB (mongodb://127.0.0.1:27017/taskdb)...");
        await mongoose.connect("mongodb://127.0.0.1:27017/taskdb", {
          serverSelectionTimeoutMS: 3000,
        });
        console.log("Connected to local MongoDB successfully.");
        return mongoose.connection;
      } catch {
        console.warn("Warning: Database connection could not be established (Atlas/Docker/Local). Server running in limited DB mode.");
      }
    } else {
      console.warn("Warning: Database connection could not be established. Server running in limited DB mode.");
    }
  })();

  return cachedPromise;
}
