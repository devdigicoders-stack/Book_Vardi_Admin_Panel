import React from 'react';
import { 
  ShieldCheck, 
  Bell
} from 'lucide-react';
import { useAdminData } from '../context/AdminDataContext';

export default function Header({ onOpenNotifications }) {
  const { adminUser, notifications } = useAdminData();
  const unreadCount = notifications.filter(n => n.unread).length;

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

        {/* Right: Admin-only controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          <button 
            onClick={onOpenNotifications}
            className="hidden md:flex relative p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer border border-white/10"
            title="View all notifications"
            aria-label="View all notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-yellow text-brand-teal-dark font-bold text-xs rounded-xl shadow-xs">
            <ShieldCheck size={14} />
            <span>{adminUser.role}</span>
          </div>
        </div>

      </div>
    </header>
  );
}
