import { NavLink } from "react-router-dom";
import { useRole } from "@/hooks/useRole";
import { useLanguage } from "@/hooks/useLanguage";
import {
  LayoutDashboard,
  Users,
  Wrench,
  Truck,
  ClipboardList,
  MapPin,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Radio,
  UserCheck,
  ClipboardCheck,
  FileText,
  ScrollText,
  CreditCard,
  BarChart3,
  Book,
  BookOpen,
  Shield,
  Crown,
} from "lucide-react";

type AppRole = "admin" | "moderator" | "user";

const navItems: { titleKey: string; to: string; icon: typeof LayoutDashboard; roles?: AppRole[] }[] = [
  { titleKey: "nav.dashboard", to: "/dashboard", icon: LayoutDashboard },
  { titleKey: "nav.dispatch", to: "/dispatch", icon: Radio, roles: ["admin", "moderator"] },
  { titleKey: "nav.accounts", to: "/accounts", icon: Users, roles: ["admin"] },
  { titleKey: "nav.onboarding", to: "/onboarding", icon: ClipboardCheck, roles: ["admin"] },
  { titleKey: "nav.providers", to: "/providers", icon: Wrench },
  { titleKey: "nav.fleet_managers", to: "/fleet-managers", icon: Truck },
  { titleKey: "nav.interventions", to: "/interventions", icon: ClipboardList },
  { titleKey: "nav.technicians", to: "/technicians", icon: UserCheck },
  { titleKey: "nav.map", to: "/map", icon: MapPin },
  { titleKey: "nav.billing", to: "/billing", icon: CreditCard, roles: ["admin", "moderator"] },
  { titleKey: "nav.analytics", to: "/analytics", icon: BarChart3, roles: ["admin", "moderator"] },
  { titleKey: "nav.audit_logs", to: "/audit-logs", icon: ScrollText, roles: ["admin"] },
  { titleKey: "nav.documentation", to: "/documentation", icon: Book },
  { titleKey: "nav.guide", to: "/user-guide", icon: BookOpen },
  { titleKey: "nav.roles", to: "/admin-roles", icon: Shield, roles: ["admin"] },
  { titleKey: "nav.settings", to: "/settings", icon: Settings, roles: ["admin", "moderator"] },
];

interface AppSidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const AppSidebar = ({ collapsed, mobileOpen, onCloseMobile }: AppSidebarProps) => {
  const sidebarWidth = collapsed ? "w-[72px]" : "w-64";
  const { roles, hasAnyRole, loading: rolesLoading } = useRole();
  const { t } = useLanguage();

  const visibleItems = navItems.filter(
    (item) => !item.roles || hasAnyRole(...item.roles)
  );

  const roleLabelKey = roles.includes("admin")
    ? "role.admin"
    : roles.includes("moderator")
    ? "role.moderator"
    : "role.user";

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen bg-sidebar flex flex-col transition-all duration-300 ease-in-out
          ${sidebarWidth}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-4 shrink-0">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-glow">
            <Truck className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-base font-bold text-sidebar-primary-foreground whitespace-nowrap tracking-tight">
              Fleet Rescue
            </span>
          )}
          {mobileOpen && (
            <button
              onClick={onCloseMobile}
              className="ml-auto p-1.5 rounded-lg hover:bg-sidebar-muted md:hidden transition-colors"
            >
              <X className="h-4 w-4 text-sidebar-foreground" />
            </button>
          )}
        </div>

        {/* Section label */}
        {!collapsed && (
          <div className="px-5 pt-4 pb-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/50">
              {t("nav.navigation")}
            </p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-2 px-3 space-y-0.5 overflow-y-auto">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `group flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  collapsed ? "justify-center px-0" : "px-3"
                } ${
                  isActive
                    ? "bg-sidebar-accent/15 text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-muted hover:text-sidebar-primary-foreground"
                }`
              }
              title={collapsed ? t(item.titleKey) : undefined}
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`shrink-0 h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-glow"
                        : "text-sidebar-foreground group-hover:text-sidebar-primary-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                  </div>
                  {!collapsed && <span>{t(item.titleKey)}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Role indicator */}
        <div className={`mx-3 mb-2 shrink-0 ${collapsed ? "flex justify-center" : ""}`}>
          {roles.length > 0 && (
            <div
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-sidebar-border bg-sidebar-muted/60 ${
                collapsed ? "px-2 justify-center" : ""
              }`}
              title={collapsed ? `${t(roleLabelKey)}` : undefined}
            >
              {roles.includes("admin") ? (
                <Crown className="h-3.5 w-3.5 text-sidebar-accent shrink-0" />
              ) : roles.includes("moderator") ? (
                <Shield className="h-3.5 w-3.5 text-accent shrink-0" />
              ) : (
                <UserCheck className="h-3.5 w-3.5 text-sidebar-foreground shrink-0" />
              )}
              {!collapsed && (
                <span className="text-[11px] font-medium text-sidebar-foreground">
                  {t(roleLabelKey)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!collapsed && (
          <div className="p-4 mx-3 mb-3 rounded-xl bg-sidebar-muted/60 shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <p className="text-xs font-semibold text-sidebar-primary-foreground">{t("sidebar.upgrade")}</p>
            </div>
            <p className="text-[11px] text-sidebar-foreground leading-relaxed">
              {t("sidebar.upgrade_desc")}
            </p>
          </div>
        )}
      </aside>
    </>
  );
};

export default AppSidebar;
