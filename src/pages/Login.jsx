import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";
import { useToast } from "../context/ToastContext.jsx";
import LoadingState from "../components/ui/LoadingState.jsx";

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, isAuthenticated, loading: authLoading } = useAuth();
  const { success, error: showError } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!email.trim()) {
      setFormError("Email is required.");
      return;
    }
    if (!password) {
      setFormError("Password is required.");
      return;
    }

    setSubmitting(true);
    try {
      await signIn(email, password);
      success("Welcome back. You are signed in.", 3000);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      showError(err?.message || "Sign-in failed. Please try again.", 5000);
    } finally {
      setSubmitting(false);
    }
  };

  if (isAuthenticated || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <LoadingState message={isAuthenticated ? "Signing you in…" : "Checking your session…"} />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 pb-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="flex flex-col items-center justify-center mb-5">
            <img
              src="/icon-192.png"
              alt="Trade Journal Logo"
              className="w-16 h-16 rounded-2xl shadow-lg border border-tj-light/40 mb-3 object-contain"
            />
            <span className="text-base font-bold text-tj-primary tracking-tight">Trade Journal</span>
          </div>
          <h1 className="text-3xl font-bold text-tj-primary tracking-tight">Welcome back</h1>
          <p className="text-tj-secondary text-sm">Sign in to access your trading journal.</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-5" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="label">Email address</label>
            <input id="login-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@example.com" />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="login-password" className="label">Password</label>
            <div className="relative">
              <input id="login-password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="input pr-10" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-tj-muted hover:text-tj-primary transition-colors duration-fast" aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {formError && <p className="text-[11px] text-tj-loss text-center">{formError}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full py-2.5">
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-tj-text-primary border-t-tj-accent rounded-full animate-spin"></div>
                <span>Signing in…</span>
              </>
            ) : (
              <>
                <ArrowRight size={16} />
                <span>Sign in</span>
              </>
            )}
          </button>
        </form>

        <div className="border-t border-tj-light/50 pt-5 gap-4">
          <button type="button" onClick={() => navigate("/forgot-password")} className="text-xs text-tj-accent hover:text-tj-accent-hover underline decoration-tj-accent/30 hover:decoration-tj-accent">
            Forgot password?
          </button>
        </div>
      </div>
    </div>
  );
}
