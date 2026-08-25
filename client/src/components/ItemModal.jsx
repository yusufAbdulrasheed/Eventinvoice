import { useState, useEffect } from "react";
import Icon from "./Icon";

const EMPTY = {
  name: "",
  category: "",
  imageUrl: "",
  totalStock: "",
  dailyRate: "",
  notes: "",
};

export default function ItemModal({ item, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Pre-fill form when editing
  useEffect(() => {
    if (item) {
      setForm({
        name: item.name || "",
        category: item.category || "",
        imageUrl: item.imageUrl || "",
        totalStock: item.totalStock ?? "",
        dailyRate: item.dailyRate ?? "",
        notes: item.notes || "",
      });
    }
  }, [item]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.category) {
      return setError("Item name and category are required");
    }
    if (form.totalStock === "" || Number(form.totalStock) < 0) {
      return setError("Total stock must be 0 or greater");
    }
    if (form.dailyRate === "" || Number(form.dailyRate) < 0) {
      return setError("Daily rate must be 0 or greater");
    }
    setLoading(true);
    try {
      await onSave({
        ...form,
        totalStock: Number(form.totalStock),
        dailyRate: Number(form.dailyRate),
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal max-w-[720px]" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{item ? "Edit Inventory Item" : "Add New Inventory Item"}</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">Register a new asset to your event catalog.</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <Icon name="close" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 md:p-8 space-y-6">
          {error && <div className="auth-error">{error}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="itemImageUrl">Item Image URL</label>
            <input
              id="itemImageUrl"
              name="imageUrl"
              className="form-input"
              value={form.imageUrl}
              onChange={handleChange}
              placeholder="https://…"
              type="url"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="form-label" htmlFor="itemName">Item Name</label>
              <input
                id="itemName"
                name="name"
                className="form-input"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Chiavari Chair - Gold"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="itemCategory">Category</label>
              <select
                id="itemCategory"
                name="category"
                className="form-input"
                value={form.category}
                onChange={handleChange}
                required
              >
                <option value="" disabled>Select a category…</option>
                <option value="rentals">Rentals (Furniture, Linens)</option>
                <option value="decor">Decor (Centerpieces, Draping)</option>
                <option value="hardware">Hardware (Lighting, AV, Rigging)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="form-group">
              <label className="form-label" htmlFor="totalStock">Total Stock</label>
              <input
                id="totalStock"
                name="totalStock"
                className="form-input"
                value={form.totalStock}
                onChange={handleChange}
                type="number"
                min="0"
                placeholder="0"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="dailyRate">Daily Rental Rate</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-on-surface-variant font-body-md pointer-events-none">$</span>
                <input
                  id="dailyRate"
                  name="dailyRate"
                  className="form-input pl-8"
                  value={form.dailyRate}
                  onChange={handleChange}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="itemNotes">Internal Notes (Optional)</label>
            <textarea
              id="itemNotes"
              name="notes"
              className="form-input resize-none"
              value={form.notes}
              onChange={handleChange}
              placeholder="Condition notes, storage location…"
              rows={2}
            />
          </div>

          <div className="modal-actions -mx-5 md:-mx-8 -mb-5 md:-mb-8">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Icon name="add" size={18} />
              {loading ? "Saving…" : item ? "Save changes" : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
