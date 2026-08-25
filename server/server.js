import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js"
import clientRoutes from "./routes/clientRoutes.js"
import itemRoutes from "./routes/itemRoutes.js"
import invoiceRoutes from "./routes/invoiceRoutes.js"
import publicRoutes from "./routes/publicRoutes.js"
import webhookRoutes from "./routes/webhookRoutes.js"

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
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

// Connect DB then start server
const PORT = process.env.PORT || 5006;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
