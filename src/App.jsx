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

function AdminRoutes() {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<PublicLoginRoute />} />

      {/* Redirect root to /dashboard */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Navigate to="/dashboard" replace />
          </ProtectedRoute>
        }
      />

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

      {/* Catch-all unknown routes: Redirect to /dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
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
