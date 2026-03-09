import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const UserMenu = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const name = profile?.full_name || user?.email || "Utilisateur";
  const email = user?.email || "";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate("/login");
  };

  const items = [
    { label: "Profile", icon: User, onClick: () => { setOpen(false); navigate("/profile"); } },
    { label: "Settings", icon: Settings, onClick: () => { setOpen(false); navigate("/settings"); } },
    { label: "Sign Out", icon: LogOut, onClick: handleSignOut },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg p-1 -m-1 hover:bg-muted/50 transition-colors"
      >
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">{email}</p>
        </div>
        <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
          {initials}
        </div>
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-48 bg-card rounded-xl shadow-md border border-border z-50 animate-fade-in overflow-hidden py-1">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors ${
                item.label === "Sign Out" ? "text-destructive" : "text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserMenu;
