import { useState, useEffect, useMemo } from "react";
import ClientModal from "../components/ClientModal";
import Icon from "../components/Icon";
import { getClients, createClient, updateClient, deleteClient } from "../utils/clientApi";
import { getInvoices } from "../utils/invoiceApi";
import { formatCurrency } from "../utils/format";

export default function Clients() {
  const [clients, setClients]       = useState([]);
  const [invoices, setInvoices]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState(null);   // null = new, object = edit
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    Promise.all([getClients(), getInvoices()])
      .then(([clientsRes, invoicesRes]) => {
        setClients(clientsRes.data);
        setInvoices(invoicesRes.data);
      })
      .catch((err) => console.error("Failed to load clients", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (form) => {
    if (editing) {
      const { data } = await updateClient(editing._id, form);
      setClients((prev) => prev.map((c) => (c._id === data._id ? data : c)));
    } else {
      const { data } = await createClient(form);
      setClients((prev) => [data, ...prev]);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteClient(deleteTarget._id);
    setClients((prev) => prev.filter((c) => c._id !== deleteTarget._id));
    setDeleteTarget(null);
  };

  const openAdd  = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (c) => { setEditing(c);   setModalOpen(true); };

  // Per-client stats derived from real invoice data (no fabricated numbers).
  const clientStats = useMemo(() => {
    const map = new Map();
    for (const inv of invoices) {
      const clientId = inv.client?._id || inv.client;
      if (!clientId) continue;
      const entry = map.get(clientId) || { events: 0, outstanding: 0, hasOverdue: false };
      entry.events += 1;
      if (inv.status === "sent" || inv.status === "overdue") entry.outstanding += inv.total;
      if (inv.status === "overdue") entry.hasOverdue = true;
      map.set(clientId, entry);
    }
    return map;
  }, [invoices]);

  const activeEvents = invoices.filter((i) => i.status === "sent" || i.status === "overdue").length;
  const totalOutstanding = invoices
    .filter((i) => i.status === "sent" || i.status === "overdue")
    .reduce((sum, i) => sum + i.total, 0);

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.company || "").toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">Client Directory</h2>
          <p className="page-sub">Manage your event planners and private client relationships, track event history, and monitor account balances.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded font-body-md text-body-md text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-colors"
              type="text"
              placeholder="Search clients…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-primary whitespace-nowrap" onClick={openAdd}>
            <Icon name="person_add" size={18} />
            Add Client
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <p className="font-label-caps text-label-caps text-on-surface-variant mb-2">Total Clients</p>
          <p className="font-headline-md text-headline-md text-primary truncate">{loading ? "—" : clients.length}</p>
        </div>
        <div className="card">
          <p className="font-label-caps text-label-caps text-on-surface-variant mb-2">Active Events</p>
          <p className="font-headline-md text-headline-md text-primary truncate">{loading ? "—" : activeEvents}</p>
          <p className="mt-4 font-body-md text-body-md text-on-surface-variant">Sent or overdue invoices</p>
        </div>
        <div className="bg-primary text-on-primary p-6 rounded-lg overflow-hidden">
          <p className="font-label-caps text-label-caps text-on-primary-container mb-2">Total Outstanding</p>
          <p className="font-headline-md text-headline-md text-white truncate" title={loading ? undefined : formatCurrency(totalOutstanding)}>{loading ? "—" : formatCurrency(totalOutstanding)}</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading clients…</div>
      ) : filtered.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon"><Icon name="group" size={36} /></div>
          <h2 className="empty-title">
            {search ? "No clients match your search" : "No clients yet"}
          </h2>
          <p className="empty-desc">
            {search
              ? "Try a different name, email, or company."
              : "Add your first client to get started. You can reuse them on every invoice."}
          </p>
          {!search && (
            <button className="btn btn-primary" onClick={openAdd}>Add client</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((c) => {
            const stats = clientStats.get(c._id) || { events: 0, outstanding: 0, hasOverdue: false };
            return (
              <div className="bg-surface-container-lowest border border-outline-variant/60 rounded flex flex-col hover:border-tertiary transition-colors hover:shadow-[0_8px_24px_rgba(74,16,21,0.08)]" key={c._id}>
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-title-lg font-bold">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="bg-surface-container-high text-on-surface-variant font-label-caps text-[10px] px-2 py-1 rounded-full uppercase tracking-wider">
                      {c.company ? "Company" : "Individual"}
                    </span>
                  </div>
                  <h4 className="font-title-lg text-title-lg text-primary mb-1">{c.name}</h4>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-4">{c.company || "Individual"}</p>
                  <div className="space-y-2 mb-2">
                    <div className="flex items-center text-on-surface-variant font-body-md text-sm">
                      <Icon name="mail" size={16} className="mr-2" />
                      <span className="truncate">{c.email}</span>
                    </div>
                    {c.phone && (
                      <div className="flex items-center text-on-surface-variant font-body-md text-sm">
                        <Icon name="call" size={16} className="mr-2" />
                        <span>{c.phone}</span>
                      </div>
                    )}
                    {c.address?.city && (
                      <div className="flex items-center text-on-surface-variant font-body-md text-sm">
                        <Icon name="location_on" size={16} className="mr-2" />
                        <span>{[c.address.city, c.address.state, c.address.country].filter(Boolean).join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className={`p-4 border-t flex justify-between items-center gap-2 rounded-b ${stats.hasOverdue ? "bg-secondary-container/10 border-secondary-container/30" : "bg-surface-bright border-outline-variant/40"}`}>
                  <div className="min-w-0 flex-1">
                    <p className={`font-label-caps text-[10px] mb-1 truncate ${stats.hasOverdue ? "text-on-secondary-container" : "text-on-surface-variant"}`}>
                      {stats.hasOverdue ? "Balance (Overdue)" : "Balance"}
                    </p>
                    <p className={`font-body-md font-semibold truncate ${stats.hasOverdue ? "text-on-secondary-fixed-variant" : "text-primary"}`} title={formatCurrency(stats.outstanding)}>
                      {formatCurrency(stats.outstanding)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-label-caps text-[10px] mb-1 ${stats.hasOverdue ? "text-on-secondary-container" : "text-on-surface-variant"}`}>Events</p>
                    <p className={`font-body-md font-semibold ${stats.hasOverdue ? "text-on-secondary-fixed-variant" : "text-primary"}`}>{stats.events}</p>
                  </div>
                </div>
                <div className="flex border-t border-outline-variant/60">
                  <button className="btn btn-ghost flex-1 rounded-none rounded-bl" onClick={() => openEdit(c)}>Edit</button>
                  <button className="btn flex-1 rounded-none rounded-br text-error hover:bg-error-container" onClick={() => setDeleteTarget(c)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <ClientModal
          client={editing}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Delete client?</h2>
            <p className="confirm-text">
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
              This can't be undone.
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
