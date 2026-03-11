import {
  getOnboardingDetail,
  listOnboardingQueue,
  type OnboardingItemDTO,
} from "@/lib/adminPortalClient";

type OnboardingResource = Record<string, unknown>;

type OnboardingDetail = {
  onboarding?: {
    id?: string;
    company_name?: string;
    account_type?: string;
  };
  resources?: {
    technicians?: OnboardingResource[];
    pricing?: OnboardingResource[];
    drivers?: OnboardingResource[];
    vehicles?: OnboardingResource[];
  };
};

export type ApprovedSpProjection = {
  byCompanyName: Map<string, { technicians: number }>;
  technicians: Array<{ id: string; name: string; phone: string; skill?: string; provider: string }>;
};

export type ApprovedFleetProjection = {
  byCompanyName: Map<string, { drivers: number; vehicles: number }>;
};

const normalize = (value: string | undefined | null) => String(value || "").trim().toLowerCase();

async function loadApprovedOnboardingDetails(accountType: "sp" | "fleet_manager"): Promise<OnboardingDetail[]> {
  const items = await listOnboardingQueue({ status: "approved", accountType });
  const approvedItems = items.filter((item: OnboardingItemDTO) => item.id);

  const details = await Promise.all(
    approvedItems.map(async (item) => {
      try {
        return (await getOnboardingDetail(item.id)) as OnboardingDetail;
      } catch {
        return null;
      }
    }),
  );

  return details.filter((detail): detail is OnboardingDetail => detail !== null);
}

export async function loadApprovedSpProjection(): Promise<ApprovedSpProjection> {
  const details = await loadApprovedOnboardingDetails("sp");
  const byCompanyName = new Map<string, { technicians: number }>();
  const technicians: ApprovedSpProjection["technicians"] = [];

  details.forEach((detail) => {
    const provider = String(detail.onboarding?.company_name || "").trim();
    const providerKey = normalize(provider);
    if (!providerKey) return;

    const items = Array.isArray(detail.resources?.technicians) ? detail.resources?.technicians : [];
    byCompanyName.set(providerKey, { technicians: items.length });

    items.forEach((item, index) => {
      technicians.push({
        id: String(item.id || `${providerKey}-tech-${index + 1}`),
        name: String(item.full_name || `Technicien ${index + 1}`),
        phone: String(item.phone || "N/A"),
        skill: item.skill == null ? undefined : String(item.skill),
        provider,
      });
    });
  });

  return { byCompanyName, technicians };
}

export async function loadApprovedFleetProjection(): Promise<ApprovedFleetProjection> {
  const details = await loadApprovedOnboardingDetails("fleet_manager");
  const byCompanyName = new Map<string, { drivers: number; vehicles: number }>();

  details.forEach((detail) => {
    const company = String(detail.onboarding?.company_name || "").trim();
    const companyKey = normalize(company);
    if (!companyKey) return;

    const drivers = Array.isArray(detail.resources?.drivers) ? detail.resources?.drivers.length : 0;
    const vehicles = Array.isArray(detail.resources?.vehicles) ? detail.resources?.vehicles.length : 0;
    byCompanyName.set(companyKey, { drivers, vehicles });
  });

  return { byCompanyName };
}
