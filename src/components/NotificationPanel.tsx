import { useState, useRef, useEffect } from "react";
import { Bell, Check } from "lucide-react";
import { reportFallbackHit } from "@/lib/fallbackTelemetry";
import { allowMockFallback } from "@/lib/runtimeFlags";
import { listNotifications, type NotificationDTO } from "@/lib/adminPortalClient";

const NotificationPanel = () => {
  const allowFallback = allowMockFallback();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [apiBacked, setApiBacked] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const markAllRead = () => {
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || now })));
  };

  const displayTime = (iso?: string) => {
    if (!iso) return "just now";
    return new Date(iso).toLocaleString("fr-FR", { hour12: false });
  };

  useEffect(() => {
    const load = async () => {
      try {
        const rows = await listNotifications(25);
        setNotifications(rows);
        setApiBacked(true);
      } catch (e) {
        setApiBacked(false);
        reportFallbackHit("Notifications");
        if (allowFallback) {
          setNotifications([
            { id: Number.POSITIVE_INFINITY, title: "Notifications offline", body: "Cannot reach Supabase right now.", created_at: new Date().toISOString(), read_at: null },
          ]);
        }
      }
    };

    void load();
  }, [allowFallback]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-card rounded-xl shadow-md border border-border z-50 animate-fade-in overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h4 className="text-sm font-semibold text-foreground">Notifications</h4>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
                <Check className="h-3 w-3" />
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`px-4 py-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${
                  !n.read_at ? "border-l-2 border-l-primary" : ""
                }`}
              >
                <p className={`text-sm ${!n.read_at ? "font-semibold text-foreground" : "text-foreground"}`}>{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.body || "Notification"}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{displayTime(n.created_at)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
