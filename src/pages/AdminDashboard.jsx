import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MobileNav from '../components/MobileNav';
import { useAdminData } from '../context/AdminDataContext';
import AdminLogin from '../components/Auth/AdminLogin';
import { Eye, ShieldAlert } from 'lucide-react';

// Admin Tabs
import DashboardTab from '../components/tabs/DashboardTab';
import ProductsTab from '../components/tabs/ProductsTab';
import OrdersTab from '../components/tabs/OrdersTab';
import SellersTab from '../components/tabs/SellersTab';
import SchoolsTab from '../components/tabs/SchoolsTab';
import UsersTab from '../components/tabs/UsersTab';
import InventoryTab from '../components/tabs/InventoryTab';
import FinanceTab from '../components/tabs/FinanceTab';
import MarketingTab from '../components/tabs/MarketingTab';
import ReviewsTab from '../components/tabs/ReviewsTab';
import AnalyticsTab from '../components/tabs/AnalyticsTab';
import NotificationsTab from '../components/tabs/NotificationsTab';
import SettingsTab from '../components/tabs/SettingsTab';
import SupportTab from '../components/tabs/SupportTab';
import ProfileTab from '../components/tabs/ProfileTab';
import TeamTab from '../components/tabs/TeamTab';

const TAB_ORDER = [
  'dashboard',
  'analytics',
  'notifications',
  'products',
  'inventory',
  'orders',
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

export default function AdminDashboard() {
  const { isAuthenticated, canViewTab, isEditor } = useAdminData();
  const [activeTab, setActiveTab] = useState('dashboard');

  // If the active tab is not allowed for the logged in user, redirect to first permitted tab
  useEffect(() => {
    if (isAuthenticated && canViewTab && !canViewTab(activeTab)) {
      const firstAllowed = TAB_ORDER.find(tabId => canViewTab(tabId)) || 'profile';
      setActiveTab(firstAllowed);
    }
  }, [activeTab, isAuthenticated, canViewTab]);

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  const renderTabContent = () => {
    if (canViewTab && !canViewTab(activeTab)) {
      return (
        <div className="p-8 bg-white rounded-3xl border border-rose-100 shadow-xs text-center space-y-3">
          <ShieldAlert size={32} className="text-rose-500 mx-auto" />
          <h3 className="font-display font-bold text-lg text-gray-900">Access Restricted</h3>
          <p className="text-xs text-gray-500">You do not have permission to view this section.</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab onNavigateTab={setActiveTab} />;
      case 'products':
        return <ProductsTab />;
      case 'orders':
        return <OrdersTab />;
      case 'sellers':
        return <SellersTab />;
      case 'schools':
        return <SchoolsTab />;
      case 'users':
        return <UsersTab />;
      case 'inventory':
        return <InventoryTab />;
      case 'finance':
        return <FinanceTab />;
      case 'marketing':
        return <MarketingTab />;
      case 'reviews':
        return <ReviewsTab />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'notifications':
        return <NotificationsTab />;
      case 'team':
        return <TeamTab />;
      case 'settings':
        return <SettingsTab />;
      case 'support':
        return <SupportTab />;
      case 'profile':
        return <ProfileTab />;
      default:
        return <DashboardTab onNavigateTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/60 pb-20 selection:bg-brand-yellow/30 selection:text-brand-teal">
      
      {/* Top Navbar */}
      <Header 
        onOpenNotifications={() => setActiveTab('notifications')} 
        onOpenProfile={() => setActiveTab('profile')} 
      />

      {/* Mobile Horizontal Navigation */}
      <MobileNav activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Workspace Layout */}
      <div className="container mx-auto px-4 mt-6">
        <div className="flex flex-col lg:flex-row items-start gap-6">
          
          {/* Sticky Desktop Left Navigation */}
          <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

          {/* Main Workspace Content Area */}
          <main className="flex-1 w-full min-w-0">
            {/* View-Only Mode Banner for Sub-Admins */}
            {activeTab !== 'profile' && isEditor && !isEditor(activeTab) && (
              <div className="mb-6 p-4 bg-amber-50/90 border border-amber-200/90 rounded-2xl flex items-center justify-between gap-3 text-amber-900 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                    <Eye size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                      <span>View-Only Mode Active</span>
                    </p>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      You have read-only permissions for this section. Action buttons, data creation, editing, and approvals are restricted.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-amber-200/80 text-amber-900 rounded-lg shrink-0">
                  Viewer
                </span>
              </div>
            )}

            {renderTabContent()}
          </main>

        </div>
      </div>

    </div>
  );
}
