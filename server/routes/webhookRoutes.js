import express from "express";
import { handlePaystackWebhook } from "../controllers/webhookController.js";

const router = express.Router();

// Raw body is required for HMAC signature verification — must be mounted
// before the global express.json() middleware in server.js.
router.post("/paystack", express.raw({ type: "application/json" }), handlePaystackWebhook);

export default router;
