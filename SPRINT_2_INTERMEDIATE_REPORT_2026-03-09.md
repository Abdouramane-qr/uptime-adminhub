# Sprint 2 Intermediate Report - Hardening Strict Backend

Date: 2026-03-09
Statut: IN_PROGRESS

## 1) Objectif Sprint 2
Passer d'une migration fonctionnelle avec fallback mock vers une exécution contrôlée en mode strict backend, sécurisée par garde-fous QA/CI.

## 2) Accomplissements

### Visibilité runtime
- Badge source de données en 3 états déployé:
  - `Backend`
  - `Mock fallback`
  - `Backend strict`
- Pages couvertes:
  - Accounts
  - Dispatch
  - Interventions
  - Map
  - Billing
  - Technicians
  - AuditLogs

### Contrôle fallback
- Flag runtime introduit:
  - `VITE_ALLOW_MOCK_FALLBACK` (default `true`)
- En mode `false`, les pages migrées n'injectent plus de datasets mock en initialisation/catch.

### Industrialisation QA
- Script statique: `scripts/check_strict_backend_mode.sh`
- Commandes npm:
  - `qa:strict-backend`
  - `build:strict-backend`
  - `qa:strict-backend:full`
- Checklist dédiée:
  - `QA_STRICT_BACKEND_CHECKLIST.md`

### CI
- Gate strict backend ajouté au workflow:
  - `Strict backend guard`
  - `Strict backend build`

### Qualité
- `lint`: PASS
- `test`: PASS (36/36)
- `build`: PASS
- `qa:strict-backend:full`: PASS

## 3) Gaps restants (priorisés)

### P1 - Contrats backend explicites
- Billing/Technicians/AuditLogs reposent encore sur des projections depuis `service-requests`/`provider-presence`.
- Action: introduire endpoints dédiés backend (ou vues SQL/RPC dédiées) pour ces domaines.

### P1 - Tests d'intégration UI
- Les tests actuels couvrent surtout hooks/guards/client API.
- Action: ajouter tests UI intégration pour pages métier branchées (Accounts, Dispatch, Interventions, Map).

### P2 - Observabilité fallback
- Le badge rend l'état visible, mais pas d'alerte agrégée.
- Action: ajouter un compteur global/telemetry “fallback hits” en dev/staging.

### P2 - Performance bundle
- Bundle principal encore volumineux (>1MB).
- Action: lazy-loading supplémentaire pour modules lourds (maps/charts/html2canvas).

## 4) Plan de retrait final des fallbacks
1. Activer `VITE_ALLOW_MOCK_FALLBACK=false` en recette.
2. Exécuter checklist `QA_STRICT_BACKEND_CHECKLIST.md`.
3. Corriger les écarts backend manquants page par page.
4. Basculer staging en strict mode permanent.
5. Garder fallback uniquement en dev local (si souhaité).

## 5) Conclusion intermédiaire
Le socle strict backend est en place et outillé. La prochaine valeur la plus forte est la suppression des projections ad hoc via des contrats backend dédiés, puis l'extension des tests d'intégration UI.
