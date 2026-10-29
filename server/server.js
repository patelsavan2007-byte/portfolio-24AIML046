import app from "./app.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
  } catch (error) {
    console.error("Database connection attempt finished with errors:", error.message);
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Task Management API server listening on http://0.0.0.0:${PORT}`);
  });
}

// Start listener for traditional server environments (Render, local, Docker)
if (!process.env.VERCEL) {
  startServer();
}

export default app;
