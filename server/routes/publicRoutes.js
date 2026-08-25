import express from "express";
import { getPublicInvoice, createCheckoutSession } from "../controllers/publicController.js";

const router = express.Router();

// No `protect` here on purpose — this is the client-facing payment link.
router.get("/:token", getPublicInvoice);
router.post("/:token/checkout-session", createCheckoutSession);

export default router;
