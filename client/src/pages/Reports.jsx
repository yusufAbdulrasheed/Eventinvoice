import { useState, useEffect, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Filler,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import { getInvoices } from "../utils/invoiceApi";
import { formatCurrency } from "../utils/format";
import Icon from "../components/Icon";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Filler);

const MONTHS_BACK = 6;

export default function Reports() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    getInvoices()
      .then(({ data }) => setInvoices(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const paid = invoices.filter((i) => i.status === "paid");
    const outstanding = invoices.filter((i) => i.status === "sent" || i.status === "overdue");

    const totalRevenue = paid.reduce((s, i) => s + i.total, 0);
    const outstandingBalance = outstanding.reduce((s, i) => s + i.total, 0);

    const paymentTimes = paid
      .filter((i) => i.paidAt)
      .map((i) => (new Date(i.paidAt) - new Date(i.issueDate)) / (1000 * 60 * 60 * 24));
    const avgPaymentDays = paymentTimes.length
      ? Math.round(paymentTimes.reduce((s, d) => s + d, 0) / paymentTimes.length)
      : 0;

    return { totalRevenue, outstandingBalance, avgPaymentDays, paidCount: paid.length };
  }, [invoices]);

  const revenueTrend = useMemo(() => {
    const now = new Date();
    const buckets = [];
    for (let i = MONTHS_BACK - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleString("default", { month: "short" }), total: 0 });
    }
    invoices
      .filter((inv) => inv.status === "paid" && inv.paidAt)
      .forEach((inv) => {
        const d = new Date(inv.paidAt);
        const bucket = buckets.find((b) => b.year === d.getFullYear() && b.month === d.getMonth());
        if (bucket) bucket.total += inv.total;
      });
    return buckets;
  }, [invoices]);

  const statusCounts = useMemo(() => {
    return ["paid", "sent", "overdue", "draft"].map((s) => ({
      status: s,
      count: invoices.filter((i) => i.status === s).length,
    }));
  }, [invoices]);

  const topClients = useMemo(() => {
    const byClient = new Map();
    invoices.forEach((inv) => {
      if (!inv.client) return;
      const key = inv.client._id;
      const entry = byClient.get(key) || { client: inv.client, billed: 0, outstanding: 0 };
      entry.billed += inv.total;
      if (inv.status === "sent" || inv.status === "overdue") entry.outstanding += inv.total;
      byClient.set(key, entry);
    });
    return Array.from(byClient.values()).sort((a, b) => b.billed - a.billed).slice(0, 5);
  }, [invoices]);

  const totalInvoiceCount = invoices.length;

  const lineData = {
    labels: revenueTrend.map((b) => b.label),
    datasets: [{
      label: "Revenue",
      data: revenueTrend.map((b) => b.total),
      borderColor: "#775a19",
      backgroundColor: (ctx) => {
        const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 260);
        g.addColorStop(0, "rgba(119,90,25,0.2)");
        g.addColorStop(1, "rgba(119,90,25,0)");
        return g;
      },
      borderWidth: 2.5,
      pointBackgroundColor: "#fff",
      pointBorderColor: "#775a19",
      pointBorderWidth: 2,
      pointRadius: 4,
      fill: true,
      tension: 0.4,
    }],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 12 } } },
      y: {
        grid: { color: "#ddd6c8", borderDash: [4, 4] },
        ticks: { callback: (v) => `₦${v / 1000}k`, font: { size: 12 } },
      },
    },
  };

  const doughnutColors = { paid: "#775a19", sent: "#4a1015", overdue: "#ba1a1a", draft: "#a89e88" };
  const doughnutData = {
    labels: statusCounts.map((s) => s.status),
    datasets: [{
      data: statusCounts.map((s) => s.count),
      backgroundColor: statusCounts.map((s) => doughnutColors[s.status]),
      borderWidth: 0,
      hoverOffset: 4,
    }],
  };
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "75%",
    plugins: { legend: { display: false } },
  };

  const REPORT_STATS = [
    { label: "Total Revenue", icon: "attach_money", tone: "text-on-secondary-fixed bg-secondary-fixed", value: loading ? "—" : formatCurrency(stats.totalRevenue), note: `${stats.paidCount} paid invoice${stats.paidCount === 1 ? "" : "s"}` },
    { label: "Outstanding Balance", icon: "pending_actions", tone: "text-error bg-error-container", value: loading ? "—" : formatCurrency(stats.outstandingBalance), note: "sent + overdue invoices" },
    { label: "Avg. Payment Time", icon: "schedule", tone: "text-on-tertiary-fixed bg-tertiary-fixed", value: loading ? "—" : `${stats.avgPaymentDays} days`, note: "issue date to payment" },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">Financial Overview</h2>
          <p className="page-sub">Analyze your revenue and payment trends.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {REPORT_STATS.map((s) => (
          <div className="card overflow-hidden" key={s.label}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${s.tone}`}>
              <Icon name={s.icon} size={22} filled />
            </div>
            <p className="font-label-caps text-label-caps text-on-surface-variant mb-1">{s.label}</p>
            <h3 className="font-headline-md text-headline-md text-primary truncate" title={s.value}>{s.value}</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">{s.note}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h3 className="font-title-lg text-title-lg text-primary mb-4">Revenue Trend</h3>
          <div className="h-64">
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>
        <div className="card">
          <h3 className="font-title-lg text-title-lg text-primary mb-4">Invoice Status</h3>
          <div className="relative h-48 flex items-center justify-center">
            <Doughnut data={doughnutData} options={doughnutOptions} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-label-caps text-label-caps text-on-surface-variant">Total</span>
              <span className="font-headline-md text-headline-md text-primary">{totalInvoiceCount}</span>
            </div>
          </div>
          <div className="space-y-2 mt-4">
            {statusCounts.map((s) => (
              <div className="flex items-center gap-2 font-body-md text-body-md" key={s.status}>
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: doughnutColors[s.status] }} />
                <span className="flex-1 text-on-surface-variant">{s.status.charAt(0).toUpperCase() + s.status.slice(1)}</span>
                <span className="text-primary font-semibold">
                  {totalInvoiceCount ? Math.round((s.count / totalInvoiceCount) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-0! overflow-hidden">
        <div className="glass-panel static! px-6 py-5">
          <h2 className="font-title-lg text-title-lg text-primary">Top Clients by Revenue</h2>
        </div>
        {topClients.length === 0 ? (
          <p className="loading-state px-6">No invoice data yet.</p>
        ) : (
          <div className="table-scroll">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-surface-variant">
                  <th className="font-label-caps text-label-caps text-on-surface-variant px-6 py-3 uppercase">Client</th>
                  <th className="font-label-caps text-label-caps text-on-surface-variant px-6 py-3 uppercase">Total Billed</th>
                  <th className="font-label-caps text-label-caps text-on-surface-variant px-6 py-3 uppercase">Outstanding</th>
                  <th className="font-label-caps text-label-caps text-on-surface-variant px-6 py-3 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md">
                {topClients.map(({ client, billed, outstanding }) => (
                  <tr key={client._id} className="border-b border-surface-variant last:border-b-0 hover:bg-surface-bright transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-label-caps text-label-caps shrink-0">
                          {client.name.charAt(0).toUpperCase()}
                        </span>
                        <span>{client.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{formatCurrency(billed)}</td>
                    <td className={`px-6 py-4 ${outstanding > 0 ? "text-error font-semibold" : ""}`}>{formatCurrency(outstanding)}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${outstanding > 0 ? "badge-unpaid" : "badge-paid"}`}>
                        {outstanding > 0 ? "Outstanding" : "Good Standing"}
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
