import { MenuItemType } from "@/types/layout"



export const MENU_ITEMS: MenuItemType[] = [
  // ── Pilotage ────────────────────────────────────────────────
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: 'ri:dashboard-3-line',
    url: '/dashboard',
  },

  // ── Opérations (le cœur du métier, en haut) ─────────────────
  { key: 'sec-operations', label: 'Opérations', isTitle: true },
  {
    key: 'missions',
    label: 'Missions',
    icon: 'ri:truck-line',
    url: '/gestion/missions',
  },
  {
    key: 'mes-missions',
    label: 'Mes Missions',
    icon: 'ri:truck-line',
    url: '/gestion/mes-missions',
  },
  {
    key: 'suivi',
    label: 'Suivi en Direct',
    icon: 'ri:base-station-line',
    url: '/gestion/suivi',
    badge: { text: 'Live', variant: 'danger' },
  },
  {
    key: 'planification',
    label: 'Planification',
    icon: 'tabler:calendar',
    url: '/apps/calendar',
  },
  {
    key: 'optimisateur',
    label: 'Optimisateur IA',
    icon: 'ri:brain-line',
    url: '/gestion/optimisateur',
    badge: { text: 'IA', variant: 'success' },
  },
  {
    key: 'chat',
    label: 'Messagerie',
    icon: 'tabler:message',
    url: '/apps/chat',
  },
  {
    key: 'taches',
    label: 'Tâches',
    icon: 'tabler:layout-kanban',
    children: [
      { key: 'kanban', label: 'Kanban', url: '/tasks/kanban', parentKey: 'taches' },
      { key: 'view-details', label: 'Vue détaillée', url: '/tasks/view-details', parentKey: 'taches' },
    ],
  },

  // ── Clients & Ventes ────────────────────────────────────────
  { key: 'sec-clients', label: 'Clients & Ventes', isTitle: true },
  {
    key: 'demandes-transport',
    label: 'Demandes de Transport',
    icon: 'ri:price-tag-3-line',
    url: '/gestion/demandes-transport',
    badge: { text: 'Devis', variant: 'warning' },
  },
  {
    key: 'contacts',
    label: 'Contacts',
    icon: 'tabler:address-book',
    url: '/users/contacts',
  },

  // ── Flotte ──────────────────────────────────────────────────
  { key: 'sec-flotte', label: 'Gestion Flotte', isTitle: true },
  {
    key: 'vehicules',
    label: 'Véhicules',
    icon: 'ri:car-line',
    url: '/gestion/vehicules',
  },
  {
    key: 'employes',
    label: 'Employés & Chauffeurs',
    icon: 'ri:steering-2-line',
    url: '/hr/employees',
  },
  {
    key: 'equipements',
    label: 'Équipements',
    icon: 'ri:box-3-line',
    url: '/gestion/equipements',
  },

  // ── Maintenance ─────────────────────────────────────────────
  { key: 'sec-maintenance', label: 'Maintenance', isTitle: true },
  {
    key: 'maintenance-interventions',
    label: 'Interventions',
    icon: 'ri:tools-line',
    url: '/maintenance/interventions',
  },
  {
    key: 'maintenance-ordres',
    label: 'Ordres de Travail',
    icon: 'ri:file-list-3-line',
    url: '/maintenance/ordres-travail',
  },
  {
    key: 'maintenance-pieces',
    label: 'Pièces de Rechange',
    icon: 'ri:settings-5-line',
    url: '/maintenance/pieces-rechange',
  },
  {
    key: 'maintenance-prediction',
    label: 'Prédiction de Pannes',
    icon: 'ri:radar-line',
    url: '/maintenance/prediction-pannes',
    badge: { text: 'IA', variant: 'info' },
  },

  // ── Finance ─────────────────────────────────────────────────
  { key: 'sec-finance', label: 'Finance', isTitle: true },
  {
    key: 'factures',
    label: 'Factures',
    icon: 'tabler:invoice',
    children: [
      { key: 'invoices', label: 'Liste des factures', url: '/invoices', parentKey: 'factures' },
      { key: 'create-invoice', label: 'Créer une facture', url: '/invoices/create-invoice', parentKey: 'factures' },
      { key: 'view-invoice', label: 'Aperçu facture', url: '/invoices/view-invoice', parentKey: 'factures' },
    ],
  },
  {
    key: 'carburant',
    label: 'Carburant',
    icon: 'ri:gas-station-line',
    url: '/operations/carburant',
  },
  {
    key: 'sources',
    label: "Sources d'Approvisionnement",
    icon: 'ri:map-pin-line',
    url: '/operations/sources',
  },

  // ── Analyses ────────────────────────────────────────────────
  { key: 'sec-analyses', label: 'Analyses', isTitle: true },
  {
    key: 'analytics',
    label: 'Analyses & KPIs',
    icon: 'ri:pie-chart-line',
    url: '/analytics',
  },
  {
    key: 'iboa',
    label: 'Assistant IBOA',
    icon: 'ri:radar-line',
    url: '/monitoring/iboa',
    badge: { text: 'IA', variant: 'danger' },
  },

  // ── Administration ──────────────────────────────────────────
  { key: 'sec-admin', label: 'Administration', isTitle: true },
  {
    key: 'users',
    label: 'Utilisateurs',
    icon: 'tabler:user-square-rounded',
    children: [
      { key: 'users-accounts', label: 'Tous les comptes', url: '/users', parentKey: 'users' },
      { key: 'pending-users', label: 'Admissions', url: '/users/pending', parentKey: 'users' },
      { key: 'user-archives', label: 'Archives', url: '/users/archives', parentKey: 'users' },
    ],
  },
  {
    key: 'alertes',
    label: 'Alertes',
    icon: 'ri:alarm-warning-line',
    url: '/alertes',
  },

  // ── Pages complémentaires (existantes, usage occasionnel) ───
  // Items directs (comme le reste du menu) plutôt qu'un sous-menu déroulant :
  // même indentation, même icône, cohérent avec les autres sections.
  { key: 'sec-autres', label: 'Autres', isTitle: true },
  { key: 'projects',     label: 'Projets',                 icon: 'tabler:folders',      url: '/apps/Projects' },
  { key: 'file-manager', label: 'Gestionnaire de fichiers', icon: 'tabler:folder',       url: '/apps/file-manager' },
  { key: 'wallet',       label: 'Trésorerie',              icon: 'tabler:wallet',       url: '/wallet' },

  // ── Mon Compte (personnel, visible par tous les rôles) ──────
  { key: 'sec-compte', label: 'Mon Compte', isTitle: true },
  { key: 'profile',    label: 'Profil',           icon: 'tabler:user-circle', url: '/users/profile' },
  { key: 'security',   label: 'Sécurité (MFA)',   icon: 'ri:shield-keyhole-line', url: '/security' },
  { key: 'faq',         label: 'FAQ / Support',    icon: 'tabler:help-circle', url: '/pages/faq' },
]
