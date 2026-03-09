import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen, Rocket, LayoutDashboard, Radio, Users, Wrench, Truck,
  ClipboardList, UserCheck, MapPin, CreditCard, BarChart3, ScrollText,
  Download, Moon, Sun, AlertTriangle, ChevronRight, Search, HelpCircle,
  Settings, Shield, Eye, Plus, Trash2, Edit, ArrowRight, Phone,
  CheckCircle2, Clock, Navigation, Flag, Star, Zap, FileText, Book,
  Lightbulb, Target, MousePointer, ArrowDown, Play,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------- Types ----------
interface GuideSection {
  id: string;
  title: string;
  icon: React.ElementType;
  category: string;
  content: GuideBlock[];
}

type GuideBlock =
  | { type: "intro"; text: string }
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "steps"; steps: { title: string; description: string; icon?: React.ElementType }[] }
  | { type: "tip"; text: string }
  | { type: "warning"; text: string }
  | { type: "feature-grid"; features: { icon: React.ElementType; title: string; description: string }[] }
  | { type: "shortcut-list"; items: { action: string; how: string }[] }
  | { type: "faq"; questions: { q: string; a: string }[] };

// ---------- Guide Data ----------
const guideSections: GuideSection[] = [
  {
    id: "getting-started",
    title: "Prise en main",
    icon: Rocket,
    category: "Démarrage",
    content: [
      { type: "intro", text: "Bienvenue dans Fleet Rescue ! Ce guide vous accompagne pas à pas dans l'utilisation de la plateforme de gestion d'interventions routières." },
      { type: "heading", text: "Première connexion" },
      { type: "steps", steps: [
        { title: "Accédez à la plateforme", description: "Ouvrez votre navigateur et rendez-vous sur l'URL fournie par votre administrateur.", icon: Play },
        { title: "Connectez-vous", description: "Entrez votre email et mot de passe sur la page de connexion.", icon: Shield },
        { title: "Explorez le Dashboard", description: "Après connexion, vous arrivez sur le tableau de bord principal avec les KPIs de votre activité.", icon: LayoutDashboard },
        { title: "Naviguez via la sidebar", description: "Utilisez le menu latéral gauche pour accéder aux différentes sections de la plateforme.", icon: MousePointer },
      ]},
      { type: "heading", text: "Interface principale" },
      { type: "feature-grid", features: [
        { icon: LayoutDashboard, title: "Sidebar", description: "Menu de navigation principal, rétractable pour plus d'espace" },
        { icon: Search, title: "Barre de recherche", description: "Recherche rapide disponible dans le header" },
        { icon: Moon, title: "Mode sombre", description: "Basculez entre thème clair et sombre via l'icône ☀/🌙 dans le header" },
        { icon: AlertTriangle, title: "Alertes", description: "Icône d'alerte dans le header pour les urgences opérationnelles" },
      ]},
      { type: "tip", text: "Vous pouvez réduire la sidebar en cliquant sur l'icône ☰ pour gagner de l'espace sur votre écran." },
    ],
  },
  {
    id: "dashboard-guide",
    title: "Tableau de bord",
    icon: LayoutDashboard,
    category: "Démarrage",
    content: [
      { type: "intro", text: "Le tableau de bord est votre point d'entrée quotidien. Il offre une vue synthétique de toute l'activité de la plateforme." },
      { type: "heading", text: "Comprendre les KPIs" },
      { type: "feature-grid", features: [
        { icon: ClipboardList, title: "Interventions actives", description: "Nombre d'interventions actuellement en cours de traitement" },
        { icon: Users, title: "Prestataires connectés", description: "Nombre de prestataires actuellement en ligne et disponibles" },
        { icon: CheckCircle2, title: "Taux de complétion", description: "Pourcentage d'interventions terminées avec succès" },
        { icon: Clock, title: "Temps moyen", description: "Durée moyenne de résolution d'une intervention" },
      ]},
      { type: "tip", text: "Consultez le dashboard chaque matin pour avoir une vue d'ensemble de votre activité et identifier les éventuels problèmes." },
    ],
  },
  {
    id: "dispatch-guide",
    title: "Dispatch Center",
    icon: Radio,
    category: "Opérations",
    content: [
      { type: "intro", text: "Le Dispatch Center est le cœur de vos opérations. C'est ici que vous assignez les interventions aux prestataires disponibles." },
      { type: "heading", text: "Comment assigner une intervention" },
      { type: "steps", steps: [
        { title: "Identifiez l'intervention", description: "Consultez la liste à gauche. Les interventions « En attente » sont surlignées et doivent être traitées en priorité.", icon: Eye },
        { title: "Cliquez sur l'intervention", description: "Sélectionnez-la pour voir ses détails et le bouton « Assigner ».", icon: MousePointer },
        { title: "Cliquez sur « Assigner »", description: "Un dialogue s'ouvre avec la liste des prestataires disponibles.", icon: Plus },
        { title: "Choisissez un prestataire", description: "Sélectionnez le prestataire le plus adapté (proximité, spécialité).", icon: UserCheck },
        { title: "Confirmez", description: "L'intervention passe automatiquement en statut « Assigné ».", icon: CheckCircle2 },
      ]},
      { type: "heading", text: "Utiliser la carte" },
      { type: "paragraph", text: "La partie droite affiche une carte avec la position de tous les prestataires. Cliquez sur un marqueur pour voir les détails du prestataire et sa mission en cours." },
      { type: "warning", text: "⚠️ Les interventions non assignées depuis plus de 10 minutes sont signalées en rouge. Traitez-les en priorité !" },
      { type: "heading", text: "Avancer le statut" },
      { type: "paragraph", text: "Pour les interventions déjà assignées, utilisez le bouton « Avancer » pour faire progresser le workflow : Assigné → En route → Arrivé → En cours → Terminé." },
    ],
  },
  {
    id: "interventions-guide",
    title: "Gérer les interventions",
    icon: ClipboardList,
    category: "Opérations",
    content: [
      { type: "intro", text: "La page Interventions vous permet de créer, suivre et gérer tout le cycle de vie d'une intervention." },
      { type: "heading", text: "Créer une intervention" },
      { type: "steps", steps: [
        { title: "Cliquez sur « Nouvelle intervention »", description: "Bouton en haut à droite de la page.", icon: Plus },
        { title: "Remplissez le formulaire", description: "Sélectionnez le gestionnaire de flotte, le prestataire, le technicien, le type de service et les infos véhicule.", icon: Edit },
        { title: "Validez", description: "L'intervention est créée avec le statut « En attente ».", icon: CheckCircle2 },
      ]},
      { type: "heading", text: "Suivre une intervention" },
      { type: "paragraph", text: "Cliquez sur une ligne du tableau pour ouvrir le détail. Vous y trouverez :" },
      { type: "feature-grid", features: [
        { icon: Clock, title: "Timeline", description: "Historique visuel de chaque étape avec l'heure exacte" },
        { icon: Truck, title: "Infos véhicule", description: "Plaque, modèle et année du véhicule concerné" },
        { icon: ArrowRight, title: "Actions", description: "Avancer le statut, annuler ou supprimer l'intervention" },
        { icon: MapPin, title: "Localisation", description: "Adresse de l'intervention" },
      ]},
      { type: "heading", text: "Filtrer les interventions" },
      { type: "shortcut-list", items: [
        { action: "Rechercher", how: "Tapez un ID, nom de gestionnaire ou prestataire dans la barre de recherche" },
        { action: "Filtrer par statut", how: "Cliquez sur les badges de statut pour filtrer (En attente, Assigné, En route, etc.)" },
        { action: "Filtrer par date", how: "Utilisez les sélecteurs de date « Début » et « Fin »" },
        { action: "Réinitialiser", how: "Cliquez sur « Réinitialiser » pour effacer tous les filtres" },
      ]},
      { type: "heading", text: "Supprimer une intervention" },
      { type: "paragraph", text: "Dans le détail d'une intervention, cliquez sur « Supprimer » puis confirmez dans la boîte de dialogue. Cette action est irréversible." },
      { type: "warning", text: "La suppression est définitive. Pensez à annuler une intervention plutôt que la supprimer si vous souhaitez conserver l'historique." },
    ],
  },
  {
    id: "accounts-guide",
    title: "Gérer les comptes",
    icon: Users,
    category: "Gestion",
    content: [
      { type: "intro", text: "La page Comptes vous permet de gérer les comptes clients de la plateforme." },
      { type: "heading", text: "Actions disponibles" },
      { type: "steps", steps: [
        { title: "Créer un compte", description: "Cliquez sur « Nouveau compte » et remplissez les informations du client.", icon: Plus },
        { title: "Approuver / Rejeter", description: "Pour les comptes en attente, utilisez les boutons d'action pour approuver ou rejeter.", icon: CheckCircle2 },
        { title: "Modifier", description: "Ouvrez le détail d'un compte pour modifier ses informations.", icon: Edit },
        { title: "Supprimer", description: "Supprimez un compte avec confirmation de sécurité.", icon: Trash2 },
      ]},
      { type: "heading", text: "Filtres" },
      { type: "paragraph", text: "Filtrez par statut (Actif, En attente, Suspendu) et cherchez par nom ou email." },
    ],
  },
  {
    id: "providers-guide",
    title: "Gérer les prestataires",
    icon: Wrench,
    category: "Gestion",
    content: [
      { type: "intro", text: "Gérez votre réseau de prestataires d'assistance routière." },
      { type: "heading", text: "Fiche prestataire" },
      { type: "paragraph", text: "Chaque prestataire dispose d'une fiche complète avec : nom, téléphone, localisation, services proposés, nombre de missions complétées et évaluation." },
      { type: "heading", text: "Actions" },
      { type: "shortcut-list", items: [
        { action: "Ajouter un prestataire", how: "Bouton « Nouveau prestataire » → formulaire avec multi-sélection de services" },
        { action: "Modifier", how: "Cliquez sur un prestataire → bouton Modifier" },
        { action: "Supprimer", how: "Bouton Supprimer avec confirmation" },
        { action: "Voir les détails", how: "Cliquez sur un prestataire pour ouvrir sa fiche complète" },
      ]},
    ],
  },
  {
    id: "technicians-guide",
    title: "Suivre les techniciens",
    icon: UserCheck,
    category: "Gestion",
    content: [
      { type: "intro", text: "Suivez tous les techniciens terrain, leur statut et leurs performances." },
      { type: "heading", text: "Statuts" },
      { type: "feature-grid", features: [
        { icon: CheckCircle2, title: "En ligne", description: "Disponible et prêt à recevoir des missions" },
        { icon: Wrench, title: "En mission", description: "Actuellement sur une intervention" },
        { icon: Clock, title: "Hors ligne", description: "Non connecté ou indisponible" },
      ]},
      { type: "heading", text: "Profil technicien" },
      { type: "paragraph", text: "Cliquez sur un technicien pour voir son profil complet : coordonnées, prestataire rattaché, spécialités, rating et mission en cours." },
      { type: "tip", text: "Utilisez le rating et le nombre de missions pour identifier vos meilleurs techniciens et équilibrer la charge de travail." },
    ],
  },
  {
    id: "map-guide",
    title: "Carte de suivi",
    icon: MapPin,
    category: "Opérations",
    content: [
      { type: "intro", text: "La carte affiche en temps réel la position de tous vos prestataires sur le terrain." },
      { type: "heading", text: "Utilisation" },
      { type: "steps", steps: [
        { title: "Visualisez les marqueurs", description: "Chaque point coloré représente un prestataire. La couleur indique son statut actuel.", icon: Eye },
        { title: "Filtrez par statut", description: "Utilisez les filtres en haut pour n'afficher que certains statuts.", icon: Search },
        { title: "Cliquez sur un marqueur", description: "Un panel s'ouvre avec les détails du prestataire et sa mission en cours.", icon: MousePointer },
      ]},
      { type: "heading", text: "Code couleur" },
      { type: "shortcut-list", items: [
        { action: "Gris", how: "En attente — pas de mission active" },
        { action: "Bleu clair", how: "Assigné — mission attribuée" },
        { action: "Violet", how: "En route — se dirige vers le client" },
        { action: "Orange", how: "Arrivé — sur place" },
        { action: "Vert", how: "En cours — intervention en cours" },
        { action: "Bleu", how: "Terminé — mission complétée" },
      ]},
    ],
  },
  {
    id: "billing-guide",
    title: "Facturation",
    icon: CreditCard,
    category: "Finance",
    content: [
      { type: "intro", text: "Suivez les paiements, factures et revenus liés à chaque intervention." },
      { type: "heading", text: "Onglets" },
      { type: "feature-grid", features: [
        { icon: FileText, title: "Factures", description: "Liste de toutes les factures avec statut de paiement (Payé, En attente, En retard, Annulé)" },
        { icon: Users, title: "Revenus prestataires", description: "Agrégation par prestataire : revenus nets, commissions prélevées, nombre de missions" },
      ]},
      { type: "heading", text: "Exporter les factures" },
      { type: "steps", steps: [
        { title: "Cliquez sur « CSV »", description: "Télécharge un fichier CSV avec toutes les factures, importable dans Excel.", icon: Download },
        { title: "Cliquez sur « PDF »", description: "Génère un rapport PDF formaté avec en-tête et tableau complet.", icon: FileText },
      ]},
      { type: "tip", text: "Les exports incluent toutes les factures, pas seulement celles filtrées. Utilisez-les pour vos rapports mensuels." },
    ],
  },
  {
    id: "analytics-guide",
    title: "Analytics",
    icon: BarChart3,
    category: "Finance",
    content: [
      { type: "intro", text: "La page Analytics donne une vision complète de la performance opérationnelle de votre plateforme." },
      { type: "heading", text: "KPIs disponibles" },
      { type: "feature-grid", features: [
        { icon: Clock, title: "Temps moyen", description: "Durée moyenne de réponse et résolution" },
        { icon: Target, title: "Missions / jour", description: "Nombre moyen de missions par jour" },
        { icon: CheckCircle2, title: "Taux de réussite", description: "% de missions complétées vs total" },
        { icon: Users, title: "Prestataires actifs", description: "Nombre de prestataires en mission" },
      ]},
      { type: "heading", text: "Graphiques" },
      { type: "paragraph", text: "6 graphiques interactifs : missions par jour (barres), temps de réponse (courbe), répartition par zone (camembert), distribution horaire, top prestataires et répartition par type de service." },
      { type: "heading", text: "Exporter les rapports" },
      { type: "paragraph", text: "Utilisez les boutons CSV et PDF en haut à droite pour exporter les données de missions." },
      { type: "heading", text: "Période" },
      { type: "paragraph", text: "Changez la période d'analyse avec les boutons 7 jours / 30 jours / 90 jours." },
    ],
  },
  {
    id: "alerts-guide",
    title: "Alertes opérationnelles",
    icon: AlertTriangle,
    category: "Opérations",
    content: [
      { type: "intro", text: "Le système d'alertes vous aide à détecter et résoudre les problèmes opérationnels rapidement." },
      { type: "heading", text: "Types d'alertes" },
      { type: "shortcut-list", items: [
        { action: "🔴 Intervention non assignée", how: "Une intervention attend depuis plus de 10 minutes — action immédiate requise" },
        { action: "🟠 Prestataire en retard", how: "Le prestataire n'est pas arrivé dans les délais prévus" },
        { action: "🔴 Mission bloquée", how: "Une intervention est restée dans le même statut trop longtemps" },
        { action: "🟠 Technicien offline", how: "Un technicien a perdu la connexion" },
      ]},
      { type: "heading", text: "Comment réagir" },
      { type: "steps", steps: [
        { title: "Cliquez sur l'icône d'alerte", description: "Dans le header, l'icône ⚠️ affiche un badge avec le nombre d'alertes actives.", icon: AlertTriangle },
        { title: "Consultez les détails", description: "Chaque alerte indique le problème, le niveau (warning / critique) et l'heure.", icon: Eye },
        { title: "Agissez", description: "Rendez-vous dans le Dispatch Center ou la page Interventions pour résoudre le problème.", icon: Zap },
        { title: "Fermez l'alerte", description: "Cliquez sur ✕ pour fermer une alerte traitée.", icon: CheckCircle2 },
      ]},
      { type: "warning", text: "Les alertes critiques déclenchent une animation pulsante sur l'icône. Ne les ignorez pas !" },
    ],
  },
  {
    id: "audit-guide",
    title: "Journal d'audit",
    icon: ScrollText,
    category: "Administration",
    content: [
      { type: "intro", text: "Le journal d'audit trace toutes les actions administratives pour garantir la traçabilité." },
      { type: "heading", text: "Actions enregistrées" },
      { type: "shortcut-list", items: [
        { action: "Assignation", how: "Un admin a assigné une mission à un prestataire" },
        { action: "Changement de statut", how: "Le statut d'une intervention a été modifié" },
        { action: "Création", how: "Un nouveau prestataire, compte ou intervention a été créé" },
        { action: "Suppression", how: "Un élément a été supprimé" },
        { action: "Modification", how: "Des données ont été mises à jour" },
        { action: "Connexion", how: "Un admin s'est connecté" },
      ]},
      { type: "heading", text: "Filtrer les logs" },
      { type: "paragraph", text: "Utilisez les badges de type d'action et la barre de recherche pour filtrer l'historique. Vous pouvez chercher par description, acteur ou objet." },
    ],
  },
  {
    id: "dark-mode-guide",
    title: "Mode sombre",
    icon: Moon,
    category: "Personnalisation",
    content: [
      { type: "intro", text: "Fleet Rescue supporte un thème sombre pour un confort visuel optimal." },
      { type: "heading", text: "Activer le mode sombre" },
      { type: "steps", steps: [
        { title: "Repérez l'icône", description: "Dans le header en haut à droite, cherchez l'icône 🌙 (ou ☀️ si déjà en mode sombre).", icon: Moon },
        { title: "Cliquez dessus", description: "Le thème bascule instantanément.", icon: MousePointer },
      ]},
      { type: "tip", text: "Votre préférence est sauvegardée automatiquement. Au prochain chargement, le thème choisi sera restauré." },
    ],
  },
  {
    id: "exports-guide",
    title: "Exports PDF / CSV",
    icon: Download,
    category: "Personnalisation",
    content: [
      { type: "intro", text: "Exportez vos données en formats PDF et CSV pour vos rapports et votre comptabilité." },
      { type: "heading", text: "Pages avec export" },
      { type: "shortcut-list", items: [
        { action: "Analytics", how: "Exporte les données de missions par jour en CSV ou PDF" },
        { action: "Facturation", how: "Exporte la table complète des factures en CSV ou PDF" },
      ]},
      { type: "heading", text: "Format PDF" },
      { type: "paragraph", text: "Le PDF généré inclut un en-tête avec le titre du rapport, la date de génération et un tableau formaté automatiquement." },
      { type: "heading", text: "Format CSV" },
      { type: "paragraph", text: "Le CSV est compatible avec Excel, Google Sheets et tout logiciel tableur. Les valeurs sont séparées par des virgules avec encodage UTF-8." },
    ],
  },
  {
    id: "profile-guide",
    title: "Profil & Paramètres",
    icon: Settings,
    category: "Administration",
    content: [
      { type: "intro", text: "Gérez vos informations personnelles et les paramètres de la plateforme." },
      { type: "heading", text: "Profil" },
      { type: "steps", steps: [
        { title: "Accédez au profil", description: "Cliquez sur votre avatar en haut à droite → « Mon profil ».", icon: Users },
        { title: "Modifiez vos infos", description: "Cliquez sur « Modifier » pour éditer nom, email, téléphone et entreprise.", icon: Edit },
        { title: "Enregistrez", description: "Cliquez sur « Enregistrer » pour sauvegarder.", icon: CheckCircle2 },
      ]},
      { type: "heading", text: "Paramètres" },
      { type: "paragraph", text: "La page Paramètres permet de configurer les options générales de la plateforme." },
    ],
  },
  {
    id: "language-guide",
    title: "Changer la langue",
    icon: BookOpen,
    category: "Personnalisation",
    content: [
      { type: "intro", text: "Fleet Rescue est disponible en français et en anglais. Changez la langue à tout moment depuis le header." },
      { type: "heading", text: "Comment changer la langue" },
      { type: "steps", steps: [
        { title: "Repérez le bouton de langue", description: "Dans le header, à côté de l'icône thème, cherchez le bouton avec l'icône globe et le code « FR » ou « EN ».", icon: BookOpen },
        { title: "Cliquez dessus", description: "La langue bascule instantanément entre français et anglais.", icon: MousePointer },
      ]},
      { type: "tip", text: "Votre préférence de langue est sauvegardée automatiquement. Au prochain chargement, la langue choisie sera restaurée." },
    ],
  },
  {
    id: "roles-guide",
    title: "Rôles et permissions",
    icon: Shield,
    category: "Administration",
    content: [
      { type: "intro", text: "Fleet Rescue utilise un système de rôles pour contrôler l'accès aux différentes fonctionnalités." },
      { type: "heading", text: "Les 3 rôles" },
      { type: "feature-grid", features: [
        { icon: Star, title: "Admin", description: "Accès complet à toutes les pages, gestion des rôles utilisateurs, audit logs" },
        { icon: Shield, title: "Modérateur", description: "Dispatch, facturation, analytics et paramètres en plus des pages standard" },
        { icon: Users, title: "Utilisateur", description: "Dashboard, prestataires, gestionnaires, interventions, techniciens, carte et documentation" },
      ]},
      { type: "heading", text: "Identifier votre rôle" },
      { type: "paragraph", text: "Votre rôle actuel est affiché en bas de la sidebar avec une icône distinctive : couronne pour Admin, bouclier pour Modérateur." },
      { type: "heading", text: "Gestion des rôles (Admin)" },
      { type: "steps", steps: [
        { title: "Accédez à la page Rôles", description: "Dans la sidebar, cliquez sur « Rôles » (visible uniquement pour les admins).", icon: Shield },
        { title: "Trouvez l'utilisateur", description: "Utilisez la barre de recherche pour trouver l'utilisateur concerné.", icon: Search },
        { title: "Changez le rôle", description: "Utilisez le menu déroulant pour sélectionner le nouveau rôle.", icon: Edit },
      ]},
      { type: "warning", text: "Vous ne pouvez pas modifier votre propre rôle pour des raisons de sécurité." },
    ],
  },
  {
    id: "faq",
    title: "FAQ",
    icon: HelpCircle,
    category: "Aide",
    content: [
      { type: "intro", text: "Questions fréquemment posées par les utilisateurs de Fleet Rescue." },
      { type: "faq", questions: [
        { q: "Comment créer une intervention rapidement ?", a: "Depuis la page Interventions, cliquez sur « Nouvelle intervention ». Remplissez les champs obligatoires (gestionnaire, prestataire, technicien, type de service, plaque et localisation) puis validez." },
        { q: "Comment assigner un prestataire depuis le Dispatch ?", a: "Cliquez sur une intervention en statut « En attente » puis sur le bouton « Assigner ». Choisissez un prestataire dans la liste déroulante et confirmez." },
        { q: "Comment exporter mes factures ?", a: "Sur la page Facturation, cliquez sur les boutons « CSV » ou « PDF » en haut à droite. Le fichier se télécharge automatiquement." },
        { q: "Que signifient les couleurs sur la carte ?", a: "Chaque couleur représente un statut : gris (en attente), bleu clair (assigné), violet (en route), orange (arrivé), vert (en cours), bleu (terminé)." },
        { q: "Comment activer le mode sombre ?", a: "Cliquez sur l'icône 🌙 dans le header en haut à droite. Votre préférence est sauvegardée automatiquement." },
        { q: "Comment changer la langue ?", a: "Cliquez sur le bouton FR/EN dans le header (icône globe). La langue change instantanément et votre choix est sauvegardé." },
        { q: "Comment voir l'historique des actions admin ?", a: "Rendez-vous sur la page « Audit Logs » dans le menu latéral. Vous pouvez filtrer par type d'action et chercher par mot-clé." },
        { q: "Où trouver la documentation technique ?", a: "La documentation technique est disponible dans le menu latéral → « Documentation »." },
        { q: "Comment contacter le support ?", a: "Contactez votre administrateur Fleet Rescue ou envoyez un email à support@fleetrescue.com." },
      ]},
    ],
  },
];

// ---------- Category grouping ----------
const categories = [...new Set(guideSections.map(s => s.category))];

// ---------- Render Helpers ----------
const GuideBlockRenderer = ({ block }: { block: GuideBlock }) => {
  switch (block.type) {
    case "intro":
      return (
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
          <p className="text-sm text-foreground/80 leading-relaxed">{block.text}</p>
        </div>
      );

    case "heading":
      return <h3 className="text-base font-bold text-foreground mt-8 mb-3 flex items-center gap-2">{block.text}</h3>;

    case "paragraph":
      return <p className="text-sm text-foreground/80 leading-relaxed">{block.text}</p>;

    case "steps":
      return (
        <div className="space-y-3">
          {block.steps.map((step, i) => {
            const Icon = step.icon || CheckCircle2;
            return (
              <div key={i} className="flex gap-4 items-start group">
                <div className="flex flex-col items-center">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <span className="text-xs font-bold text-primary">{i + 1}</span>
                  </div>
                  {i < block.steps.length - 1 && <div className="w-0.5 h-6 bg-border mt-1" />}
                </div>
                <div className="pt-1 pb-2">
                  <p className="text-sm font-semibold text-foreground">{step.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      );

    case "tip":
      return (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-success/10 border border-success/20">
          <Lightbulb className="h-4 w-4 text-success mt-0.5 shrink-0" />
          <p className="text-sm text-foreground/80">{block.text}</p>
        </div>
      );

    case "warning":
      return (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/20">
          <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
          <p className="text-sm text-foreground/80">{block.text}</p>
        </div>
      );

    case "feature-grid":
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {block.features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="p-4 rounded-xl bg-muted/40 border border-border/50 hover:bg-muted/60 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{f.title}</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            );
          })}
        </div>
      );

    case "shortcut-list":
      return (
        <div className="rounded-xl border border-border overflow-hidden">
          {block.items.map((item, i) => (
            <div key={i} className={cn("flex items-start gap-3 px-4 py-3", i > 0 && "border-t border-border")}>
              <span className="text-sm font-semibold text-foreground whitespace-nowrap min-w-[140px]">{item.action}</span>
              <span className="text-sm text-muted-foreground">{item.how}</span>
            </div>
          ))}
        </div>
      );

    case "faq":
      return (
        <div className="space-y-3">
          {block.questions.map((faq, i) => (
            <details key={i} className="group rounded-xl border border-border overflow-hidden">
              <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors">
                <ChevronRight className="h-4 w-4 text-muted-foreground group-open:rotate-90 transition-transform" />
                <span className="text-sm font-medium text-foreground">{faq.q}</span>
              </summary>
              <div className="px-4 pb-4 pt-1 ml-7">
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            </details>
          ))}
        </div>
      );

    default:
      return null;
  }
};

// ---------- Main Component ----------
const UserGuide = () => {
  const [activeSection, setActiveSection] = useState("getting-started");
  const [search, setSearch] = useState("");

  const filteredSections = guideSections.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.content.some(b =>
      ("text" in b && typeof (b as any).text === "string" && (b as any).text.toLowerCase().includes(search.toLowerCase()))
    )
  );

  const current = guideSections.find(s => s.id === activeSection) || guideSections[0];

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col lg:flex-row gap-6" style={{ minHeight: "calc(100vh - 140px)" }}>
        {/* Sidebar */}
        <div className="lg:w-72 shrink-0">
          <div className="sticky top-20 space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                Guide utilisateur
              </h1>
              <p className="text-xs text-muted-foreground mt-1">Fleet Rescue v1.0 — Tout pour bien démarrer</p>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher dans le guide..."
                className="h-9 w-full pl-8 pr-3 rounded-xl border border-input bg-background text-xs placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>

            <nav className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
              {categories.map(cat => {
                const catSections = filteredSections.filter(s => s.category === cat);
                if (catSections.length === 0) return null;
                return (
                  <div key={cat}>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-1">{cat}</p>
                    <div className="space-y-0.5">
                      {catSections.map(s => {
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
                    </div>
                  </div>
                );
              })}
            </nav>

            {/* Link to technical docs */}
            <Link
              to="/documentation"
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted/50 border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Book className="h-3.5 w-3.5" />
              Documentation technique →
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-card rounded-2xl border border-border p-6 lg:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <current.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{current.title}</h2>
                <p className="text-xs text-muted-foreground">{current.category} — Guide utilisateur</p>
              </div>
            </div>

            <div className="space-y-5 max-w-none">
              {current.content.map((block, i) => (
                <GuideBlockRenderer key={i} block={block} />
              ))}
            </div>
          </div>

          {/* Nav */}
          <div className="flex justify-between mt-4 mb-8">
            {(() => {
              const idx = guideSections.findIndex(s => s.id === activeSection);
              const prev = idx > 0 ? guideSections[idx - 1] : null;
              const next = idx < guideSections.length - 1 ? guideSections[idx + 1] : null;
              return (
                <>
                  {prev ? (
                    <button onClick={() => { setActiveSection(prev.id); window.scrollTo(0, 0); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <ChevronRight className="h-4 w-4 rotate-180" />
                      {prev.title}
                    </button>
                  ) : <div />}
                  {next ? (
                    <button onClick={() => { setActiveSection(next.id); window.scrollTo(0, 0); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-sm text-primary font-medium hover:bg-primary/20 transition-colors">
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

export default UserGuide;
