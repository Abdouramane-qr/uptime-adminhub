import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Couleurs par urgence
const URGENCY_COLORS = {
  normal: "#6b7280",   // Gray
  high: "#f59e0b",     // Amber
  critical: "#ef4444", // Red
};

const createInterventionIcon = (urgency: "normal" | "high" | "critical", id: string) => {
  const color = URGENCY_COLORS[urgency];
  return L.divIcon({
    className: "intervention-marker",
    html: `<div style="
      position: relative; width: 36px; height: 36px;
      display: flex; align-items: center; justify-content: center;
    ">
      <div style="
        width: 30px; height: 30px; border-radius: 8px;
        background: ${color}; border: 2px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        display: flex; align-items: center; justify-content: center;
        transform: rotate(45deg);
      ">
        <div style="transform: rotate(-45deg); color: white; font-weight: bold; font-size: 10px;">
          ${id.split("-")[1] || id.slice(-3)}
        </div>
      </div>
      <div style="
        position: absolute; bottom: -2px; width: 0; height: 0;
        border-left: 6px solid transparent; border-right: 6px solid transparent;
        border-top: 8px solid ${color};
      "></div>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });
};

interface Props {
  intervention: {
    id: string;
    lat: number;
    lng: number;
    client: string;
    type: string;
    urgency: "normal" | "high" | "critical";
    status: string;
  };
  onSelect: (id: string) => void;
}

const InterventionMarker = ({ intervention, onSelect }: Props) => {
  // Validate coordinates to prevent Leaflet crash
  const lat = Number(intervention.lat);
  const lng = Number(intervention.lng);
  
  if (isNaN(lat) || Number(lat) === 0 || isNaN(lng) || Number(lng) === 0) {
    return null;
  }

  return (
    <Marker
      position={[lat, lng]}
      icon={createInterventionIcon(intervention.urgency, intervention.id)}
      eventHandlers={{ click: () => onSelect(intervention.id) }}
    >
      <Popup>
        <div className="p-1 min-w-[150px]">
          <p className="font-bold text-xs font-mono text-primary mb-1">{intervention.id}</p>
          <p className="font-semibold text-sm leading-tight">{intervention.client}</p>
          <p className="text-xs text-muted-foreground mt-1">{intervention.type}</p>
          <div className="mt-2 pt-2 border-t border-border flex justify-between items-center">
             <span className="text-[10px] uppercase font-bold text-muted-foreground">{intervention.status}</span>
             <div className="h-2 w-2 rounded-full" style={{ background: URGENCY_COLORS[intervention.urgency] }}></div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default InterventionMarker;
