import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Store, 
  ShoppingBag, 
  Bell, 
  ExternalLink, 
  CheckCircle2, 
  UserCheck, 
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { useAdminData } from '../context/AdminDataContext';

export default function Header({ onOpenNotifications, onOpenProfile }) {
  const { adminUser, switchAdminRole, notifications } = useAdminData();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const unreadCount = notifications.filter(n => n.unread).length;

  const roles = [
    'Super Admin',
    'Operations Manager',
    'Finance Admin',
    'Support Lead'
  ];

  return (
    <header className="bg-brand-teal text-white border-b border-white/10 sticky top-0 z-40 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left: Brand & Admin Identity */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="Book Vardi"
              className="h-10 w-auto object-contain bg-white p-1 rounded-xl shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-lg tracking-tight text-white">
                  BOOK <span className="text-brand-yellow">VARDI</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-yellow text-brand-teal tracking-wider uppercase">
                  Admin Console
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Notification Button */}
          <button 
            onClick={onOpenNotifications}
            className="md:hidden relative p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Right: Cross-App Navigation & Role Switcher */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          
          {/* Quick Link to Customer Storefront */}
          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-colors border border-white/15 cursor-pointer backdrop-blur-xs"
            title="Open Customer Storefront"
          >
            <ShoppingBag size={14} className="text-brand-yellow" />
            <span>Customer Store</span>
            <ExternalLink size={12} className="opacity-70" />
          </a>

          {/* Quick Link to Seller Hub */}
          <a
            href="http://localhost:5174"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-colors border border-white/15 cursor-pointer backdrop-blur-xs"
            title="Open Seller Portal"
          >
            <Store size={14} className="text-amber-300" />
            <span>Seller Hub</span>
            <ExternalLink size={12} className="opacity-70" />
          </a>

          {/* Notification Button Desktop */}
          <button 
            onClick={onOpenNotifications}
            className="hidden md:flex relative p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer border border-white/10"
            title="Notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-brand-yellow text-brand-teal-dark font-bold text-xs rounded-xl shadow-xs hover:bg-brand-yellow-hover transition-colors cursor-pointer"
            >
              <UserCheck size={14} />
              <span>{adminUser.role}</span>
              <ChevronDown size={13} className={`transition-transform duration-200 ${roleDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-50 text-gray-800">
                <div className="px-3 py-1 text-[10px] font-bold uppercase text-gray-400 border-b border-gray-100">
                  Switch Admin Role
                </div>
                {roles.map(role => (
                  <button
                    key={role}
                    onClick={() => {
                      switchAdminRole(role);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between hover:bg-gray-100 transition-colors cursor-pointer ${
                      adminUser.role === role ? 'bg-teal-50 text-teal-800 font-bold' : ''
                    }`}
                  >
                    <span>{role}</span>
                    {adminUser.role === role && <CheckCircle2 size={14} className="text-teal-700" />}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
