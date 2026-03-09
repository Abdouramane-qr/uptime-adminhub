import { Menu } from "lucide-react";
import NotificationPanel from "./NotificationPanel";
import UserMenu from "./UserMenu";

interface SpHeaderProps {
  collapsed: boolean;
  onToggleSidebar: () => void;
}

const SpHeader = ({ collapsed, onToggleSidebar }: SpHeaderProps) => {
  const leftOffset = collapsed ? "md:left-16" : "md:left-60";

  return (
    <header className={`fixed top-0 left-0 ${leftOffset} right-0 z-20 h-16 bg-card shadow-sm border-b border-border flex items-center justify-between px-4 md:px-6 transition-all duration-200`}>
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5 text-muted-foreground" />
        </button>
        <h2 className="text-sm font-medium text-muted-foreground hidden sm:block">Service Provider Portal</h2>
      </div>

      <div className="flex items-center gap-3">
        <NotificationPanel />
        <UserMenu />
      </div>
    </header>
  );
};

export default SpHeader;