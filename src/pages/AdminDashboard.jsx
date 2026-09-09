import React, { useState } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MobileNav from '../components/MobileNav';
import { useAdminData } from '../context/AdminDataContext';
import AdminLogin from '../components/Auth/AdminLogin';

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

export default function AdminDashboard() {
  const { isAuthenticated } = useAdminData();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  const renderTabContent = () => {
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
            {renderTabContent()}
          </main>

        </div>
      </div>

    </div>
  );
}
