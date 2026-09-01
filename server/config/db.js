import mongoose from "mongoose";

export async function connectDB() {
  const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (MONGO_URI) {
    try {
      console.log(
        "Connecting to MongoDB:",
        MONGO_URI.replace(/(mongodb\+srv:\/\/[^:]+:)[^@]+(@.*)/, "$1*****$2")
      );
      await mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log("MongoDB connected successfully.");
      return;
    } catch (error) {
      console.error("MongoDB Atlas connection failed:", error.message);
    }
  } else {
    console.warn("No MONGODB_URI provided. Falling back to local MongoDB.");
  }

  try {
    console.log("Attempting connection to local MongoDB (mongodb://127.0.0.1:27017/taskdb)...");
    await mongoose.connect("mongodb://127.0.0.1:27017/taskdb", {
      serverSelectionTimeoutMS: 3000,
    });
    console.log("Connected to local MongoDB successfully.");
  } catch {
    console.warn("Warning: Database connection could not be established (Atlas/Local). Server running in limited DB mode.");
  }
}
