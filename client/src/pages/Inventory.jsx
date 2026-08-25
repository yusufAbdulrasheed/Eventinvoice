import { useState, useEffect, useMemo } from "react";
import ItemModal from "../components/ItemModal";
import Icon from "../components/Icon";
import { getItems, createItem, updateItem, deleteItem } from "../utils/itemApi";
import { formatCurrency, ITEM_STATUS_LABELS, ITEM_STATUS_CLASS, ITEM_CATEGORY_LABELS } from "../utils/format";

export default function Inventory() {
  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [category, setCategory]     = useState("all");
  const [availability, setAvailability] = useState("all");
  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const { data } = await getItems();
      setItems(data);
    } catch (err) {
      console.error("Failed to load inventory", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (form) => {
    if (editing) {
      const { data } = await updateItem(editing._id, form);
      setItems((prev) => prev.map((i) => (i._id === data._id ? data : i)));
    } else {
      const { data } = await createItem(form);
      setItems((prev) => [data, ...prev]);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteItem(deleteTarget._id);
    setItems((prev) => prev.filter((i) => i._id !== deleteTarget._id));
    setDeleteTarget(null);
  };

  const openAdd  = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (i) => { setEditing(i);   setModalOpen(true); };

  const totalValue = useMemo(() => items.reduce((sum, i) => sum + i.totalStock * i.dailyRate, 0), [items]);
  const activeRentals = useMemo(() => items.reduce((sum, i) => sum + (i.totalStock - i.availableStock), 0), [items]);
  const lowStockCount = useMemo(() => items.filter((i) => i.status === "low_stock").length, [items]);

  const filtered = items.filter((i) => {
    const q = search.toLowerCase();
    const matchesSearch = i.name.toLowerCase().includes(q);
    const matchesCategory = category === "all" || i.category === category;
    const matchesAvailability = availability === "all" || i.status === availability;
    return matchesSearch && matchesCategory && matchesAvailability;
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">Inventory Dashboard</h2>
          <p className="page-sub">Manage and track your premium event assets.</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Icon name="add" size={18} />
          New Item
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex justify-between items-center text-on-surface-variant mb-2">
            <h3 className="font-label-caps text-label-caps uppercase">Total Inventory Value</h3>
            <Icon name="account_balance_wallet" size={20} />
          </div>
          <div className="font-headline-md text-headline-md text-primary truncate" title={loading ? undefined : formatCurrency(totalValue)}>{loading ? "—" : formatCurrency(totalValue)}</div>
        </div>
        <div className="card">
          <div className="flex justify-between items-center text-on-surface-variant mb-2">
            <h3 className="font-label-caps text-label-caps uppercase">Active Rentals</h3>
            <Icon name="local_shipping" size={20} />
          </div>
          <div className="font-headline-md text-headline-md text-primary truncate">{loading ? "—" : activeRentals}</div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Units currently deployed</p>
        </div>
        <div className="card">
          <div className="flex justify-between items-center text-on-surface-variant mb-2">
            <h3 className="font-label-caps text-label-caps uppercase">Low Stock Alerts</h3>
            <Icon name="warning" size={20} />
          </div>
          <div className="font-headline-md text-headline-md text-error truncate">{loading ? "—" : lowStockCount}</div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Items requiring restock review</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface-container-lowest p-4 border border-outline-variant rounded-lg mb-4">
        <div className="relative w-full md:w-80">
          <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            className="w-full pl-10 pr-4 py-2 bg-surface border border-outline-variant rounded font-body-md text-body-md text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors"
            placeholder="Search inventory…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select className="flex-1 md:flex-none bg-surface border border-outline-variant rounded py-2 pl-3 pr-8 font-body-md text-body-md text-on-surface focus:outline-none focus:border-secondary" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All Categories</option>
            <option value="rentals">Rentals</option>
            <option value="decor">Decor</option>
            <option value="hardware">Hardware</option>
          </select>
          <select className="flex-1 md:flex-none bg-surface border border-outline-variant rounded py-2 pl-3 pr-8 font-body-md text-body-md text-on-surface focus:outline-none focus:border-secondary" value={availability} onChange={(e) => setAvailability(e.target.value)}>
            <option value="all">Availability: All</option>
            <option value="in_stock">In Stock</option>
            <option value="rented">Rented</option>
            <option value="low_stock">Low Stock</option>
            <option value="pending_maintenance">Pending Maintenance</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading inventory…</div>
      ) : filtered.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon"><Icon name="inventory_2" size={36} /></div>
          <h2 className="empty-title">{search || category !== "all" || availability !== "all" ? "No items match your filters" : "No inventory items yet"}</h2>
          <p className="empty-desc">
            {search || category !== "all" || availability !== "all"
              ? "Try adjusting your search or filters."
              : "Add your first item to start building your event catalog."}
          </p>
          {!search && category === "all" && availability === "all" && (
            <button className="btn btn-primary" onClick={openAdd}>Add item</button>
          )}
        </div>
      ) : (
        <div className="card p-0! table-scroll">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container border-b border-outline-variant">
                <th className="font-label-caps text-label-caps text-on-surface-variant px-4 py-3 uppercase tracking-wider">Item Name</th>
                <th className="font-label-caps text-label-caps text-on-surface-variant px-4 py-3 uppercase tracking-wider">Category</th>
                <th className="font-label-caps text-label-caps text-on-surface-variant px-4 py-3 uppercase tracking-wider text-right">Total Stock</th>
                <th className="font-label-caps text-label-caps text-on-surface-variant px-4 py-3 uppercase tracking-wider text-right">Available</th>
                <th className="font-label-caps text-label-caps text-on-surface-variant px-4 py-3 uppercase tracking-wider text-right">Daily Rate</th>
                <th className="font-label-caps text-label-caps text-on-surface-variant px-4 py-3 uppercase tracking-wider text-center">Status</th>
                <th className="font-label-caps text-label-caps text-on-surface-variant px-4 py-3 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant font-body-md text-body-md text-on-surface">
              {filtered.map((i) => (
                <tr key={i._id} className="hover:bg-surface-bright hover:border-l-2 hover:border-secondary transition-colors group border-l-2 border-transparent">
                  <td className="px-4 py-3 font-medium">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-surface-variant flex-shrink-0 overflow-hidden flex items-center justify-center">
                        {i.imageUrl ? (
                          <img src={i.imageUrl} alt={i.name} className="w-full h-full object-cover" />
                        ) : (
                          <Icon name="inventory_2" size={16} className="text-on-surface-variant" />
                        )}
                      </div>
                      {i.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">{ITEM_CATEGORY_LABELS[i.category] || i.category}</td>
                  <td className="px-4 py-3 text-right">{i.totalStock}</td>
                  <td className="px-4 py-3 text-right font-medium">{i.availableStock}</td>
                  <td className="px-4 py-3 text-right text-on-surface-variant">{formatCurrency(i.dailyRate)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`badge ${ITEM_STATUS_CLASS[i.status]}`}>{ITEM_STATUS_LABELS[i.status]}</span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <button className="text-secondary hover:text-primary transition-colors p-1" onClick={() => openEdit(i)} title="Edit">
                      <Icon name="edit" size={20} />
                    </button>
                    <button className="text-on-surface-variant hover:text-error transition-colors p-1" onClick={() => setDeleteTarget(i)} title="Delete">
                      <Icon name="delete" size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <ItemModal item={editing} onClose={() => setModalOpen(false)} onSave={handleSave} />
      )}

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Delete item?</h2>
            <p className="confirm-text">
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This can't be undone.
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
