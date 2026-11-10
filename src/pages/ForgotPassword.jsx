import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Mail, ArrowLeft } from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";
import { useToast } from "../context/ToastContext.jsx";
import LoadingState from "../components/ui/LoadingState.jsx";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { resetPassword, isAuthenticated, loading: authLoading } = useAuth();
  const { success, error: showError } = useToast();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState("");

  if (isAuthenticated || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <LoadingState message="Checking your session…" />
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!email.trim()) {
      setFormError("Email is required.");
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(email);
      setSent(true);
      success("If an account exists for this email, a password reset link has been sent.", 5000);
    } catch (err) {
      showError(err?.message || "If an account exists for this email, a password reset link has been sent.", 5000);
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md text-center">
          <div className="flex items-center justify-center gap-2 mb-5">
            <Mail size={32} className="text-tj-accent" />
          </div>
          <h1 className="text-3xl font-bold text-tj-primary tracking-tight mb-2">Check your email</h1>
          <p className="text-tj-secondary text-sm mb-8">We've sent a password reset link to <strong className="text-tj-primary">{email}</strong>. Open the link to set a new password.</p>
          <button type="button" onClick={() => navigate("/login")} className="btn-primary px-6 py-2.5">
            <ArrowLeft size={16} />
            Back to sign in
          </button>
        </div>
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
              className="w-14 h-14 rounded-2xl shadow-lg border border-tj-light/40 mb-3 object-contain"
            />
            <span className="text-base font-bold text-tj-primary tracking-tight">Trade Journal</span>
          </div>
          <h1 className="text-3xl font-bold text-tj-primary tracking-tight">Forgot password</h1>
          <p className="text-tj-secondary text-sm">Enter your email address and we'll send a link to reset your password.</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-5" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="reset-email" className="label">Email address</label>
            <input id="reset-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@example.com" />
          </div>

          {formError && <p className="text-[11px] text-tj-loss text-center">{formError}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full py-2.5">
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-tj-text-primary border-t-tj-accent rounded-full animate-spin"></div>
                <span>Sending…</span>
              </>
            ) : (
              <>
                <Mail size={16} />
                <span>Send reset link</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <button type="button" onClick={() => navigate("/login")} className="text-xs text-tj-accent hover:text-tj-accent-hover underline decoration-tj-accent/30 hover:decoration-tj-accent">
            Remember your password? Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
