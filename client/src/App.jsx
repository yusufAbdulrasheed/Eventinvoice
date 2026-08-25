import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Layout from "./components/Layout";
import InvoiceFormModal from "./components/InvoiceFormModal";
import SettingsModal from "./components/SettingsModal";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Inventory from "./pages/Inventory";
import Invoices from "./pages/Invoice";
import PublicInvoice from "./pages/PublicInvoice";
import InvoicePreview from "./pages/InvoicePreview";
import Reports from "./pages/Reports";

// Shown while AuthProvider is checking an existing token against /auth/me
const SessionLoading = () => <div className="loading-state">Loading…</div>;

// Redirect to dashboard if already logged in
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <SessionLoading />;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

// Redirect to login if not logged in
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <SessionLoading />;
  return user ? children : <Navigate to="/login" replace />;
};

// Create/Edit Invoice and Settings render as modals floating over whatever
// page was active when they were opened (react-router's "background
// location" pattern). Callers that open them should navigate with
// `state: { backgroundLocation: location }` so the right page stays visible
// behind the blur; a direct deep link (no state) falls back to a sensible
// default background instead of leaving nothing rendered underneath.
const INVOICE_MODAL_PATTERN = /^\/invoices\/(new|[^/]+\/edit)$/;

function AppRoutes() {
  const location = useLocation();
  const isInvoiceModalRoute = INVOICE_MODAL_PATTERN.test(location.pathname);
  const isSettingsModalRoute = location.pathname === "/settings";
  const isModalRoute = isInvoiceModalRoute || isSettingsModalRoute;

  const backgroundLocation =
    location.state?.backgroundLocation ||
    (isModalRoute
      ? { ...location, pathname: isSettingsModalRoute ? "/dashboard" : "/invoices", state: null }
      : null);

  return (
    <>
      <Routes location={backgroundLocation || location}>
        <Route path="/" element={
          <PublicRoute><Login /></PublicRoute>
        } />

        <Route path="/login" element={
          <PublicRoute><Login /></PublicRoute>
        } />

        <Route path="/register" element={
          <PublicRoute><Register /></PublicRoute>
        } />

        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/reports" element={<Reports />} />
        </Route>

        {/* Standalone preview/print page — no sidebar chrome */}
        <Route path="/invoices/:id/preview" element={
          <ProtectedRoute><InvoicePreview /></ProtectedRoute>
        } />

        {/* Public — client-facing payment link, no auth either way */}
        <Route path="/pay/:token" element={<PublicInvoice />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {isModalRoute && (
        <Routes>
          <Route path="/invoices/new" element={<ProtectedRoute><InvoiceFormModal /></ProtectedRoute>} />
          <Route path="/invoices/:id/edit" element={<ProtectedRoute><InvoiceFormModal /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsModal /></ProtectedRoute>} />
        </Routes>
      )}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
