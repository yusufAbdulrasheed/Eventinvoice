import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import clientRoutes from "./routes/clientRoutes.js";
import itemRoutes from "./routes/itemRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";

// The Express app itself, with no listener attached — shared by the local/
// Render entrypoint (server.js, which calls app.listen()) and the Netlify
// Function entrypoint (netlify/functions/api.mjs, which wraps this app with
// serverless-http instead). Keeping app construction here means both hosts
// run the exact same middleware/routes.
const app = express();

// CLIENT_URL is the deployed frontend's own origin — not this server's URL.
// Comma-separate multiple values (e.g. a preview + production domain) if
// needed. localhost:5173 is always allowed too, so local dev never breaks
// regardless of what CLIENT_URL is set to.
const allowedOrigins = [
  "http://localhost:5173",
  ...(process.env.CLIENT_URL || "").split(",").map((o) => o.trim()).filter(Boolean),
];

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

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "InvoiceApp API is running" });
});

export default app;
