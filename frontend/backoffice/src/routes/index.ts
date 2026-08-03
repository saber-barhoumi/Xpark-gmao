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
const PredictionPannes = lazy(() => import('@/app/(admin)/maintenance/prediction-pannes/page'))

// HR / Users
const Employees        = lazy(() => import('@/app/(admin)/hr/employees/page'))
const PendingUsers     = lazy(() => import('@/app/(admin)/users/pending/page'))
const UserArchives     = lazy(() => import('@/app/(admin)/users/archives/page'))
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
const Error404Alt      = lazy(() => import('@/app/(admin)/pages/error-404-alt/page'))

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
  { name: 'prediction-pannes', path: '/maintenance/prediction-pannes', element: createElement(PredictionPannes), allowedRoles: ['ADMIN', 'ADMINISTRATEUR', 'GESTIONNAIRE', 'TECHNICIEN'] },

  // HR / Users
  { name: 'employees',    path: '/hr/employees',        element: createElement(Employees),  allowedRoles: ['ADMIN', 'RH'] },
  { name: 'pending-users',path: '/users/pending',       element: createElement(PendingUsers), allowedRoles: ['ADMIN'] },
  { name: 'user-archives',path: '/users/archives',      element: createElement(UserArchives), allowedRoles: ['ADMIN', 'ADMINISTRATEUR'] },
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
  { name: 'error-404-alt',path: '/pages/error-404-alt', element: createElement(Error404Alt) },

  // Layouts

  // Charts

  // Forms

  // Tables

  // Maps

  // UI

  // Extended

  // Icons
]
