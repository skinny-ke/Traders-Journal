import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Eye, EyeOff, Lock, ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";
import { useToast } from "../context/ToastContext.jsx";
import LoadingState from "../components/ui/LoadingState.jsx";

const MIN_PASSWORD_LENGTH = 8;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { updatePassword, isAuthenticated, loading: authLoading } = useAuth();
  const { success, error: showError } = useToast();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState("");

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <LoadingState message="Checking your recovery session…" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md text-center">
          <div className="flex items-center justify-center gap-2 mb-5">
            <CheckCircle size={32} className="text-tj-profit" />
          </div>
          <h1 className="text-3xl font-bold text-tj-primary tracking-tight mb-2">Password updated</h1>
          <p className="text-tj-secondary text-sm mb-8">
            Your password has been changed successfully. You can now continue with your new password.
          </p>
          <button type="button" onClick={() => navigate("/dashboard")} className="btn-primary px-6 py-2.5">
            <ArrowLeft size={16} />
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <AlertTriangle size={32} className="text-tj-loss" />
          </div>
          <h1 className="text-2xl font-bold text-tj-primary tracking-tight">Invalid or expired link</h1>
          <p className="text-tj-secondary text-sm">
            This password reset link is invalid, has expired, or was already used. Please request a new link.
          </p>
          <div className="pt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button type="button" onClick={() => navigate("/forgot-password")} className="btn-primary px-6 py-2.5">
              Request new link
            </button>
            <button type="button" onClick={() => navigate("/login")} className="btn-outline px-6 py-2.5">
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!newPassword) {
      setFormError("New password is required.");
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setFormError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await updatePassword(newPassword);
      setDone(true);
      success("Your password has been updated successfully.", 4000);
    } catch (err) {
      showError(err?.message || "Failed to update password. Please try again.", 5000);
    } finally {
      setSubmitting(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-tj-primary tracking-tight">Set new password</h1>
          <p className="text-tj-secondary text-sm">Enter your new password below.</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-5" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="new-password" className="label">New password</label>
            <div className="relative">
              <input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-tj-muted hover:text-tj-primary transition-colors duration-fast"
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-[11px] text-tj-muted">Minimum {MIN_PASSWORD_LENGTH} characters</p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirm-password" className="label">Confirm new password</label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-tj-muted hover:text-tj-primary transition-colors duration-fast"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {formError && <p className="text-[11px] text-tj-loss text-center">{formError}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full py-2.5">
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Updating…</span>
              </>
            ) : (
              <>
                <Lock size={16} />
                <span>Update password</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-xs text-tj-accent hover:text-tj-accent-hover underline decoration-tj-accent/30 hover:decoration-tj-accent"
          >
            Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
}
