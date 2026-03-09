import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Book, LayoutDashboard, Radio, Users, Wrench, Truck, ClipboardList,
  UserCheck, MapPin, CreditCard, BarChart3, ScrollText, Shield,
  Settings, FileText, Download, Moon, Zap, ChevronRight, Search,
  ExternalLink, AlertTriangle, Clock, CheckCircle2, Navigation, Flag,
  Code, Layers, Database, Globe, Palette, Lock, Languages,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------- Types ----------
interface DocSection {
  id: string;
  title: string;
  icon: React.ElementType;
  content: DocBlock[];
}

type DocBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "code"; language: string; code: string }
  | { type: "callout"; variant: "info" | "warning" | "success"; text: string }
  | { type: "status-flow"; statuses: { label: string; color: string }[] };

// ---------- Data ----------
const sections: DocSection[] = [
  {
    id: "overview",
    title: "Vue d'ensemble",
    icon: Book,
    content: [
      { type: "paragraph", text: "Fleet Rescue est une plateforme SaaS de gestion d'interventions d'assistance routière. Elle permet la coordination en temps réel entre gestionnaires de flotte, prestataires de services et techniciens terrain." },
      { type: "heading", text: "Architecture" },
      { type: "paragraph", text: "L'application est construite en React 18 avec TypeScript, utilisant Vite comme bundler. Le design system repose sur Tailwind CSS avec des tokens sémantiques et shadcn/ui pour les composants." },
      { type: "table", headers: ["Technologie", "Usage", "Version"], rows: [
        ["React", "Framework UI", "18.3"],
        ["TypeScript", "Typage statique", "5.x"],
        ["Vite", "Build tool", "5.x"],
        ["Tailwind CSS", "Design system", "3.x"],
        ["shadcn/ui", "Composants UI", "latest"],
        ["Recharts", "Graphiques", "2.x"],
        ["Leaflet", "Cartographie", "1.9"],
        ["framer-motion", "Animations", "12.x"],
        ["jsPDF", "Export PDF", "latest"],
      ]},
      { type: "heading", text: "Portails" },
      { type: "list", items: [
        "Portail Admin — Gestion complète des opérations, dispatch, analytics et facturation",
        "Portail Prestataire (SP) — Interface dédiée pour les prestataires avec dashboard, techniciens, services et facturation",
      ]},
    ],
  },
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    content: [
      { type: "paragraph", text: "Le tableau de bord principal offre une vue synthétique de l'activité de la plateforme." },
      { type: "heading", text: "KPIs affichés" },
      { type: "list", items: [
        "Nombre total d'interventions",
        "Interventions actives en cours",
        "Prestataires connectés",
        "Taux de complétion",
      ]},
      { type: "callout", variant: "info", text: "Le dashboard se rafraîchit automatiquement. Les données sont actuellement mockées et seront connectées au backend." },
    ],
  },
  {
    id: "dispatch",
    title: "Dispatch Center",
    icon: Radio,
    content: [
      { type: "paragraph", text: "Le centre de dispatch est le cœur opérationnel de Fleet Rescue. Il permet d'assigner les interventions aux prestataires disponibles en temps réel." },
      { type: "heading", text: "Interface" },
      { type: "paragraph", text: "L'écran est divisé en deux zones : la liste des interventions à gauche et la carte de suivi à droite." },
      { type: "heading", text: "Fonctionnalités" },
      { type: "list", items: [
        "Vue liste des interventions avec filtrage par statut",
        "Indicateur d'urgence (normal, urgent, critique)",
        "Alerte visuelle pour les interventions non assignées > 10 min",
        "Assignation directe d'un prestataire depuis la liste",
        "Avancement du statut en un clic",
        "Carte temps réel avec position des prestataires",
      ]},
      { type: "callout", variant: "warning", text: "Les interventions non assignées depuis plus de 10 minutes sont surlignées en rouge avec une alerte." },
    ],
  },
  {
    id: "interventions",
    title: "Interventions",
    icon: ClipboardList,
    content: [
      { type: "paragraph", text: "Module complet de gestion du cycle de vie des interventions." },
      { type: "heading", text: "Workflow" },
      { type: "status-flow", statuses: [
        { label: "En attente", color: "hsl(var(--muted-foreground))" },
        { label: "Assigné", color: "hsl(var(--info))" },
        { label: "En route", color: "hsl(var(--accent))" },
        { label: "Arrivé", color: "hsl(var(--warning, 38 92% 50%))" },
        { label: "En cours", color: "hsl(var(--success))" },
        { label: "Terminé", color: "hsl(var(--primary))" },
      ]},
      { type: "heading", text: "CRUD" },
      { type: "list", items: [
        "Créer — Formulaire avec gestionnaire, prestataire, technicien, véhicule et localisation",
        "Lire — Table filtrable avec recherche, filtre par statut et date",
        "Modifier — Avancement de statut étape par étape, annulation possible",
        "Supprimer — Avec confirmation AlertDialog",
      ]},
      { type: "heading", text: "Timeline" },
      { type: "paragraph", text: "Chaque intervention dispose d'une timeline détaillée affichant chaque étape avec l'heure, le statut et l'icône correspondante." },
    ],
  },
  {
    id: "accounts",
    title: "Comptes",
    icon: Users,
    content: [
      { type: "paragraph", text: "Gestion CRUD complète des comptes clients de la plateforme." },
      { type: "heading", text: "Fonctionnalités" },
      { type: "list", items: [
        "Création de nouveaux comptes",
        "Approbation / Rejet des demandes en attente",
        "Modification des informations",
        "Suppression avec confirmation",
        "Filtrage par statut (actif, en attente, suspendu)",
        "Recherche par nom ou email",
      ]},
    ],
  },
  {
    id: "providers",
    title: "Prestataires",
    icon: Wrench,
    content: [
      { type: "paragraph", text: "Catalogue et gestion des prestataires de services d'assistance routière." },
      { type: "list", items: [
        "Fiche détaillée : nom, téléphone, localisation, services proposés",
        "Évaluation et rating",
        "Nombre de missions complétées",
        "Multi-sélection de services (remorquage, pneu, batterie, etc.)",
        "CRUD complet avec formulaire de création/modification",
      ]},
    ],
  },
  {
    id: "fleet-managers",
    title: "Gestionnaires de flotte",
    icon: Truck,
    content: [
      { type: "paragraph", text: "Suivi des gestionnaires de flotte avec leurs métriques et flottes associées." },
      { type: "list", items: [
        "Table avec recherche et filtres",
        "KPIs par gestionnaire (véhicules, interventions)",
        "Drawer avec détails complets",
        "CRUD complet",
      ]},
    ],
  },
  {
    id: "technicians",
    title: "Techniciens",
    icon: UserCheck,
    content: [
      { type: "paragraph", text: "Gestion des techniciens terrain avec profil détaillé." },
      { type: "heading", text: "Statuts" },
      { type: "table", headers: ["Statut", "Description"], rows: [
        ["En ligne", "Disponible pour des missions"],
        ["En mission", "Actuellement sur une intervention"],
        ["Hors ligne", "Non disponible"],
      ]},
      { type: "heading", text: "Profil technicien" },
      { type: "list", items: [
        "Informations personnelles et contact",
        "Prestataire rattaché",
        "Spécialités techniques",
        "Rating et nombre de missions",
        "Mission en cours",
      ]},
    ],
  },
  {
    id: "map",
    title: "Carte de suivi",
    icon: MapPin,
    content: [
      { type: "paragraph", text: "Visualisation géographique en temps réel de tous les prestataires sur le terrain." },
      { type: "heading", text: "Composants" },
      { type: "table", headers: ["Composant", "Rôle"], rows: [
        ["ProviderMarker", "Marqueur coloré par statut sur la carte"],
        ["MissionPanel", "Panel latéral avec détails de la mission sélectionnée"],
        ["MapLegend", "Légende des statuts"],
      ]},
      { type: "callout", variant: "info", text: "La carte utilise react-leaflet v4.2.1 (compatible React 18) avec des tuiles OpenStreetMap." },
    ],
  },
  {
    id: "billing",
    title: "Facturation",
    icon: CreditCard,
    content: [
      { type: "paragraph", text: "Module de suivi des paiements et revenus liés aux interventions." },
      { type: "heading", text: "Onglets" },
      { type: "list", items: [
        "Factures — Table complète avec statut (payé, en attente, en retard, annulé)",
        "Revenus prestataires — Agrégation par prestataire avec revenus nets et commissions",
      ]},
      { type: "heading", text: "KPIs" },
      { type: "list", items: ["Revenus totaux payés", "Commissions gagnées", "Montant en attente/retard"] },
      { type: "heading", text: "Exports" },
      { type: "paragraph", text: "Les factures peuvent être exportées en CSV et PDF via les boutons dans le header de la page." },
    ],
  },
  {
    id: "analytics",
    title: "Analytics",
    icon: BarChart3,
    content: [
      { type: "paragraph", text: "Tableau de bord analytique offrant une vision complète de la performance opérationnelle." },
      { type: "heading", text: "KPIs" },
      { type: "list", items: [
        "Temps moyen d'intervention",
        "Missions par jour",
        "Taux de réussite",
        "Prestataires actifs",
      ]},
      { type: "heading", text: "Graphiques (Recharts)" },
      { type: "table", headers: ["Graphique", "Type", "Description"], rows: [
        ["Missions par jour", "BarChart", "Total et complétées par jour"],
        ["Temps de réponse", "AreaChart", "Évolution du temps moyen"],
        ["Répartition par zone", "PieChart", "Distribution géographique"],
        ["Distribution horaire", "BarChart", "Pics d'activité dans la journée"],
        ["Top prestataires", "Liste", "Classement par nombre de missions"],
        ["Par type d'intervention", "Progress bars", "Répartition par catégorie"],
      ]},
      { type: "heading", text: "Exports" },
      { type: "paragraph", text: "Les données analytics peuvent être exportées en CSV (tableau missions) et PDF (rapport complet)." },
    ],
  },
  {
    id: "alerts",
    title: "Alertes opérationnelles",
    icon: AlertTriangle,
    content: [
      { type: "paragraph", text: "Système d'alertes temps réel intégré dans le header pour aider les opérateurs à détecter les problèmes." },
      { type: "heading", text: "Types d'alertes" },
      { type: "table", headers: ["Type", "Niveau", "Description"], rows: [
        ["Intervention non assignée", "Critique", "Non assignée depuis > 10 min"],
        ["Prestataire en retard", "Warning", "Arrivée prévue dépassée"],
        ["Mission bloquée", "Critique", "Statut inchangé depuis > 30 min"],
        ["Technicien offline", "Warning", "Perte de connexion d'un technicien"],
      ]},
      { type: "callout", variant: "warning", text: "Les alertes critiques déclenchent une animation pulse sur l'icône du header." },
    ],
  },
  {
    id: "audit-logs",
    title: "Journal d'audit",
    icon: ScrollText,
    content: [
      { type: "paragraph", text: "Historique complet de toutes les actions administratives pour la traçabilité." },
      { type: "heading", text: "Types d'actions" },
      { type: "list", items: [
        "Assignation — Mission assignée à un prestataire",
        "Changement de statut — Progression du workflow",
        "Création — Nouveau prestataire, compte ou intervention",
        "Suppression — Suppression d'éléments",
        "Modification — Mise à jour de données",
        "Connexion — Login admin",
      ]},
      { type: "paragraph", text: "Filtrage par type d'action et recherche textuelle disponibles." },
    ],
  },
  {
    id: "exports",
    title: "Exports PDF / CSV",
    icon: Download,
    content: [
      { type: "paragraph", text: "Fleet Rescue propose des exports de données en formats PDF et CSV pour les rapports et la comptabilité." },
      { type: "heading", text: "Pages avec export" },
      { type: "table", headers: ["Page", "CSV", "PDF", "Contenu"], rows: [
        ["Analytics", "✅", "✅", "Données missions par jour"],
        ["Facturation", "✅", "✅", "Table complète des factures"],
      ]},
      { type: "heading", text: "Implémentation technique" },
      { type: "code", language: "typescript", code: `import { exportCSV, exportPDF } from "@/lib/export";

// Export CSV
exportCSV(data, "filename");

// Export PDF
exportPDF("Titre", ["Col1", "Col2"], rows, "filename");` },
      { type: "callout", variant: "info", text: "Les exports utilisent jsPDF pour le PDF et jspdf-autotable pour le formatage automatique des tableaux." },
    ],
  },
  {
    id: "dark-mode",
    title: "Mode sombre",
    icon: Moon,
    content: [
      { type: "paragraph", text: "Fleet Rescue supporte un mode sombre complet avec persistance." },
      { type: "heading", text: "Fonctionnement" },
      { type: "list", items: [
        "Toggle dans le header (icône Soleil/Lune)",
        "Détection automatique des préférences système",
        "Persistance via localStorage",
        "Tokens CSS sémantiques pour light et dark modes",
      ]},
      { type: "code", language: "typescript", code: `// Utilisation dans un composant
import { useTheme } from "@/hooks/useTheme";

const { theme, toggleTheme } = useTheme();
// theme: "light" | "dark"` },
    ],
  },
  {
    id: "design-system",
    title: "Design System",
    icon: Palette,
    content: [
      { type: "paragraph", text: "Le design system repose sur des tokens CSS sémantiques définis dans index.css et exploités via Tailwind." },
      { type: "heading", text: "Tokens principaux" },
      { type: "table", headers: ["Token", "Usage"], rows: [
        ["--background", "Fond de page"],
        ["--foreground", "Texte principal"],
        ["--card", "Fond des cartes"],
        ["--primary", "Couleur d'action principale (bleu)"],
        ["--accent", "Couleur secondaire (violet)"],
        ["--success", "Succès, validations (vert)"],
        ["--warning", "Alertes modérées (orange)"],
        ["--info", "Informations (bleu clair)"],
        ["--destructive", "Erreurs, suppressions (rouge)"],
        ["--muted", "Éléments atténués"],
      ]},
      { type: "heading", text: "Typographie" },
      { type: "list", items: [
        "Plus Jakarta Sans — Police principale (body, titres)",
        "JetBrains Mono — Police monospace (IDs, codes)",
      ]},
      { type: "heading", text: "Utilitaires CSS" },
      { type: "list", items: [
        ".glass — Glassmorphism (backdrop-blur)",
        ".gradient-text — Texte avec gradient primary → accent",
        ".shadow-glow — Ombre diffuse primary",
        ".skeleton-shimmer — Animation skeleton loading",
      ]},
    ],
  },
  {
    id: "api-routes",
    title: "Routes & Navigation",
    icon: Globe,
    content: [
      { type: "paragraph", text: "L'application utilise React Router v6 avec deux layouts principaux." },
      { type: "heading", text: "Portail Admin" },
      { type: "table", headers: ["Route", "Page", "Description"], rows: [
        ["/dashboard", "Dashboard", "Tableau de bord principal"],
        ["/dispatch", "Dispatch", "Centre de dispatch temps réel"],
        ["/accounts", "Accounts", "Gestion des comptes"],
        ["/providers", "Providers", "Gestion des prestataires"],
        ["/fleet-managers", "FleetManagers", "Gestionnaires de flotte"],
        ["/interventions", "Interventions", "Suivi des interventions"],
        ["/technicians", "Technicians", "Gestion des techniciens"],
        ["/map", "Map", "Carte de suivi"],
        ["/billing", "Billing", "Facturation"],
        ["/analytics", "Analytics", "Analytics"],
        ["/audit-logs", "AuditLogs", "Journal d'audit"],
        ["/profile", "Profile", "Profil utilisateur"],
        ["/settings", "Settings", "Paramètres"],
      ]},
      { type: "heading", text: "Portail Prestataire" },
      { type: "table", headers: ["Route", "Page"], rows: [
        ["/sp/dashboard", "SpDashboard"],
        ["/sp/technicians", "SpTechnicians"],
        ["/sp/services", "SpServices"],
        ["/sp/invoices", "SpInvoices"],
        ["/sp/onboarding", "SpOnboarding"],
        ["/sp/settings", "SpSettings"],
      ]},
    ],
  },
  {
    id: "project-structure",
    title: "Structure du projet",
    icon: Layers,
    content: [
      { type: "code", language: "text", code: `src/
├── components/           # Composants réutilisables
│   ├── map/              # ProviderMarker, MissionPanel, MapLegend
│   └── ui/               # shadcn/ui (Button, Dialog, Table, etc.)
├── hooks/                # useTheme, useMobile, useToast
├── lib/                  # utils.ts, export.ts (PDF/CSV)
├── pages/                # Pages admin
│   └── sp/               # Pages portail prestataire
├── data/                 # Données mock (mockProviders)
└── types/                # Types TypeScript (map.ts)` },
      { type: "heading", text: "Conventions" },
      { type: "list", items: [
        "Composants en PascalCase (ProviderMarker.tsx)",
        "Hooks en camelCase (useTheme.tsx)",
        "Pages en PascalCase (Dispatch.tsx)",
        "Types dans src/types/",
        "Données mock dans src/data/",
        "Utilitaires dans src/lib/",
      ]},
    ],
  },
  {
    id: "authentication",
    title: "Authentification",
    icon: Lock,
    content: [
      { type: "paragraph", text: "Fleet Rescue utilise Supabase Auth pour l'authentification avec support de multiples méthodes de connexion." },
      { type: "heading", text: "Méthodes de connexion" },
      { type: "list", items: [
        "Email / Mot de passe — inscription et connexion classiques",
        "Google OAuth — connexion en un clic via Google",
        "Réinitialisation de mot de passe — flux complet avec email",
      ]},
      { type: "heading", text: "Hooks" },
      { type: "code", language: "typescript", code: `import { useAuth } from "@/hooks/useAuth";

const { user, session, profile, loading, signOut } = useAuth();
// user: User | null — utilisateur Supabase
// profile: { full_name, avatar_url, role } — profil public
// signOut() — déconnexion` },
      { type: "callout", variant: "info", text: "Le composant ProtectedRoute redirige automatiquement vers /login si l'utilisateur n'est pas authentifié." },
    ],
  },
  {
    id: "rbac",
    title: "Contrôle d'accès (RBAC)",
    icon: Shield,
    content: [
      { type: "paragraph", text: "Système de rôles basé sur une table user_roles avec des politiques RLS (Row Level Security) pour la sécurité au niveau base de données." },
      { type: "heading", text: "Rôles disponibles" },
      { type: "table", headers: ["Rôle", "Accès"], rows: [
        ["Admin", "Accès complet : toutes les pages, gestion des rôles, audit logs"],
        ["Moderator", "Dispatch, facturation, analytics, paramètres + pages générales"],
        ["User", "Dashboard, prestataires, gestionnaires, interventions, techniciens, carte, docs"],
      ]},
      { type: "heading", text: "Implémentation" },
      { type: "list", items: [
        "useRole() — hook pour vérifier les rôles (hasRole, hasAnyRole, isAdmin, isModerator)",
        "RoleGuard — composant wrapper pour protéger les routes",
        "Sidebar filtering — masque automatiquement les liens non autorisés",
        "has_role() — fonction SQL security definer pour les politiques RLS",
      ]},
      { type: "code", language: "typescript", code: `import { useRole } from "@/hooks/useRole";

const { roles, isAdmin, isModerator, hasRole, hasAnyRole } = useRole();

// Protection de route
<RoleGuard allowedRoles={["admin", "moderator"]}>
  <ProtectedPage />
</RoleGuard>` },
    ],
  },
  {
    id: "i18n",
    title: "Internationalisation (i18n)",
    icon: Languages,
    content: [
      { type: "paragraph", text: "Support bilingue Français / Anglais avec changement en temps réel et persistance localStorage." },
      { type: "heading", text: "Usage" },
      { type: "code", language: "typescript", code: `import { useLanguage } from "@/hooks/useLanguage";

const { language, setLanguage, t } = useLanguage();

// Dans un composant
<span>{t("nav.dashboard")}</span>
<button onClick={() => setLanguage("en")}>English</button>` },
      { type: "heading", text: "Ajouter une traduction" },
      { type: "list", items: [
        "Ouvrir src/hooks/useLanguage.tsx",
        "Ajouter la clé dans les objets fr et en du dictionnaire translations",
        "Utiliser t('ma_cle') dans le composant",
      ]},
      { type: "callout", variant: "info", text: "Le sélecteur de langue est dans le header (icône globe + code langue). La langue est persistée dans localStorage sous la clé 'fleet-rescue-language'." },
    ],
  },
];

// ---------- Render helpers ----------
const DocBlockRenderer = ({ block }: { block: DocBlock }) => {
  switch (block.type) {
    case "paragraph":
      return <p className="text-sm text-foreground/80 leading-relaxed">{block.text}</p>;

    case "heading":
      return <h3 className="text-base font-bold text-foreground mt-6 mb-2">{block.text}</h3>;

    case "list":
      return (
        <ul className="space-y-1.5 ml-1">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
              <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );

    case "table":
      return (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                {block.headers.map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} className="border-t border-border">
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-2.5 text-sm text-foreground/80">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "code":
      return (
        <pre className="bg-sidebar text-sidebar-foreground rounded-xl p-4 text-xs font-mono overflow-x-auto leading-relaxed">
          <code>{block.code}</code>
        </pre>
      );

    case "callout": {
      const cfg = {
        info: { bg: "bg-info/10", border: "border-info/30", text: "text-info", icon: CheckCircle2 },
        warning: { bg: "bg-warning/10", border: "border-warning/30", text: "text-warning", icon: AlertTriangle },
        success: { bg: "bg-success/10", border: "border-success/30", text: "text-success", icon: CheckCircle2 },
      }[block.variant];
      const Icon = cfg.icon;
      return (
        <div className={cn("flex items-start gap-3 p-4 rounded-xl border", cfg.bg, cfg.border)}>
          <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", cfg.text)} />
          <p className="text-sm text-foreground/80">{block.text}</p>
        </div>
      );
    }

    case "status-flow":
      return (
        <div className="flex flex-wrap items-center gap-2 py-2">
          {block.statuses.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <span
                className="text-xs font-medium px-3 py-1.5 rounded-lg text-white"
                style={{ background: s.color }}
              >
                {s.label}
              </span>
              {i < block.statuses.length - 1 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
      );

    default:
      return null;
  }
};

// ---------- Main Component ----------
const Documentation = () => {
  const [activeSection, setActiveSection] = useState("overview");
  const [search, setSearch] = useState("");

  const filteredSections = sections.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.content.some(b =>
      ("text" in b && typeof b.text === "string" && b.text.toLowerCase().includes(search.toLowerCase())) ||
      ("items" in b && (b as any).items?.some((item: string) => item.toLowerCase().includes(search.toLowerCase())))
    )
  );

  const current = sections.find(s => s.id === activeSection) || sections[0];

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col lg:flex-row gap-6" style={{ minHeight: "calc(100vh - 140px)" }}>
        {/* Sidebar */}
        <div className="lg:w-64 shrink-0">
          <div className="sticky top-20 space-y-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                <Book className="h-6 w-6 text-primary" />
                Documentation
              </h1>
              <p className="text-xs text-muted-foreground mt-1">Fleet Rescue v1.0</p>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="h-8 w-full pl-8 pr-3 rounded-lg border border-input bg-background text-xs placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
              />
            </div>

            <nav className="space-y-0.5 max-h-[60vh] overflow-y-auto pr-1">
              {filteredSections.map(s => {
                const Icon = s.icon;
                const isActive = activeSection === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{s.title}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-card rounded-2xl border border-border p-6 lg:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <current.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{current.title}</h2>
                <p className="text-xs text-muted-foreground">Documentation technique</p>
              </div>
            </div>

            <div className="space-y-4 max-w-none">
              {current.content.map((block, i) => (
                <DocBlockRenderer key={i} block={block} />
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-4">
            {(() => {
              const idx = sections.findIndex(s => s.id === activeSection);
              const prev = idx > 0 ? sections[idx - 1] : null;
              const next = idx < sections.length - 1 ? sections[idx + 1] : null;
              return (
                <>
                  {prev ? (
                    <button onClick={() => setActiveSection(prev.id)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <ChevronRight className="h-4 w-4 rotate-180" />
                      {prev.title}
                    </button>
                  ) : <div />}
                  {next ? (
                    <button onClick={() => setActiveSection(next.id)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {next.title}
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : <div />}
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
