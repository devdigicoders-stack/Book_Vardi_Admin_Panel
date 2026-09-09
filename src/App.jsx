import React from 'react';
import { AdminDataProvider } from './context/AdminDataContext';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <AdminDataProvider>
      <AdminDashboard />
    </AdminDataProvider>
  );
}
