import { Database, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataSourceBadgeProps {
  backend: boolean;
  fallbackAllowed?: boolean;
  className?: string;
}

const DataSourceBadge = ({ backend, fallbackAllowed = true, className }: DataSourceBadgeProps) => {
  const isStrict = !fallbackAllowed;
  const label = backend ? "Backend" : isStrict ? "Backend strict" : "Mock fallback";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border",
        backend
          ? "bg-success/10 text-success border-success/20"
          : isStrict
            ? "bg-primary/10 text-primary border-primary/20"
            : "bg-warning/10 text-warning border-warning/20",
        className,
      )}
    >
      {backend || isStrict ? <Database className="h-3.5 w-3.5" /> : <FlaskConical className="h-3.5 w-3.5" />}
      {label}
    </span>
  );
};

export default DataSourceBadge;
