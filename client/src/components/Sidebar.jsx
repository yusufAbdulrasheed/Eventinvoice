import { useNavigate, useLocation, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Icon from "./Icon";

const NAV_ITEMS = [
  { to: "/dashboard", icon: "dashboard", label: "Dashboard" },
  { to: "/inventory", icon: "inventory_2", label: "Inventory" },
  { to: "/invoices", icon: "receipt_long", label: "Invoices" },
  { to: "/clients", icon: "groups", label: "Clients" },
  { to: "/reports", icon: "analytics", label: "Reports" },
];

export default function Sidebar({ open = false, onClose }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const openInvoiceModal = () => {
    navigate("/invoices/new", { state: { backgroundLocation: location } });
    onClose?.();
  };

  const openSettingsModal = () => {
    navigate("/settings", { state: { backgroundLocation: location } });
    onClose?.();
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-primary/30 backdrop-blur-sm transition-opacity md:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 flex flex-col h-screen w-64 shrink-0 bg-surface-container border-r border-outline-variant py-8 transition-transform md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="px-8 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Generous Event" className="w-11 h-11 rounded-lg object-cover shrink-0" />
            <div>
              <h1 className="font-headline-sm text-headline-sm text-primary leading-tight">Generous Event</h1>
              <p className="font-label-caps text-label-caps text-on-surface-variant mt-0.5">Premium Management</p>
            </div>
          </div>
          <button className="md:hidden text-on-surface-variant p-2 -mr-2 rounded-full hover:bg-surface-container-high" onClick={onClose} aria-label="Close menu">
            <Icon name="close" size={22} />
          </button>
        </div>

        <div className="px-4 mb-2">
          <button
            className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary font-bold font-body-md text-body-md rounded-lg py-3 hover:bg-primary-container transition-colors"
            onClick={openInvoiceModal}
          >
            <Icon name="add" size={18} />
            Create Invoice
          </button>
        </div>

        <nav className="flex-1 mt-4 px-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                "flex items-center gap-4 px-4 py-3 rounded-lg font-label-caps text-label-caps transition-all " +
                (isActive
                  ? "text-primary font-bold bg-surface-bright border-l-4 border-secondary"
                  : "text-on-surface-variant hover:bg-surface-container-high")
              }
            >
              {({ isActive }) => (
                <>
                  <Icon name={item.icon} size={20} filled={isActive} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-8 pt-4 mt-2 border-t border-outline-variant space-y-2">
          <button
            className="w-full flex items-center gap-4 py-2 text-on-surface-variant hover:text-primary transition-colors font-label-caps text-label-caps"
            onClick={openSettingsModal}
          >
            <Icon name="settings" size={20} />
            <span>Settings</span>
          </button>
          <a className="flex items-center gap-4 py-2 text-on-surface-variant hover:text-primary transition-colors font-label-caps text-label-caps" href="mailto:support@generousevent.com">
            <Icon name="help" size={20} />
            <span>Support</span>
          </a>
          <button className="flex items-center gap-4 py-2 text-on-surface-variant hover:text-error transition-colors font-label-caps text-label-caps" onClick={handleLogout}>
            <Icon name="logout" size={20} />
            <span>Log out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
