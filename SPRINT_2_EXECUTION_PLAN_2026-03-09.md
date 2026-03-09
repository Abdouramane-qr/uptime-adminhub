# Sprint 2 - Hardening & Fallback Visibility

Date de démarrage: 2026-03-09
Statut: IN_PROGRESS

## Objectifs
1. Rendre explicite l'état backend/mock sur les pages migrées.
2. Réduire le risque d'illusion de données réelles en environnement non branché.
3. Préparer la suppression progressive des fallbacks.

## Tâches
- [x] Ajouter un composant réutilisable d'indicateur de source de données.
- [x] Intégrer l'indicateur sur Accounts, Dispatch, Interventions, Map, Billing, Technicians, AuditLogs.
- [x] Vérifier lint/test/build.
- [x] Mettre à jour le suivi sprint.

## Exécution
- Ajout composant: `src/components/DataSourceBadge.tsx`
- Intégrations: `Accounts`, `Dispatch`, `Interventions`, `Map`, `Billing`, `Technicians`, `AuditLogs`
- Validation:
  - `npm run lint` -> PASS
  - `npm run test` -> PASS (36/36)
  - `npm run build` -> PASS
- [x] Introduire un flag runtime `VITE_ALLOW_MOCK_FALLBACK` (default true) pour pilotage progressif du retrait des mocks.

## Etat des lieux intermédiaire
- Fallback mode visible dans l'UI (badge Backend/Mock fallback).
- Fallback désormais contrôlable par env var.
- En mode strict (`VITE_ALLOW_MOCK_FALLBACK=false`), les pages migrées n'injectent plus de mocks en initialisation/catch.
- Badge enrichi en 3 états: `Backend`, `Mock fallback`, `Backend strict`.
- [x] Ajouter checklist QA mode strict backend (`QA_STRICT_BACKEND_CHECKLIST.md`).
- [x] Ajouter script d'audit statique strict backend: `scripts/check_strict_backend_mode.sh`.
- [x] Ajouter script npm `qa:strict-backend` dans `package.json`.
- [x] Intégrer `qa:strict-backend` dans le workflow CI (`.github/workflows/ci.yml`).
- [x] Ajouter scripts npm strict backend: `build:strict-backend`, `qa:strict-backend:full`.
- [x] Ajouter `.env.example` documentant `VITE_ALLOW_MOCK_FALLBACK`.
- [x] Étendre CI avec étape `Strict backend build`.
- [x] Générer rapport intermédiaire Sprint 2: `SPRINT_2_INTERMEDIATE_REPORT_2026-03-09.md`.

## Next actions (Sprint 2)
- [x] Ajouter tests d'intégration UI pour pages métier branchées (Billing/Technicians/AuditLogs).
- [x] Ajouter observabilité fallback hits (dev/staging) via compteur global navigateur + trace console DEV.
- [ ] Préparer bascule recette stricte permanente.
- [x] Spécifier contrats backend dédiés: `BACKEND_CONTRACTS_SPRINT2_BILLING_TECH_AUDIT.md`.
- [x] Ajouter méthodes client dédiées (`listBillingInvoices`, `listTechnicians`, `listAuditLogs`) et basculer Billing/Technicians/AuditLogs avec fallback de compatibilité.
- [x] Étendre tests client pour wrappers endpoints dédiés.
- [x] Revalider `lint/test/build/qa:strict-backend:full` après bascule endpoints dédiés.
- [x] Retirer fallback legacy (`service-requests` / `provider-presence`) sur Billing/Technicians/AuditLogs.
- [x] Renforcer `scripts/check_strict_backend_mode.sh` pour détecter toute régression vers endpoints legacy sur ces pages dédiées.
- [x] Ajouter suite dédiée `test:backend-client` et l'exécuter en CI pour verrouiller la liaison endpoints -> Supabase Functions.
- [x] Renforcer tests client sur normalisation URL Supabase et headers HTTP (GET vs POST body) pour éviter les dérives d'appel backend.
- [x] Ajouter gate unifié `qa:backend-link:full` (tests backend-client + strict guard + strict build) et l'intégrer à la CI.
