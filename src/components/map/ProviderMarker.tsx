import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { ProviderPosition, STATUS_CONFIG } from "@/types/map";
import { Progress } from "@/components/ui/progress";

const createIcon = (status: ProviderPosition["status"]) => {
  const { color } = STATUS_CONFIG[status];
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width: 32px; height: 32px; border-radius: 50%;
      background: ${color}; border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
    ">
      <div style="width: 10px; height: 10px; border-radius: 50%; background: white;"></div>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

interface Props {
  provider: ProviderPosition;
  onSelect: (provider: ProviderPosition) => void;
}

const ProviderMarker = ({ provider, onSelect }: Props) => {
  const config = STATUS_CONFIG[provider.status];

  return (
    <Marker
      position={[provider.lat, provider.lng]}
      icon={createIcon(provider.status)}
      eventHandlers={{ click: () => onSelect(provider) }}
    >
      <Popup>
        <div className="min-w-[200px] p-1">
          <p className="font-semibold text-sm">{provider.name}</p>
          <span
            className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-1 text-white"
            style={{ background: config.color }}
          >
            {config.label}
          </span>
          {provider.currentMission && (
            <div className="mt-2 space-y-1">
              <p className="text-xs text-muted-foreground">{provider.currentMission.type}</p>
              <p className="text-xs font-medium">{provider.currentMission.client}</p>
              <Progress value={provider.currentMission.progress} className="h-1.5" />
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

export default ProviderMarker;
