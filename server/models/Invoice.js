import mongoose from "mongoose";
import crypto from "crypto";

const lineItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    quantity:    { type: Number, required: true, min: 0 },
    rate:        { type: Number, required: true, min: 0 },
    amount:      { type: Number, required: true }, // quantity * rate, stored for fast reads
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "sent", "paid", "overdue"],
      default: "draft",
    },
    issueDate: { type: Date, required: true },
    dueDate:   { type: Date, required: true },

    lineItems: [lineItemSchema],

    subtotal: { type: Number, required: true },
    taxRate:  { type: Number, default: 0 },   // percentage e.g. 10 = 10%
    taxAmount:{ type: Number, default: 0 },
    total:    { type: Number, required: true },

    notes: { type: String, default: "" },
    currency: { type: String, default: "NGN" },

    // Public payment link — a separate unguessable id, distinct from _id,
    // so the shareable /pay/:token URL can't be used to enumerate invoices.
    publicToken: { type: String, unique: true, sparse: true, index: true },
    paidAt: { type: Date },
    payment: {
      provider: { type: String, enum: ["paystack"] },
      reference: { type: String },
      paystackTransactionId: { type: Number },
    },
  },
  { timestamps: true }
);

invoiceSchema.index({ user: 1, invoiceNumber: 1 }, { unique: true });

invoiceSchema.pre("save", function (next) {
  if (!this.publicToken) {
    this.publicToken = crypto.randomBytes(24).toString("hex");
  }
  next();
});

const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;
