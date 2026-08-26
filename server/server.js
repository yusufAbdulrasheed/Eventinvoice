import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cron from "node-cron";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js"
import clientRoutes from "./routes/clientRoutes.js"
import itemRoutes from "./routes/itemRoutes.js"
import invoiceRoutes from "./routes/invoiceRoutes.js"
import publicRoutes from "./routes/publicRoutes.js"
import webhookRoutes from "./routes/webhookRoutes.js"

dotenv.config();

const app = express();

// CLIENT_URL is the deployed frontend's own origin (e.g. the Vercel domain) —
// not this server's URL. Comma-separate multiple values (e.g. a Vercel
// preview + production domain) if needed. localhost:5173 is always allowed
// too, so local dev never breaks regardless of what CLIENT_URL is set to.
const allowedOrigins = [
  "http://localhost:5173",
  ...(process.env.CLIENT_URL || "").split(",").map((o) => o.trim()).filter(Boolean),
];

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // No Origin header (server-to-server calls, curl, Postman) — allow.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} is not allowed`));
  },
  credentials: true,
}));

// Mounted before express.json(): the webhook signature check needs the raw
// request body, which express.json() would otherwise have already parsed.
app.use("/api/webhooks", webhookRoutes);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/public/invoices", publicRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "InvoiceApp API is running" });
});

// Keep the Render free-tier instance from spinning down after 15 minutes of
// no inbound traffic — self-ping the health check every 10 minutes.
// RENDER_EXTERNAL_URL is set automatically by Render; SELF_URL is a manual
// fallback for other hosts. Skipped entirely (e.g. local dev) if neither
// is set, since there's nothing to keep alive.
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
