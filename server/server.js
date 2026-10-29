import app from "./app.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
  } catch {
    console.error("Database connection attempt finished with errors.");
  }
  app.listen(PORT, () => {
    console.log(`Task Management API server listening on http://localhost:${PORT}`);
  });
}

// Only start the server port listener when running locally, not on Vercel
if (!process.env.VERCEL) {
  startServer();
}

export default app;
