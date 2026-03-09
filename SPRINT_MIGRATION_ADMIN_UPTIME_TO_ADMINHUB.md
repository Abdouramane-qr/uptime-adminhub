# Sprint Migration - admin_uptime -> uptime-adminhub

Date de démarrage: 2026-03-09
Statut: IN_PROGRESS

## Objectif sprint
Migrer la logique backend + métier de `admin_uptime` vers `uptime-adminhub` sans régression, en remplaçant progressivement les mocks par des flux Supabase réels.

## Etat des lieux initial (snapshot)
- Front React structuré + routes + guards: OK
- CI/lint/test/build: OK (warnings lint non bloquants)
- Migrations Supabase locales: présentes, mais nombreuses placeholders legacy
- Risque critique identifié: incohérence de clé `profiles` (`id` vs `user_id`) entre SQL et code React
- Plusieurs pages encore sur données mockées (Dispatch/Map/Billing/Technicians/AuditLogs)

## Backlog sprint

### Lot 1 - Fondations auth/RBAC/profiles (P1)
- [x] Aligner usage `profiles` sur clé canonique
- [x] Vérifier cohérence `useAuth`, `Profile`, `AdminRoles`, types Supabase
- [x] Vérifier policies RLS liées aux profils/roles
- [x] Tests + build après correctifs

### Lot 2 - Contrats backend legacy -> React (P1)
- [x] Cartographier endpoints legacy (`admin-portal`, `onboarding-crud`)
- [x] Créer matrice de mapping page React -> endpoint -> statut
- [x] Prioriser migration par risque métier

### Lot 3 - Dé-mock progressif (P1/P2)
- [x] Dispatch + service_requests (lecture + update statut/assignation, fallback local)
- [x] Interventions + service_requests (lecture + create + update statut/annulation, fallback local)
- [x] Map + provider_presence (lecture backend + fallback local)
- [x] Billing (projection backend service-requests + fallback local)
- [x] Technicians (projection provider-presence + fallback local)
- [x] Audit logs (projection service-requests + fallback local)
- [x] Accounts: branchement initial API `admin-portal` + fallback local

### Lot 4 - Qualité & clôture (P1)
- [x] Ajouter tests d'intégration API (client admin-portal)
- [x] Réduire warnings lint restants
- [x] Rapport de fin de sprint (risques résiduels + next sprint)

## Journal d'exécution
- 2026-03-09: Sprint créé et Lot 1 démarré.
- 2026-03-09: Correctif appliqué sur `Profile` et `AdminRoles` pour aligner les filtres `profiles` sur `id`.
- 2026-03-09: Validation post-correctif exécutée (`lint`, `test`, `build`) -> OK (warnings lint non bloquants inchangés).
- 2026-03-09: Ajout migration corrective `20260309020000_add_missing_auth_helper_functions.sql` pour `current_user_tenant_id()` et `is_admin()` référencées par les policies.
- 2026-03-09: Revalidation complète post-RLS (`lint`, `test`, `build`) -> OK.
- 2026-03-09: Lot 2 terminé, matrice backend legacy -> React créée (`MIGRATION_BACKEND_MAPPING_ADMIN_UPTIME_TO_ADMINHUB.md`) avec priorisation P1/P2.
- 2026-03-09: Création `src/lib/adminPortalClient.ts` (client commun `callAdminPortal` + opérations tenants).
- 2026-03-09: `src/pages/Accounts.tsx` branché sur `GET /tenants` + `POST /accounts` + `PATCH /tenants/:id` + `DELETE /tenants/:id` avec fallback dataset local si API indisponible.
- 2026-03-09: Revalidation post-intégration (`lint`, `test`, `build`) -> OK.
- 2026-03-09: `Dispatch.tsx` branché sur `GET /service-requests` + `PATCH /service-requests/:id/status` (assignation et avancement), avec mapping tolérant des payloads backend et fallback local.
- 2026-03-09: `adminPortalClient.ts` enrichi avec méthodes `listServiceRequests` / `updateServiceRequestStatus`.
- 2026-03-09: `Interventions.tsx` branché sur `GET /service-requests` + `POST /service-requests` + `PATCH /service-requests/:id/status`, avec mapping tolérant et fallback local.
- 2026-03-09: `adminPortalClient.ts` enrichi avec méthode `createServiceRequest`.
- 2026-03-09: `Map.tsx` branché sur `GET /provider-presence` (normalisation statuts + fallback mock).
- 2026-03-09: `Dispatch.tsx` aligné sur `provider-presence` pour markers + assignation providers.
- 2026-03-09: `adminPortalClient.ts` enrichi avec méthode `listProviderPresence`.
- 2026-03-09: `Billing.tsx` alimenté depuis `service-requests` (factures dérivées) avec fallback mock.
- 2026-03-09: `Technicians.tsx` alimenté depuis `provider-presence` (projection techniciens) avec fallback mock.
- 2026-03-09: `AuditLogs.tsx` alimenté depuis `service-requests` (projection logs) avec fallback mock.
- 2026-03-09: Revalidation post-P2 (`lint`, `test`, `build`) -> OK.
- 2026-03-09: Ajout `src/lib/adminPortalClient.test.ts` (session absente, 403, succès, parsing wrappers listes).
- 2026-03-09: Revalidation post-qualité (`lint`, `test`, `build`) -> OK, tests portés à 36.
- 2026-03-09: Warnings lint ramenés à 0 (override ciblé + correction hooks deps `AdminRoles`).
- 2026-03-09: Rapport de fin de sprint généré: `SPRINT_1_MIGRATION_REPORT_2026-03-09.md`.
