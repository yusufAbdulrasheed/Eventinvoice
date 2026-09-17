import dotenv from "dotenv";
import cron from "node-cron";
import { connectDB } from "./config/db.js";
import app from "./app.js";

dotenv.config();

const selfUrl = process.env.RENDER_EXTERNAL_URL || process.env.SELF_URL;

if (selfUrl) {
  cron.schedule("*/10 * * * *", async () => {
    try {
      const res = await fetch(`${selfUrl}/api/health`);
      console.log(`[keep-alive] ping ${res.status}`);
    } catch (error) {
      console.error("[keep-alive] ping failed:", error.message);
    }
  });
  console.log(`[keep-alive] scheduled — pinging ${selfUrl}/api/health every 10 minutes`);
} else {
  console.log("[keep-alive] RENDER_EXTERNAL_URL/SELF_URL not set — skipping self-ping");
}

// Connect DB then start server
const PORT = process.env.PORT || 5006;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
