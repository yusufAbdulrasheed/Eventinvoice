import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Icon from "../components/Icon";
import ThemeToggle from "../components/ThemeToggle";
import Footer from "../components/Footer";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] bg-surface-container-lowest border border-outline-variant rounded-xl shadow-[0_8px_24px_rgba(74,16,21,0.08)] p-8 md:p-10 relative">
        <ThemeToggle className="absolute top-6 right-6" />
        <Link to="/" className="block mb-8">
          <img src="/logo.jpg" alt="Generous Event" className="h-16 mx-auto object-contain" />
        </Link>

        <h1 className="font-headline-sm text-headline-sm text-primary mb-2">Welcome back</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mb-6">Please enter your details to sign in.</p>

        {error && <div className="auth-error mb-6">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <div className="relative">
              <Icon name="mail" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                id="email"
                type="email"
                name="email"
                className="form-input pl-11"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <div className="flex items-center justify-between">
              <label className="form-label" htmlFor="password">Password</label>
              <button type="button" className="font-body-md text-sm text-secondary hover:underline" title="Password reset isn't available yet">
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Icon name="lock" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                id="password"
                type="password"
                name="password"
                className="form-input pl-11"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? "Logging in…" : "Sign In"}
            {!loading && <Icon name="arrow_forward" size={18} />}
          </button>
        </form>

        <p className="text-center font-body-md text-body-md text-on-surface-variant mt-8">
          Don't have an account? <Link to="/register" className="text-secondary font-semibold hover:underline">Sign up free</Link>
        </p>
      </div>
      </div>
      <Footer />
    </div>
  );
}
