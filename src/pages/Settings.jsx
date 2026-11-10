import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { LogOut, Lock, ShieldCheck, Eye, EyeOff, Download, Smartphone, CheckCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";
import { useToast } from "../context/ToastContext.jsx";
import { usePWA } from "../hooks/usePWA.js";
import LoadingState from "../components/ui/LoadingState.jsx";
import IOSInstallModal from "../components/pwa/IOSInstallModal.jsx";

const MIN_PASSWORD_LENGTH = 8;

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, session, updatePassword, signOut, isAuthenticated, loading } = useAuth();
  const { success, error: showError } = useToast();
  const { canInstall, isInstalled, isStandalone, isIOS, dismissed, installApp, clearDismissed } =
    usePWA();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [installing, setInstalling] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  if (loading) return <LoadingState message="Loading account…" />;
  if (!isAuthenticated) return <LoadingState message="Checking your session…" />;

  const appIsInstalled = isInstalled || isStandalone;

  const handleChangePassword = async (e) => {
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
      setNewPassword("");
      setConfirmPassword("");
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      success("Your password has been updated successfully.", 4000);
    } catch (err) {
      showError(err?.message || "Failed to update password. Please try again.", 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch (err) {
      showError(err?.message || "Failed to sign out. Please try again.", 5000);
    }
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }
    setInstalling(true);
    await installApp();
    setInstalling(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-tj-primary tracking-tight">Account Settings</h1>
        <p className="text-tj-secondary text-sm mt-1">Manage your Trade Journal account.</p>
      </div>

      {/* ── Account info ─────────────────────────────────────────────── */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <ShieldCheck size={20} className="text-tj-accent" />
          <h2 className="text-xs font-semibold text-tj-muted uppercase tracking-wider">Account</h2>
        </div>

        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-tj-muted block">Email address</span>
              <p className="text-tj-primary text-sm financial-sm">{user?.email || session?.user?.email || "—"}</p>
            </div>
            <span className="text-xs text-tj-muted">Sign-in email</span>
          </div>

          <div className="flex items-center justify-between pt-5 border-t border-tj-light/50">
            <div>
              <span className="text-xs font-medium text-tj-muted block">Session status</span>
              <p className="text-tj-primary text-sm">Signed in</p>
            </div>
            <BadgeText variant="success">Active</BadgeText>
          </div>
        </div>
      </div>

      {/* ── Install App ───────────────────────────────────────────────── */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <Download size={20} className="text-tj-accent" />
          <h2 className="text-xs font-semibold text-tj-muted uppercase tracking-wider">App</h2>
        </div>

        {appIsInstalled ? (
          /* Already installed */
          <div className="flex items-center gap-3">
            <CheckCircle size={18} className="text-tj-win flex-shrink-0" />
            <div>
              <p className="text-tj-primary text-sm font-medium">Trade Journal is installed</p>
              <p className="text-tj-secondary text-xs mt-0.5">
                You're running the app from your Home Screen or app launcher.
              </p>
            </div>
          </div>
        ) : isIOS ? (
          /* iOS — show instruction button */
          <div className="space-y-4">
            <p className="text-tj-secondary text-sm leading-relaxed">
              Install Trade Journal on your Home Screen for quick access — no App Store needed.
            </p>
            <button
              type="button"
              onClick={() => setShowIOSModal(true)}
              className="btn-primary w-full py-2.5"
            >
              <Smartphone size={16} />
              How to Install on iPhone / iPad
            </button>
          </div>
        ) : canInstall ? (
          /* Chromium / Android / Desktop — native install */
          <div className="space-y-4">
            <p className="text-tj-secondary text-sm leading-relaxed">
              Install Trade Journal as an app for faster access and offline support. No App Store
              required.
            </p>
            <button
              type="button"
              onClick={handleInstall}
              disabled={installing}
              className="btn-primary w-full py-2.5"
            >
              {installing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Installing…</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Install App</span>
                </>
              )}
            </button>
            {dismissed && (
              <p className="text-xs text-tj-muted text-center">
                Previously dismissed the banner?{" "}
                <button
                  type="button"
                  onClick={clearDismissed}
                  className="text-tj-accent underline underline-offset-2 hover:no-underline"
                >
                  Show it again
                </button>
              </p>
            )}
          </div>
        ) : (
          /* Not eligible / already installed via other means */
          <div className="space-y-3">
            <p className="text-tj-secondary text-sm leading-relaxed">
              To install Trade Journal, open it in a supported browser (Chrome, Edge, or Safari on
              iOS) and use the browser's install option.
            </p>
            {dismissed && (
              <p className="text-xs text-tj-muted">
                Dismissed the install banner?{" "}
                <button
                  type="button"
                  onClick={clearDismissed}
                  className="text-tj-accent underline underline-offset-2 hover:no-underline"
                >
                  Show it again
                </button>
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Change password ───────────────────────────────────────────── */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <Lock size={20} className="text-tj-accent" />
          <h2 className="text-xs font-semibold text-tj-muted uppercase tracking-wider">Change password</h2>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-5" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="settings-new-password" className="label">New password</label>
            <div className="relative">
              <input
                id="settings-new-password"
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
            <label htmlFor="settings-confirm-password" className="label">Confirm new password</label>
            <div className="relative">
              <input
                id="settings-confirm-password"
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
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
      </div>

      {/* ── Sign out ──────────────────────────────────────────────────── */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-tj-muted block">Sign out</span>
            <p className="text-tj-primary text-sm">End your session and return to the sign-in page.</p>
          </div>
          <button type="button" onClick={handleSignOut} className="btn-danger px-4 py-2.5">
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </div>

      {/* iOS modal */}
      {showIOSModal && <IOSInstallModal onClose={() => setShowIOSModal(false)} />}
    </div>
  );
}

function BadgeText({ variant = "default", children }) {
  const variants = {
    success: "badge-win",
    default: "badge bg-tj-card text-tj-primary border-tj-light",
  };
  return <span className={variants[variant]}>{children}</span>;
}
