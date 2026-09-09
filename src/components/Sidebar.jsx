import React from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Store,
  GraduationCap,
  Users,
  Box,
  CreditCard,
  Tag,
  MessageSquareWarning,
  BarChart3,
  Bell,
  Settings,
  HelpCircle,
  UserCheck,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { useAdminData } from '../context/AdminDataContext';

export const ADMIN_TABS = [
  {
    title: 'Platform Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={17} /> },
      { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={17} /> },
      { id: 'notifications', label: 'Notifications', icon: <Bell size={17} />, badgeKey: 'notifications' }
    ]
  },
  {
    title: 'Catalog & Stock',
    items: [
      { id: 'products', label: 'Products', icon: <Package size={17} />, badgeKey: 'pendingProducts' },
      { id: 'inventory', label: 'Inventory', icon: <Box size={17} />, badgeKey: 'lowStock' }
    ]
  },
  {
    title: 'Commerce & Orders',
    items: [
      { id: 'orders', label: 'Orders', icon: <ShoppingBag size={17} />, badgeKey: 'pendingOrders' },
      { id: 'finance', label: 'Finance', icon: <CreditCard size={17} /> }
    ]
  },
  {
    title: 'Stakeholders',
    items: [
      { id: 'sellers', label: 'Sellers', icon: <Store size={17} />, badgeKey: 'pendingSellers' },
      { id: 'schools', label: 'Schools', icon: <GraduationCap size={17} /> },
      { id: 'users', label: 'Users', icon: <Users size={17} /> }
    ]
  },
  {
    title: 'Growth & Moderation',
    items: [
      { id: 'marketing', label: 'Marketing', icon: <Tag size={17} /> },
      { id: 'reviews', label: 'Reviews & Reports', icon: <MessageSquareWarning size={17} />, badgeKey: 'flaggedReviews' }
    ]
  },
  {
    title: 'System & Profile',
    items: [
      { id: 'settings', label: 'Settings', icon: <Settings size={17} /> },
      { id: 'profile', label: 'Admin Profile', icon: <UserCheck size={17} /> },
      { id: 'support', label: 'Support', icon: <HelpCircle size={17} />, badgeKey: 'openTickets' }
    ]
  }
];

export default function Sidebar({ activeTab, onSelectTab }) {
  const { products, orders, sellers, reviews, supportTickets, notifications, adminUser } = useAdminData();

  const getBadge = (key) => {
    switch (key) {
      case 'notifications': {
        const count = notifications.filter(n => n.unread).length;
        return count > 0 ? count : null;
      }
      case 'pendingProducts': {
        const count = products.filter(p => p.approvalStatus === 'Pending').length;
        return count > 0 ? count : null;
      }
      case 'lowStock': {
        const count = products.filter(p => (p.stockQuantity ?? 50) <= 10).length;
        return count > 0 ? count : null;
      }
      case 'pendingOrders': {
        const count = orders.filter(o => o.status === 'Pending').length;
        return count > 0 ? count : null;
      }
      case 'pendingSellers': {
        const count = sellers.filter(s => s.status === 'Pending Approval').length;
        return count > 0 ? count : null;
      }
      case 'flaggedReviews': {
        const count = reviews.filter(r => r.reported || r.status === 'Flagged for Moderation').length;
        return count > 0 ? count : null;
      }
      case 'openTickets': {
        const count = supportTickets.filter(t => t.status === 'Open').length;
        return count > 0 ? count : null;
      }
      default:
        return null;
    }
  };

  return (
    <aside className="hidden lg:block w-64 xl:w-72 shrink-0 self-start sticky top-20">
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-3.5 space-y-4 max-h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar">
        
        {/* Status indicator badge / Admin Profile Card */}
        <div 
          onClick={() => onSelectTab('profile')}
          className="p-3 bg-teal-50/70 hover:bg-teal-100/70 transition-colors rounded-xl border border-teal-100 cursor-pointer"
          title="Click to view/edit admin profile"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-teal-950 truncate max-w-[130px]">{adminUser?.name || 'Admin'}</span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800">
              {adminUser?.role || 'Super Admin'}
            </span>
          </div>
          <div className="text-[10px] text-teal-700 mt-1 flex items-center justify-between">
            <span>Verified Admin</span>
            <span className="font-bold text-teal-900 hover:underline">Profile & Security →</span>
          </div>
        </div>

        {/* Sidebar Sections */}
        {ADMIN_TABS.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">
              {section.title}
            </div>
            {section.items.map((tab) => {
              const isCurrent = activeTab === tab.id;
              const badge = tab.badgeKey ? getBadge(tab.badgeKey) : null;

              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-teal-800 text-white font-bold shadow-sm ring-1 ring-teal-700/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    {tab.icon}
                    <span>{tab.label}</span>
                  </span>
                  
                  {badge ? (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isCurrent ? 'bg-amber-400 text-teal-950' : 'bg-red-500 text-white'
                    }`}>
                      {badge}
                    </span>
                  ) : (
                    <ChevronRight size={13} className={isCurrent ? 'opacity-100 text-white' : 'opacity-20'} />
                  )}
                </button>
              );
            })}
          </div>
        ))}

        {/* Bottom Action: Exit to Customer Store */}
        <div className="pt-3 mt-2 border-t border-gray-100">
          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-teal-900 bg-teal-50 hover:bg-brand-yellow hover:text-brand-teal-dark border border-teal-200/80 transition-all duration-200 cursor-pointer shadow-2xs group"
            title="Return to the customer shopping storefront"
          >
            <span className="flex items-center gap-2.5">
              <ShoppingBag size={16} className="text-teal-700 group-hover:text-brand-teal-dark transition-colors" />
              <span>Exit to Customer Store</span>
            </span>
            <ArrowLeft size={14} className="opacity-70 group-hover:opacity-100 group-hover:-translate-x-0.5 transition-transform" />
          </a>
        </div>

      </div>
    </aside>
  );
}
