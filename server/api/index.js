import app from "../app.js";
import { connectDB } from "../config/db.js";

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (error) {
    console.error("[Vercel Serverless] Database connection error:", error.message);
  }
  return app(req, res);
}

