import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Clock, MapPin, Plus, Send, Tag, Trash2, Users } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useSpOnboardingDraft } from "@/hooks/useSpOnboardingDraft";
import { serviceCatalog } from "@/lib/serviceCatalog";

const SpOnboarding = () => {
  const {
    detail,
    loading,
    error,
    saveDraft,
    addTechnician,
    deleteTechnician,
    addPricing,
    deletePricing,
    submitForReview,
  } = useSpOnboardingDraft();

  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [zone, setZone] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [technicianForm, setTechnicianForm] = useState({ full_name: "", phone: "", skill: "" });
  const [pricingForm, setPricingForm] = useState({ service_id: "", base_price: "" });
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onboarding = detail?.onboarding;
  const technicians = detail?.resources.technicians ?? [];
  const pricing = detail?.resources.pricing ?? [];
  const status = onboarding?.status || "draft";
  const canSubmitDraft = technicians.length > 0 && pricing.length > 0;

  useEffect(() => {
    setCompanyName(onboarding?.company_name || "");
    setPhone(onboarding?.contact_phone || "");
    setZone(onboarding?.zone || "");
    setRegistrationNumber(onboarding?.registration_number || "");
  }, [
    onboarding?.company_name,
    onboarding?.contact_phone,
    onboarding?.zone,
    onboarding?.registration_number,
  ]);

  if (loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="h-12 rounded-xl bg-muted animate-pulse" />
        <div className="h-64 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  if (error) {
    return <EmptyState title="Onboarding indisponible" description={error} />;
  }

  if (!onboarding) {
    return (
      <EmptyState
        title="Aucun dossier SP"
        description="Aucun dossier onboarding SP n'est associé à votre compte."
      />
    );
  }

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await saveDraft({
        company_name: companyName.trim(),
        contact_phone: phone.trim(),
        zone: zone.trim(),
        registration_number: registrationNumber.trim(),
      });
      toast({ title: "Brouillon enregistré", description: "Le dossier a été mis à jour." });
    } catch (err) {
      toast({
        title: "Erreur",
        description: String((err as { message?: string })?.message || "Impossible d'enregistrer le brouillon."),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddTechnician = async () => {
    if (!technicianForm.full_name.trim()) return;

    try {
      await addTechnician({
        full_name: technicianForm.full_name.trim(),
        phone: technicianForm.phone.trim() || undefined,
        skill: technicianForm.skill.trim() || undefined,
      });
      setTechnicianForm({ full_name: "", phone: "", skill: "" });
      toast({ title: "Technicien ajouté", description: "Le brouillon a été enrichi." });
    } catch (err) {
      toast({
        title: "Erreur",
        description: String((err as { message?: string })?.message || "Impossible d'ajouter le technicien."),
        variant: "destructive",
      });
    }
  };

  const handleAddPricing = async () => {
    const serviceId = pricingForm.service_id.trim();
    const basePrice = Number(pricingForm.base_price);
    if (!serviceId || !Number.isFinite(basePrice)) return;

    try {
      await addPricing({ service_id: serviceId, base_price: basePrice, currency: "XOF" });
      setPricingForm({ service_id: "", base_price: "" });
      toast({ title: "Tarification ajoutée", description: "Le service est prêt pour la revue." });
    } catch (err) {
      toast({
        title: "Erreur",
        description: String((err as { message?: string })?.message || "Impossible d'ajouter le service."),
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await submitForReview();
      toast({
        title: "Dossier soumis",
        description: "Le dossier a été envoyé pour validation admin.",
      });
    } catch (err) {
      toast({
        title: "Soumission impossible",
        description: String((err as { message?: string })?.message || "Le dossier est incomplet."),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const statusCard = {
    draft: {
      title: "Brouillon en préparation",
      description: "Ajoutez vos techniciens et vos services, puis soumettez le dossier.",
      icon: Clock,
      tone: "text-accent",
    },
    pending_review: {
      title: "Dossier en attente de revue",
      description: "Le dossier a été soumis. L'équipe admin doit encore l'approuver.",
      icon: AlertCircle,
      tone: "text-warning",
    },
    approved: {
      title: "Dossier approuvé",
      description: "Le service provider est activé et peut apparaître sur la carte.",
      icon: CheckCircle2,
      tone: "text-success",
    },
    rejected: {
      title: "Dossier rejeté",
      description: onboarding.rejection_reason || "Corrigez les informations puis soumettez à nouveau.",
      icon: AlertCircle,
      tone: "text-destructive",
    },
  }[status] || {
    title: `Statut: ${status}`,
    description: "Vérifiez le dossier onboarding.",
    icon: AlertCircle,
    tone: "text-muted-foreground",
  };

  const StatusIcon = statusCard.icon;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">Onboarding SP</h1>
        <p className="text-sm text-muted-foreground">
          Complétez le dossier prestataire, ajoutez vos techniciens et vos services, puis soumettez-le à l’admin.
        </p>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border p-5">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
            <StatusIcon className={`h-5 w-5 ${statusCard.tone}`} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{statusCard.title}</h2>
            <p className="text-sm text-muted-foreground">{statusCard.description}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">
          <section className="bg-card rounded-xl shadow-sm border border-border p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Informations entreprise</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Raison sociale</p>
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Email de contact</p>
                <Input value={onboarding.contact_email || ""} disabled />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Téléphone</p>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Zone</p>
                <Input value={zone} onChange={(e) => setZone(e.target.value)} placeholder="Ouagadougou" />
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-muted-foreground mb-1">Numéro d'immatriculation / registre</p>
                <Input
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="RC / IFU / registre"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveDraft} disabled={saving}>
                {saving ? "Enregistrement..." : "Enregistrer le brouillon"}
              </Button>
            </div>
          </section>

          <section className="bg-card rounded-xl shadow-sm border border-border p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Techniciens</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                value={technicianForm.full_name}
                onChange={(e) => setTechnicianForm((prev) => ({ ...prev, full_name: e.target.value }))}
                placeholder="Nom complet"
              />
              <Input
                value={technicianForm.phone}
                onChange={(e) => setTechnicianForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="Téléphone"
              />
              <div className="flex gap-2">
                <Input
                  value={technicianForm.skill}
                  onChange={(e) => setTechnicianForm((prev) => ({ ...prev, skill: e.target.value }))}
                  placeholder="Spécialité"
                />
                <Button type="button" size="icon" onClick={handleAddTechnician}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {technicians.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun technicien ajouté.</p>
              ) : (
                technicians.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.full_name}</p>
                      <p className="text-xs text-muted-foreground">{item.skill || "Sans spécialité"} · {item.phone || "Sans téléphone"}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => void deleteTechnician(item.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="bg-card rounded-xl shadow-sm border border-border p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Services & tarification</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-3">
              <select
                value={pricingForm.service_id}
                onChange={(e) => setPricingForm((prev) => ({ ...prev, service_id: e.target.value }))}
                className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground"
              >
                <option value="">Choisir un service</option>
                {serviceCatalog.map((service) => (
                  <option key={service.id} value={service.id}>{service.label}</option>
                ))}
              </select>
              <Input
                type="number"
                value={pricingForm.base_price}
                onChange={(e) => setPricingForm((prev) => ({ ...prev, base_price: e.target.value }))}
                placeholder="Prix de base"
              />
              <Button type="button" size="icon" onClick={handleAddPricing}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {pricing.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun service tarifé ajouté.</p>
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
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="bg-card rounded-xl shadow-sm border border-border p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Résumé du dossier</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Techniciens</span>
                <span className="font-semibold text-foreground">{technicians.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Services tarifés</span>
                <span className="font-semibold text-foreground">{pricing.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Zone</span>
                <span className="font-semibold text-foreground">{onboarding.zone || "Non renseignée"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Statut</span>
                <span className="font-semibold text-foreground">{status}</span>
              </div>
            </div>
          </section>

          <section className="bg-card rounded-xl shadow-sm border border-border p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Soumission</h3>
            <p className="text-sm text-muted-foreground">
              Un dossier SP doit contenir au moins un technicien et un service tarifé avant soumission.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{technicians.length > 0 ? "Techniciens prêts" : "Ajoutez au moins un technicien"}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{zone ? `Zone: ${zone}` : "Zone recommandée avant soumission"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                <span>{pricing.length > 0 ? "Tarification prête" : "Ajoutez au moins un service"}</span>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={submitting || status === "pending_review" || status === "approved" || !canSubmitDraft}
            >
              <Send className="h-4 w-4 mr-2" />
              {submitting ? "Soumission..." : status === "rejected" ? "Corriger et soumettre à nouveau" : "Soumettre pour revue"}
            </Button>
            {!canSubmitDraft && status !== "pending_review" && status !== "approved" && (
              <p className="text-xs text-muted-foreground">
                Ajoutez au moins un technicien et un service tarifé pour débloquer la soumission.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default SpOnboarding;
