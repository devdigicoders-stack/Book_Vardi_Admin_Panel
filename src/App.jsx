import React from 'react';
import { ToastProvider } from './context/ToastContext';
import { AdminDataProvider } from './context/AdminDataContext';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <ToastProvider>
      <AdminDataProvider>
        <AdminDashboard />
      </AdminDataProvider>
    </ToastProvider>
  );
}
