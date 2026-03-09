import { STATUS_CONFIG, MissionStatus } from "@/types/map";

const MapLegend = () => (
  <div className="absolute bottom-4 left-4 z-[1000] bg-card border border-border rounded-xl shadow-md p-3">
    <p className="text-xs font-semibold text-foreground mb-2">Statuts</p>
    <div className="space-y-1.5">
      {(Object.entries(STATUS_CONFIG) as [MissionStatus, typeof STATUS_CONFIG[MissionStatus]][]).map(
        ([key, val]) => (
          <div key={key} className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ background: val.color }} />
            <span className="text-[11px] text-muted-foreground">{val.label}</span>
          </div>
        )
      )}
    </div>
  </div>
);

export default MapLegend;
