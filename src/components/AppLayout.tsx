import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import AppHeader from "./AppHeader";
import PageTransition from "./PageTransition";

const STORAGE_KEY = "fleet-rescue-sidebar-collapsed";

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === "true"; } catch { return false; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, String(collapsed)); } catch {}
  }, [collapsed]);

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setMobileOpen((v) => !v);
    } else {
      setCollapsed((v) => !v);
    }
  };

  const mainMargin = collapsed ? "md:ml-[72px]" : "md:ml-64";

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar collapsed={collapsed} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <AppHeader collapsed={collapsed} onToggleSidebar={toggleSidebar} />
      <main className={`mt-16 p-4 md:p-6 lg:p-8 transition-all duration-300 ${mainMargin}`}>
        <PageTransition key={location.pathname}>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  );
};

export default AppLayout;
