import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AdminDataProvider, useAdminData } from './context/AdminDataContext';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './components/Auth/AdminLogin';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAdminData();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function PublicLoginRoute() {
  const { isAuthenticated } = useAdminData();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <AdminLogin />;
}

const ADMIN_ROUTE_PATHS = [
  'dashboard',
  'analytics',
  'notifications',
  'products',
  'kits',
  'categories',
  'inventory',
  'orders',
  'bulk-orders',
  'logistics',
  'finance',
  'sellers',
  'schools',
  'users',
  'marketing',
  'reviews',
  'team',
  'settings',
  'profile',
  'support'
];

// Delivery Partner Portal Redirection component:
// If a delivery partner / driver link is accidentally opened on the Admin Panel,
// immediately route them to the Storefront Website Delivery Partner portal preserving the token.
function DeliveryPartnerRedirect() {
  React.useEffect(() => {
    const websiteUrl = (
      import.meta.env.VITE_WEBSITE_URL ||
      `${window.location.protocol}//${window.location.hostname}:5173`
    ).replace(/\/+$/, '');

    const searchParams = new URLSearchParams(window.location.search);
    let token = searchParams.get('token') || searchParams.get('orderId') || '';
    const hash = window.location.hash || '';
    if (!token && hash.includes('token=')) {
      token = hash.split('token=')[1]?.split('&')[0] || '';
    }

    const targetUrl = `${websiteUrl}/#delivery-partner${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    window.location.replace(targetUrl);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0f172a', color: '#f8fafc', fontFamily: 'sans-serif', textAlign: 'center', padding: '20px' }}>
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '28px', maxWidth: '420px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid #0d9488', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 8px' }}>Routing to Delivery Partner Portal...</h2>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Please wait, redirecting driver to order verification portal.</p>
      </div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// Special handler for root path to ensure rider links with hash (/#delivery-partner)
// do NOT get redirected to the admin dashboard
function AdminRootRoute() {
  const hash = (typeof window !== 'undefined' ? window.location.hash : '') || '';
  if (hash.includes('delivery-partner')) {
    return <DeliveryPartnerRedirect />;
  }
  return (
    <ProtectedRoute>
      <Navigate to="/dashboard" replace />
    </ProtectedRoute>
  );
}

// Catch-all route to prevent delivery-partner routes from redirecting to dashboard
function AdminCatchAllRoute() {
  const hash = (typeof window !== 'undefined' ? window.location.hash : '') || '';
  if (hash.includes('delivery-partner')) {
    return <DeliveryPartnerRedirect />;
  }
  return <Navigate to="/dashboard" replace />;
}

function AdminRoutes() {
  // Global listener for delivery-partner in URL hash or path
  React.useEffect(() => {
    const hash = window.location.hash || '';
    const path = window.location.pathname || '';
    if (hash.includes('delivery-partner') || path.includes('delivery-partner')) {
      const websiteUrl = (
        import.meta.env.VITE_WEBSITE_URL ||
        `${window.location.protocol}//${window.location.hostname}:5173`
      ).replace(/\/+$/, '');
      const searchParams = new URLSearchParams(window.location.search);
      let token = searchParams.get('token') || searchParams.get('orderId') || '';
      if (!token && hash.includes('token=')) {
        token = hash.split('token=')[1]?.split('&')[0] || '';
      }
      const targetUrl = `${websiteUrl}/#delivery-partner${token ? `?token=${encodeURIComponent(token)}` : ''}`;
      window.location.replace(targetUrl);
    }
  }, []);

  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<PublicLoginRoute />} />

      {/* Delivery Partner Portal Redirection */}
      <Route path="/delivery-partner" element={<DeliveryPartnerRedirect />} />

      {/* Redirect root: checks for delivery-partner hash before dashboard */}
      <Route path="/" element={<AdminRootRoute />} />

      {/* Alias for camelCase bulkOrders */}
      <Route
        path="/bulkOrders"
        element={
          <ProtectedRoute>
            <Navigate to="/bulk-orders" replace />
          </ProtectedRoute>
        }
      />

      {/* Protected Admin Routes */}
      {ADMIN_ROUTE_PATHS.map((path) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      ))}

      {/* Catch-all unknown routes: Checks for delivery-partner before redirecting to /dashboard */}
      <Route path="*" element={<AdminCatchAllRoute />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AdminDataProvider>
        <BrowserRouter>
          <AdminRoutes />
        </BrowserRouter>
      </AdminDataProvider>
    </ToastProvider>
  );
}
