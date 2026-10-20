import mongoose from "mongoose";

export async function connectDB() {
  // Practical 12: Guard DB connection during tests so no real MongoDB instance is required
  if (process.env.NODE_ENV === "test") {
    return;
  }

  // Practical 11: Support Docker Compose service name via MONGO_URI (mongodb://mongodb:27017/taskdb)
  // Fall back to MONGODB_URI (e.g., Atlas) or localhost for non-Docker local runs
  const MONGO_URI =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/taskdb";

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
    return;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
  }

  // Fallback to local MongoDB if initial connection was to an external host or container that failed
  if (!MONGO_URI.includes("127.0.0.1") && !MONGO_URI.includes("localhost")) {
    try {
      console.log("Attempting fallback connection to local MongoDB (mongodb://127.0.0.1:27017/taskdb)...");
      await mongoose.connect("mongodb://127.0.0.1:27017/taskdb", {
        serverSelectionTimeoutMS: 3000,
      });
      console.log("Connected to local MongoDB successfully.");
    } catch {
      console.warn("Warning: Database connection could not be established (Atlas/Docker/Local). Server running in limited DB mode.");
    }
  } else {
    console.warn("Warning: Database connection could not be established. Server running in limited DB mode.");
  }
}
