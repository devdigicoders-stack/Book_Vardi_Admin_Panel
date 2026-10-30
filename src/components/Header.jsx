import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Bell
} from 'lucide-react';
import { useAdminData } from '../context/AdminDataContext';

export default function Header({ onOpenNotifications, onOpenProfile }) {
  const navigate = useNavigate();
  const { adminUser, notifications } = useAdminData();
  const unreadCount = notifications.filter(n => n.unread).length;

  const handleNotificationsClick = () => {
    if (onOpenNotifications) onOpenNotifications();
    navigate('/notifications');
  };

  const handleProfileClick = () => {
    if (onOpenProfile) onOpenProfile();
    navigate('/profile');
  };

  return (
    <header className="bg-brand-teal text-white border-b border-white/10 sticky top-0 z-40 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left: Brand & Admin Identity */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2.5 cursor-pointer"
            title="Go to Dashboard"
          >
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
            onClick={handleNotificationsClick}
            className="md:hidden relative p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
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
            onClick={handleNotificationsClick}
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

          <button
            onClick={handleProfileClick}
            className="flex items-center gap-2 px-3 py-1.5 bg-brand-yellow text-brand-teal-dark font-bold text-xs rounded-xl shadow-xs hover:bg-amber-300 transition-colors cursor-pointer"
            title="View Admin Profile"
          >
            <ShieldCheck size={14} />
            <span>{adminUser?.role || 'Super Admin'}</span>
          </button>
        </div>

      </div>
    </header>
  );
}
