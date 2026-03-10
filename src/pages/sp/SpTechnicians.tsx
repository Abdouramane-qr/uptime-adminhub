import { useState } from "react";
import { Plus, Trash2, Users } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useSpOnboardingDraft } from "@/hooks/useSpOnboardingDraft";

const SpTechnicians = () => {
  const { detail, loading, error, addTechnician, deleteTechnician } = useSpOnboardingDraft();
  const [form, setForm] = useState({ full_name: "", phone: "", skill: "" });

  const technicians = detail?.resources.technicians ?? [];

  const handleAdd = async () => {
    if (!form.full_name.trim()) return;

    try {
      await addTechnician({
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || undefined,
        skill: form.skill.trim() || undefined,
      });
      setForm({ full_name: "", phone: "", skill: "" });
      toast({ title: "Technicien ajouté", description: "Le brouillon a été mis à jour." });
    } catch (err) {
      toast({
        title: "Erreur",
        description: String((err as { message?: string })?.message || "Impossible d'ajouter le technicien."),
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="h-48 rounded-xl bg-muted animate-pulse" />;
  }

  if (error) {
    return <EmptyState title="Techniciens indisponibles" description={error} />;
  }

  if (!detail) {
    return <EmptyState title="Aucun dossier SP" description="Aucun onboarding SP actif pour ce compte." />;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Technicians</h1>
        <p className="text-sm text-muted-foreground">
          Ajoutez les techniciens qui doivent apparaître dans votre dossier onboarding.
        </p>
      </div>

      <section className="bg-card rounded-xl shadow-sm border border-border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Nouveau technicien</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input
            value={form.full_name}
            onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
            placeholder="Nom complet"
          />
          <Input
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            placeholder="Téléphone"
          />
          <Input
            value={form.skill}
            onChange={(e) => setForm((prev) => ({ ...prev, skill: e.target.value }))}
            placeholder="Spécialité"
          />
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </section>

      <section className="bg-card rounded-xl shadow-sm border border-border p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Techniciens enregistrés</h2>
        {technicians.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun technicien enregistré pour le moment.</p>
        ) : (
          technicians.map((tech) => (
            <div key={tech.id} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">{tech.full_name}</p>
                <p className="text-xs text-muted-foreground">{tech.skill || "Sans spécialité"} · {tech.phone || "Sans téléphone"}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => void deleteTechnician(tech.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))
        )}
      </section>
    </div>
  );
};

export default SpTechnicians;
