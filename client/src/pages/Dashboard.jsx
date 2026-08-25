import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getInvoices } from "../utils/invoiceApi";
import { formatCurrency } from "../utils/format";
import Icon from "../components/Icon";

const TONE_CLASS = {
  accent: "text-on-tertiary-fixed bg-tertiary-fixed",
  neutral: "text-on-surface-variant bg-surface-container-high",
  success: "text-on-secondary-fixed bg-secondary-fixed",
  danger: "text-error bg-error-container",
};

export default function Dashboard() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    getInvoices()
      .then(({ data }) => setInvoices(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openNewInvoice = () => navigate("/invoices/new", { state: { backgroundLocation: location } });
  const openEditInvoice = (id) => navigate(`/invoices/${id}/edit`, { state: { backgroundLocation: location } });

  const paid    = invoices.filter((i) => i.status === "paid");
  const unpaid  = invoices.filter((i) => i.status === "sent");
  const overdue = invoices.filter((i) => i.status === "overdue");

  const totalRevenue   = paid.reduce((s, i) => s + i.total, 0);
  const unpaidTotal    = unpaid.reduce((s, i) => s + i.total, 0);
  const overdueTotal   = overdue.reduce((s, i) => s + i.total, 0);
  const paidThisMonth  = paid.filter((i) => {
    if (!i.paidAt) return false; // paid before this field existed / marked paid manually pre-migration
    const d = new Date(i.paidAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, i) => s + i.total, 0);

  const stats = [
    { label: "Total Revenue", value: formatCurrency(totalRevenue), icon: "account_balance_wallet", note: `${paid.length} invoice${paid.length === 1 ? "" : "s"} paid`, tone: "accent" },
    { label: "Pending", value: formatCurrency(unpaidTotal), icon: "pending_actions", note: `${unpaid.length} awaiting payment`, tone: "neutral" },
    { label: "Paid this month", value: formatCurrency(paidThisMonth), icon: "check_circle", note: "settled this month", tone: "success" },
    { label: "Overdue", value: formatCurrency(overdueTotal), icon: "error", note: `${overdue.length} need attention`, tone: "danger" },
  ];

  const recent = invoices.slice(0, 5);

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">Welcome back, {user?.name?.split(" ")[0]}</h2>
          <p className="page-sub">Here's how your business is doing.</p>
        </div>
        <button className="btn btn-primary" onClick={openNewInvoice}>
          <Icon name="add" size={18} />
          New Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((s) => (
          <div className="card" key={s.label}>
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-label-caps text-label-caps text-on-surface-variant mb-2">{s.label}</div>
                <div className="font-headline-md text-headline-md text-primary whitespace-nowrap overflow-hidden text-ellipsis" title={loading ? undefined : s.value}>{loading ? "—" : s.value}</div>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${TONE_CLASS[s.tone]}`}>
                <Icon name={s.icon} size={20} filled />
              </div>
            </div>
            <div className="font-body-md text-body-md text-on-surface-variant mt-3">{s.note}</div>
          </div>
        ))}
      </div>

      <div className="card p-0! overflow-hidden">
        <div className="glass-panel static! flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-5">
          <div>
            <h2 className="font-title-lg text-title-lg text-primary">Recent Invoices</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">Manage and track your latest billing activity.</p>
          </div>
          <button className="btn btn-secondary whitespace-nowrap self-start sm:self-auto" onClick={() => navigate("/invoices")}>
            View all
          </button>
        </div>

        {loading ? (
          <p className="loading-state px-6">Loading…</p>
        ) : recent.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Icon name="receipt_long" size={36} /></div>
            <h2 className="empty-title">No invoices yet</h2>
            <p className="empty-desc">Create your first invoice to get started.</p>
            <button className="btn btn-primary" onClick={openNewInvoice}>Create invoice</button>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-surface-variant">
                  <th className="font-label-caps text-label-caps text-on-surface-variant px-6 py-3 uppercase">Invoice</th>
                  <th className="font-label-caps text-label-caps text-on-surface-variant px-6 py-3 uppercase">Client</th>
                  <th className="font-label-caps text-label-caps text-on-surface-variant px-6 py-3 uppercase">Amount</th>
                  <th className="font-label-caps text-label-caps text-on-surface-variant px-6 py-3 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md">
                {recent.map((inv) => (
                  <tr
                    key={inv._id}
                    className="border-b border-surface-variant last:border-b-0 hover:bg-surface-bright transition-colors cursor-pointer"
                    onClick={() => openEditInvoice(inv._id)}
                  >
                    <td className="px-6 py-4 font-semibold text-primary">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4">{inv.client?.name}</td>
                    <td className="px-6 py-4 font-semibold text-primary">{formatCurrency(inv.total, inv.currency)}</td>
                    <td className="px-6 py-4">
                      <span className={`badge badge-${inv.status === "sent" ? "unpaid" : inv.status}`}>
                        {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
