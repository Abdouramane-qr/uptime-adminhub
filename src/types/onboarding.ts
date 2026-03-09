export type OnboardingStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'submitted'
  | string;

export type AccountType = 'sp' | 'fleet_manager' | 'customer' | string;

export interface OnboardingQueueItem {
  id: string;
  company_name: string | null;
  account_type: AccountType | null;
  status: OnboardingStatus | null;
  code: string | null;
  contact_email: string | null;
  zone: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface OnboardingResources {
  technicians?: unknown[];
  pricing?: unknown[];
  vehicles?: unknown[];
  drivers?: unknown[];
  [key: string]: unknown;
}

export interface OnboardingDetailResponse {
  onboarding: Record<string, unknown> & {
    id?: string;
    company_name?: string | null;
    account_type?: AccountType | null;
    status?: OnboardingStatus | null;
    code?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    zone?: string | null;
    created_at?: string | null;
    submitted_at?: string | null;
    reviewed_at?: string | null;
    approved_at?: string | null;
    rejected_at?: string | null;
  };
  resources?: OnboardingResources;
  [key: string]: unknown;
}

export interface QueueFilters {
  status?: string;
  accountType?: string;
  q?: string;
}

export interface ApiEnvelope<T> {
  ok?: boolean;
  message?: string;
  error?: string;
  items?: T[];
  item?: T;
}
