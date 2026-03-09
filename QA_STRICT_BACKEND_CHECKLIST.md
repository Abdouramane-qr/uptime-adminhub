# QA Strict Backend Checklist

Date: 2026-03-09
Mode cible: données backend uniquement (pas de fallback mock)

## 1) Préparation
1. Configurer l'env:
```bash
VITE_ALLOW_MOCK_FALLBACK=false
```
2. Démarrer l'app:
```bash
npm run dev
```
3. Se connecter avec un compte admin valide.

## 2) Vérifications globales
- Le badge source de données affiche `Backend` ou `Backend strict` (jamais `Mock fallback`).
- Aucune page métier migrée ne montre de dataset fictif si backend indisponible.
- Les erreurs backend (401/403/5xx) sont visibles via UI (toast/empty/error state).

## 3) Parcours par page

### Accounts (`/accounts`)
- Chargement liste comptes via backend.
- Create account -> visible après refresh/reload.
- Edit account -> changement persistant.
- Delete account -> suppression persistante.

### Dispatch (`/dispatch`)
- Liste interventions chargée backend.
- Assignation provider -> statut passe à `assigned`.
- Avancement statut -> persistant après reload.
- Markers/providers cohérents avec `provider-presence` backend.

### Interventions (`/interventions`)
- Table chargée backend.
- Création intervention -> visible après refresh.
- Transition statut + annulation -> persistantes.

### Map (`/map`)
- Providers chargés backend.
- Filtres par statut cohérents.
- Clic marker -> panel mission/profil.

### Billing (`/billing`)
- Données dérivées de `service-requests` (pas de factures mock initiales).
- Totaux et exports cohérents avec les lignes affichées.

### Technicians (`/technicians`)
- Liste issue de `provider-presence`.
- Filtres de statut cohérents.

### Audit logs (`/audit-logs`)
- Logs projetés depuis `service-requests`.
- Filtre action + recherche fonctionnels.

## 4) Gates techniques (obligatoires)
```bash
npm run lint
npm run test
npm run build
```
Résultat attendu:
- lint: PASS
- test: PASS
- build: PASS

## 5) Critères de sortie
- 100% des pages migrées valident en mode strict backend.
- 0 dépendance nécessaire au fallback mock pour les parcours critiques.
- Aucun blocage P1 ouvert sur auth/RBAC/profiles/service_requests/provider_presence.

## 6) Contrôle automatique strict-mode (statique)
```bash
./scripts/check_strict_backend_mode.sh
```
Résultat attendu:
- `[strict-backend] PASS`
