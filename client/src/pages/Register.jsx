import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Icon from "../components/Icon";
import ThemeToggle from "../components/ThemeToggle";
import Footer from "../components/Footer";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      return setError("Passwords don't match");
    }
    if (form.password.length < 6) {
      return setError("Password must be at least 6 characters");
    }
    if (!agreed) {
      return setError("Please agree to the Terms of Service and Privacy Policy");
    }

    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-4 py-12 relative">
      <ThemeToggle className="absolute top-6 right-6" />
      <Link to="/" className="mb-8">
        <img src="/logo.jpg" alt="Generous Event" className="h-16 object-contain" />
      </Link>

      <div className="w-full max-w-[440px] bg-surface-container-lowest border border-outline-variant rounded-xl shadow-[0_8px_24px_rgba(74,16,21,0.08)] p-8 md:p-10">
        <h1 className="font-headline-sm text-headline-sm text-primary mb-2">Create your account</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mb-6">Start managing your events with ease.</p>

        {error && <div className="auth-error mb-6">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              name="name"
              className="form-input"
              placeholder="e.g. Jane Doe"
              value={form.name}
              onChange={handleChange}
              required
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Work Email</label>
            <input
              id="email"
              type="email"
              name="email"
              className="form-input"
              placeholder="name@company.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                className="form-input pr-11"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <Icon name={showPassword ? "visibility_off" : "visibility"} size={18} />
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirm">Confirm password</label>
            <input
              id="confirm"
              type={showPassword ? "text" : "password"}
              name="confirm"
              className="form-input"
              placeholder="••••••••"
              value={form.confirm}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </div>

          <label className="flex items-start gap-2 font-body-md text-sm text-on-surface-variant">
            <input
              type="checkbox"
              className="mt-1"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              required
            />
            <span>
              I agree to the <span className="text-secondary hover:underline cursor-pointer">Terms of Service</span> and{" "}
              <span className="text-secondary hover:underline cursor-pointer">Privacy Policy</span>.
            </span>
          </label>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? "Creating account…" : "Get Started"}
            {!loading && <Icon name="arrow_forward" size={18} />}
          </button>
        </form>

        <p className="text-center font-body-md text-body-md text-on-surface-variant mt-8">
          Already have an account? <Link to="/login" className="text-secondary font-semibold hover:underline">Sign In</Link>
        </p>
      </div>

      <div className="flex gap-6 mt-8 font-body-md text-sm text-on-surface-variant">
        <span className="flex items-center gap-1"><Icon name="lock" size={16} />Secure</span>
        <span className="flex items-center gap-1"><Icon name="speed" size={16} />Fast Setup</span>
      </div>
      </div>
      <Footer />
    </div>
  );
}
