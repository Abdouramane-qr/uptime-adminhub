# Cross-App Backend Compatibility Matrix

Date: 2026-03-09
Apps:
- Admin web: `uptime-adminhub`
- Client mobile: `uptime-repo`
- Provider mobile: `uptime_sp`

Supabase project target: `wlxgpvqfzrxzqaahwkmr`

## 1) Shared Core Data Contracts

### `service_requests`
- Used by admin web (dispatch/interventions/billing/audit/analytics/dashboard)
- Used by client mobile (`service_requests_repository_supabase`)
- Used by provider mobile (`job_repository_supabase`)

Critical fields observed cross-app:
- `id`
- `status`
- `service_type`
- `created_at`
- `assigned_provider_id`
- `assigned_provider` / `provider_name` (admin projections)
- `fleet_manager` / `client_name` / `client` (admin projections)
- `pickup_lat`, `pickup_lng`, `lat`, `lng`

### `provider_presence`
- Used by admin web (`Map`, `Dispatch`, `Technicians` compatibility)
- Used by provider mobile (`presence_repository_supabase`)
- Used by client map in `uptime-repo` (`request_map_screen`)

Critical fields:
- `provider_id`
- `lat`, `lng`
- `is_available`
- `display_name`
- `updated_at`

### `profiles`
- Used by all apps for identity/profile
- Admin gate compatibility depends on profile row existence

## 2) Function Contracts

### `admin-portal` (admin web)
- `/dashboard`
- `/tenants`
- `/accounts`
- `/service-requests`
- `/provider-presence`
- `/billing/invoices`
- `/technicians`
- `/audit-logs`
- `/tenants/:id/members`
- `/tenants/:id/owner-password`

### `onboarding-crud` (admin web)
- `/onboarding`
- `/onboarding/:id`
- `/onboarding/:id/approve|reject|submit`
- `/onboarding/:id/:resource`

## 3) Current Alignment Status

Aligned now:
- Admin pages migrated backend-first (including Providers/FleetManagers/Dashboard/Analytics)
- Admin client supports both `admin-portal` and `onboarding-crud`
- Strict QA guard extended to prevent static dataset regressions on backend-first pages

Still direct-table in mobiles (expected):
- `uptime-repo` and `uptime_sp` repositories query Supabase tables directly
- This is acceptable but requires schema stability discipline on shared tables

## 4) Risks to Watch

1. Status enum drift (`service_requests.status`) between admin and provider app transitions.
2. Provider ID naming drift (`assigned_provider_id` vs `assigned_provider` projections).
3. Missing `profiles` row on signup causing role/gate inconsistencies.

## 5) Recommended Next Hardening

1. Add SQL smoke checks for required columns across `service_requests` and `provider_presence`.
2. Add cross-app E2E scenario:
   - provider updates presence
   - admin sees map update
   - client sees tracking update
3. Keep strict staging mode:
   - `VITE_ALLOW_MOCK_FALLBACK=false`
