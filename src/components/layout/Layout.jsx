import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar, { MobileHeader } from "./Sidebar";
import ToastContainer from "../ui/ToastContainer";
import BackendStatusBanner from "./BackendStatusBanner";
import InstallPrompt from "../pwa/InstallPrompt";
import OfflineIndicator from "../pwa/OfflineIndicator";
import BottomNav from "../nav/BottomNav";
import ThemeSwitcher from "../ui/ThemeSwitcher";

export default function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const hideSidebar = () => setSidebarOpen(false);
  const showSidebar = () => setSidebarOpen(true);

  return (
    <div className="min-h-screen bg-tj-bg-primary text-tj-primary">
      <Sidebar isOpen={sidebarOpen} onClose={hideSidebar} />

      <main className="relative">
        <MobileHeader title={pageTitle(location.pathname)} onMenu={showSidebar} />

        {/* Theme switcher: pinned top-right on desktop, hidden on mobile (sidebar has it) */}
        <div className="hidden lg:block fixed top-4 right-4 z-50">
          <ThemeSwitcher />
        </div>

        <div className="pt-16 px-4 pb-24 sm:px-6 lg:ml-64 lg:pt-8 lg:px-8 lg:pb-12">
          <BackendStatusBanner />
          <Outlet />
        </div>
        <ToastContainer />
        <InstallPrompt />
        <OfflineIndicator />
      </main>

      <BottomNav />
    </div>
  );
}

function pageTitle(path) {
  if (path.startsWith("/trades/") && path.endsWith("/edit")) return "Edit Trade";
  if (path.startsWith("/trades/")) return "Trade Details";
  const titles = {
    "/dashboard": "Dashboard",
    "/calendar": "Trading Calendar",
    "/trades": "Trade History",
    "/add-trade": "Add Trade",
    "/settings": "Account Settings",
    "/recycle-bin": "Recycle Bin",
  };
  return titles[path] || "Trade Journal";
}
