# Alignment Regression Checklist

Date: 2026-03-10

Objectif:
- vérifier que `uptime-adminhub` reste aligné avec le workflow validé dans `admin_uptime`
- confirmer la compatibilité métier avec les apps mobiles
- éviter toute régression entre:
  - `admin-portal`
  - `onboarding-crud`
  - `provider_presence`
  - `service_requests`

Mode cible:
- backend réel uniquement
- aucun fallback mock pour les parcours critiques

## 1) Préparation

1. Configurer le front en backend strict:
```bash
VITE_ALLOW_MOCK_FALLBACK=false
```

2. Démarrer `uptime-adminhub`:
```bash
npm run dev
```

3. Vérifier les fonctions Edge déployées:
- `admin-portal`
- `onboarding-crud`

4. Vérifier qu'un compte admin valide existe.

5. Préparer les preuves:
- captures écran
- réponses réseau
- sorties SQL si nécessaire

## 2) Vérifications globales

- Aucun écran critique n'utilise de dataset statique à la place du backend.
- Les actions d'approbation/rejet ne sont pas exécutées depuis `Accounts`.
- Les validations métier passent par `Onboarding`.
- Les pages admin ne montrent pas de données fictives dans les onglets détail.
- Les pages backend-first survivent à un refresh sans perte d'état.
- Les erreurs backend sont visibles et compréhensibles.

## 3) Matrice d'alignement

| Domaine | Legacy attendu (`admin_uptime`) | AdminHub attendu | Source de vérité |
| --- | --- | --- | --- |
| Comptes | CRUD tenant + membres | CRUD tenant + membres | `admin-portal` |
| Approbation SP/Fleet | `onboarding-crud/approve` | `Onboarding` uniquement | `onboarding-crud` |
| Rejet SP/Fleet | `onboarding-crud/reject` | `Onboarding` uniquement | `onboarding-crud` |
| Création compte | crée tenant + owner + onboarding | même logique | `admin-portal` |
| Techniciens SP | ajoutés via onboarding | visibles depuis backend réel | `sp_technicians` |
| Drivers Fleet | ajoutés via onboarding | visibles depuis backend réel | `fleet_drivers` |
| Présence carte SP | créée après approval | visible carte/admin | `provider_presence` |
| Tracking mission | mobile / mission live | visible dans admin | `provider_locations` |
| Login mobile après approval | doit fonctionner | doit rester fonctionnel | Supabase Auth + profile/tenant |

## 4) Parcours critiques

### A. Admin Login

- Se connecter avec un compte admin.
- Vérifier accès:
  - `/dashboard`
  - `/accounts`
  - `/onboarding`
- Résultat attendu:
  - aucune erreur `Invalid JWT`
  - aucune erreur `admin_required`

### B. Accounts Tenant CRUD

Route: `/accounts`

- Lister les tenants.
- Créer une compagnie SP.
- Créer une compagnie Fleet.
- Éditer email/téléphone/nom.
- Supprimer un tenant de test.
- Vérifier persistance après refresh.

Résultat attendu:
- les changements passent par `admin-portal`
- les lignes reviennent après refresh
- aucun approve/reject métier n'est exécuté ici

### C. Team Members

Route: `/accounts`

- Ouvrir un tenant existant.
- Lire les membres.
- Ajouter un membre.
- Vérifier persistance après refresh.

Résultat attendu:
- backend réel
- pas de placeholder statique pour les membres

### D. SP Onboarding Workflow

Route: `/onboarding`

1. Créer un compte SP depuis `Accounts`.
2. Vérifier qu'un onboarding existe.
3. Compléter les ressources SP:
   - techniciens
   - pricing/services
4. Soumettre le dossier.
5. Vérifier statut `pending_review`.
6. Approuver depuis `Onboarding`.
7. Vérifier statut `approved`.
8. Vérifier création ou mise à jour de `provider_presence`.

Résultat attendu:
- le workflow d'approbation ne passe jamais par `Accounts`
- l'approval crée la présence provider si SP
- le compte SP peut se connecter côté mobile après approval

### E. Fleet Onboarding Workflow

Route: `/onboarding`

1. Créer un compte Fleet depuis `Accounts`.
2. Vérifier qu'un onboarding existe.
3. Compléter les ressources Fleet:
   - drivers
   - vehicles
4. Soumettre le dossier.
5. Vérifier statut `pending_review`.
6. Approuver depuis `Onboarding`.

Résultat attendu:
- le dossier transite correctement jusqu'à `approved`
- le compte Fleet peut se connecter côté mobile après approval

### F. Dashboard

Route: `/dashboard`

- Charger les KPI.
- Vérifier cohérence avec backend.
- Refresh de page.

Résultat attendu:
- `200` backend
- chiffres cohérents avec `provider_presence`, `service_requests`, `profiles`, `notifications`

### G. Map

Route: `/map`

- Vérifier que les providers affichés viennent de `provider_presence`.
- Vérifier filtres et panneau détail.
- Vérifier cohérence après approval SP.

Résultat attendu:
- un provider approuvé avec présence active devient visible
- pas de position fictive injectée par le front

### H. Technicians

Route: `/technicians`

- Vérifier que la liste vient du backend.
- Vérifier le statut calculé:
  - `online`
  - `offline`
  - `on_job`
- Vérifier que la localisation affichée est cohérente avec la source réelle.

Résultat attendu:
- pas de liste statique
- aucune confusion entre position provider et position technicien individuel

### I. Dispatch / Interventions

Routes:
- `/dispatch`
- `/interventions`

- Vérifier liste interventions.
- Vérifier assignation provider.
- Vérifier transitions de statut.
- Vérifier persistance après refresh.
- Vérifier cohérence entre:
  - `service_requests`
  - `provider_presence`
  - tracking mission

Résultat attendu:
- pas de technicien mock obligatoire pour compléter un flow réel
- le backend reste la source de vérité

## 5) Contrôles SQL recommandés

### Tenant / owner créés

```sql
select t.id, t.name, t.code, t.type, p.id as owner_id, p.role, p.tenant_id
from public.tenants t
left join public.profiles p on p.tenant_id = t.id and p.role = 'owner'
order by t.created_at desc
limit 20;
```

### Onboarding workflow

```sql
select id, user_id, tenant_id, account_type, status, submitted_at, approved_at, approved_by
from public.account_onboarding
order by updated_at desc
limit 20;
```

### SP technicians

```sql
select onboarding_id, count(*) as technicians
from public.sp_technicians
group by onboarding_id
order by technicians desc;
```

### Fleet drivers

```sql
select onboarding_id, count(*) as drivers
from public.fleet_drivers
group by onboarding_id
order by drivers desc;
```

### Fleet vehicles

```sql
select onboarding_id, count(*) as vehicles
from public.fleet_vehicles
group by onboarding_id
order by vehicles desc;
```

### Provider presence

```sql
select provider_id, display_name, lat, lng, is_available, updated_at
from public.provider_presence
order by updated_at desc
limit 20;
```

## 6) Critères de sortie

- `Accounts` ne fait plus d'approbation métier directe.
- `Onboarding` reste l'unique point d'approbation/rejet.
- Les parcours SP et Fleet passent de bout en bout.
- Les comptes approuvés peuvent se connecter côté mobile.
- La carte admin reflète `provider_presence` réel.
- Les pages critiques survivent à un refresh sans perte d'état.
- Aucune donnée placeholder ne prétend être une donnée métier réelle.

## 7) Gates techniques

```bash
npm run qa:strict-backend
npm run lint
npm test
npm run build:strict-backend
```

Résultat attendu:
- `qa:strict-backend`: PASS
- `lint`: PASS ou warnings connus seulement
- `test`: PASS
- `build:strict-backend`: PASS

## 8) Écarts à ouvrir immédiatement si détectés

- `Accounts` approuve ou rejette encore un dossier directement.
- Un compte approuvé ne peut pas se connecter côté mobile.
- `provider_presence` n'est pas matérialisé après approval SP.
- Une page critique affiche un placeholder statique à la place du backend.
- Les techniciens affichent une fausse relation ou une fausse localisation.
- `Dispatch` ou `Interventions` dépend encore d'une liste mock pour finir le flux.

## 9) Verdict

Cocher un seul statut:

- [ ] Fully aligned
- [ ] Partially aligned, safe for controlled rollout
- [ ] Not aligned, business workflow gaps remain
