import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Icon from "../components/Icon";
import { getInvoices, deleteInvoice, updateStatus } from "../utils/invoiceApi";
import { getPaymentLink } from "../utils/publicApi";
import { formatCurrency, formatDate, STATUS_LABELS, STATUS_CLASS, PAYSTACK_SUPPORTED_CURRENCIES } from "../utils/format";

const FILTERS = ["all", "draft", "sent", "paid", "overdue"];
const PAYABLE_STATUSES = ["sent", "overdue"];

export default function Invoices() {
  const navigate = useNavigate();
  const location = useLocation();
  const [invoices, setInvoices]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState("all");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [statusMenu, setStatusMenu]   = useState(null); // invoice id with open menu
  const [copiedId, setCopiedId]       = useState(null);

  // Re-runs on mount, and again whenever the Create/Edit Invoice modal signals
  // a save via location.state — it stays open as this page's background
  // (see App.jsx), so it can't rely on remounting to pick up new data.
  useEffect(() => {
    fetchInvoices();
  }, [location.state?.invoicesUpdatedAt]);

  const fetchInvoices = async () => {
    try {
      const { data } = await getInvoices();
      setInvoices(data);
    } catch (err) {
      console.error("Failed to load invoices", err);
    } finally {
      setLoading(false);
    }
  };

  const openNewInvoice = () => navigate("/invoices/new", { state: { backgroundLocation: location } });
  const openEditInvoice = (id) => navigate(`/invoices/${id}/edit`, { state: { backgroundLocation: location } });

  const handleDelete = async () => {
    await deleteInvoice(deleteTarget._id);
    setInvoices((p) => p.filter((inv) => inv._id !== deleteTarget._id));
    setDeleteTarget(null);
  };

  const handleStatusChange = async (invoiceId, status) => {
    const { data } = await updateStatus(invoiceId, status);
    setInvoices((p) => p.map((inv) => (inv._id === data._id ? data : inv)));
    setStatusMenu(null);
  };

  const handleCopyLink = async (invoiceId) => {
    try {
      const { data } = await getPaymentLink(invoiceId);
      await navigator.clipboard.writeText(data.url);
      setCopiedId(invoiceId);
      setTimeout(() => setCopiedId((id) => (id === invoiceId ? null : id)), 2000);
    } catch (err) {
      console.error("Failed to copy payment link", err);
    }
  };

  const filtered = filter === "all"
    ? invoices
    : invoices.filter((inv) => inv.status === filter);

  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === "all" ? invoices.length : invoices.filter((i) => i.status === f).length;
    return acc;
  }, {});

  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const totalPending = invoices.filter((i) => i.status === "sent").reduce((s, i) => s + i.total, 0);
  const totalOverdue = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + i.total, 0);

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">Invoices</h2>
          <p className="page-sub">Manage and track your billing history.</p>
        </div>
        <button className="btn btn-primary" onClick={openNewInvoice}>
          <Icon name="add" size={18} />
          Create Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <div className="card overflow-hidden">
          <span className="font-label-caps text-label-caps text-on-surface-variant block mb-2">Total Paid</span>
          <span className="font-headline-md text-headline-md text-primary block truncate" title={formatCurrency(totalPaid)}>{formatCurrency(totalPaid)}</span>
        </div>
        <div className="card overflow-hidden">
          <span className="font-label-caps text-label-caps text-on-surface-variant block mb-2">Pending</span>
          <span className="font-headline-md text-headline-md text-primary block truncate" title={formatCurrency(totalPending)}>{formatCurrency(totalPending)}</span>
        </div>
        <div className="card border-error/30 overflow-hidden">
          <span className="font-label-caps text-label-caps text-error block mb-2">Overdue</span>
          <span className="font-headline-md text-headline-md text-error block truncate" title={formatCurrency(totalOverdue)}>{formatCurrency(totalOverdue)}</span>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-label-caps text-label-caps whitespace-nowrap transition-colors ${
              filter === f
                ? "bg-primary text-on-primary"
                : "bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:border-secondary"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className={`text-[10px] px-1.5 rounded-full ${filter === f ? "bg-on-primary/20" : "bg-surface-container-high"}`}>{counts[f]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <p className="loading-state">Loading invoices…</p>
      ) : filtered.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon"><Icon name="receipt_long" size={36} /></div>
          <h2 className="empty-title">
            {filter === "all" ? "No invoices yet" : `No ${filter} invoices`}
          </h2>
          <p className="empty-desc">
            {filter === "all"
              ? "Create your first invoice to get started."
              : `You have no invoices with status "${filter}".`}
          </p>
          {filter === "all" && (
            <button className="btn btn-primary" onClick={openNewInvoice}>Create invoice</button>
          )}
        </div>
      ) : (
        <div className="card p-0! overflow-visible">
          <div className="table-scroll">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-surface-variant">
                  <th className="font-label-caps text-label-caps text-on-surface-variant px-6 py-4 uppercase">Invoice ID</th>
                  <th className="font-label-caps text-label-caps text-on-surface-variant px-6 py-4 uppercase">Client Name</th>
                  <th className="font-label-caps text-label-caps text-on-surface-variant px-6 py-4 uppercase">Event Date</th>
                  <th className="font-label-caps text-label-caps text-on-surface-variant px-6 py-4 uppercase">Due Date</th>
                  <th className="font-label-caps text-label-caps text-on-surface-variant px-6 py-4 uppercase text-right">Amount</th>
                  <th className="font-label-caps text-label-caps text-on-surface-variant px-6 py-4 uppercase text-right">Status</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md">
                {filtered.map((inv) => (
                  <tr key={inv._id} className="border-b border-surface-variant last:border-b-0 hover:bg-surface-bright transition-colors">
                    <td className="px-6 py-4 font-semibold text-primary">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4">
                      <span className="text-on-surface block">{inv.client?.name}</span>
                      {inv.client?.company && (
                        <span className="text-on-surface-variant text-sm">{inv.client.company}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant">{formatDate(inv.issueDate)}</td>
                    <td className={`px-6 py-4 ${inv.status === "overdue" ? "text-error font-semibold" : "text-on-surface-variant"}`}>
                      {formatDate(inv.dueDate)}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-primary">{formatCurrency(inv.total, inv.currency)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1 relative">
                        <span className={`badge ${STATUS_CLASS[inv.status]}`}>{STATUS_LABELS[inv.status]}</span>
                        <button
                          className="text-on-surface-variant hover:text-primary p-1 rounded-full hover:bg-surface-container transition-colors"
                          onClick={() => setStatusMenu(statusMenu === inv._id ? null : inv._id)}
                          title="Change status"
                        >
                          <Icon name="expand_more" size={16} />
                        </button>
                        {statusMenu === inv._id && (
                          <div className="absolute right-0 top-full mt-1 z-20 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-[0_8px_24px_rgba(74,16,21,0.12)] p-1 flex flex-col min-w-[140px]">
                            {["draft", "sent", "paid", "overdue"].map((s) => (
                              <button
                                key={s}
                                className={`text-left px-3 py-2 rounded hover:bg-surface-container transition-colors ${inv.status === s ? "bg-surface-container" : ""}`}
                                onClick={() => handleStatusChange(inv._id, s)}
                              >
                                <span className={`badge ${STATUS_CLASS[s]}`}>{STATUS_LABELS[s]}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1 flex-wrap">
                        {PAYABLE_STATUSES.includes(inv.status) && PAYSTACK_SUPPORTED_CURRENCIES.includes(inv.currency) && (
                          <button className="btn btn-ghost px-3! py-1.5! text-sm" onClick={() => handleCopyLink(inv._id)}>
                            {copiedId === inv._id ? "Copied!" : "Copy link"}
                          </button>
                        )}
                        <button className="btn btn-ghost px-3! py-1.5! text-sm" onClick={() => navigate(`/invoices/${inv._id}/preview`)}>Preview</button>
                        <button className="btn btn-ghost px-3! py-1.5! text-sm" onClick={() => openEditInvoice(inv._id)}>Edit</button>
                        <button className="btn px-3! py-1.5! text-sm text-error hover:bg-error-container" onClick={() => setDeleteTarget(inv)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Delete invoice?</h2>
            <p className="confirm-text">
              Delete <strong>{deleteTarget.invoiceNumber}</strong>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button className="btn btn-outline" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Yes, delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
