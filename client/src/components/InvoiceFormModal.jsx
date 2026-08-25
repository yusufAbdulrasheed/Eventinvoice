import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "./Icon";
import { getClients } from "../utils/clientApi";
import { createInvoice, getInvoice, updateInvoice } from "../utils/invoiceApi";
import { formatCurrency, toInputDate } from "../utils/format";

// Format using local date parts (toISOString would shift to UTC and can
// land on the wrong day for users behind/ahead of UTC)
const toLocalDateInput = (d) => {
  const year  = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day   = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const today      = () => toLocalDateInput(new Date());
const thirtyDays = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return toLocalDateInput(d);
};

const EMPTY_ITEM = { description: "", quantity: 1, rate: 0, amount: 0 };

const EMPTY_FORM = {
  clientId:  "",
  issueDate: today(),
  dueDate:   thirtyDays(),
  currency:  "NGN",
  taxRate:   0,
  notes:     "",
  status:    "draft",
  lineItems: [{ ...EMPTY_ITEM }],
};

export default function InvoiceFormModal() {
  const { id } = useParams();          // present when editing
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const close = () => navigate("/invoices");

  const [form, setForm]       = useState(EMPTY_FORM);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [clients, setClients] = useState([]);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEditing);

  useEffect(() => {
    getClients().then(({ data }) => setClients(data));

    if (isEditing) {
      getInvoice(id).then(({ data }) => {
        setForm({
          clientId:  data.client._id,
          issueDate: toInputDate(data.issueDate),
          dueDate:   toInputDate(data.dueDate),
          currency:  data.currency,
          taxRate:   data.taxRate,
          notes:     data.notes,
          status:    data.status,
          lineItems: data.lineItems,
        });
        setInvoiceNumber(data.invoiceNumber);
        setPageLoading(false);
      }).catch(() => close());
    }
  }, [id]);

  const handleField = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleItem = (index, field, value) => {
    setForm((prev) => {
      const items = prev.lineItems.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        updated.amount = parseFloat(
          ((parseFloat(updated.quantity) || 0) * (parseFloat(updated.rate) || 0)).toFixed(2)
        );
        return updated;
      });
      return { ...prev, lineItems: items };
    });
  };

  const addItem    = () => setForm((p) => ({ ...p, lineItems: [...p.lineItems, { ...EMPTY_ITEM }] }));
  const removeItem = (i) => setForm((p) => ({ ...p, lineItems: p.lineItems.filter((_, idx) => idx !== i) }));

  const subtotal  = form.lineItems.reduce((s, item) => s + (item.amount || 0), 0);
  const taxAmount = parseFloat(((subtotal * (parseFloat(form.taxRate) || 0)) / 100).toFixed(2));
  const total     = parseFloat((subtotal + taxAmount).toFixed(2));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.clientId) return setError("Please select a client");
    if (form.lineItems.some((i) => !i.description.trim())) return setError("All line items need a description");
    if (form.lineItems.some((i) => i.quantity <= 0 || i.rate < 0)) return setError("Quantity must be > 0 and rate ≥ 0");

    setLoading(true);
    try {
      if (isEditing) {
        await updateInvoice(id, form);
      } else {
        await createInvoice(form);
      }
      // The invoices list stays mounted in the background behind this modal
      // (see App.jsx's modal-over-background routing), so a plain navigate
      // back to it won't re-trigger its mount-only fetch — signal it via
      // location.state instead so it knows to refetch.
      navigate("/invoices", { state: { invoicesUpdatedAt: Date.now() } });
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal max-w-[800px] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{isEditing ? "Edit Invoice" : "Create New Invoice"}</h2>
          <button className="modal-close" onClick={close} aria-label="Close">
            <Icon name="close" size={20} />
          </button>
        </div>

        {pageLoading ? (
          <p className="loading-state px-8">Loading…</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="px-5 md:px-8 py-5 md:py-8 space-y-8">
              {error && <div className="auth-error">{error}</div>}

              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group col-span-1 md:col-span-2">
                  <label className="form-label">Client *</label>
                  <select name="clientId" className="form-input" value={form.clientId} onChange={handleField} required>
                    <option value="">Select a client…</option>
                    {clients.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}{c.company ? ` — ${c.company}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Issue Date *</label>
                  <input className="form-input" type="date" name="issueDate" value={form.issueDate} onChange={handleField} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date *</label>
                  <input className="form-input" type="date" name="dueDate" value={form.dueDate} onChange={handleField} required />
                </div>

                <div className="form-group">
                  <label className="form-label">Invoice Number</label>
                  <input className="form-input bg-surface-container-low cursor-not-allowed" readOnly value={invoiceNumber || "Auto-generated on save"} />
                </div>
                <div className="form-group">
                  <label className="form-label">Currency</label>
                  <input className="form-input bg-surface-container-low cursor-not-allowed" readOnly value={form.currency === "NGN" ? "NGN — Nigerian Naira" : form.currency} />
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select name="status" className="form-input" value={form.status} onChange={handleField}>
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="font-title-lg text-title-lg text-primary">Service Items</h3>
                <div className="border border-outline-variant rounded-xl overflow-hidden">
                  <div className="hidden md:grid grid-cols-12 gap-4 bg-surface-container py-3 px-4 border-b border-outline-variant items-center">
                    <div className="col-span-6 font-label-caps text-label-caps text-on-surface-variant">Description</div>
                    <div className="col-span-2 font-label-caps text-label-caps text-on-surface-variant text-right">Qty</div>
                    <div className="col-span-2 font-label-caps text-label-caps text-on-surface-variant text-right">Rate</div>
                    <div className="col-span-2 font-label-caps text-label-caps text-on-surface-variant text-right">Amount</div>
                  </div>
                  <div className="divide-y divide-outline-variant">
                    {form.lineItems.map((item, i) => (
                      <div className="grid grid-cols-2 md:grid-cols-12 gap-3 md:gap-4 py-4 px-4 group hover:bg-surface-bright transition-colors border-l-2 border-transparent hover:border-secondary" key={i}>
                        <div className="col-span-2 md:col-span-6 flex items-center gap-2">
                          <input
                            className="w-full bg-transparent border border-outline-variant md:border-none rounded md:rounded-none px-3 md:px-0 py-2 md:py-0 text-on-surface font-body-md text-body-md focus:ring-0 placeholder-outline-variant"
                            placeholder="Item description"
                            value={item.description}
                            onChange={(e) => handleItem(i, "description", e.target.value)}
                          />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <label className="md:hidden form-label mb-1 block">Qty</label>
                          <input
                            className="w-full bg-transparent border border-outline-variant rounded px-2 py-1.5 md:py-1 text-on-surface font-body-md text-body-md focus:border-secondary focus:ring-1 focus:ring-secondary text-right"
                            type="number" min="0" step="0.01"
                            value={item.quantity}
                            onChange={(e) => handleItem(i, "quantity", e.target.value)}
                          />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <label className="md:hidden form-label mb-1 block">Rate</label>
                          <input
                            className="w-full bg-transparent border border-outline-variant rounded px-2 py-1.5 md:py-1 text-on-surface font-body-md text-body-md focus:border-secondary focus:ring-1 focus:ring-secondary text-right"
                            type="number" min="0" step="0.01"
                            value={item.rate}
                            onChange={(e) => handleItem(i, "rate", e.target.value)}
                          />
                        </div>
                        <div className="col-span-1 md:col-span-1">
                          <span className="md:hidden form-label mb-1 block">Amount</span>
                          <div className="text-right font-body-md text-body-md text-primary py-1.5 md:py-0">
                            {formatCurrency(item.amount, form.currency)}
                          </div>
                        </div>
                        <div className="col-span-1 md:col-span-1 flex items-center justify-end">
                          {form.lineItems.length > 1 && (
                            <button type="button" className="text-on-surface-variant hover:text-error p-1" onClick={() => removeItem(i)} title="Remove line">
                              <Icon name="delete" size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="py-3 px-4 bg-surface-container-lowest">
                    <button type="button" className="btn btn-ghost px-2! py-1! text-secondary" onClick={addItem}>
                      <Icon name="add_circle" size={18} />
                      Add Line Item
                    </button>
                  </div>
                </div>
              </section>

              <section className="flex flex-col md:flex-row justify-between gap-8 pt-4">
                <div className="flex-1 form-group">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-input resize-none"
                    name="notes"
                    value={form.notes}
                    onChange={handleField}
                    placeholder="Thank you for your business…"
                    rows={3}
                  />
                </div>
                <div className="w-full md:w-72 space-y-4">
                  <div className="flex justify-between items-center text-on-surface font-body-lg text-body-lg">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal, form.currency)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-on-surface font-body-lg text-body-lg">Tax (%)</span>
                    <input
                      className="w-20 bg-surface-container-lowest border border-outline-variant rounded px-2 py-1 text-on-surface font-body-md text-body-md focus:border-secondary focus:ring-1 focus:ring-secondary text-right"
                      type="number" min="0" max="100" step="0.1"
                      value={form.taxRate}
                      onChange={(e) => setForm((p) => ({ ...p, taxRate: e.target.value }))}
                    />
                  </div>
                  <div className="h-px w-full bg-outline-variant" />
                  <div className="flex justify-between items-center">
                    <span className="font-headline-sm text-headline-sm text-primary">Total</span>
                    <span className="font-headline-sm text-headline-sm text-primary">{formatCurrency(total, form.currency)}</span>
                  </div>
                </div>
              </section>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={close}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Saving…" : isEditing ? "Save changes" : "Create Invoice"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
