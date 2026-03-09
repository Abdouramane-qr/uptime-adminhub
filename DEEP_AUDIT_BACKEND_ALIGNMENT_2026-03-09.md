# Deep Audit - Backend Alignment (Admin Panel / Mobile Apps)

Date: 2026-03-09
Scope:
- `uptime-adminhub` (admin panel)
- compatibility with mobile apps `uptime-repo` and `uptime_sp` through shared backend contracts

## 1) Real Backend Endpoints Confirmed

Project Supabase: `wlxgpvqfzrxzqaahwkmr`

Functions available:
- `/functions/v1/admin-portal`
- `/functions/v1/admin-accounts`
- `/functions/v1/admin-accounts-v2`
- `/functions/v1/onboarding-crud`

Admin panel target endpoint family (normalized):
- `admin-portal/*` for dashboard/accounts/requests/providers
- `onboarding-crud/*` for onboarding workflows

## 2) Mock Cleanup Done (Admin Pages)

Pages now backend-first (with controlled fallback guard):
- `Accounts`
- `Dispatch`
- `Interventions`
- `Map`
- `Billing`
- `Technicians`
- `AuditLogs`
- `Providers` (switched from local static array to backend tenants + requests aggregation)
- `FleetManagers` (switched from local static array to backend tenants + requests aggregation)
- `Dashboard` (switched to backend counts + request trend)
- `Analytics` (switched to backend request analytics)

Observability:
- fallback hit telemetry added (`window.__adminhubFallbackHits`)
- strict backend QA script active

## 3) Admin Gate Hardening

Implemented:
- Primary admin gate via `rpc is_admin()`
- Compatibility fallback via `admin-portal/dashboard` gate

Reason:
- avoid lockout during mixed legacy/new role-model states (`user_roles` + `profiles.role`)

## 4) Automated Proof

Validated:
- unit + integration tests (backend wrappers + UI pages)
- lint
- strict backend static guard
- strict backend build
- dedicated CI gate for backend wiring

## 5) Remaining Work for Full Cross-App Completeness

Remaining mock/static logic still present outside core admin-migrated scope:
- `src/pages/sp/*` (SP portal pages still mostly UI-local datasets)

To fully align with `uptime-repo` and `uptime_sp`:
1. define shared contract matrix (`service_requests`, `provider_presence`, onboarding lifecycle)
2. remove SP-side static seed data and bind to same function contracts
3. add cross-app E2E contract checks against `admin-portal` + `onboarding-crud`

## 6) Recommendation

Run with strict mode in staging:
- `VITE_ALLOW_MOCK_FALLBACK=false`

Use this as release gate:
- `npm run qa:backend-link:full`

