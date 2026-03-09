import { X, Phone, MapPin, Clock, User, History } from "lucide-react";
import { ProviderPosition, STATUS_CONFIG } from "@/types/map";
import { Progress } from "@/components/ui/progress";

interface Props {
  provider: ProviderPosition | null;
  onClose: () => void;
}

const MissionPanel = ({ provider, onClose }: Props) => {
  if (!provider) return null;

  const config = STATUS_CONFIG[provider.status];
  const mission = provider.currentMission;

  return (
    <div className="absolute top-4 right-4 z-[1000] w-80 bg-card border border-border rounded-xl shadow-lg overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ background: config.color }}
          >
            {provider.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">{provider.name}</p>
            <span
              className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full text-white"
              style={{ background: config.color }}
            >
              {config.label}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Contact */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="h-3.5 w-3.5" />
          <span>{provider.phone}</span>
        </div>
      </div>

      {/* Mission */}
      {mission ? (
        <div className="p-4 space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mission en cours</h4>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <User className="h-3.5 w-3.5 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">{mission.client}</p>
                <p className="text-xs text-muted-foreground">{mission.type}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-3.5 w-3.5 mt-0.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{mission.address}</p>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Début : {new Date(mission.startedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Progression</span>
                <span className="font-medium text-foreground">{mission.progress}%</span>
              </div>
              <Progress value={mission.progress} className="h-2" />
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 text-center">
          <p className="text-sm text-muted-foreground">Aucune mission active</p>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border flex items-center gap-2">
        <History className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{provider.completedMissions} missions terminées</span>
      </div>
    </div>
  );
};

export default MissionPanel;
