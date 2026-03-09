import { useState } from "react";
import {
  Search,
  Plus,
  Phone,
  Mail,
  Star,
  Edit3,
  PhoneCall,
  CalendarDays,
  X,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import EmptyState from "@/components/EmptyState";

type TechStatus = "available" | "on_mission" | "offline";

interface Technician {
  id: number;
  firstName: string;
  lastName: string;
  speciality: string;
  phone: string;
  email: string;
  missions: number;
  rating: number;
  status: TechStatus;
  currentJob?: string;
  currentDistance?: string;
}

const technicians: Technician[] = [
  { id: 1, firstName: "Jean", lastName: "Dupont", speciality: "Mechanical", phone: "+33 6 12 34 56 78", email: "jean.dupont@autofixpro.com", missions: 14, rating: 4.8, status: "on_mission", currentJob: "FR-2041", currentDistance: "1.2km" },
  { id: 2, firstName: "Marie", lastName: "Laurent", speciality: "Electrical", phone: "+33 6 23 45 67 89", email: "marie.laurent@autofixpro.com", missions: 11, rating: 4.9, status: "available" },
  { id: 3, firstName: "Pierre", lastName: "Martin", speciality: "Towing", phone: "+33 6 34 56 78 90", email: "pierre.martin@autofixpro.com", missions: 18, rating: 4.7, status: "available" },
  { id: 4, firstName: "Sophie", lastName: "Moreau", speciality: "Tire", phone: "+33 6 45 67 89 01", email: "sophie.moreau@autofixpro.com", missions: 9, rating: 4.6, status: "offline" },
  { id: 5, firstName: "Luc", lastName: "Bernard", speciality: "Locksmith", phone: "+33 6 56 78 90 12", email: "luc.bernard@autofixpro.com", missions: 22, rating: 4.9, status: "on_mission", currentJob: "FR-2038", currentDistance: "3.5km" },
  { id: 6, firstName: "Camille", lastName: "Petit", speciality: "Mechanical", phone: "+33 6 67 89 01 23", email: "camille.petit@autofixpro.com", missions: 7, rating: 4.5, status: "available" },
];

const statusConfig: Record<TechStatus, { dot: string; bg: string; text: string; label: string }> = {
  available: { dot: "bg-success", bg: "bg-success/10", text: "text-success", label: "Available" },
  on_mission: { dot: "bg-primary", bg: "bg-primary/10", text: "text-primary", label: "On Mission" },
  offline: { dot: "bg-muted-foreground", bg: "bg-muted", text: "text-muted-foreground", label: "Offline" },
};

const avatarColors = [
  "bg-primary text-primary-foreground",
  "bg-accent text-accent-foreground",
  "bg-success text-success-foreground",
  "bg-info text-info-foreground",
  "bg-destructive text-destructive-foreground",
  "bg-primary text-primary-foreground",
];

const specialityOptions = ["Mechanical", "Electrical", "Towing", "Tire", "Locksmith", "Other"];

const SpTechnicians = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const filtered = technicians.filter((t) => {
    const matchSearch = `${t.firstName} ${t.lastName}`.toLowerCase().includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || statusFilter.toLowerCase().replace(" ", "_") === t.status;
    return matchSearch && matchStatus;
  });

  const toggleSpec = (spec: string) => {
    setSelectedSpecs((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setModalOpen(false);
      setSelectedSpecs([]);
    }, 1500);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">Technicians</h1>
          <span className="bg-accent/15 text-accent text-xs font-semibold px-2.5 py-1 rounded-full">{technicians.length}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search technicians..."
              className="h-9 pl-9 pr-4 rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none w-52"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-input bg-card text-sm text-foreground focus:border-accent outline-none"
          >
            <option>All</option>
            <option>Available</option>
            <option>On Mission</option>
            <option>Offline</option>
          </select>
          <button
            onClick={() => setModalOpen(true)}
            className="h-9 px-4 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Technician
          </button>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No technicians found"
          description="Try adjusting your search or filter"
          actionLabel="Clear filters"
          onAction={() => { setSearch(""); setStatusFilter("All"); }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((tech, i) => {
            const initials = `${tech.firstName[0]}${tech.lastName[0]}`;
            const sc = statusConfig[tech.status];
            return (
              <div key={tech.id} className="bg-card rounded-xl shadow-sm border border-border p-5 hover:shadow-md transition-shadow">
                {/* Top */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className={`h-11 w-11 rounded-full flex items-center justify-center text-sm font-bold ${avatarColors[i % avatarColors.length]}`}>
                        {initials}
                      </div>
                      <span className={`absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card ${sc.dot}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{tech.firstName} {tech.lastName}</p>
                      <p className="text-xs text-muted-foreground">{tech.speciality}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-full ${sc.bg} ${sc.text}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                    {sc.label}
                  </span>
                </div>

                {/* Contact */}
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span>{tech.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span>{tech.email}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
                  <span>{tech.missions} missions this month</span>
                  <span className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 text-accent fill-accent" />
                    {tech.rating}
                  </span>
                </div>

                {/* On mission info */}
                {tech.status === "on_mission" && tech.currentJob && (
                  <p className="text-xs text-primary font-medium mb-3">
                    Job #{tech.currentJob} — {tech.currentDistance}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-border">
                  <button className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="Edit">
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-success/10 hover:text-success transition-colors" title="Call">
                    <PhoneCall className="h-4 w-4" />
                  </button>
                  <button className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors" title="View Schedule">
                    <CalendarDays className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Technician Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Add New Technician</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSendInvite} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">First Name</label>
                <input required className="w-full h-10 px-3 rounded-lg border border-input bg-card text-sm text-foreground focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none" placeholder="Jean" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Last Name</label>
                <input required className="w-full h-10 px-3 rounded-lg border border-input bg-card text-sm text-foreground focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none" placeholder="Dupont" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Email</label>
              <input required type="email" className="w-full h-10 px-3 rounded-lg border border-input bg-card text-sm text-foreground focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none" placeholder="jean.dupont@example.com" />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
              <input required className="w-full h-10 px-3 rounded-lg border border-input bg-card text-sm text-foreground focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none" placeholder="+33 6 12 34 56 78" />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Specialities</label>
              <div className="flex flex-wrap gap-2">
                {specialityOptions.map((spec) => (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => toggleSpec(spec)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                      selectedSpecs.includes(spec)
                        ? "bg-accent text-accent-foreground border-accent"
                        : "border-input text-muted-foreground hover:border-accent hover:text-accent"
                    }`}
                  >
                    {spec}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
              <textarea className="w-full h-20 px-3 py-2 rounded-lg border border-input bg-card text-sm text-foreground focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none resize-none" placeholder="Any additional notes..." />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full h-10 rounded-lg bg-accent text-accent-foreground font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Invitation"
              )}
            </button>

            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SpTechnicians;