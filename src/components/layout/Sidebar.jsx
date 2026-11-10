import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  List,
  Plus,
  Menu,
  X,
  LayoutList,
  LogOut,
  Download,
  Trash2,
} from "lucide-react";
import Button from "../ui/Button.jsx";
import ThemeSwitcher from "../ui/ThemeSwitcher.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { usePWA } from "../../hooks/usePWA.js";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/calendar", label: "Calendar", icon: Calendar },
  { path: "/trades", label: "Trade History", icon: List },
  { path: "/add-trade", label: "Add Trade", icon: Plus },
  { path: "/recycle-bin", label: "Recycle Bin", icon: Trash2 },
];

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isAuthenticated, loading } = useAuth();
  const { canInstall, isInstalled, isStandalone, isIOS } = usePWA();

  const isActive = (path) =>
    path === "/trades"
      ? location.pathname === "/trades" || location.pathname.startsWith("/trades/")
      : location.pathname === path;

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch {
      // signOut already surfaces an error toast via AuthContext.
    }
  };

  if (loading) {
    return null;
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-tj-card border-r border-tj-medium
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 flex flex-col
        `}
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-tj-medium">
          <div className="flex items-center gap-2.5">
            <img
              src="/icon-192.png"
              alt="Trade Journal Logo"
              className="w-8 h-8 rounded-lg object-contain shadow-sm border border-tj-light/40"
            />
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold text-tj-primary tracking-tight">Trade Journal</span>
              <span className="text-[10px] text-tj-muted font-medium mt-0.5">Trader's Log</span>
            </div>
          </div>
          <button className="text-tj-muted hover:text-tj-primary lg:hidden" onClick={onClose} type="button" aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-0.5" aria-label="Main navigation menu">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => {
                  navigate(item.path);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-fast ${
                  active
                    ? "bg-tj-accent-soft text-tj-accent border-l-2 border-tj-accent"
                    : "text-tj-muted hover:text-tj-primary hover:bg-tj-surface"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={16} className="flex-shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-4 pb-4 border-t border-tj-medium space-y-2 pt-3">
          {/* Install App — visible when browser supports installation and app
              is not already running in standalone mode. Navigates to Settings
              where the full install card lives. */}
          {(canInstall || isIOS) && !isInstalled && !isStandalone && (
            <button
              type="button"
              onClick={() => {
                navigate("/settings");
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-fast text-tj-accent hover:bg-tj-accent-soft"
            >
              <Download size={16} className="flex-shrink-0" />
              Install App
            </button>
          )}
          <Button variant="outline" className="w-full" type="button" onClick={() => navigate("/settings")}>
            <LayoutList size={16} className="mr-2" />
            Settings
          </Button>
        </div>

        {isAuthenticated && (
          <div className="px-4 border-t border-tj-medium">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-fast text-tj-loss hover:bg-tj-loss-soft border-l-2 border-tj-loss/30"
            >
              <LogOut size={16} className="flex-shrink-0" />
              Sign out
            </button>
          </div>
        )}

        <div className="px-4 pb-6 border-t border-tj-medium">
          <div className="flex items-center justify-between gap-2 mb-2 pt-3">
            <div className="min-w-0">
              <span className="text-xs font-medium text-tj-muted uppercase tracking-wider block">Signed in as</span>
              <p className="text-xs text-tj-muted break-all leading-tight">{user?.email || "—"}</p>
            </div>
            <ThemeSwitcher />
          </div>
        </div>
      </aside>
    </>
  );
}

export function MobileHeader({ title, onMenu }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-14 border-b border-tj-medium bg-tj-bg-primary/95 backdrop-blur-lg lg:hidden">
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            className="flex items-center justify-center w-9 h-9 rounded-lg text-tj-primary hover:bg-tj-surface transition-colors duration-fast shrink-0"
            onClick={onMenu}
            type="button"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <img
            src="/icon-192.png"
            alt="Trade Journal"
            className="w-6 h-6 rounded-md object-contain shrink-0"
          />
          <span className="text-sm font-semibold text-tj-primary truncate">{title}</span>
        </div>
        <ThemeSwitcher />
      </div>
    </header>
  );
}
