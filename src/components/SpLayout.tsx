import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import SpSidebar from "./SpSidebar";
import SpHeader from "./SpHeader";
import PageTransition from "./PageTransition";

const SP_STORAGE_KEY = "fleet-rescue-sp-sidebar-collapsed";

const SpLayout = () => {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(SP_STORAGE_KEY) === "true"; } catch { return false; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    try { localStorage.setItem(SP_STORAGE_KEY, String(collapsed)); } catch {}
  }, [collapsed]);

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setMobileOpen((v) => !v);
    } else {
      setCollapsed((v) => !v);
    }
  };

  const mainMargin = collapsed ? "md:ml-16" : "md:ml-60";

  return (
    <div className="min-h-screen bg-background">
      <SpSidebar collapsed={collapsed} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <SpHeader collapsed={collapsed} onToggleSidebar={toggleSidebar} />
      <main className={`mt-16 p-4 md:p-6 transition-all duration-200 ${mainMargin}`}>
        <PageTransition key={location.pathname}>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  );
};

export default SpLayout;