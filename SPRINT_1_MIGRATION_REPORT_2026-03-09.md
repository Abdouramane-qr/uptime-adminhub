# Sprint 1 Report - Migration admin_uptime -> uptime-adminhub

Date: 2026-03-09
Périmètre: migration backend/logique métier vers frontend React structuré

## 1) Résultat global
- Sprint status: **DONE**
- Objectif principal atteint: brancher les domaines métier majeurs au backend `admin-portal` avec fallback contrôlé
- Stabilité technique validée
  - `npm run lint` -> **PASS (0 warning / 0 error)**
  - `npm run test` -> **PASS (36/36)**
  - `npm run build` -> **PASS**

## 2) Ce qui a été migré

### Fondations Auth/RBAC/Profiles
- Alignement `profiles` sur clé canonique `id` côté React.
- Ajout migration SQL helper manquante:
  - `current_user_tenant_id()`
  - `is_admin()`

### Backend client unifié
- Création de `src/lib/adminPortalClient.ts`:
  - call sécurisé (token/session + 401/403 handling)
  - méthodes métiers: tenants, service_requests, provider_presence

### Pages branchées backend (avec fallback local)
- Accounts
- Dispatch
- Interventions
- Map
- Billing (projection service_requests -> factures)
- Technicians (projection provider_presence -> techniciens)
- AuditLogs (projection service_requests -> logs)

### Qualité
- Ajout tests `adminPortalClient` (cas critiques API/session)
- Warning React hooks corrigé dans `AdminRoles`
- Warnings lint `react-refresh` neutralisés via override ciblé (`ui/*`, `hooks/*`)

## 3) Risques résiduels
1. Plusieurs pages utilisent encore des **projections** de données backend (billing/technicians/audit) en attente de contrats API dédiés.
2. Le fallback mock reste actif (utile pour robustesse dev), mais peut masquer une indisponibilité backend si non monitoré.
3. Bundle principal reste volumineux (>1MB), optimisation de lazy-loading à poursuivre.

## 4) Recommandations Sprint 2
1. Remplacer les projections par des endpoints backend dédiés (billing, technicians, audit logs).
2. Ajouter tests d’intégration UI (MSW + React Testing Library) pour `Accounts/Dispatch/Interventions/Map`.
3. Ajouter indicateurs explicites de mode fallback (badge "mock fallback active") en dev.
4. Renforcer typage API (DTO dédiés) et régénérer types Supabase après stabilisation SQL finale.

## 5) Conclusion
Le socle de migration est opérationnel: la logique legacy critique est désormais connectée au backend dans l’architecture React, avec un niveau de qualité stable et vérifié.
