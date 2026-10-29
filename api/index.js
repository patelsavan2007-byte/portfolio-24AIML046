import app from "../server/app.js";
import { connectDB } from "../server/config/db.js";

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (error) {
    console.error("[Vercel Serverless] Database connection error:", error.message);
  }
  return app(req, res);
}

