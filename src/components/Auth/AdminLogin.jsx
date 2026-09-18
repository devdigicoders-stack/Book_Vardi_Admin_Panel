import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  UserCheck, 
  AlertCircle, 
  ArrowRight, 
  Sparkles,
  ExternalLink,
  Store,
  ShoppingBag
} from 'lucide-react';
import { useAdminData, APPROVED_ADMIN_ROLES } from '../../context/AdminDataContext';

export default function AdminLogin() {
  const { loginAdmin } = useAdminData();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Super Admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginAdmin({ email, password, role });
    } catch (err) {
      setError(err.message || 'Authentication Failed: Invalid credentials or backend connection issue. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (selectedRole) => {
    setRole(selectedRole);
    setError('');
    setLoading(true);
    const demoEmail = selectedRole === 'Super Admin' ? 'admin@admin.com' : `${selectedRole.toLowerCase().replace(/\s+/g, '.')}@bookvardi.in`;
    setEmail(demoEmail);
    try {
      await loginAdmin({ 
        email: demoEmail, 
        password: 'admin123',
        role: selectedRole 
      });
    } catch (err) {
      setError(err.message || 'Authentication Failed: Unable to authenticate with live server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-950 via-brand-teal to-teal-900 flex items-center justify-center p-4 selection:bg-brand-yellow/30 selection:text-brand-yellow relative overflow-hidden">
      
      {/* Ambient background glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-yellow/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-brand-pink/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        
        {/* Card */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-white/20 backdrop-blur-md">
          
          {/* Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="flex justify-center">
              <img
                src="/logo.png"
                alt="Book Vardi"
                className="h-16 w-auto object-contain bg-white p-1.5 rounded-2xl shadow-md border border-gray-100"
              />
            </div>
            
            <div className="pt-2">
              <h1 className="font-display text-2xl font-black tracking-tight text-gray-900">
                BOOK<span className="text-brand-yellow">VARDI</span>
              </h1>
              <p className="text-xs font-bold uppercase tracking-widest text-teal-800 mt-0.5">
                Admin Console Authentication
              </p>
            </div>

            <div className="text-xs text-gray-500 max-w-xs mx-auto pt-1">
              Restricted Area. Authorized administrative and operations personnel only.
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Approved Role Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                <span>Administrative Role *</span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full">
                  Approval Required
                </span>
              </label>
              <div className="relative">
                <UserCheck size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-xs font-bold focus:ring-2 focus:ring-brand-yellow outline-hidden bg-white text-gray-800 cursor-pointer"
                >
                  {APPROVED_ADMIN_ROLES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                  <option value="Guest">Guest (Unapproved - Test Rejection)</option>
                </select>
              </div>
            </div>

            {/* Email or Phone Number */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Official Admin Email or Phone</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@bookvardi.in or 1231231232"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-brand-yellow outline-hidden"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Security Key / Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-brand-yellow outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 uppercase tracking-wider"
            >
              <span>{loading ? 'Verifying Credentials...' : 'Sign In to Admin Workspace'}</span>
              <ArrowRight size={15} />
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="pt-5 mt-5 border-t border-gray-100">
            <div className="text-[10px] uppercase font-extrabold text-gray-400 text-center mb-2.5 tracking-wider">
              Fast Demo Sign In
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('Super Admin')}
                className="px-2.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-900 rounded-xl text-[11px] font-bold transition-colors cursor-pointer text-center"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('Finance Admin')}
                className="px-2.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-800 rounded-xl text-[11px] font-bold transition-colors cursor-pointer text-center border border-gray-200"
              >
                Finance Admin
              </button>
            </div>
          </div>

          {/* Cross-Platform Links */}
          <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <a
              href="http://localhost:5173"
              target="_blank"
              rel="noreferrer"
              className="hover:text-teal-900 font-semibold flex items-center gap-1"
            >
              <ShoppingBag size={12} /> Customer Store
            </a>
            <a
              href="http://localhost:5174"
              target="_blank"
              rel="noreferrer"
              className="hover:text-teal-900 font-semibold flex items-center gap-1"
            >
              <Store size={12} /> Seller Hub
            </a>
          </div>

        </div>

      </div>
    </div>
  );
}
