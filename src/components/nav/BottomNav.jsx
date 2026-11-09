import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  List,
  Plus,
} from "lucide-react";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/calendar", label: "Calendar", icon: Calendar },
  { path: "/trades", label: "Trades", icon: List },
  { path: "/add-trade", label: "Add Trade", icon: Plus },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) =>
    path === "/trades"
      ? location.pathname === "/trades" || location.pathname.startsWith("/trades/")
      : location.pathname === path;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-tj-light bg-tj-bg-primary/95 backdrop-blur-md px-4 pt-3 lg:hidden"
      style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
      aria-label="Bottom navigation"
    >
      <div className="max-w-5xl mx-auto grid grid-cols-4 gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          const cls = active
            ? "flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl bg-tj-accent-soft text-tj-accent transition-all duration-fast"
            : "flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl text-tj-muted hover:text-tj-primary hover:bg-tj-surface transition-all duration-fast";
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={cls}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={22} className={active ? "text-tj-accent" : "text-tj-muted"} />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
