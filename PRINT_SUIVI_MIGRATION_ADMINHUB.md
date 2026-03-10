# Print de Suivi Migration AdminHub

Date de reference: 2026-03-09
Scope: migration `admin_uptime` -> `uptime-adminhub`
Statut global: IN_PROGRESS
Suppression de `admin_uptime`: NOT_READY

## Objectif

Faire de `uptime-adminhub` la seule interface admin de production, branchee sur les memes fonctions Supabase et la meme logique metier que `admin_uptime`, puis supprimer `admin_uptime` sans regression fonctionnelle, auth, backend ou QA.

## Regle de sortie

`admin_uptime` ne peut etre supprime que si les 5 conditions suivantes sont vraies:

- `uptime-adminhub` couvre tous les ecrans critiques admin sans fallback mock actif.
- Tous les endpoints utilises par `uptime-adminhub` existent reellement cote backend.
- Les mutations critiques sont persistantes et verifiables en base.
- Les scripts QA/gates/runbooks ne dependent plus de `admin_uptime`.
- Les scenarios E2E croises adminhub <-> mobiles <-> backend sont valides.

## Etat actuel

### Ce qui est deja migre

- Auth admin React avec verification `is_admin()` + fallback `GET /functions/v1/admin-portal/dashboard`
- Client API commun `adminPortalClient`
- Build strict sans fallback mock: OK
- Tests frontend `uptime-adminhub`: OK
- Pages branchees sur backend au moins en lecture:
  - Dashboard
  - Accounts
  - Interventions
  - Dispatch
  - Map
  - Providers
  - FleetManagers
  - Billing
  - Technicians
  - AuditLogs
  - Onboarding client API disponible

### Ce qui bloque encore la bascule finale

- Contrat `service-requests` incomplet entre front React et `admin-portal`
- Assignation dispatch non persistante cote backend
- Creation de request admin non rattachee au vrai client metier
- Plusieurs pages gardent un fallback local ou un etat optimiste non fiable
- `billing`, `technicians`, `audit-logs` sont appeles par React mais non exposes dans `admin-portal`
- Validation E2E croisee finale encore ouverte avant suppression du legacy

## Tableau de pilotage

| Lot | Sujet | Statut | Priorite | Blocage de suppression |
|---|---|---|---|---|
| L1 | Auth admin React alignee backend | DONE | P0 | Oui |
| L2 | Client API `admin-portal` / `onboarding-crud` | DONE | P0 | Oui |
| L3 | Dashboard branche backend | PARTIAL | P1 | Non |
| L4 | Accounts CRUD branche backend sans fallback operationnel | IN_REVIEW | P0 | Oui |
| L5 | Dispatch / Interventions alignes au contrat backend | PARTIAL | P0 | Oui |
| L6 | Map / provider presence sans mock runtime | PARTIAL | P1 | Oui |
| L7 | Billing / Technicians / AuditLogs exposes par backend reel | IN_REVIEW | P1 | Oui |
| L8 | Onboarding admin workflow React complet | PARTIAL | P1 | Oui |
| L9 | Scripts QA / runbooks / gates migres | DONE | P0 | Oui |
| L10 | Validation E2E croisee avec mobiles | TODO | P0 | Oui |
| L11 | Retrait final de `admin_uptime` | TODO | P0 | Oui |

## Ecarts critiques confirmes

### E1 - Assignation dispatch non persistante

- Front React envoie `assigned_provider` sur `PATCH /admin-portal/service-requests/:id/status`
- Backend `admin-portal` n'update aujourd'hui que `status`
- Impact:
  - assignation visible localement mais pas fiable en base
  - incoherence adminhub <-> mobile provider <-> admin map

### E2 - Creation admin de request non conforme metier

- Front React envoie des champs hors contrat backend (`location`, `provider_name`, `fleet_manager`)
- Backend cree la request avec `user_id = caller.id`
- Impact:
  - le job appartient a l'admin createur
  - notifications et lecture client partent vers le mauvais utilisateur

### E3 - Endpoints front absents cote backend

- `GET /admin-portal/billing/invoices`
- `GET /admin-portal/technicians`
- `GET /admin-portal/audit-logs`
- Impact:
  - ces pages ne peuvent pas etre considerees migrees en backend strict

### E4 - Fallback/mock encore presents

- Pages concernees:
  - `Accounts`
  - `Interventions`
  - `Dispatch`
  - `Map`
  - `Billing`
  - `Technicians`
  - `AuditLogs`
- Impact:
  - mode demo possible
  - pas acceptable comme seul admin panel avant suppression du legacy

### E5 - Tooling encore dependant de `admin_uptime`

- La dependance active des scripts/gates/runbooks a `admin_uptime` est retiree
- Les references restantes a `admin_uptime` sont historiques ou documentaires, pas bloquantes pour l'outillage courant
- Impact:
  - la suppression reste toutefois bloquee tant que la validation E2E finale n'est pas cloturee

## Plan d'execution recommande

### Phase 1 - Fermer le contrat metier backend

Statut: IN_REVIEW

- [x] Ajouter support de l'assignation provider dans `PATCH /service-requests/:id/status`
- [x] Introduire un vrai `customer_user_id` ou equivalent dans la creation admin de request
- [x] Normaliser le payload React `Interventions` / `Dispatch` sur le contrat backend reel
- [ ] Verifier les impacts notifications / ownership / lecture mobile client

### Phase 2 - Supprimer les faux succes frontend

Statut: IN_REVIEW

- [x] Retirer les updates locales qui masquent un echec backend
- [x] N'afficher le succes UI qu'apres confirmation serveur
- [ ] Ajouter etats de chargement / erreur / retry sur mutations critiques

### Phase 3 - Completer les domaines backend manquants

Statut: IN_REVIEW

- [x] Implementer ou desactiver proprement `billing/invoices`
- [x] Implementer ou desactiver proprement `technicians`
- [x] Implementer ou desactiver proprement `audit-logs`
- [ ] Brancher l'onboarding admin React complet sur `onboarding-crud`

### Phase 4 - Passer en mode strict

Statut: IN_REVIEW

- [x] Executer `npm run qa:strict-backend:full`
- [x] Confirmer zero fallback runtime sur les pages critiques
- [x] Verifier les DataSourceBadge en backend strict
- [ ] Capturer evidence QA de chaque route critique

### Phase 5 - Migrer l'outillage

Statut: DONE

- [x] Remplacer references `admin_uptime` dans scripts/gates
- [x] Remplacer references `admin_uptime` dans docs/runbooks
- [x] Ajouter gate unique `uptime-adminhub`
- [x] Deprecier officiellement `admin_uptime`

### Phase 6 - Validation finale et suppression

Statut: TODO

- [ ] Login admin
- [ ] Dashboard counts
- [ ] Accounts CRUD
- [ ] Team members
- [ ] Service requests create / assign / status / cancel / complete
- [ ] Map providers live
- [ ] Onboarding approve / reject / submit
- [ ] Cross-app validation avec `uptime-repo`
- [ ] Cross-app validation avec `uptime_sp`
- [ ] Suppression de `admin_uptime`

## Commandes de verification

Depuis `uptime-adminhub/`:

```bash
npm test
npm run build:strict-backend
npm run qa:strict-backend:full
```

Depuis `uptime-repo/`:

```bash
./scripts/run_rls_tests.sh
./scripts/validate_admin_portal_auth.sh
./scripts/test_admin_rate_limit.sh
```

Depuis les apps Flutter:

```bash
cd /workspaces/uptime-repo && flutter analyze && flutter test
cd /workspaces/uptime_sp && flutter analyze && flutter test
```

## References utiles

- `SPRINT_MIGRATION_ADMIN_UPTIME_TO_ADMINHUB.md`
- `MIGRATION_BACKEND_MAPPING_ADMIN_UPTIME_TO_ADMINHUB.md`
- `QA_MIGRATION_PLAN_ADMINHUB.md`
- `DEEP_AUDIT_BACKEND_ALIGNMENT_2026-03-09.md`
- `MOBILE_CROSS_APP_COMM_AUDIT_2026-03-09.md`

## Journal court

- 2026-03-09: auth React admin validee, client API commun present, tests et build strict OK.
- 2026-03-09: ecarts critiques confirmes sur `service-requests`, endpoints manquants et fallback runtime.
- 2026-03-09: suppression de `admin_uptime` re-classee `NOT_READY`.
- 2026-03-09: phase 1 service_requests implemente cote code: `admin-portal` accepte `customer_tenant_id` / `customer_user_id` et `assigned_provider_id`; `Dispatch` et `Interventions` envoient des IDs metier reels.
- 2026-03-09: phase 2 frontend engagee: `Accounts`, `Providers`, `FleetManagers`, `Dispatch`, `Interventions` n'affichent plus de succes avant confirmation backend; ajout de `DELETE /admin-portal/service-requests/:id`.
- 2026-03-09: phase 3 backend engagee: `billing/invoices`, `technicians` et `audit-logs` exposes dans `admin-portal`; `Billing`, `Technicians` et `AuditLogs` traitent maintenant un backend vide comme une vraie source backend sans re-afficher les mocks.
- 2026-03-09: phase 4 strict validee statiquement: `npm run qa:strict-backend`, `npm run lint`, `npm test` et `npm run build:strict-backend` passent; les warnings strict-mode sur `Billing`, `Technicians`, `AuditLogs` ont ete supprimes.
- 2026-03-09: evidence runtime route-par-route encore a capturer manuellement en UI pour cloturer completement la phase 4.
- 2026-03-09: phase 5 outillage engagee: `series_a_gate.sh` pointe maintenant vers `uptime-adminhub`; nouveaux scripts `check_secrets.sh`, `run_production_gate.sh`, `wf008_*`, `sprint_gate_dashboard.sh`, `run_p1_05_gate.sh` portes dans `uptime-adminhub/scripts`.
- 2026-03-09: validation outillage OK sur `uptime-adminhub/scripts/run_production_gate.sh` et `uptime-repo/scripts/tkt063_check_status_alignment.sh`; deprecation officielle de `admin_uptime` encore en attente.
- 2026-03-09: deprecation officielle de `admin_uptime` publiee via `admin_uptime/DEPRECATED.md` et bandeau explicite dans `admin_uptime/README.md`; phase 5 reclassee DONE.
