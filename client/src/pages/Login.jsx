import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Icon from "../components/Icon";
import ThemeToggle from "../components/ThemeToggle";

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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
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

        <div className="flex items-center gap-3 my-6">
          <span className="flex-1 h-px bg-outline-variant" />
          <p className="font-body-md text-sm text-on-surface-variant">Or continue with</p>
          <span className="flex-1 h-px bg-outline-variant" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button type="button" className="btn btn-outline opacity-55 cursor-not-allowed" disabled title="Google sign-in isn't connected yet">
            <GoogleIcon />
            Google
          </button>
          <button type="button" className="btn btn-outline opacity-55 cursor-not-allowed" disabled title="GitHub sign-in isn't connected yet">
            <Icon name="code" size={18} />
            GitHub
          </button>
        </div>

        <p className="text-center font-body-md text-body-md text-on-surface-variant mt-8">
          Don't have an account? <Link to="/register" className="text-secondary font-semibold hover:underline">Sign up free</Link>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
