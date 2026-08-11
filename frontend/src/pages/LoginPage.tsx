import { FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../api/client";
import { ErrorBanner } from "../components/Banner";

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    const from = (location.state as any)?.from?.pathname ?? "/";
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-display text-2xl font-semibold tracking-tight text-white">Mini ERP</p>
          <p className="text-sm text-slate-400">Wholesale &amp; Distribution Operations Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 p-6">
          <div>
            <label className="field-label" htmlFor="email">
              Work email
            </label>
            <input
              id="email"
              type="email"
              required
              autoFocus
              className="field-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label className="field-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              className="field-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && <ErrorBanner message={error} />}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? "Signing in..." : "Sign in"}
          </button>

          <p className="pt-1 text-center text-xs text-slate-400">
            Seeded test accounts use password <span className="font-mono text-slate-500">Password123!</span>
          </p>
        </form>
      </div>
    </div>
  );
}
