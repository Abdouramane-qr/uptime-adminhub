import { Menu, Search, Sun, Moon, Languages } from "lucide-react";
import NotificationPanel from "./NotificationPanel";
import AlertsPanel from "./AlertsPanel";
import UserMenu from "./UserMenu";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";

interface AppHeaderProps {
  collapsed: boolean;
  onToggleSidebar: () => void;
}

const AppHeader = ({ collapsed, onToggleSidebar }: AppHeaderProps) => {
  const leftOffset = collapsed ? "md:left-[72px]" : "md:left-64";
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === "fr" ? "en" : "fr");
  };

  return (
    <header
      className={`fixed top-0 left-0 ${leftOffset} right-0 z-20 h-16 glass border-b border-border/60 flex items-center justify-between px-4 md:px-6 transition-all duration-300`}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-label={t("header.toggle_sidebar")}
        >
          <Menu className="h-5 w-5 text-muted-foreground" />
        </button>

        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("header.search")}
            className="h-9 w-64 pl-9 pr-4 rounded-xl border border-border bg-muted/50 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Language switcher */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-label="Change language"
          title={language === "fr" ? "Switch to English" : "Passer en Français"}
        >
          <Languages className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase">{language}</span>
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-label={t("header.toggle_theme")}
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5 text-warning" />
          ) : (
            <Moon className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
        <AlertsPanel />
        <NotificationPanel />
        <div className="h-6 w-px bg-border hidden sm:block" />
        <UserMenu />
      </div>
    </header>
  );
};

export default AppHeader;
