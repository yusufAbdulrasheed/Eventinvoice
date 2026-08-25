export const formatCurrency = (amount, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency }).format(amount ?? 0);

export const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
};

export const toInputDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
};

export const STATUS_LABELS = {
  draft:   "Draft",
  sent:    "Sent",
  paid:    "Paid",
  overdue: "Overdue",
};

export const STATUS_CLASS = {
  draft:   "badge-draft",
  sent:    "badge-unpaid",
  paid:    "badge-paid",
  overdue: "badge-overdue",
};

// Currencies the connected Paystack account currently accepts. Keep in sync
// with server/controllers/publicController.js — widen both once the account
// is approved for more currencies.
export const PAYSTACK_SUPPORTED_CURRENCIES = ["NGN"];

// Inventory item status — derived server-side (see server/models/Item.js's
// `status` virtual), just labeled/styled here.
export const ITEM_STATUS_LABELS = {
  in_stock: "In Stock",
  rented: "Rented",
  low_stock: "Low Stock",
  pending_maintenance: "Pending Maint.",
};

export const ITEM_STATUS_CLASS = {
  in_stock: "badge-paid",
  rented: "badge-unpaid",
  low_stock: "badge-overdue",
  pending_maintenance: "badge-draft",
};

export const ITEM_CATEGORY_LABELS = {
  rentals: "Rentals",
  decor: "Decor",
  hardware: "Hardware",
};
