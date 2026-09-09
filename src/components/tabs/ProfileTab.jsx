import React, { useState } from 'react';
import { 
  UserCheck, 
  ShieldCheck, 
  Lock, 
  Mail, 
  Phone, 
  Key, 
  LogOut, 
  CheckCircle2, 
  Calendar,
  Sparkles,
  Save
} from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';

export default function ProfileTab() {
  const { adminUser, updateAdminProfile, logoutAdmin, logAudit } = useAdminData();
  
  const [formData, setFormData] = useState({
    name: adminUser.name || '',
    email: adminUser.email || '',
    phone: adminUser.phone || '',
    avatar: adminUser.avatar || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [savedSuccess, setSavedSuccess] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    updateAdminProfile(formData);
    setSavedSuccess('Admin profile updated successfully.');
    setTimeout(() => setSavedSuccess(''), 4000);
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (!passwordData.newPassword) return;
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    logAudit('Password Changed', 'Administrator updated master security credentials');
    setPasswordSuccess('Security credentials updated.');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setTimeout(() => setPasswordSuccess(''), 4000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={adminUser.avatar}
            alt={adminUser.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-brand-yellow shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-extrabold text-xl text-gray-900">{adminUser.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-yellow text-brand-teal-dark tracking-wider uppercase">
                {adminUser.role}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
              <span>ID: {adminUser.adminId || 'BV-ADM-001'}</span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <ShieldCheck size={13} /> Approved Administrator
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={logoutAdmin}
          className="px-4 py-2.2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <LogOut size={15} /> Lock & Sign Out
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{savedSuccess}</span>
        </div>
      )}

      {/* Grid: Details & Password */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Personal Details Form */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4">
          <h3 className="font-display font-bold text-base text-gray-900 flex items-center gap-2">
            <UserCheck size={17} className="text-teal-700" /> Profile Information
          </h3>

          <form onSubmit={handleProfileUpdate} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-yellow outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Official Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-yellow outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Direct Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-yellow outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Avatar Image URL</label>
              <input
                type="url"
                value={formData.avatar}
                onChange={e => setFormData({ ...formData, avatar: e.target.value })}
                className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-yellow outline-hidden font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Save size={14} /> Save Profile Changes
            </button>
          </form>
        </div>

        {/* Security & Credentials Form */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4">
          <h3 className="font-display font-bold text-base text-gray-900 flex items-center gap-2">
            <Key size={17} className="text-teal-700" /> Security & Access Key
          </h3>

          {passwordSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={passwordData.currentPassword}
                onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-yellow outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">New Security Password</label>
              <input
                type="password"
                required
                value={passwordData.newPassword}
                onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-yellow outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={passwordData.confirmPassword}
                onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-yellow outline-hidden"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Lock size={14} /> Update Security Key
            </button>
          </form>

          {/* Active Session Info */}
          <div className="pt-4 border-t border-gray-100 text-[11px] text-gray-500 space-y-1">
            <div className="flex justify-between">
              <span>Security Clearance:</span>
              <span className="font-bold text-gray-800">Level 4 (Platform Admin)</span>
            </div>
            <div className="flex justify-between">
              <span>Account Status:</span>
              <span className="font-bold text-emerald-600">Active & Verified</span>
            </div>
            <div className="flex justify-between">
              <span>Last Login:</span>
              <span className="font-semibold text-gray-700">{adminUser.lastLogin || 'Today'}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
