export const TAB_ROUTE_MAP = {
  dashboard: '/dashboard',
  analytics: '/analytics',
  notifications: '/notifications',
  products: '/products',
  kits: '/kits',
  categories: '/categories',
  inventory: '/inventory',
  orders: '/orders',
  bulkOrders: '/bulk-orders',
  logistics: '/logistics',
  finance: '/finance',
  reports: '/reports',
  sellers: '/sellers',
  schools: '/schools',
  users: '/users',
  marketing: '/marketing',
  reviews: '/reviews',
  team: '/team',
  settings: '/settings',
  profile: '/profile',
  support: '/support'
};

export const ROUTE_TAB_MAP = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/analytics': 'analytics',
  '/notifications': 'notifications',
  '/products': 'products',
  '/kits': 'kits',
  '/categories': 'categories',
  '/inventory': 'inventory',
  '/orders': 'orders',
  '/bulk-orders': 'bulkOrders',
  '/bulkorders': 'bulkOrders',
  '/logistics': 'logistics',
  '/finance': 'finance',
  '/reports': 'reports',
  '/billing-reports': 'reports',
  '/sellers': 'sellers',
  '/schools': 'schools',
  '/users': 'users',
  '/marketing': 'marketing',
  '/reviews': 'reviews',
  '/team': 'team',
  '/settings': 'settings',
  '/profile': 'profile',
  '/support': 'support'
};

export const getTabFromPath = (pathname) => {
  if (!pathname) return 'dashboard';
  const clean = pathname.toLowerCase().replace(/\/+$/, '') || '/';
  return ROUTE_TAB_MAP[clean] || 'dashboard';
};

export const getPathFromTab = (tabId) => {
  return TAB_ROUTE_MAP[tabId] || `/${tabId}`;
};
