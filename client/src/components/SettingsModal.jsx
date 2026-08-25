import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Icon from "./Icon";

const TABS = [
  { id: "profile", label: "Profile", icon: "person" },
  { id: "billing", label: "Billing", icon: "credit_card" },
  { id: "invoicing", label: "Invoicing", icon: "receipt_long" },
  { id: "notifications", label: "Notifications", icon: "notifications_active" },
];

export default function SettingsModal() {
  const navigate = useNavigate();
  const close = () => navigate(-1);
  const { user, updateProfile } = useAuth();
  const [tab, setTab] = useState("profile");

  const [form, setForm] = useState({ name: "", email: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) setForm({ name: user.name || "", email: user.email || "" });
  }, [user]);

  const dirty = user && (form.name !== user.name || form.email !== user.email);

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSaving(true);
    try {
      await updateProfile(form);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const activeTab = TABS.find((t) => t.id === tab);

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal max-w-[800px] flex flex-col md:flex-row" onClick={(e) => e.stopPropagation()}>
        <nav className="md:w-64 bg-surface-container flex-shrink-0 border-b md:border-b-0 md:border-r border-outline-variant p-6 flex flex-col">
          <div className="mb-8 hidden md:block">
            <h2 className="font-headline-sm text-headline-sm text-primary mb-1">Settings</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Manage your account preferences</p>
          </div>
          <ul className="flex flex-row md:flex-col gap-2 overflow-x-auto">
            {TABS.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg whitespace-nowrap transition-colors font-label-caps text-label-caps tracking-wider ${
                    tab === t.id
                      ? "bg-surface-bright text-primary font-bold border-b-2 md:border-b-0 md:border-l-4 border-secondary"
                      : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
                  }`}
                >
                  <Icon name={t.icon} size={18} filled={tab === t.id} />
                  <span>{t.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex-1 flex flex-col p-6 md:p-10 bg-surface-container-lowest relative">
          <button className="modal-close absolute top-4 right-4" onClick={close} aria-label="Close">
            <Icon name="close" size={20} />
          </button>

          {tab === "profile" ? (
            <>
              <div className="md:hidden mb-6">
                <h2 className="font-headline-sm text-headline-sm text-primary mb-1">Profile Settings</h2>
              </div>

              <section className="mb-10 flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="w-24 h-24 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-headline-md text-headline-md font-bold border border-outline-variant">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="text-center md:text-left flex-1">
                  <h3 className="font-title-lg text-title-lg text-primary mb-1">Profile Image</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-3">Avatar uploads aren't available yet.</p>
                  <div className="flex gap-3 justify-center md:justify-start">
                    <button type="button" className="btn btn-secondary opacity-55 cursor-not-allowed" disabled>Upload New</button>
                    <button type="button" className="btn btn-ghost text-error opacity-55 cursor-not-allowed" disabled>Remove</button>
                  </div>
                </div>
              </section>

              <form onSubmit={handleSave} className="flex-1 flex flex-col gap-6">
                {error && <div className="auth-error">{error}</div>}
                {success && (
                  <div className="flex items-center gap-2 text-secondary font-body-md text-body-md">
                    <Icon name="check_circle" size={16} filled />
                    Saved
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-group">
                    <label className="form-label" htmlFor="settingsName">First &amp; Last Name</label>
                    <input
                      id="settingsName"
                      className="form-input"
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="settingsEmail">Business Email</label>
                    <input
                      id="settingsEmail"
                      type="email"
                      className="form-input"
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="mt-auto pt-8 flex justify-end gap-4">
                  <button type="button" className="btn btn-outline" onClick={close}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={!dirty || saving}>
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="empty-state flex-1 justify-center">
              <div className="empty-icon"><Icon name={activeTab.icon} size={32} /></div>
              <h2 className="empty-title">{activeTab.label}</h2>
              <span className="badge badge-draft">Coming soon</span>
              <p className="empty-desc">
                {tab === "billing" && "Plan management and payment methods will live here."}
                {tab === "invoicing" && "Default tax rate, currency, and invoice numbering preferences will live here."}
                {tab === "notifications" && "Email and reminder preferences will live here."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
