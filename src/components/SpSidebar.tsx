import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  HardHat,
  Tag,
  ClipboardList,
  Map,
  FileText,
  Settings,
  Truck,
  X,
} from "lucide-react";

const navItems = [
  { title: "Dashboard", to: "/sp/dashboard", icon: LayoutDashboard },
  { title: "Technicians", to: "/sp/technicians", icon: HardHat },
  { title: "Services & Pricing", to: "/sp/services", icon: Tag },
  { title: "Interventions", to: "/sp/interventions", icon: ClipboardList },
  { title: "Map View", to: "/sp/map", icon: Map },
  { title: "Invoices", to: "/sp/invoices", icon: FileText },
  { title: "Settings", to: "/sp/settings", icon: Settings },
];

interface SpSidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const SpSidebar = ({ collapsed, mobileOpen, onCloseMobile }: SpSidebarProps) => {
  const sidebarWidth = collapsed ? "w-16" : "w-60";

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm md:hidden" onClick={onCloseMobile} />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 h-screen bg-card shadow-md flex flex-col transition-all duration-200 ease-in-out
          ${sidebarWidth}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
        `}
      >
        <div className="flex flex-col h-16 justify-center px-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
              <Truck className="h-4 w-4 text-accent-foreground" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-lg font-bold text-foreground leading-tight">Fleet Rescue</span>
              </div>
            )}
            {mobileOpen && (
              <button onClick={onCloseMobile} className="ml-auto p-1 rounded-lg hover:bg-muted md:hidden">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {!collapsed && (
          <div className="px-4 py-2">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/15 text-accent">
              Service Provider
            </span>
          </div>
        )}

        <nav className="flex-1 py-2 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  collapsed ? "justify-center px-0" : "px-3"
                } ${
                  isActive
                    ? "bg-accent/10 text-accent font-semibold border-l-[3px] border-accent"
                    : "text-sidebar-foreground hover:bg-muted focus:bg-muted"
                }`
              }
              title={collapsed ? item.title : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          ))}
        </nav>

        {!collapsed && (
          <div className="p-4 border-t border-border shrink-0">
            <p className="text-xs text-muted-foreground">© 2026 Fleet Rescue</p>
          </div>
        )}
      </aside>
    </>
  );
};

export default SpSidebar;