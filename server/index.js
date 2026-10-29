import app from "./app.js";
import { connectDB } from "./config/db.js";

// Ensure MongoDB is connected for every serverless request
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.error("[MongoDB] Connection error:", err.message);
  }
  next();
});

export default app;
