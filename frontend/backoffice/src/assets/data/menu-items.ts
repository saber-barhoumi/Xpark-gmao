import { MenuItemType } from "@/types/layout"



export const MENU_ITEMS: MenuItemType[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: 'ri:dashboard-3-line',
    url: '/dashboard',
  },
  {
    key: 'analytics',
    label: 'Analyses & KPIs',
    icon: 'ri:pie-chart-line',
    badge: {
      text: "New",
      variant: "success",
    },
    url: '/analytics',
  },
  {
    key: 'chat',
    label: 'Chat',
    icon: 'tabler:message',
    url: '/apps/chat',
  },
  {
    key: 'calendar',
    label: 'Calendar',
    icon: 'tabler:calendar',
    url: '/apps/calendar',
  },
  {
    key: 'users',
    label: 'Users',
    icon: 'tabler:user-square-rounded',
    children: [
      {
        key: 'pending-users',
        label: 'Admissions',
        url: '/users/pending',
        parentKey: 'users',
      },
      {
        key: 'contacts',
        label: 'Contacts',
        url: '/users/contacts',
        parentKey: 'users',
      },
      {
        key: 'profile',
        label: 'Profile',
        url: '/users/profile',
        parentKey: 'users',
      },
    ]
  },
  {
    key: 'gestion-flotte',
    label: 'Gestion Flotte',
    icon: 'ri:car-line',
    children: [
      {
        key: 'vehicules',
        label: 'Véhicules',
        url: '/gestion/vehicules',
        parentKey: 'gestion-flotte',
      },
      {
        key: 'missions',
        label: 'Missions',
        url: '/gestion/missions',
        parentKey: 'gestion-flotte',
      },
      {
        key: 'equipements',
        label: 'Équipements',
        url: '/gestion/equipements',
        parentKey: 'gestion-flotte',
      },
    ],
  },
  {
    key: 'operations',
    label: 'Opérations',
    icon: 'ri:compass-3-line',
    children: [
      {
        key: 'operations-sources',
        label: "Sources d'Approvisionnement",
        url: '/operations/sources',
        parentKey: 'operations',
      },
      {
        key: 'operations-carburant',
        label: 'Consommation Carburant',
        url: '/operations/carburant',
        parentKey: 'operations',
      },
    ],
  },
  {
    key: 'maintenance',

    label: 'Maintenance',
    icon: 'ri:tools-line',
    children: [
      {
        key: 'maintenance-ordres',
        label: 'Ordres de Travail',
        url: '/maintenance/ordres-travail',
        parentKey: 'maintenance',
      },
      {
        key: 'maintenance-interventions',
        label: 'Interventions',
        url: '/maintenance/interventions',
        parentKey: 'maintenance',
      },
      {
        key: 'maintenance-pieces',
        label: 'Pièces de Rechange',
        url: '/maintenance/pieces-rechange',
        parentKey: 'maintenance',
      },
    ],
  },
  {
    key: 'hr',
    label: 'Ressources Humaines',
    icon: 'ri:group-line',
    children: [
      {
        key: 'hr-employees',
        label: 'Employés',
        url: '/hr/employees',
        parentKey: 'hr',
      },
    ],
  },
  {
    key: 'email',
    label: 'Email',
    icon: 'tabler:mailbox',
    url: '/apps/email',
  },
  {
    key: 'file-manager',
    label: 'File Manager',
    icon: 'tabler:folders',
    url: '/apps/file-manager',
  },
  {
    key: 'projects',
    label: 'Projects',
    icon: 'tabler:briefcase',
    url: '/apps/Projects',
  },
  {
    key: 'tasks',
    label: 'Tasks',
    icon: 'tabler:layout-kanban',
    children: [
      {
        key: 'kanban',
        label: 'Kanban',
        url: '/tasks/kanban',
        parentKey: 'tasks',
      },
      {
        key: 'view-details',
        label: 'View Details',
        url: '/tasks/view-details',
        parentKey: 'tasks',
      },
    ]
  },
  {
    key: 'invoice',
    label: 'Invoice',
    icon: 'tabler:invoice',
    children: [
      {
        key: 'invoices',
        label: 'Invoice',
        url: '/invoices',
        parentKey: 'invoice',
      },
      {
        key: 'view-invoice',
        label: 'View Invoice',
        url: '/invoices/view-invoice',
        parentKey: 'invoice',
      },
      {
        key: 'create-invoice',
        label: 'Create Invoice',
        url: '/invoices/create-invoice',
        parentKey: 'invoice',
      },
    ]
  },
  {
    key: 'custom',
    label: 'Custom',
    isTitle: true
  },
  {
    key: 'pages',
    label: 'Pages',
    icon: 'tabler:package',
    children: [
      {
        key: 'starter-page',
        label: 'Starter Page',
        url: '/pages/starter-page',
        parentKey: 'pages',
      },
      {
        key: 'pricing',
        label: 'Pricing',
        url: '/pages/pricing',
        parentKey: 'pages',

      },
      {
        key: 'faq',
        label: 'FAQ',
        url: '/pages/faq',
        parentKey: 'pages',
      },
      {
        key: 'maintenance',
        label: 'Maintenance',
        url: '/maintenance',
        parentKey: 'pages',
      },
      {
        key: 'timeline',
        label: 'Timeline',
        url: '/pages/timeline',
        parentKey: 'pages',
      },
      {
        key: 'coming-soon',
        label: 'Coming Soon',
        url: '/coming-soon',
        parentKey: 'pages',
      },
    ]
  },
  {
    key: 'auth',
    label: 'Authentication',
    icon: 'tabler:user-shield',
    children: [
      {
        key: 'login',
        label: 'Login',
        url: '/auth/login',
        parentKey: 'auth',
      },
      {
        key: 'register',
        label: 'Register',
        url: '/auth/register',
        parentKey: 'auth',
      },
      {
        key: 'logout',
        label: 'Logout',
        url: '/auth/logout',
        parentKey: 'auth',
      },
      {
        key: 'recover-password',
        label: 'Recover Password',
        url: '/auth/recover-password',
        parentKey: 'auth',
      },
      {
        key: 'create-password',
        label: 'Create Password',
        url: '/auth/create-password',
        parentKey: 'auth',
      },
      {
        key: 'lock-screen',
        label: 'Lock Screen',
        url: '/auth/lock-screen',
        parentKey: 'auth',
      },
      {
        key: 'confirm-mail',
        label: 'Confirm Mail',
        url: '/auth/confirm-mail',
        parentKey: 'auth',
      },
      {
        key: 'login-pin',
        label: 'Login with PIN',
        url: '/auth/login-pin',
        parentKey: 'auth',
      },
    ]
  },
  {
    key: 'errors',
    label: 'Error Pages',
    icon: 'tabler:exclamation-circle',
    children: [
      {
        key: 'error-401',
        label: '401 Unauthorized',
        url: '/errors/error-401',
        parentKey: 'errors',
      },
      {
        key: 'error-400',
        label: '400 Bad Reques',
        url: '/errors/error-400',
        parentKey: 'errors',
      },
      {
        key: 'error-403',
        label: '403 Forbidden',
        url: '/errors/error-403',
        parentKey: 'errors',
      },
      {
        key: 'error-404',
        label: '404 Not Found',
        url: '/errors/error-404',
        parentKey: 'errors',
      },
      {
        key: 'error-500',
        label: '500 Internal Server',
        url: '/errors/error-500',
        parentKey: 'errors',
      },
      {
        key: 'service-unavailable',
        label: 'Service Unavailable',
        url: '/errors/service-unavailable',
        parentKey: 'errors',
      },
      {
        key: 'error-404-alt',
        label: 'Error 404 Alt',
        url: '/pages/error-404-alt',
        parentKey: 'errors',
      },


    ]
  },
  {
    key: 'widgets',
    label: 'Widgets',
    url: '/wallet',
    icon: 'tabler:layout-dashboard',
  },
  {
    key: 'components',
    label: 'Components',
    isTitle: true
  },
  {
    key: 'base-ui',
    label: 'Base UI',
    icon: 'tabler:aperture',
    children: [
      {
        key: 'base-ui-accordions',
        label: 'Accordions',
        url: '/ui/accordions',
        parentKey: 'base-ui',
      },
      {
        key: 'base-ui-alerts',
        label: 'Alerts',
        url: '/ui/alerts',
        parentKey: 'base-ui',
      },
      {
        key: 'base-ui-avatars',
        label: 'Avatars',
        url: '/ui/avatars',
        parentKey: 'base-ui',
      },
      {
        key: 'base-ui-badges',
        label: 'Badges',
        url: '/ui/badges',
        parentKey: 'base-ui',
      },
      {
        key: 'base-ui-breadcrumb',
        label: 'Breadcrumb',
        url: '/ui/breadcrumb',
        parentKey: 'base-ui',
      },
      {
        key: 'base-ui-buttons',
        label: 'Buttons',
        url: '/ui/buttons',
        parentKey: 'base-ui',
      },
      {
        key: 'base-ui-cards',
        label: 'Cards',
        url: '/ui/cards',
        parentKey: 'base-ui',
      },
      {
        key: 'base-ui-carousel',
        label: 'Carousel',
        url: '/ui/carousel',
        parentKey: 'base-ui',
      },
      {
        key: 'base-ui-collapse',
        label: 'Collapse',
        url: '/ui/collapse',
        parentKey: 'base-ui',
      },
      {
        key: 'base-ui-dropdowns',
        label: 'Dropdowns',
        url: '/ui/dropdowns',
        parentKey: 'base-ui',
      },
      {
        key: 'ul-ratio',
        label: 'Ratio',
        url: '/ui/ratio',
        parentKey: 'base-ui',
      },
      {
        key: 'ul-grid',
        label: 'Grid',
        url: '/ui/grid',
        parentKey: 'base-ui',
      },
      {
        key: 'ul-links',
        label: 'Links',
        url: '/ui/links',
        parentKey: 'base-ui',
      },
      {
        key: 'base-ui-list-group',
        label: 'List Group',
        url: '/ui/list-group',
        parentKey: 'base-ui',
      },
      {
        key: 'base-ui-modals',
        label: 'Modals',
        url: '/ui/modals',
        parentKey: 'base-ui',
      },
      {
        key: 'base-ui-notifications',
        label: 'Notifications',
        url: '/ui/notifications',
        parentKey: 'base-ui',
      },
      {
        key: 'base-ui-offcanvas',
        label: 'Offcanvas',
        url: '/ui/offcanvas',
        parentKey: 'base-ui',
      },
      {
        key: 'base-ui-placeholders',
        label: 'Placeholders',
        url: '/ui/placeholders',
        parentKey: 'base-ui',
      },
      {
        key: 'base-ui-pagination',
        label: 'Pagination',
        url: '/ui/pagination',
        parentKey: 'base-ui',
      },
      {
        key: 'base-ui-popovers',
        label: 'Popovers',
        url: '/ui/popovers',
        parentKey: 'base-ui',
      },
      {
        key: 'base-ui-progress',
        label: 'Progress',
        url: '/ui/progress',
        parentKey: 'base-ui',
      },
      {
        key: 'base-ui-spinners',
        label: 'Spinners',
        url: '/ui/spinners',
        parentKey: 'base-ui',
      },
      {
        key: 'base-ui-tabs',
        label: 'Tabs',
        url: '/ui/tabs',
        parentKey: 'base-ui',
      },
      {
        key: 'base-ui-tooltips',
        label: 'Tooltips',
        url: '/ui/tooltips',
        parentKey: 'base-ui',
      },
      {
        key: 'base-ui-typography',
        label: 'Typography',
        url: '/ui/typography',
        parentKey: 'base-ui',
      },
      {
        key: 'base-ui-utilities',
        label: 'Utilities',
        url: '/ui/utilities',
        parentKey: 'base-ui',
      },
    ]
  },
  {
    key: 'extended-ui',
    label: 'Extended UI',
    icon: 'tabler:macro',
    children: [
      {
        key: 'dragula',
        label: 'Dragula',
        url: '/extended/dragula',
        parentKey: 'extended-ui',
      },
      {
        key: 'sweet-alert',
        label: 'Sweet Alert',
        url: '/extended/sweet-alert',
        parentKey: 'extended-ui',
      },
      {
        key: 'ratings',
        label: 'Ratings',
        url: '/extended/ratings',
        parentKey: 'extended-ui',
      },
      {
        key: 'scrollbar',
        label: 'Scrollbar',
        url: '/extended/scrollbar',
        parentKey: 'extended-ui',
      },
    ]
  },
  {
    key: 'icons',
    label: 'Icons',
    icon: 'tabler:icons',
    children: [
      {
        key: 'remix',
        label: 'Remix',
        url: '/icons/remix',
        parentKey: 'icons',
      },
      {
        key: 'tabler',
        label: 'Tabler',
        url: '/icons/tabler',
        parentKey: 'icons',
      },
      {
        key: 'solar',
        label: 'Solar',
        url: '/icons/solar',
        parentKey: 'icons',
      },
    ]
  },
  {
    key: 'charts',
    label: 'charts',
    icon: 'tabler:chart-infographic',
    children: [
      {
        key: 'area',
        label: 'area',
        url: '/charts/area',
        parentKey: 'charts',
      },
      {
        key: 'bar',
        label: 'Bar',
        url: '/charts/bar',
        parentKey: 'charts',
      },
      {
        key: 'bubble',
        label: 'Bubble',
        url: '/charts/bubble',
        parentKey: 'charts',
      },
      {
        key: 'candlestick',
        label: 'Candlestick',
        url: '/charts/candlestick',
        parentKey: 'charts',
      },
      {
        key: 'column',
        label: 'Column',
        url: '/charts/column',
        parentKey: 'charts',
      },
      {
        key: 'heatmap',
        label: 'Heatmap',
        url: '/charts/heatmap',
        parentKey: 'charts',
      },
      {
        key: 'line',
        label: 'Line',
        url: '/charts/line',
        parentKey: 'charts',
      },
      {
        key: 'mixed',
        label: 'Mixed',
        url: '/charts/mixed',
        parentKey: 'charts',
      },
      {
        key: 'timeline-chart',
        label: 'Timeline',
        url: '/charts/timeline',
        parentKey: 'charts',
      },
      {
        key: 'boxplot',
        label: 'Boxplot',
        url: '/charts/boxplot',
        parentKey: 'charts',
      },
      {
        key: 'treemap',
        label: 'Treemap',
        url: '/charts/treemap',
        parentKey: 'charts',
      },
      {
        key: 'pie',
        label: 'Pie',
        url: '/charts/pie',
        parentKey: 'charts',
      },
      {
        key: 'radar',
        label: 'Radar',
        url: '/charts/radar',
        parentKey: 'charts',
      },
      {
        key: 'radialBar',
        label: 'RadialBar',
        url: '/charts/radialBar',
        parentKey: 'charts',
      },
      {
        key: 'scatter',
        label: 'Scatter',
        url: '/charts/scatter',
        parentKey: 'charts',
      },
      {
        key: 'polar',
        label: 'Polar Area',
        url: '/charts/polar',
        parentKey: 'charts',
      },
      {
        key: 'sparklines',
        label: 'Sparklines',
        url: '/charts/sparklines',
        parentKey: 'charts',
      },
      {
        key: 'slope',
        label: 'Slope',
        url: '/charts/slope',
        parentKey: 'charts',
      },
      {
        key: 'funnel',
        label: 'Funnel',
        url: '/charts/funnel',
        parentKey: 'charts',
      },
    ],
  },
  {
    key: 'forms',
    label: 'Forms',
    icon: 'tabler:list-details',
    children: [
      {
        key: 'basic',
        label: 'Basic Elements',
        url: '/forms/basic',
        parentKey: 'forms',
      },
      {
        key: 'inputmask',
        label: 'Inputmask',
        url: '/forms/inputmask',
        parentKey: 'forms',
      },
      {
        key: 'picker',
        label: 'Picker',
        url: '/forms/picker',
        parentKey: 'forms',
      },
      {
        key: 'select',
        label: 'Select',
        url: '/forms/select',
        parentKey: 'forms',
      },
      {
        key: 'slider',
        label: 'Range Slider',
        url: '/forms/slider',
        parentKey: 'forms',
      },
      {
        key: 'validation',
        label: 'Validation',
        url: '/forms/validation',
        parentKey: 'forms',
      },
      {
        key: 'wizard',
        label: 'Wizard',
        url: '/forms/wizard',
        parentKey: 'forms',
      },
      {
        key: 'file-uploads',
        label: 'File Uploads',
        url: '/forms/file-uploads',
        parentKey: 'forms',
      },
      {
        key: 'editors',
        label: 'Editors',
        url: '/forms/editors',
        parentKey: 'forms',
      },
      {
        key: 'layouts',
        label: 'Layouts',
        url: '/forms/layouts',
        parentKey: 'forms',
      },
    ]
  },
  {
    key: 'tables',
    label: 'Tables',
    icon: 'tabler:table-row',
    children: [
      {
        key: 'basic',
        label: 'Basic Tables',
        url: '/tables/basic',
        parentKey: 'tables',
      },
      {
        key: 'gridJs',
        label: 'GridJs Tables',
        url: '/tables/gridJs',
        parentKey: 'tables',
      },
      {
        key: 'datatable-tables',
        label: 'Datatable Tables',
        url: '/tables/datatable-tables',
        parentKey: 'tables',
      },
    ]
  },
  {
    key: 'maps',
    label: 'Maps',
    icon: 'tabler:map-2',
    children: [
      {
        key: 'google',
        label: 'Google Maps',
        url: '/maps/google',
        parentKey: 'maps',
      },
      {
        key: 'vector',
        label: 'Vector Maps',
        url: '/maps/vector',
        parentKey: 'maps',
      },
      {
        key: 'leaflet',
        label: 'Leaflet Maps',
        url: '/maps/leaflet',
        parentKey: 'maps',
      },
    ]
  },
  {
    key: 'more',
    label: 'More',
    isTitle: true,
  },
  {
    key: 'layouts',
    label: 'layouts',
    icon: 'tabler:layout',
    children: [
      {
        key: 'horizontal',
        label: 'Horizontal',
        url: '/horizontal',
        parentKey: 'layouts',
      },
      {
        key: 'detached',
        label: 'Detached',
        url: '/detached',
        parentKey: 'layouts',
      },
      {
        key: 'full-view',
        label: 'Full View',
        url: '/full-view',
        parentKey: 'layouts',
      },
      {
        key: 'fullscreen-view',
        label: 'FullScreen View',
        url: '/fullscreen-view',
        parentKey: 'layouts',
      },
      {
        key: 'hover-menu',
        label: 'Hover Menu',
        url: '/hover-menu',
        parentKey: 'layouts',
      },
      {
        key: 'compact',
        label: 'Compact',
        url: '/compact',
        parentKey: 'layouts',
      },
      {
        key: 'icon-view',
        label: 'Icon View',
        url: '/icon-view',
        parentKey: 'layouts',
      },
      {
        key: 'dark-mode',
        label: 'Dark Mode',
        url: '/dark-mode',
        parentKey: 'layouts',
        badge: {
          text: 'Hot',
          variant: 'badge badge-soft-danger ',
        },
      },
    ],
  },
  {
    key: 'multi-level',
    label: 'Multi Level',
    icon: 'tabler:share',
    children: [
      {
        key: 'second-level',
        label: 'Second Level',
        parentKey: 'multi-level',
        children: [
          {
            key: 'item11',
            label: 'Item 1',
            parentKey: 'second-level',
          },
          {
            key: 'item22',
            label: 'Item 2',
            parentKey: 'second-level',
          },
        ]
      },
      {
        key: 'third-level',
        label: 'Third Level',
        parentKey: 'multi-level',
        children: [
          {
            key: 'item1',
            label: 'Item 1',
            parentKey: 'second-level',
          },
          {
            key: 'item2',
            label: 'Item 2',
            parentKey: 'second-level',
            children: [
              {
                key: 'item2.1',
                label: 'Item 2.1',
                parentKey: 'item2',
              },
              {
                key: 'item2.2',
                label: 'Item 2.2',
                parentKey: 'item2',
              },
            ]
          },
        ]
      },
    ]
  },
]

export const HORIZONTAL_MENU_ITEM: MenuItemType[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: 'tabler:dashboard',
    badge: {
      text: "9",
      variant: "danger",
      icon: ''
    },
    url: '/dashboard',
  },
  {
    key: 'apps',
    label: 'Apps',
    icon: 'tabler:apps',
    children: [
      {
        key: 'chat',
        label: 'Chat',
        url: '/apps/chat',
        parentKey: 'apps',
      },
      {
        key: 'calendar',
        label: 'Calendar',
        url: '/apps/calendar',
        parentKey: 'apps',
      },
      {
        key: 'email',
        label: 'Email',
        url: '/apps/email',
        parentKey: 'apps',
      },
      {
        key: 'file-manager',
        label: 'File Manager',
        url: '/apps/file-manager',
        parentKey: 'apps',
      },
      {
        key: 'invoice',
        label: 'Invoice',
        parentKey: 'apps',
        children: [
          {
            key: 'invoices',
            label: 'Invoice',
            url: '/invoices',
            parentKey: 'invoice',
          },
          {
            key: 'view-invoice',
            label: 'View Invoice',
            url: '/invoices/view-invoice',
            parentKey: 'invoice',
          },
          {
            key: 'create-invoice',
            label: 'Create Invoice',
            url: '/invoices/create-invoice',
            parentKey: 'invoice',
          },
        ]
      },
    ]
  },
  {
    key: 'pages',
    label: 'Pages',
    icon: 'tabler:file-description',
    children: [
      {
        key: 'auth',
        label: 'Authentication',
        parentKey: 'pages',
        children: [
          {
            key: 'login',
            label: 'Login',
            url: '/auth/login',
            parentKey: 'auth',
          },
          {
            key: 'register',
            label: 'Register',
            url: '/auth/register',
            parentKey: 'auth',
          },
          {
            key: 'logout',
            label: 'Logout',
            url: '/auth/logout',
            parentKey: 'auth',
          },
          {
            key: 'recover-password',
            label: 'Recover Password',
            url: '/auth/recover-password',
            parentKey: 'auth',
          },
          {
            key: 'create-password',
            label: 'Create Password',
            url: '/auth/create-password',
            parentKey: 'auth',
          },
          {
            key: 'lock-screen',
            label: 'Lock Screen',
            url: '/auth/lock-screen',
            parentKey: 'auth',
          },
          {
            key: 'confirm-mail',
            label: 'Confirm Mail',
            url: '/auth/confirm-mail',
            parentKey: 'auth',
          },
          {
            key: 'login-pin',
            label: 'Login with PIN',
            url: '/auth/login-pin',
            parentKey: 'auth',
          },
          {
            key: '2FA',
            label: '2FA',
            url: '/auth/two-factor',
            parentKey: 'auth',
          },
          {
            key: 'account-deactivation',
            label: 'Account Deactivation',
            url: '/auth/account-deactivation',
            parentKey: 'auth',
          },
        ]
      },
      {
        key: 'errors',
        label: 'Error Pages',
        parentKey: 'pages',
        children: [
          {
            key: 'error-401',
            label: '401 Unauthorized',
            url: '/errors/error-401',
            parentKey: 'errors',
          },
          {
            key: 'error-400',
            label: '400 Bad Reques',
            url: '/errors/error-400',
            parentKey: 'errors',
          },
          {
            key: 'error-403',
            label: '403 Forbidden',
            url: '/errors/error-403',
            parentKey: 'errors',
          },
          {
            key: 'error-404',
            label: '404 Not Found',
            url: '/errors/error-404',
            parentKey: 'errors',
          },
          {
            key: 'error-408',
            label: '408 Request Timeout',
            url: '/errors/error-408',
            parentKey: 'errors',
          },
          {
            key: 'error-500',
            label: '500 Internal Server',
            url: '/errors/error-500',
            parentKey: 'errors',
          },
          {
            key: 'error-501',
            label: '501 Not Implemented',
            url: '/errors/error-501',
            parentKey: 'errors',
          },
          {
            key: 'error-502',
            label: '502 Service Overloaded',
            url: '/errors/error-502',
            parentKey: 'errors',
          },
          {
            key: 'service-unavailable',
            label: 'Service Unavailable',
            url: '/errors/service-unavailable',
            parentKey: 'errors',
          },
        ]
      },
      {
        key: 'starter-page',
        label: 'Starter Page',
        url: '/pages/starter-page',
        parentKey: 'pages',
      },
      {
        key: 'faq',
        label: 'FAQ',
        url: '/pages/faq',
        parentKey: 'pages',
      },
      {
        key: 'maintenance',
        label: 'Maintenance',
        url: '/maintenance',
        parentKey: 'pages',
      },
      {
        key: 'timeline',
        label: 'Timeline',
        url: '/pages/timeline',
        parentKey: 'pages',
      },
    ]
  },
  {
    key: 'components',
    label: 'Components',
    icon: 'tabler:components',
    children: [
      {
        key: 'widgets',
        label: 'Widgets',
        url: '/wallet',
        parentKey: 'components',
      },
      {
        key: 'base-ui',
        label: 'Base UI',
        children: [
          {
            key: 'base-ui-accordions',
            label: 'Accordions',
            url: '/ui/accordions',
            parentKey: 'base-ui',
          },
          {
            key: 'base-ui-alerts',
            label: 'Alerts',
            url: '/ui/alerts',
            parentKey: 'base-ui',
          },
          {
            key: 'base-ui-avatars',
            label: 'Avatars',
            url: '/ui/avatars',
            parentKey: 'base-ui',
          },
          {
            key: 'base-ui-badges',
            label: 'Badges',
            url: '/ui/badges',
            parentKey: 'base-ui',
          },
          {
            key: 'base-ui-breadcrumb',
            label: 'Breadcrumb',
            url: '/ui/breadcrumb',
            parentKey: 'base-ui',
          },
          {
            key: 'base-ui-buttons',
            label: 'Buttons',
            url: '/ui/buttons',
            parentKey: 'base-ui',
          },
          {
            key: 'base-ui-cards',
            label: 'Cards',
            url: '/ui/cards',
            parentKey: 'base-ui',
          },
          {
            key: 'base-ui-carousel',
            label: 'Carousel',
            url: '/ui/carousel',
            parentKey: 'base-ui',
          },
          {
            key: 'base-ui-collapse',
            label: 'Collapse',
            url: '/ui/collapse',
            parentKey: 'base-ui',
          },
          {
            key: 'base-ui-dropdowns',
            label: 'Dropdowns',
            url: '/ui/dropdowns',
            parentKey: 'base-ui',
          },
          {
            key: 'ul-ratio',
            label: 'Ratio',
            url: '/ui/ratio',
            parentKey: 'base-ui',
          },
          {
            key: 'ul-grid',
            label: 'Grid',
            url: '/ui/grid',
            parentKey: 'base-ui',
          },
          {
            key: 'ul-links',
            label: 'Links',
            url: '/ui/links',
            parentKey: 'base-ui',
          },
          {
            key: 'base-ui-list-group',
            label: 'List Group',
            url: '/ui/list-group',
            parentKey: 'base-ui',
          },
          {
            key: 'base-ui-modals',
            label: 'Modals',
            url: '/ui/modals',
            parentKey: 'base-ui',
          },
          {
            key: 'base-ui-notifications',
            label: 'Notifications',
            url: '/ui/notifications',
            parentKey: 'base-ui',
          },
          {
            key: 'base-ui-offcanvas',
            label: 'Offcanvas',
            url: '/ui/offcanvas',
            parentKey: 'base-ui',
          },
          {
            key: 'base-ui-placeholders',
            label: 'Placeholders',
            url: '/ui/placeholders',
            parentKey: 'base-ui',
          },
          {
            key: 'base-ui-pagination',
            label: 'Pagination',
            url: '/ui/pagination',
            parentKey: 'base-ui',
          },
          {
            key: 'base-ui-popovers',
            label: 'Popovers',
            url: '/ui/popovers',
            parentKey: 'base-ui',
          },
          {
            key: 'base-ui-progress',
            label: 'Progress',
            url: '/ui/progress',
            parentKey: 'base-ui',
          },
          {
            key: 'base-ui-spinners',
            label: 'Spinners',
            url: '/ui/spinners',
            parentKey: 'base-ui',
          },
          {
            key: 'base-ui-tabs',
            label: 'Tabs',
            url: '/ui/tabs',
            parentKey: 'base-ui',
          },
          {
            key: 'base-ui-tooltips',
            label: 'Tooltips',
            url: '/ui/tooltips',
            parentKey: 'base-ui',
          },
          {
            key: 'base-ui-typography',
            label: 'Typography',
            url: '/ui/typography',
            parentKey: 'base-ui',
          },
          {
            key: 'base-ui-utilities',
            label: 'Utilities',
            url: '/ui/utilities',
            parentKey: 'base-ui',
          },
        ]
      },
      {
        key: 'extended-ui',
        label: 'Extended UI',
        children: [
          {
            key: 'dragula',
            label: 'Dragula',
            url: '/extended/dragula',
            parentKey: 'extended-ui',
          },
          {
            key: 'sweet-alert',
            label: 'Sweet Alert',
            url: '/extended/sweet-alert',
            parentKey: 'extended-ui',
          },
          {
            key: 'ratings',
            label: 'Ratings',
            url: '/extended/ratings',
            parentKey: 'extended-ui',
          },
          {
            key: 'scrollbar',
            label: 'Scrollbar',
            url: '/extended/scrollbar',
            parentKey: 'extended-ui',
          },
        ]
      },
      {
        key: 'forms',
        label: 'Forms',
        children: [
          {
            key: 'basic',
            label: 'Basic Elements',
            url: '/forms/basic',
            parentKey: 'forms',
          },
          {
            key: 'inputmask',
            label: 'Inputmask',
            url: '/forms/inputmask',
            parentKey: 'forms',
          },
          {
            key: 'picker',
            label: 'Picker',
            url: '/forms/picker',
            parentKey: 'forms',
          },
          {
            key: 'select',
            label: 'Select',
            url: '/forms/select',
            parentKey: 'forms',
          },
          {
            key: 'slider',
            label: 'Range Slider',
            url: '/forms/slider',
            parentKey: 'forms',
          },
          {
            key: 'validation',
            label: 'Validation',
            url: '/forms/validation',
            parentKey: 'forms',
          },
          {
            key: 'wizard',
            label: 'Wizard',
            url: '/forms/wizard',
            parentKey: 'forms',
          },
          {
            key: 'file-uploads',
            label: 'File Uploads',
            url: '/forms/file-uploads',
            parentKey: 'forms',
          },
          {
            key: 'editors',
            label: 'Editors',
            url: '/forms/editors',
            parentKey: 'forms',
          },
          {
            key: 'layouts',
            label: 'Layouts',
            url: '/forms/layouts',
            parentKey: 'forms',
          },
        ]
      },
      {
        key: 'charts',
        label: 'charts',
        children: [
          {
            key: 'area',
            label: 'area',
            url: '/charts/area',
            parentKey: 'charts',
          },
          {
            key: 'bar',
            label: 'Bar',
            url: '/charts/bar',
            parentKey: 'charts',
          },
          {
            key: 'bubble',
            label: 'Bubble',
            url: '/charts/bubble',
            parentKey: 'charts',
          },
          {
            key: 'candlestick',
            label: 'Candlestick',
            url: '/charts/candlestick',
            parentKey: 'charts',
          },
          {
            key: 'column',
            label: 'Column',
            url: '/charts/column',
            parentKey: 'charts',
          },
          {
            key: 'heatmap',
            label: 'Heatmap',
            url: '/charts/heatmap',
            parentKey: 'charts',
          },
          {
            key: 'line',
            label: 'Line',
            url: '/charts/line',
            parentKey: 'charts',
          },
          {
            key: 'mixed',
            label: 'Mixed',
            url: '/charts/mixed',
            parentKey: 'charts',
          },
          {
            key: 'timeline-chart',
            label: 'Timeline',
            url: '/charts/timeline',
            parentKey: 'charts',
          },
          {
            key: 'boxplot',
            label: 'Boxplot',
            url: '/charts/boxplot',
            parentKey: 'charts',
          },
          {
            key: 'treemap',
            label: 'Treemap',
            url: '/charts/treemap',
            parentKey: 'charts',
          },
          {
            key: 'pie',
            label: 'Pie',
            url: '/charts/pie',
            parentKey: 'charts',
          },
          {
            key: 'radar',
            label: 'Radar',
            url: '/charts/radar',
            parentKey: 'charts',
          },
          {
            key: 'radialBar',
            label: 'RadialBar',
            url: '/charts/radialBar',
            parentKey: 'charts',
          },
          {
            key: 'scatter',
            label: 'Scatter',
            url: '/charts/scatter',
            parentKey: 'charts',
          },
          {
            key: 'polar',
            label: 'Polar Area',
            url: '/charts/polar',
            parentKey: 'charts',
          },
          {
            key: 'sparklines',
            label: 'Sparklines',
            url: '/charts/sparklines',
            parentKey: 'charts',
          },
        ],
      },
      {
        key: 'tables',
        label: 'Tables',
        children: [
          {
            key: 'basics-table',
            label: 'Basic Tables',
            url: '/tables/basics-table',
            parentKey: 'tables',
          },
          {
            key: 'gridJs',
            label: 'GridJs Tables',
            url: '/tables/gridJs',
            parentKey: 'tables',
          },
          {
            key: 'datatable-tables',
            label: 'Datatable Tables',
            url: '/tables/datatable-tables',
            parentKey: 'tables',
          },
        ]
      },
      {
        key: 'icons',
        label: 'Icons',
        children: [
          {
            key: 'tabler',
            label: 'Tabler',
            url: '/icons/tabler',
            parentKey: 'icons',
          },
          {
            key: 'solar',
            label: 'Solar',
            url: '/icons/solar',
            parentKey: 'icons',
          },
        ]
      },
      {
        key: 'maps',
        label: 'Maps',
        children: [
          {
            key: 'google',
            label: 'Google Maps',
            url: '/maps/google',
            parentKey: 'maps',
          },
          {
            key: 'vector',
            label: 'Vector Maps',
            url: '/maps/vector',
            parentKey: 'maps',
          },
          {
            key: 'leaflet',
            label: 'Leaflet Maps',
            url: '/maps/leaflet',
            parentKey: 'maps',
          },
        ]
      },

    ]

  },
  {
    key: 'layouts',
    label: 'layouts',
    icon: 'tabler:layout',
    children: [
      {
        key: 'horizontal',
        label: 'Horizontal',
        url: '/horizontal',
        parentKey: 'layouts',
      },
      {
        key: 'detached',
        label: 'Detached',
        url: '/detached',
        parentKey: 'layouts',
      },
      {
        key: 'full-view',
        label: 'Full View',
        url: '/full-view',
        parentKey: 'layouts',
      },
      {
        key: 'fullscreen-view',
        label: 'FullScreen View',
        url: '/fullscreen-view',
        parentKey: 'layouts',
      },
      {
        key: 'hover-menu',
        label: 'Hover Menu',
        url: '/hover-menu',
        parentKey: 'layouts',
      },
      {
        key: 'compact',
        label: 'Compact',
        url: '/compact',
        parentKey: 'layouts',
      },
      {
        key: 'icon-view',
        label: 'Icon View',
        url: '/icon-view',
        parentKey: 'layouts',
      },
      {
        key: 'dark-mode',
        label: 'darkmode',
        url: '/dark-mode',
        parentKey: 'layouts',
        badge: {
          text: 'Hot',
          variant: 'badge badge-soft-danger ',
        },
      },
    ],
  },
]