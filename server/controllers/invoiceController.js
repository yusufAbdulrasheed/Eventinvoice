import Invoice from "../models/Invoice.js";
import Counter from "../models/Counter.js";
import Client from "../models/Clients.js";
import { sendMail, isMailerConfigured } from "../config/mailer.js";

// Helper: generate next invoice number for this user// Uses an atomic per-user counter so numbers are unique and never reused,
// even under concurrent requests or after an earlier invoice is deleted.
const getNextInvoiceNumber = async (userId) => {
  const counter = await Counter.findByIdAndUpdate(
    String(userId),
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `INV-${String(counter.seq).padStart(4, "0")}`;
};

// Helper: compute totals from line items + taxRate
const computeTotals = (lineItems, taxRate = 0) => {
  const subtotal  = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = parseFloat(((subtotal * taxRate) / 100).toFixed(2));
  const total     = parseFloat((subtotal + taxAmount).toFixed(2));
  return { subtotal: parseFloat(subtotal.toFixed(2)), taxAmount, total };
};

// GET /api/invoices
export const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ user: req.user._id })
      .populate("client", "name email company")
      .sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/invoices/:id
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user._id })
      .populate("client");
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// POST /api/invoices
export const createInvoice = async (req, res) => {
  const { clientId, issueDate, dueDate, lineItems, taxRate, notes, currency, status } = req.body;

  if (!clientId || !issueDate || !dueDate || !lineItems?.length) {
    return res.status(400).json({ message: "Client, dates and at least one line item are required" });
  }

  try {
    // Client must belong to the requesting user — otherwise this would let
    // any authenticated user attach (and later read back via populate)
    // another tenant's client record just by guessing/passing its id.
    const client = await Client.findOne({ _id: clientId, user: req.user._id });
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Recompute amounts server-side (never trust client math for billing)
    const items = lineItems.map((item) => ({
      ...item,
      amount: parseFloat((item.quantity * item.rate).toFixed(2)),
    }));

    const { subtotal, taxAmount, total } = computeTotals(items, taxRate || 0);
    const invoiceNumber = await getNextInvoiceNumber(req.user._id);

    const invoice = await Invoice.create({
      user: req.user._id,
      client: clientId,
      invoiceNumber,
      status: status || "draft",
      issueDate,
      dueDate,
      lineItems: items,
      subtotal,
      taxRate:   taxRate || 0,
      taxAmount,
      total,
      notes:     notes || "",
      currency:  currency || "NGN",
    });

    const populated = await invoice.populate("client", "name email company");
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PUT /api/invoices/:id
export const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user._id });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    const { clientId, issueDate, dueDate, lineItems, taxRate, notes, currency, status } = req.body;

    if (clientId) {
      const client = await Client.findOne({ _id: clientId, user: req.user._id });
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      invoice.client = clientId;
    }
    if (issueDate)  invoice.issueDate  = issueDate;
    if (dueDate)    invoice.dueDate    = dueDate;
    if (notes !== undefined) invoice.notes = notes;
    if (currency)   invoice.currency   = currency;
    if (status)     invoice.status     = status;

    if (lineItems?.length) {
      invoice.lineItems = lineItems.map((item) => ({
        ...item,
        amount: parseFloat((item.quantity * item.rate).toFixed(2)),
      }));
    }
    if (taxRate !== undefined) invoice.taxRate = taxRate;

    // Recompute totals whenever line items or tax rate could have changed
    const totals = computeTotals(invoice.lineItems, invoice.taxRate);
    invoice.subtotal  = totals.subtotal;
    invoice.taxAmount = totals.taxAmount;
    invoice.total     = totals.total;

    const updated = await invoice.save();
    const populated = await updated.populate("client", "name email company");
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE /api/invoices/:id
export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.json({ message: "Invoice deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PATCH /api/invoices/:id/status
export const updateStatus = async (req, res) => {
  const { status } = req.body;
  const valid = ["draft", "sent", "paid", "overdue"];

  if (!valid.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    // Manually marking paid (e.g. an offline/cash payment) should still
    // record when — same field the Paystack webhook sets on an online payment.
    const update = status === "paid" ? { status, paidAt: new Date() } : { status };

    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      update,
      { new: true }
    ).populate("client", "name email company");

    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// POST /api/invoices/:id/send — emails the invoice to the client on file.
// Owner-scoped. Requires SMTP_HOST/SMTP_USER/SMTP_PASS to be set in
// server/.env — returns 503 with a clear message if they aren't.
export const sendInvoiceEmail = async (req, res) => {
  if (!isMailerConfigured()) {
    return res.status(503).json({
      message: "Email isn't set up yet. Add SMTP_HOST, SMTP_USER and SMTP_PASS to server/.env to enable sending.",
    });
  }

  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user._id }).populate("client");
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    if (!invoice.client?.email) {
      return res.status(400).json({ message: "This client has no email address on file" });
    }

    if (!invoice.publicToken) await invoice.save(); // backfill for older invoices

    const base = process.env.CLIENT_URL || "http://localhost:5173";
    const payUrl = `${base}/pay/${invoice.publicToken}`;
    const formatMoney = (n) =>
      new Intl.NumberFormat("en-NG", { style: "currency", currency: invoice.currency }).format(n);

    const subject = `Invoice ${invoice.invoiceNumber} from ${req.user.name}`;
    const text =
      `Hi ${invoice.client.name},\n\n` +
      `${req.user.name} sent you invoice ${invoice.invoiceNumber} for ${formatMoney(invoice.total)}, due ${new Date(invoice.dueDate).toLocaleDateString()}.\n\n` +
      `View and pay online: ${payUrl}\n\n` +
      (invoice.notes ? `Notes: ${invoice.notes}\n\n` : "") +
      `Thanks!`;
    const html =
      `<p>Hi ${invoice.client.name},</p>` +
      `<p><strong>${req.user.name}</strong> sent you invoice <strong>${invoice.invoiceNumber}</strong> for <strong>${formatMoney(invoice.total)}</strong>, due ${new Date(invoice.dueDate).toLocaleDateString()}.</p>` +
      `<p><a href="${payUrl}">View and pay invoice ${invoice.invoiceNumber}</a></p>` +
      (invoice.notes ? `<p>${invoice.notes}</p>` : "") +
      `<p>Thanks!</p>`;

    await sendMail({ to: invoice.client.email, subject, html, text });

    // Sending a draft is the same real-world action as marking it sent.
    if (invoice.status === "draft") {
      invoice.status = "sent";
      await invoice.save();
    }

    res.json({ message: `Invoice emailed to ${invoice.client.email}` });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/invoices/:id/payment-link — owner-scoped. Older invoices predate
// the publicToken field, so this backfills one (via the model's pre-save
// hook) on first request instead of needing a migration script.
export const getPaymentLink = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user._id });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    if (!invoice.publicToken) {
      await invoice.save();
    }

    const base = process.env.CLIENT_URL || "http://localhost:5173";
    res.json({ url: `${base}/pay/${invoice.publicToken}` });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
