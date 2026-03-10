import { useState } from "react";
import { Plus, Tag, Trash2 } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useSpOnboardingDraft } from "@/hooks/useSpOnboardingDraft";
import { serviceCatalog } from "@/lib/serviceCatalog";

const SpServices = () => {
  const { detail, loading, error, addPricing, deletePricing } = useSpOnboardingDraft();
  const [form, setForm] = useState({ service_id: "", base_price: "" });

  const pricing = detail?.resources.pricing ?? [];

  const handleAdd = async () => {
    const serviceId = form.service_id.trim();
    const basePrice = Number(form.base_price);
    if (!serviceId || !Number.isFinite(basePrice)) return;

    try {
      await addPricing({ service_id: serviceId, base_price: basePrice, currency: "XOF" });
      setForm({ service_id: "", base_price: "" });
      toast({ title: "Service ajouté", description: "La tarification a été enregistrée." });
    } catch (err) {
      toast({
        title: "Erreur",
        description: String((err as { message?: string })?.message || "Impossible d'ajouter le service."),
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="h-48 rounded-xl bg-muted animate-pulse" />;
  }

  if (error) {
    return <EmptyState title="Services indisponibles" description={error} />;
  }

  if (!detail) {
    return <EmptyState title="Aucun dossier SP" description="Aucun onboarding SP actif pour ce compte." />;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Services & Pricing</h1>
        <p className="text-sm text-muted-foreground">
          Ajoutez les services proposés et leur prix de base pour compléter le dossier onboarding.
        </p>
      </div>

      <section className="bg-card rounded-xl shadow-sm border border-border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Nouveau service</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px_auto] gap-3">
          <select
            value={form.service_id}
            onChange={(e) => setForm((prev) => ({ ...prev, service_id: e.target.value }))}
            className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground"
          >
            <option value="">Choisir un service</option>
            {serviceCatalog.map((service) => (
              <option key={service.id} value={service.id}>{service.label}</option>
            ))}
          </select>
          <Input
            type="number"
            value={form.base_price}
            onChange={(e) => setForm((prev) => ({ ...prev, base_price: e.target.value }))}
            placeholder="Prix de base (XOF)"
          />
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </section>

      <section className="bg-card rounded-xl shadow-sm border border-border p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Services enregistrés</h2>
        {pricing.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun service tarifé enregistré.</p>
        ) : (
          pricing.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">{item.service_id}</p>
                <p className="text-xs text-muted-foreground">
                  {item.base_price} {item.currency || "XOF"}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => void deletePricing(item.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))
        )}
      </section>
    </div>
  );
};

export default SpServices;
