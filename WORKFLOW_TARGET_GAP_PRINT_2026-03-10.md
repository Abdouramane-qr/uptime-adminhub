# Workflow Target Gap Print

Date: 2026-03-10

Scope:
- `admin_uptime` legacy workflow
- `uptime-adminhub`
- `uptime_sp`
- `uptime-repo`

Decision MVP liee:
- `Option 2` retenue pour le MVP: ne pas transformer `uptime-repo` en app Fleet maintenant
- `Option 1` materialisee pour plus tard dans [FLEET_APP_MVP_DECISION_2026-03-10.md](/home/suprox/projects/new/garage/uptime-repo/docs/FLEET_APP_MVP_DECISION_2026-03-10.md)

## 1. Workflow cible retenu

### Acteurs connectes

- `Admin Web`: comptes admin uniquement
- `Service Provider app`: compte entreprise prestataire
- `Fleet Manager app`: compte entreprise flotte

### Ressources metier non connectees par defaut

- `sp_technicians`: ressources terrain du prestataire
- `fleet_drivers`: ressources flotte
- `fleet_vehicles`: ressources flotte
- `sp_service_pricing`: catalogue / tarification

### Chaine metier d'une mission

`Fleet Manager` -> `Fleet Rescue platform` -> `Service Provider` -> `Technicien`

Conclusion:
- l'assignation plateforme se fait vers le `Service Provider`
- le `Technicien` est un executant interne au prestataire
- un technicien n'est pas, par defaut, un compte de connexion

## 2. Baseline legacy

Le legacy documente et implemente:

- creation d'un compte entreprise avec identifiants de connexion
- separation entre:
  - compte principal `owner`
  - membres d'equipe `member`
  - ressources onboarding (`technicians`, `drivers`, `vehicles`, `pricing`)
- approbation admin uniquement via `onboarding-crud`
- login mobile attendu apres approbation du dossier

References:
- [FLEET_RESCUE_WORKFLOW.md](/home/suprox/projects/new/garage/admin_uptime/FLEET_RESCUE_WORKFLOW.md)
- [E2E_BUSINESS_SIGNOFF.md](/home/suprox/projects/new/garage/admin_uptime/E2E_BUSINESS_SIGNOFF.md)
- [accounts.page.js](/home/suprox/projects/new/garage/admin_uptime/js/accounts.page.js)
- [onboarding.page.js](/home/suprox/projects/new/garage/admin_uptime/js/onboarding.page.js)

## 3. Comparaison cible vs code actuel

| Sujet | Cible workflow | Etat actuel | Ecart |
| --- | --- | --- | --- |
| Creation SP/Fleet | cree un compte entreprise principal + onboarding | `admin-portal` cree `tenant + owner + profile + onboarding` | OK |
| Login mobile SP | possible apres approval du dossier | `uptime_sp` n'exigeait pas approval | ECART critique |
| Technicien SP | ressource metier | `sp_technicians` est une ressource onboarding | OK |
| Member d'equipe SP | acces secondaire optionnel | `tenants/:id/members` cree un vrai compte `member` | OK |
| Assignation mission | assignee au `Service Provider` | `service_requests.assigned_provider_id` aligne | OK |
| Technicien sur mission | gerance interne provider | plusieurs vues admin affichent encore un technicien fictif ou derive | ECART fonctionnel |
| Login Fleet | compte entreprise Fleet dedie | pas d'app Fleet dediee identifiee dans le workspace | ECART architecture |
| Driver Fleet | ressource metier par defaut | `fleet_drivers` est une ressource onboarding | OK |
| Approval admin | seulement via `Onboarding` | mitigation en place, `Accounts` redirige vers `/onboarding` | OK partiel |
| Presence carte SP | materialisee apres approval | `onboarding-crud` upsert `provider_presence` a l'approval | OK |

## 4. Detail des ecarts a traiter

### E1. App prestataire ouverte avant approval

Constat:
- `uptime_sp` verifie le type `sp` et le code entreprise
- mais ne bloquait pas un owner SP tant que son onboarding n'etait pas `approved`

Impact:
- un garage pouvait entrer dans l'app avant validation admin
- le workflow "validation admin puis acces mobile" n'etait pas respecte

Correction appliquee:
- [app_auth_guard_service.dart](/home/suprox/projects/new/garage/uptime_sp/lib/core/services/app_auth_guard_service.dart)
- l'app refuse maintenant l'acces si le dossier du compte courant existe et n'est pas `approved`

Limite:
- ce correctif couvre le compte porteur du dossier (`owner`)
- les comptes `member` restent possibles si tu choisis de les autoriser plus tard

### E2. Confusion provider / technicien dans certaines vues admin

Constat:
- le workflow metier assigne au prestataire, pas au technicien
- plusieurs ecrans admin gardent encore des champs ou placeholders de technicien

Exemples:
- [Interventions.tsx](/home/suprox/projects/new/garage/uptime-adminhub/src/pages/Interventions.tsx)
- [Technicians.tsx](/home/suprox/projects/new/garage/uptime-adminhub/src/pages/Technicians.tsx)

Impact:
- risque de faire croire que la plateforme connait un technicien live canonique
- alors que la source reelle principale reste `assigned_provider_id` + `provider_presence`

Traitement recommande:
- ne jamais rendre un technicien obligatoire pour un flow backend reel
- afficher explicitement que l'affectation technicien est interne au prestataire si non branchee

### E3. Fleet mobile app non explicite dans le workspace

Constat:
- `uptime_sp` couvre le provider app
- `uptime-repo` est l'app client actuelle, pas une app Fleet dediee
- son auth guard refuse explicitement les comptes `fleet_manager`
- ses ecrans restent centres sur un utilisateur client:
  - signup libre
  - selection de service
  - gestion de vehicules personnels
  - demande d'assistance au nom du compte connecte

Impact:
- le workflow cible "Fleet Manager app" n'est pas encore aligne avec l'architecture de repo observable
- aucun correctif local simple ne permet de transformer `uptime-repo` en app Fleet sans redefinir:
  - auth
  - onboarding
  - ecrans de gestion flotte
  - mode de creation des demandes

Traitement recommande:
- decider si `uptime-repo` devient l'app Fleet
- ou creer un client Fleet dedie
- tant que cette decision n'est pas prise, ne pas forcer un patch auth Fleet dans `uptime-repo`

Decision actuelle:
- pour le MVP, retenir `Option 2`
- garder `uptime-repo` en app client
- reporter la materialisation Fleet a un chantier dedie documente dans [FLEET_APP_MVP_DECISION_2026-03-10.md](/home/suprox/projects/new/garage/uptime-repo/docs/FLEET_APP_MVP_DECISION_2026-03-10.md)

### E4. Driver Fleet encore ambigu comme acteur connecte

Constat:
- ton workflow dit "un driver ou fleet manager cree une demande"
- mais le modele actuel traite `fleet_drivers` comme ressource metier, pas comme compte auth

Decision produit encore necessaire:
- `driver` reste une ressource selectionnee par le Fleet Manager
- ou `driver` devient un vrai utilisateur secondaire avec compte

Tant que cette decision n'est pas prise:
- ne pas deduire automatiquement qu'un `fleet_driver` doit pouvoir se connecter

## 5. Correctifs faisables immediatement

### Fait

- blocage du login SP avant approval du dossier owner
- blocage du login SP aux seuls comptes `owner`
- **Clarification UI (AdminHub)** : Ajout d'une "Scope Note" en header des pages critiques (Techniciens, Interventions, Onboarding, Dispatch, Providers, FleetManagers) pour expliquer la source de vérité et la limite de responsabilité Admin.
- **Nettoyage Libelles (AdminHub)** : Les libellés et placeholders ont été revus pour ne plus suggérer une assignation technicien directe par la plateforme (confirmé comme ressource interne SP).

### Faisable ensuite a faible risque

1. Completer le signoff `WF-008` avec:
   - proof SP mobile login apres approval
   - proof Fleet login apres approval si app cible definie
2. Data Visualisation : Ajouter un badge "Internal Resource" ou "Managed by Provider" sur les avatars techniciens dans les listes pour renforcer visuellement la distinction.

### Bloque par decision produit

1. `member` dans l'app SP:
   - autorise ou non
2. `driver` dans l'app Fleet:
   - ressource simple ou vrai compte de connexion

## 6. Regle cible recommandee

### Regle minimale stable

- `owner` d'un tenant `sp` peut se connecter a `uptime_sp` apres approval
- `sp_technicians` ne sont pas des comptes
- `fleet_drivers` ne sont pas des comptes tant qu'une feature explicite ne les promeut pas en utilisateurs
- la mission reste assignee au `Service Provider`, pas au technicien

### Regle d'evolution possible

- ouvrir plus tard l'app SP aux `members`
- ouvrir plus tard l'app Fleet a des `drivers` authentifies

Mais ce doit etre:
- un choix produit explicite
- avec tables / auth / guards dedies
- sans reutiliser directement `sp_technicians` ou `fleet_drivers` comme identites de connexion

## 7. References de code

- [index.ts](/home/suprox/projects/new/garage/uptime-repo/supabase/functions/admin-portal/index.ts)
- [index.ts](/home/suprox/projects/new/garage/uptime-repo/supabase/functions/onboarding-crud/index.ts)
- [app_auth_guard_service.dart](/home/suprox/projects/new/garage/uptime_sp/lib/core/services/app_auth_guard_service.dart)
- [login_screen.dart](/home/suprox/projects/new/garage/uptime_sp/lib/features/auth/presentation/login_screen.dart)
- [Accounts.tsx](/home/suprox/projects/new/garage/uptime-adminhub/src/pages/Accounts.tsx)
- [Interventions.tsx](/home/suprox/projects/new/garage/uptime-adminhub/src/pages/Interventions.tsx)
