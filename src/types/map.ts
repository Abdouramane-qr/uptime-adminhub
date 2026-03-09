export type MissionStatus =
  | "pending"
  | "assigned"
  | "en_route"
  | "arrived"
  | "in_progress"
  | "completed";

export interface ProviderPosition {
  id: string;
  name: string;
  status: MissionStatus;
  lat: number;
  lng: number;
  phone: string;
  currentMission: {
    id: string;
    client: string;
    address: string;
    type: string;
    startedAt: string;
    progress: number; // 0-100
  } | null;
  completedMissions: number;
}

export const STATUS_CONFIG: Record<MissionStatus, { label: string; color: string; markerClass: string }> = {
  pending: { label: "En attente", color: "hsl(var(--muted-foreground))", markerClass: "bg-muted-foreground" },
  assigned: { label: "Assigné", color: "hsl(var(--info))", markerClass: "bg-info" },
  en_route: { label: "En route", color: "hsl(var(--accent))", markerClass: "bg-accent" },
  arrived: { label: "Arrivé", color: "hsl(var(--warning, 45 93% 47%))", markerClass: "bg-yellow-500" },
  in_progress: { label: "En cours", color: "hsl(var(--success))", markerClass: "bg-success" },
  completed: { label: "Terminé", color: "hsl(var(--primary))", markerClass: "bg-primary" },
};
