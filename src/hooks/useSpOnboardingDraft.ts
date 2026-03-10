import { useCallback, useEffect, useState } from "react";
import {
  getCurrentOnboardingDetail,
  onboardingAction,
  onboardingCreateResource,
  onboardingDeleteResource,
  updateOnboarding,
} from "@/lib/adminPortalClient";

export interface SpOnboardingRecord {
  id: string;
  company_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  zone: string | null;
  registration_number: string | null;
  status: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
}

export interface SpTechnicianRecord {
  id: string;
  full_name: string;
  phone?: string | null;
  skill?: string | null;
  created_at?: string | null;
}

export interface SpPricingRecord {
  id: string;
  service_id: string;
  base_price: number;
  currency?: string | null;
  created_at?: string | null;
}

interface SpOnboardingDetail {
  onboarding: SpOnboardingRecord;
  resources: {
    technicians: SpTechnicianRecord[];
    pricing: SpPricingRecord[];
  };
}

function normalizeDetail(payload: Record<string, unknown>): SpOnboardingDetail {
  const onboarding = (payload.onboarding || {}) as Record<string, unknown>;
  const resources = (payload.resources || {}) as Record<string, unknown>;

  return {
    onboarding: {
      id: String(onboarding.id || ""),
      company_name: onboarding.company_name == null ? null : String(onboarding.company_name),
      contact_email: onboarding.contact_email == null ? null : String(onboarding.contact_email),
      contact_phone: onboarding.contact_phone == null ? null : String(onboarding.contact_phone),
      zone: onboarding.zone == null ? null : String(onboarding.zone),
      registration_number:
        onboarding.registration_number == null ? null : String(onboarding.registration_number),
      status: onboarding.status == null ? null : String(onboarding.status),
      submitted_at: onboarding.submitted_at == null ? null : String(onboarding.submitted_at),
      approved_at: onboarding.approved_at == null ? null : String(onboarding.approved_at),
      rejection_reason:
        onboarding.rejection_reason == null ? null : String(onboarding.rejection_reason),
    },
    resources: {
      technicians: Array.isArray(resources.technicians)
        ? (resources.technicians as SpTechnicianRecord[])
        : [],
      pricing: Array.isArray(resources.pricing) ? (resources.pricing as SpPricingRecord[]) : [],
    },
  };
}

export function useSpOnboardingDraft() {
  const [detail, setDetail] = useState<SpOnboardingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = await getCurrentOnboardingDetail({ accountType: "sp" });
      setDetail(normalizeDetail(payload));
    } catch (err) {
      const message = String((err as { message?: string })?.message || "");
      if (message.includes("onboarding_not_found")) {
        setDetail(null);
        setError(null);
      } else {
        setError(message || "Impossible de charger le dossier onboarding.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const ensureOnboardingId = useCallback(() => {
    const onboardingId = detail?.onboarding.id;
    if (!onboardingId) throw new Error("Aucun dossier onboarding SP actif.");
    return onboardingId;
  }, [detail?.onboarding.id]);

  const saveDraft = useCallback(
    async (patch: Record<string, unknown>) => {
      const onboardingId = ensureOnboardingId();
      await updateOnboarding(onboardingId, patch);
      await refresh();
    },
    [ensureOnboardingId, refresh],
  );

  const addTechnician = useCallback(
    async (body: { full_name: string; phone?: string; skill?: string }) => {
      const onboardingId = ensureOnboardingId();
      await onboardingCreateResource(onboardingId, "technicians", body);
      await refresh();
    },
    [ensureOnboardingId, refresh],
  );

  const deleteTechnician = useCallback(
    async (itemId: string) => {
      const onboardingId = ensureOnboardingId();
      await onboardingDeleteResource(onboardingId, "technicians", itemId);
      await refresh();
    },
    [ensureOnboardingId, refresh],
  );

  const addPricing = useCallback(
    async (body: { service_id: string; base_price: number; currency?: string }) => {
      const onboardingId = ensureOnboardingId();
      await onboardingCreateResource(onboardingId, "pricing", body);
      await refresh();
    },
    [ensureOnboardingId, refresh],
  );

  const deletePricing = useCallback(
    async (itemId: string) => {
      const onboardingId = ensureOnboardingId();
      await onboardingDeleteResource(onboardingId, "pricing", itemId);
      await refresh();
    },
    [ensureOnboardingId, refresh],
  );

  const submitForReview = useCallback(async () => {
    const onboardingId = ensureOnboardingId();
    await onboardingAction(onboardingId, "submit");
    await refresh();
  }, [ensureOnboardingId, refresh]);

  return {
    detail,
    loading,
    error,
    refresh,
    saveDraft,
    addTechnician,
    deleteTechnician,
    addPricing,
    deletePricing,
    submitForReview,
  };
}
