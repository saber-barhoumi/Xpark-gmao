import { lazy } from 'react'
import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'

export interface AppRoute {
  name: string
  path: string
  element: ReactNode
  allowedRoles?: string[]
}

// ─── Auth / Public ───────────────────────────────────────────────────────────
const Login            = lazy(() => import('@/app/(other)/auth/login/page'))
const Register         = lazy(() => import('@/app/(other)/auth/register/page'))
const Logout           = lazy(() => import('@/app/(other)/auth/logout/page'))
const RecoverPassword  = lazy(() => import('@/app/(other)/auth/recover-password/page'))
const CreatePassword   = lazy(() => import('@/app/(other)/auth/create-password/page'))
const LockScreen       = lazy(() => import('@/app/(other)/auth/lock-screen/page'))
const ConfirmMail      = lazy(() => import('@/app/(other)/auth/confirm-mail/page'))
const LoginPin         = lazy(() => import('@/app/(other)/auth/login-pin/page'))
const ComingSoon       = lazy(() => import('@/app/(other)/coming-soon/page'))
const MaintenancePage  = lazy(() => import('@/app/(other)/maintenance/page'))
const Error400         = lazy(() => import('@/app/(other)/errors/error-400/page'))
const Error401         = lazy(() => import('@/app/(other)/errors/error-401/page'))
const Error403         = lazy(() => import('@/app/(other)/errors/error-403/page'))
const Error404         = lazy(() => import('@/app/(other)/errors/error-404/page'))
const Error500         = lazy(() => import('@/app/(other)/errors/error-500/page'))
const ServiceUnavail   = lazy(() => import('@/app/(other)/errors/service-unavailable/page'))

// ─── Admin Pages ─────────────────────────────────────────────────────────────
const Dashboard        = lazy(() => import('@/app/(admin)/dashboard/page'))
const Analytics        = lazy(() => import('@/app/(admin)/analytics/page'))
const Alertes          = lazy(() => import('@/app/(admin)/alertes/page'))

// Apps
const Chat             = lazy(() => import('@/app/(admin)/apps/chat/page'))
const Calendar         = lazy(() => import('@/app/(admin)/apps/calendar/page'))
const Email            = lazy(() => import('@/app/(admin)/apps/email/page'))
const FileManager      = lazy(() => import('@/app/(admin)/apps/file-manager/page'))
const Projects         = lazy(() => import('@/app/(admin)/apps/Projects/page'))

// Fleet / GMAO
const Vehicules        = lazy(() => import('@/app/(admin)/gestion/vehicules/page'))
const Missions         = lazy(() => import('@/app/(admin)/gestion/missions/page'))
const DemandesTransport = lazy(() => import('@/app/(admin)/gestion/demandes-transport/page'))
const Suivi            = lazy(() => import('@/app/(admin)/gestion/suivi/page'))
const Optimisateur     = lazy(() => import('@/app/(admin)/gestion/optimisateur/page'))
const IboaAssistant    = lazy(() => import('@/app/(admin)/monitoring/iboa/page'))
const SecurityPage     = lazy(() => import('@/app/(admin)/security/page'))
const UsersAccounts    = lazy(() => import('@/app/(admin)/users/page'))
const Equipements      = lazy(() => import('@/app/(admin)/gestion/equipements/page'))
const EquipementDetail = lazy(() => import('@/app/(admin)/gestion/equipements/[id]/page'))
const Sources          = lazy(() => import('@/app/(admin)/operations/sources/page'))
const Carburant        = lazy(() => import('@/app/(admin)/operations/carburant/page'))

// Maintenance
const OrdresTravail    = lazy(() => import('@/app/(admin)/maintenance/ordres-travail/page'))
const Interventions    = lazy(() => import('@/app/(admin)/maintenance/interventions/page'))
const PiecesRechange   = lazy(() => import('@/app/(admin)/maintenance/pieces-rechange/page'))

// HR / Users
const Employees        = lazy(() => import('@/app/(admin)/hr/employees/page'))
const PendingUsers     = lazy(() => import('@/app/(admin)/users/pending/page'))
const Contacts         = lazy(() => import('@/app/(admin)/users/contacts/page'))
const Profile          = lazy(() => import('@/app/(admin)/users/profile/page'))
const ProfileEdit      = lazy(() => import('@/app/(admin)/users/profile/edit/page'))

// Finance
const Wallet           = lazy(() => import('@/app/(admin)/wallet/page'))
const Invoices         = lazy(() => import('@/app/(admin)/invoices/page'))
const ViewInvoice      = lazy(() => import('@/app/(admin)/invoices/view-invoice/page'))
const CreateInvoice    = lazy(() => import('@/app/(admin)/invoices/create-invoice/page'))

// Tasks
const Kanban           = lazy(() => import('@/app/(admin)/tasks/kanban/page'))
const ViewDetails      = lazy(() => import('@/app/(admin)/tasks/view-details/page'))

// Static pages
const FAQ              = lazy(() => import('@/app/(admin)/pages/faq/page'))
const Pricing          = lazy(() => import('@/app/(admin)/pages/pricing/page'))
const StarterPage      = lazy(() => import('@/app/(admin)/pages/starter-page/page'))
const Timeline         = lazy(() => import('@/app/(admin)/pages/timeline/page'))
const Error404Alt      = lazy(() => import('@/app/(admin)/pages/error-404-alt/page'))

// Layouts
const Horizontal       = lazy(() => import('@/app/(admin)/(layout)/horizontal/page'))
const Detached         = lazy(() => import('@/app/(admin)/(layout)/detached/page'))
const FullView         = lazy(() => import('@/app/(admin)/(layout)/full-view/page'))
const FullscreenView   = lazy(() => import('@/app/(admin)/(layout)/fullscreen-view/page'))
const HoverMenu        = lazy(() => import('@/app/(admin)/(layout)/hover-menu/page'))
const Compact          = lazy(() => import('@/app/(admin)/(layout)/compact/page'))
const IconView         = lazy(() => import('@/app/(admin)/(layout)/icon-view/page'))
const DarkMode         = lazy(() => import('@/app/(admin)/(layout)/dark-mode/page'))

// Charts
const AreaChart        = lazy(() => import('@/app/(admin)/charts/area/page'))
const BarChart         = lazy(() => import('@/app/(admin)/charts/bar/page'))
const BoxplotChart     = lazy(() => import('@/app/(admin)/charts/boxplot/page'))
const BubbleChart      = lazy(() => import('@/app/(admin)/charts/bubble/page'))
const CandlestickChart = lazy(() => import('@/app/(admin)/charts/candlestick/page'))
const ColumnChart      = lazy(() => import('@/app/(admin)/charts/column/page'))
const FunnelChart      = lazy(() => import('@/app/(admin)/charts/funnel/page'))
const HeatmapChart     = lazy(() => import('@/app/(admin)/charts/heatmap/page'))
const LineChart        = lazy(() => import('@/app/(admin)/charts/line/page'))
const MixedChart       = lazy(() => import('@/app/(admin)/charts/mixed/page'))
const PieChart         = lazy(() => import('@/app/(admin)/charts/pie/page'))
const PolarChart       = lazy(() => import('@/app/(admin)/charts/polar/page'))
const RadarChart       = lazy(() => import('@/app/(admin)/charts/radar/page'))
const RadialBarChart   = lazy(() => import('@/app/(admin)/charts/radialBar/page'))
const ScatterChart     = lazy(() => import('@/app/(admin)/charts/scatter/page'))
const SlopeChart       = lazy(() => import('@/app/(admin)/charts/slope/page'))
const SparklinesChart  = lazy(() => import('@/app/(admin)/charts/sparklines/page'))
const TimelineChart    = lazy(() => import('@/app/(admin)/charts/timeline/page'))
const TreemapChart     = lazy(() => import('@/app/(admin)/charts/treemap/page'))

// Forms
const FormsBasic       = lazy(() => import('@/app/(admin)/forms/basic/page'))
const FormsEditors     = lazy(() => import('@/app/(admin)/forms/editors/page'))
const FormsFileUploads = lazy(() => import('@/app/(admin)/forms/file-uploads/page'))
const FormsInputmask   = lazy(() => import('@/app/(admin)/forms/inputmask/page'))
const FormsLayouts     = lazy(() => import('@/app/(admin)/forms/layouts/page'))
const FormsPicker      = lazy(() => import('@/app/(admin)/forms/picker/page'))
const FormsSelect      = lazy(() => import('@/app/(admin)/forms/select/page'))
const FormsSlider      = lazy(() => import('@/app/(admin)/forms/slider/page'))
const FormsValidation  = lazy(() => import('@/app/(admin)/forms/validation/page'))
const FormsWizard      = lazy(() => import('@/app/(admin)/forms/wizard/page'))

// Tables
const TablesBasic      = lazy(() => import('@/app/(admin)/tables/basic/page'))
const TablesDatatable  = lazy(() => import('@/app/(admin)/tables/datatable-tables/page'))
const TablesGridJs     = lazy(() => import('@/app/(admin)/tables/gridJs/page'))

// Maps
const MapsGoogle       = lazy(() => import('@/app/(admin)/maps/google/page'))
const MapsLeaflet      = lazy(() => import('@/app/(admin)/maps/leaflet/page'))
const MapsVector       = lazy(() => import('@/app/(admin)/maps/vector/page'))

// UI
const UIAccordions     = lazy(() => import('@/app/(admin)/ui/accordions/page'))
const UIAlerts         = lazy(() => import('@/app/(admin)/ui/alerts/page'))
const UIAvatars        = lazy(() => import('@/app/(admin)/ui/avatars/page'))
const UIBadges         = lazy(() => import('@/app/(admin)/ui/badges/page'))
const UIBreadcrumb     = lazy(() => import('@/app/(admin)/ui/breadcrumb/page'))
const UIButtons        = lazy(() => import('@/app/(admin)/ui/buttons/page'))
const UICards          = lazy(() => import('@/app/(admin)/ui/cards/page'))
const UICarousel       = lazy(() => import('@/app/(admin)/ui/carousel/page'))
const UICollapse       = lazy(() => import('@/app/(admin)/ui/collapse/page'))
const UIDropdowns      = lazy(() => import('@/app/(admin)/ui/dropdowns/page'))
const UIGrid           = lazy(() => import('@/app/(admin)/ui/grid/page'))
const UILinks          = lazy(() => import('@/app/(admin)/ui/links/page'))
const UIListGroup      = lazy(() => import('@/app/(admin)/ui/list-group/page'))
const UIModals         = lazy(() => import('@/app/(admin)/ui/modals/page'))
const UINotifications  = lazy(() => import('@/app/(admin)/ui/notifications/page'))
const UIOffcanvas      = lazy(() => import('@/app/(admin)/ui/offcanvas/page'))
const UIPagination     = lazy(() => import('@/app/(admin)/ui/pagination/page'))
const UIPlaceholders   = lazy(() => import('@/app/(admin)/ui/placeholders/page'))
const UIPopovers       = lazy(() => import('@/app/(admin)/ui/popovers/page'))
const UIProgress       = lazy(() => import('@/app/(admin)/ui/progress/page'))
const UIRatio          = lazy(() => import('@/app/(admin)/ui/ratio/page'))
const UISpinners       = lazy(() => import('@/app/(admin)/ui/spinners/page'))
const UITabs           = lazy(() => import('@/app/(admin)/ui/tabs/page'))
const UITooltips       = lazy(() => import('@/app/(admin)/ui/tooltips/page'))
const UITypography     = lazy(() => import('@/app/(admin)/ui/typography/page'))
const UIUtilities      = lazy(() => import('@/app/(admin)/ui/utilities/page'))

// Extended
const Dragula          = lazy(() => import('@/app/(admin)/extended/dragula/page'))
const Ratings          = lazy(() => import('@/app/(admin)/extended/ratings/page'))
const Scrollbar        = lazy(() => import('@/app/(admin)/extended/scrollbar/page'))
const SweetAlert       = lazy(() => import('@/app/(admin)/extended/sweet-alert/page'))

// Icons
const IconsRemix       = lazy(() => import('@/app/(admin)/icons/remix/page'))
const IconsSolar       = lazy(() => import('@/app/(admin)/icons/solar/page'))
const IconsTabler      = lazy(() => import('@/app/(admin)/icons/tabler/page'))

// ─── PUBLIC ROUTES (no auth required) ────────────────────────────────────────
import { createElement } from 'react'

export const PUBLIC_ROUTES: AppRoute[] = [
  { name: 'login',              path: '/auth/login',            element: createElement(Login) },
  { name: 'register',           path: '/auth/register',         element: createElement(Register) },
  { name: 'logout',             path: '/auth/logout',           element: createElement(Logout) },
  { name: 'recover-password',   path: '/auth/recover-password', element: createElement(RecoverPassword) },
  { name: 'create-password',    path: '/auth/create-password',  element: createElement(CreatePassword) },
  { name: 'lock-screen',        path: '/auth/lock-screen',      element: createElement(LockScreen) },
  { name: 'confirm-mail',       path: '/auth/confirm-mail',     element: createElement(ConfirmMail) },
  { name: 'login-pin',          path: '/auth/login-pin',        element: createElement(LoginPin) },
  { name: 'coming-soon',        path: '/coming-soon',           element: createElement(ComingSoon) },
  { name: 'maintenance',        path: '/maintenance',           element: createElement(MaintenancePage) },
  { name: 'error-400',          path: '/errors/error-400',      element: createElement(Error400) },
  { name: 'error-401',          path: '/errors/error-401',      element: createElement(Error401) },
  { name: 'error-403',          path: '/errors/error-403',      element: createElement(Error403) },
  { name: 'error-404',          path: '/errors/error-404',      element: createElement(Error404) },
  { name: 'error-500',          path: '/errors/error-500',      element: createElement(Error500) },
  { name: 'service-unavailable',path: '/errors/service-unavailable', element: createElement(ServiceUnavail) },
]

// ─── PROTECTED ROUTES (auth required) ────────────────────────────────────────
export const APP_ROUTES: AppRoute[] = [
  // Root redirect → dashboard (ProtectedRoute will redirect to /auth/login if not authenticated)
  { name: 'root',        path: '/',           element: createElement(Navigate, { to: '/dashboard', replace: true }) },

  // Dashboard & Analytics
  { name: 'dashboard',   path: '/dashboard',  element: createElement(Dashboard) },
  { name: 'analytics',   path: '/analytics',  element: createElement(Analytics) },
  { name: 'alertes',     path: '/alertes',    element: createElement(Alertes) },

  // Apps
  { name: 'chat',         path: '/apps/chat',          element: createElement(Chat) },
  { name: 'calendar',     path: '/apps/calendar',      element: createElement(Calendar) },
  { name: 'email',        path: '/apps/email',         element: createElement(Email) },
  { name: 'file-manager', path: '/apps/file-manager',  element: createElement(FileManager) },
  { name: 'projects',     path: '/apps/Projects',      element: createElement(Projects) },

  // Fleet management
  { name: 'vehicules',        path: '/gestion/vehicules',          element: createElement(Vehicules) },
  { name: 'missions',         path: '/gestion/missions',           element: createElement(Missions) },
  { name: 'demandes-transport', path: '/gestion/demandes-transport', element: createElement(DemandesTransport), allowedRoles: ['ADMIN', 'ADMINISTRATEUR', 'GESTIONNAIRE'] },
  { name: 'suivi',            path: '/gestion/suivi',              element: createElement(Suivi), allowedRoles: ['ADMIN', 'ADMINISTRATEUR', 'GESTIONNAIRE'] },
  { name: 'optimisateur',     path: '/gestion/optimisateur',       element: createElement(Optimisateur), allowedRoles: ['ADMIN', 'ADMINISTRATEUR', 'GESTIONNAIRE'] },
  { name: 'iboa',             path: '/monitoring/iboa',            element: createElement(IboaAssistant), allowedRoles: ['ADMIN', 'ADMINISTRATEUR', 'GESTIONNAIRE'] },
  { name: 'security',         path: '/security',                   element: createElement(SecurityPage) },
  { name: 'equipements',      path: '/gestion/equipements',        element: createElement(Equipements) },
  { name: 'equipement-detail',path: '/gestion/equipements/:id',    element: createElement(EquipementDetail) },
  { name: 'sources',          path: '/operations/sources',         element: createElement(Sources) },
  { name: 'carburant',        path: '/operations/carburant',       element: createElement(Carburant) },

  // Maintenance
  { name: 'ordres-travail',   path: '/maintenance/ordres-travail',  element: createElement(OrdresTravail) },
  { name: 'interventions',    path: '/maintenance/interventions',   element: createElement(Interventions) },
  { name: 'pieces-rechange',  path: '/maintenance/pieces-rechange', element: createElement(PiecesRechange) },

  // HR / Users
  { name: 'employees',    path: '/hr/employees',        element: createElement(Employees),  allowedRoles: ['ADMIN', 'RH'] },
  { name: 'pending-users',path: '/users/pending',       element: createElement(PendingUsers), allowedRoles: ['ADMIN'] },
  { name: 'users-accounts',path: '/users',              element: createElement(UsersAccounts), allowedRoles: ['ADMIN', 'ADMINISTRATEUR', 'GESTIONNAIRE'] },
  { name: 'contacts',     path: '/users/contacts',      element: createElement(Contacts) },
  { name: 'profile',      path: '/users/profile',       element: createElement(Profile) },
  { name: 'profile-edit', path: '/users/profile/edit',  element: createElement(ProfileEdit) },

  // Finance
  { name: 'wallet',         path: '/wallet',                   element: createElement(Wallet) },
  { name: 'invoices',       path: '/invoices',                 element: createElement(Invoices) },
  { name: 'view-invoice',   path: '/invoices/view-invoice',    element: createElement(ViewInvoice) },
  { name: 'create-invoice', path: '/invoices/create-invoice',  element: createElement(CreateInvoice) },

  // Tasks
  { name: 'kanban',       path: '/tasks/kanban',        element: createElement(Kanban) },
  { name: 'view-details', path: '/tasks/view-details',  element: createElement(ViewDetails) },

  // Pages
  { name: 'faq',          path: '/pages/faq',           element: createElement(FAQ) },
  { name: 'pricing',      path: '/pages/pricing',       element: createElement(Pricing) },
  { name: 'starter-page', path: '/pages/starter-page',  element: createElement(StarterPage) },
  { name: 'timeline',     path: '/pages/timeline',      element: createElement(Timeline) },
  { name: 'error-404-alt',path: '/pages/error-404-alt', element: createElement(Error404Alt) },

  // Layouts
  { name: 'horizontal',     path: '/horizontal',      element: createElement(Horizontal) },
  { name: 'detached',       path: '/detached',        element: createElement(Detached) },
  { name: 'full-view',      path: '/full-view',       element: createElement(FullView) },
  { name: 'fullscreen-view',path: '/fullscreen-view', element: createElement(FullscreenView) },
  { name: 'hover-menu',     path: '/hover-menu',      element: createElement(HoverMenu) },
  { name: 'compact',        path: '/compact',         element: createElement(Compact) },
  { name: 'icon-view',      path: '/icon-view',       element: createElement(IconView) },
  { name: 'dark-mode',      path: '/dark-mode',       element: createElement(DarkMode) },

  // Charts
  { name: 'chart-area',       path: '/charts/area',        element: createElement(AreaChart) },
  { name: 'chart-bar',        path: '/charts/bar',         element: createElement(BarChart) },
  { name: 'chart-boxplot',    path: '/charts/boxplot',     element: createElement(BoxplotChart) },
  { name: 'chart-bubble',     path: '/charts/bubble',      element: createElement(BubbleChart) },
  { name: 'chart-candlestick',path: '/charts/candlestick', element: createElement(CandlestickChart) },
  { name: 'chart-column',     path: '/charts/column',      element: createElement(ColumnChart) },
  { name: 'chart-funnel',     path: '/charts/funnel',      element: createElement(FunnelChart) },
  { name: 'chart-heatmap',    path: '/charts/heatmap',     element: createElement(HeatmapChart) },
  { name: 'chart-line',       path: '/charts/line',        element: createElement(LineChart) },
  { name: 'chart-mixed',      path: '/charts/mixed',       element: createElement(MixedChart) },
  { name: 'chart-pie',        path: '/charts/pie',         element: createElement(PieChart) },
  { name: 'chart-polar',      path: '/charts/polar',       element: createElement(PolarChart) },
  { name: 'chart-radar',      path: '/charts/radar',       element: createElement(RadarChart) },
  { name: 'chart-radialBar',  path: '/charts/radialBar',   element: createElement(RadialBarChart) },
  { name: 'chart-scatter',    path: '/charts/scatter',     element: createElement(ScatterChart) },
  { name: 'chart-slope',      path: '/charts/slope',       element: createElement(SlopeChart) },
  { name: 'chart-sparklines', path: '/charts/sparklines',  element: createElement(SparklinesChart) },
  { name: 'chart-timeline',   path: '/charts/timeline',    element: createElement(TimelineChart) },
  { name: 'chart-treemap',    path: '/charts/treemap',     element: createElement(TreemapChart) },

  // Forms
  { name: 'forms-basic',        path: '/forms/basic',        element: createElement(FormsBasic) },
  { name: 'forms-editors',      path: '/forms/editors',      element: createElement(FormsEditors) },
  { name: 'forms-file-uploads', path: '/forms/file-uploads', element: createElement(FormsFileUploads) },
  { name: 'forms-inputmask',    path: '/forms/inputmask',    element: createElement(FormsInputmask) },
  { name: 'forms-layouts',      path: '/forms/layouts',      element: createElement(FormsLayouts) },
  { name: 'forms-picker',       path: '/forms/picker',       element: createElement(FormsPicker) },
  { name: 'forms-select',       path: '/forms/select',       element: createElement(FormsSelect) },
  { name: 'forms-slider',       path: '/forms/slider',       element: createElement(FormsSlider) },
  { name: 'forms-validation',   path: '/forms/validation',   element: createElement(FormsValidation) },
  { name: 'forms-wizard',       path: '/forms/wizard',       element: createElement(FormsWizard) },

  // Tables
  { name: 'tables-basic',     path: '/tables/basic',            element: createElement(TablesBasic) },
  { name: 'tables-datatable', path: '/tables/datatable-tables', element: createElement(TablesDatatable) },
  { name: 'tables-gridjs',    path: '/tables/gridJs',           element: createElement(TablesGridJs) },

  // Maps
  { name: 'maps-google',  path: '/maps/google',  element: createElement(MapsGoogle) },
  { name: 'maps-leaflet', path: '/maps/leaflet', element: createElement(MapsLeaflet) },
  { name: 'maps-vector',  path: '/maps/vector',  element: createElement(MapsVector) },

  // UI
  { name: 'ui-accordions',   path: '/ui/accordions',   element: createElement(UIAccordions) },
  { name: 'ui-alerts',       path: '/ui/alerts',       element: createElement(UIAlerts) },
  { name: 'ui-avatars',      path: '/ui/avatars',      element: createElement(UIAvatars) },
  { name: 'ui-badges',       path: '/ui/badges',       element: createElement(UIBadges) },
  { name: 'ui-breadcrumb',   path: '/ui/breadcrumb',   element: createElement(UIBreadcrumb) },
  { name: 'ui-buttons',      path: '/ui/buttons',      element: createElement(UIButtons) },
  { name: 'ui-cards',        path: '/ui/cards',        element: createElement(UICards) },
  { name: 'ui-carousel',     path: '/ui/carousel',     element: createElement(UICarousel) },
  { name: 'ui-collapse',     path: '/ui/collapse',     element: createElement(UICollapse) },
  { name: 'ui-dropdowns',    path: '/ui/dropdowns',    element: createElement(UIDropdowns) },
  { name: 'ui-grid',         path: '/ui/grid',         element: createElement(UIGrid) },
  { name: 'ui-links',        path: '/ui/links',        element: createElement(UILinks) },
  { name: 'ui-list-group',   path: '/ui/list-group',   element: createElement(UIListGroup) },
  { name: 'ui-modals',       path: '/ui/modals',       element: createElement(UIModals) },
  { name: 'ui-notifications',path: '/ui/notifications',element: createElement(UINotifications) },
  { name: 'ui-offcanvas',    path: '/ui/offcanvas',    element: createElement(UIOffcanvas) },
  { name: 'ui-pagination',   path: '/ui/pagination',   element: createElement(UIPagination) },
  { name: 'ui-placeholders', path: '/ui/placeholders', element: createElement(UIPlaceholders) },
  { name: 'ui-popovers',     path: '/ui/popovers',     element: createElement(UIPopovers) },
  { name: 'ui-progress',     path: '/ui/progress',     element: createElement(UIProgress) },
  { name: 'ui-ratio',        path: '/ui/ratio',        element: createElement(UIRatio) },
  { name: 'ui-spinners',     path: '/ui/spinners',     element: createElement(UISpinners) },
  { name: 'ui-tabs',         path: '/ui/tabs',         element: createElement(UITabs) },
  { name: 'ui-tooltips',     path: '/ui/tooltips',     element: createElement(UITooltips) },
  { name: 'ui-typography',   path: '/ui/typography',   element: createElement(UITypography) },
  { name: 'ui-utilities',    path: '/ui/utilities',    element: createElement(UIUtilities) },

  // Extended
  { name: 'dragula',     path: '/extended/dragula',     element: createElement(Dragula) },
  { name: 'ratings',     path: '/extended/ratings',     element: createElement(Ratings) },
  { name: 'scrollbar',   path: '/extended/scrollbar',   element: createElement(Scrollbar) },
  { name: 'sweet-alert', path: '/extended/sweet-alert', element: createElement(SweetAlert) },

  // Icons
  { name: 'icons-remix',  path: '/icons/remix',  element: createElement(IconsRemix) },
  { name: 'icons-solar',  path: '/icons/solar',  element: createElement(IconsSolar) },
  { name: 'icons-tabler', path: '/icons/tabler', element: createElement(IconsTabler) },
]
