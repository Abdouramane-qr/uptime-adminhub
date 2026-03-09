# Mapping Migration Backend - admin_uptime -> uptime-adminhub

Date: 2026-03-09
Source legacy: `/home/suprox/projects/new/garage/admin_uptime`
Target React: `/home/suprox/projects/new/garage/uptime-adminhub`

## 1) Contrats backend legacy identifiés

### Auth / Gate admin
- `GET /functions/v1/admin-portal/dashboard` (gate admin + counts)

### Accounts / Tenants
- `POST /functions/v1/admin-portal/accounts`
- `GET /functions/v1/admin-portal/tenants`
- `PATCH /functions/v1/admin-portal/tenants/:id`
- `DELETE /functions/v1/admin-portal/tenants/:id`
- `PATCH /functions/v1/admin-portal/tenants/:id/owner-password`
- `GET /functions/v1/admin-portal/tenants/:id/members`
- `POST /functions/v1/admin-portal/tenants/:id/members`

### Service Requests
- `POST /functions/v1/admin-portal/service-requests`
- `GET /functions/v1/admin-portal/service-requests`
- `PATCH /functions/v1/admin-portal/service-requests/:id/status`
- Realtime table: `public.service_requests`

### Provider Presence / Map
- `GET /functions/v1/admin-portal/provider-presence`
- Realtime table: `public.provider_presence`

### Onboarding
- `GET /functions/v1/onboarding-crud/onboarding`
- `GET /functions/v1/onboarding-crud/onboarding/:id`
- `POST /functions/v1/onboarding-crud/onboarding/:id/approve`
- `POST /functions/v1/onboarding-crud/onboarding/:id/reject`
- `POST /functions/v1/onboarding-crud/onboarding/:id/submit`
- `POST /functions/v1/onboarding-crud/onboarding/:id/:resource`

## 2) Etat de migration côté React

| Domaine | Legacy (admin_uptime) | Cible React | Etat | Priorité |
|---|---|---|---|---|
| Auth login/logout | Supabase auth + gate admin | `src/hooks/useAuth.tsx`, `src/pages/Login.tsx`, `AdminGuard` | Migré partiellement (gate présent) | P1 |
| Dashboard counts | `/admin-portal/dashboard` | `src/pages/Dashboard.tsx` | Non migré (UI majoritairement mock/statique) | P1 |
| Accounts CRUD | `/admin-portal/accounts`, `/tenants*` | `src/pages/Accounts.tsx` | Non migré (pas de couche API admin-portal) | P1 |
| Service requests CRUD | `/admin-portal/service-requests*` | `src/pages/Dispatch.tsx`, `src/pages/Interventions.tsx` | Non migré (données mock) | P1 |
| Realtime service_requests | table `service_requests` | `src/hooks/useRealtime.ts` | Partiellement migré (hook générique prêt) | P1 |
| Provider presence list/map | `/admin-portal/provider-presence` + realtime | `src/pages/Map.tsx`, `src/pages/Dispatch.tsx`, `src/data/mockProviders.ts` | Non migré (mockProviders) | P1 |
| Onboarding workflow | `/onboarding-crud/onboarding*` | `src/pages/sp/SpOnboarding.tsx` (et potentiellement admin) | Non migré (pas de client onboarding-crud) | P1 |
| Roles & admin control | `has_role`, `user_roles`, policies | `src/pages/AdminRoles.tsx`, `src/hooks/useRole.tsx` | Migré partiellement (base en place, alignements récents) | P1 |
| Profiles | `profiles` + RLS | `useAuth`, `Profile`, `AdminRoles` | Migré partiellement (correctifs `id` faits) | P1 |
| Billing/Technicians/Audit | dépend du backend métier | `Billing.tsx`, `Technicians.tsx`, `AuditLogs.tsx` | Non migré (mock local) | P2 |

## 3) Ecarts critiques (à traiter d'abord)

1. Absence de client API équivalent `callAdminPortal` côté React pour les endpoints `admin-portal`.
2. Pages métiers critiques encore mockées (`Dispatch`, `Map`, `Accounts`, `Billing`, `Technicians`, `AuditLogs`).
3. Onboarding non branché sur `onboarding-crud`.
4. Types Supabase localement potentiellement désynchronisés vs schéma réel (à régénérer après stabilisation SQL).

## 4) Plan d'exécution recommandé (ordre strict)

1. Créer une couche API `adminPortalClient` (fetch + gestion 401/403/5xx), réutilisable.
2. Brancher `Accounts` sur endpoints `tenants*`.
3. Brancher `Dispatch/Interventions` sur `service-requests*` + realtime `service_requests`.
4. Brancher `Map` sur `provider-presence` + realtime `provider_presence`.
5. Brancher `SpOnboarding` sur `onboarding-crud`.
6. Remplacer mocks P2 (`Billing`, `Technicians`, `AuditLogs`) via endpoints/tables réels.

## 5) Etat des lieux de référence pour ce document

- Correctifs déjà appliqués dans ce sprint:
  - Alignement `profiles` sur `id` dans `Profile` et `AdminRoles`
  - Ajout migration SQL des helpers manquants: `current_user_tenant_id()`, `is_admin()`
- Validation technique après correctifs:
  - `npm run lint` -> OK (warnings non bloquants)
  - `npm run test` -> 32/32
  - `npm run build` -> OK
