import { useState, useEffect } from "react";
import Icon from "./Icon";

const EMPTY = {
  name: "", email: "", phone: "", company: "",
  address: { street: "", city: "", state: "", zip: "", country: "" },
  notes: "",
};

export default function ClientModal({ client, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Pre-fill form when editing
  useEffect(() => {
    if (client) {
      setForm({
        name:    client.name    || "",
        email:   client.email   || "",
        phone:   client.phone   || "",
        company: client.company || "",
        address: { ...EMPTY.address, ...(client.address || {}) },
        notes:   client.notes   || "",
      });
    }
  }, [client]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const key = name.split(".")[1];
      setForm((p) => ({ ...p, address: { ...p.address, [key]: value } }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.email.trim()) {
      return setError("Name and email are required");
    }
    setLoading(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="font-label-caps text-label-caps text-secondary mb-1">Client Management</p>
            <h2 className="modal-title">{client ? "Edit Client" : "Add New Client"}</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <Icon name="close" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 md:p-8 space-y-6">
          {error && <div className="auth-error">{error}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="clientName">Full Name / Company Name</label>
            <input id="clientName" name="name" className="form-input" value={form.name} onChange={handleChange} placeholder="e.g. Jane Doe or Acme Corp" required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="form-label" htmlFor="clientEmail">Email Address</label>
              <input id="clientEmail" type="email" name="email" className="form-input" value={form.email} onChange={handleChange} placeholder="client@example.com" required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="clientPhone">Phone Number</label>
              <input id="clientPhone" name="phone" className="form-input" value={form.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="clientCompany">Company</label>
            <input id="clientCompany" name="company" className="form-input" value={form.company} onChange={handleChange} placeholder="Acme Inc." />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="clientAddress">Billing Address</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input name="address.street" className="form-input sm:col-span-2" value={form.address.street} onChange={handleChange} placeholder="Street" />
              <input name="address.city" className="form-input" value={form.address.city} onChange={handleChange} placeholder="City" />
              <input name="address.state" className="form-input" value={form.address.state} onChange={handleChange} placeholder="State" />
              <input name="address.zip" className="form-input" value={form.address.zip} onChange={handleChange} placeholder="ZIP" />
              <input name="address.country" className="form-input" value={form.address.country} onChange={handleChange} placeholder="Country" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="clientNotes">Notes</label>
            <textarea id="clientNotes" name="notes" className="form-input resize-none" value={form.notes} onChange={handleChange} placeholder="Any notes about this client…" rows={3} />
          </div>

          <div className="modal-actions -mx-5 md:-mx-8 -mb-5 md:-mb-8">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Icon name="add" size={18} />
              {loading ? "Saving…" : client ? "Save changes" : "Add Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
