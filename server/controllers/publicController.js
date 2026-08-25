import Invoice from "../models/Invoice.js";
import { initializeTransaction } from "../config/paystack.js";

// Currencies this Paystack account is currently configured to accept.
// Widen this once the account is approved for more.
export const PAYSTACK_SUPPORTED_CURRENCIES = ["NGN"];

const PAYABLE_STATUSES = ["sent", "overdue"];

// GET /api/public/invoices/:token — unauthenticated, deliberately narrow projection
export const getPublicInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ publicToken: req.params.token })
      .populate("client", "name email company")
      .populate("user", "name email bankDetails");

    if (!invoice || invoice.status === "draft") {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.json({
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      lineItems: invoice.lineItems,
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount,
      total: invoice.total,
      currency: invoice.currency,
      notes: invoice.notes,
      paidAt: invoice.paidAt,
      client: invoice.client,
      from: invoice.user,
      payable: PAYABLE_STATUSES.includes(invoice.status) && PAYSTACK_SUPPORTED_CURRENCIES.includes(invoice.currency),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// POST /api/public/invoices/:token/checkout-session — unauthenticated
export const createCheckoutSession = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ publicToken: req.params.token }).populate("client", "email");
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    if (!PAYABLE_STATUSES.includes(invoice.status)) {
      return res.status(400).json({ message: "This invoice is not payable" });
    }
    if (!PAYSTACK_SUPPORTED_CURRENCIES.includes(invoice.currency)) {
      return res.status(400).json({ message: `Online payment isn't available for ${invoice.currency} invoices yet` });
    }

    const reference = `inv_${invoice._id}_${Date.now()}`;

    // Amount is always recomputed from the invoice as currently stored —
    // never accepted from the client — and converted to the smallest
    // currency subunit Paystack expects (kobo for NGN).
    const { authorization_url: url } = await initializeTransaction({
      email: invoice.client.email,
      amount: Math.round(invoice.total * 100),
      currency: invoice.currency,
      reference,
      callbackUrl: `${process.env.CLIENT_URL || "http://localhost:5173"}/pay/${invoice.publicToken}`,
      metadata: { invoiceId: String(invoice._id) },
    });

    invoice.payment = { provider: "paystack", reference };
    await invoice.save();

    res.json({ url });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
