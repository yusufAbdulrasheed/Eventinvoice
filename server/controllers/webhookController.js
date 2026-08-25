import crypto from "crypto";
import Invoice from "../models/Invoice.js";
import { verifyTransaction } from "../config/paystack.js";

// POST /api/webhooks/paystack — body is the raw Buffer (see webhookRoutes.js),
// required because the HMAC must be computed over the exact bytes Paystack sent.
export const handlePaystackWebhook = async (req, res) => {
  const signature = req.headers["x-paystack-signature"];
  const expected = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(req.body)
    .digest("hex");

  const valid =
    signature &&
    signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));

  if (!valid) {
    return res.status(401).json({ message: "Invalid signature" });
  }

  // Signature is good — acknowledge immediately, Paystack expects a fast 200.
  res.sendStatus(200);

  let event;
  try {
    event = JSON.parse(req.body.toString("utf8"));
  } catch {
    return; // malformed body; nothing more we can do after already ack'ing
  }

  if (event.event !== "charge.success") return;

  try {
    const reference = event.data?.reference;
    if (!reference) return;

    // Defense in depth: don't trust the webhook payload alone. Confirm the
    // transaction server-to-server before granting "paid" status.
    const verified = await verifyTransaction(reference);
    if (verified.status !== "success") return;

    const invoiceId = verified.metadata?.invoiceId;
    const invoice =
      (await Invoice.findOne({ "payment.reference": reference })) ||
      (invoiceId ? await Invoice.findById(invoiceId) : null);

    if (!invoice || invoice.status === "paid") return; // not found, or already applied (idempotent)

    const expectedAmount = Math.round(invoice.total * 100);
    if (verified.amount !== expectedAmount || verified.currency !== invoice.currency) {
      return; // amount/currency mismatch — refuse to mark paid
    }

    invoice.status = "paid";
    invoice.paidAt = new Date();
    invoice.payment = {
      provider: "paystack",
      reference,
      paystackTransactionId: verified.id,
    };
    await invoice.save();
  } catch {
    // Webhook already ack'd with 200; Paystack won't retry on our internal
    // errors here. Worst case the invoice needs a manual mark-as-paid.
  }
};
