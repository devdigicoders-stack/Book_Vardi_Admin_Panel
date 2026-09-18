import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  UserPlus, 
  Eye, 
  Edit3, 
  Ban, 
  CheckCircle2, 
  AlertCircle,
  Lock,
  Mail,
  User,
  Phone,
  Sparkles
} from 'lucide-react';

export const PERMISSION_MODULES = [
  { id: 'dashboard', label: 'Dashboard & Metrics', category: 'Overview', description: 'Live platform KPIs and overview cards' },
  { id: 'analytics', label: 'Sales & Analytics', category: 'Overview', description: 'Revenue graphs, conversion and performance' },
  { id: 'notifications', label: 'Notifications', category: 'Overview', description: 'Platform alerts and system broadcasts' },
  { id: 'products', label: 'Products & Approvals', category: 'Catalog', description: 'Catalog listings, approvals and rejections' },
  { id: 'inventory', label: 'Inventory & Stock', category: 'Catalog', description: 'Stock levels and low-stock indicators' },
  { id: 'orders', label: 'Orders & Fulfillment', category: 'Commerce', description: 'Order processing, dispatch and tracking' },
  { id: 'finance', label: 'Finance & Payouts', category: 'Commerce', description: 'Seller payout release and financial ledgers' },
  { id: 'sellers', label: 'Sellers Directory', category: 'Stakeholders', description: 'Vendor approvals, KYC and commission rates' },
  { id: 'schools', label: 'Schools & Programs', category: 'Stakeholders', description: 'School tie-ups, delivery radius and kits' },
  { id: 'users', label: 'Customer Accounts', category: 'Stakeholders', description: 'Customer directory and account status' },
  { id: 'marketing', label: 'Marketing & Coupons', category: 'Growth', description: 'Discount codes and promotional banners' },
  { id: 'reviews', label: 'Reviews & Reports', category: 'Growth', description: 'Rating moderation and flagged reviews' },
  { id: 'settings', label: 'Platform Settings', category: 'System', description: 'Platform operational parameters' },
  { id: 'support', label: 'Customer Support', category: 'System', description: 'Support tickets and dispute resolution' }
];

export const ROLE_PRESETS = [
  {
    name: 'All Editor',
    apply: () => {
      const perms = {};
      PERMISSION_MODULES.forEach(m => { perms[m.id] = 'editor'; });
      return perms;
    }
  },
  {
    name: 'All Viewer',
    apply: () => {
      const perms = {};
      PERMISSION_MODULES.forEach(m => { perms[m.id] = 'viewer'; });
      return perms;
    }
  },
  {
    name: 'Operations Manager',
    apply: () => {
      const perms = {};
      PERMISSION_MODULES.forEach(m => {
        if (['products', 'inventory', 'orders', 'schools'].includes(m.id)) perms[m.id] = 'editor';
        else if (['dashboard', 'analytics', 'sellers'].includes(m.id)) perms[m.id] = 'viewer';
        else perms[m.id] = 'none';
      });
      return perms;
    }
  },
  {
    name: 'Finance Officer',
    apply: () => {
      const perms = {};
      PERMISSION_MODULES.forEach(m => {
        if (['finance', 'orders'].includes(m.id)) perms[m.id] = 'editor';
        else if (['dashboard', 'analytics', 'sellers'].includes(m.id)) perms[m.id] = 'viewer';
        else perms[m.id] = 'none';
      });
      return perms;
    }
  },
  {
    name: 'Support & Moderation',
    apply: () => {
      const perms = {};
      PERMISSION_MODULES.forEach(m => {
        if (['support', 'reviews', 'users', 'notifications'].includes(m.id)) perms[m.id] = 'editor';
        else if (['dashboard', 'products', 'orders'].includes(m.id)) perms[m.id] = 'viewer';
        else perms[m.id] = 'none';
      });
      return perms;
    }
  },
  {
    name: 'Clear All',
    apply: () => {
      const perms = {};
      PERMISSION_MODULES.forEach(m => { perms[m.id] = 'none'; });
      return perms;
    }
  }
];

export default function SubadminModal({ isOpen, onClose, onSave, subadmin }) {
  const isEdit = Boolean(subadmin);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'subadmin',
    status: 'active'
  });

  const [permissions, setPermissions] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (subadmin) {
      setFormData({
        name: subadmin.name || '',
        email: subadmin.email || '',
        phone: subadmin.phone || '',
        password: '',
        role: subadmin.role || 'subadmin',
        status: subadmin.status || 'active'
      });
      setPermissions(subadmin.permissions || {});
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'subadmin',
        status: 'active'
      });
      // Default: all viewer for new subadmin
      const initial = {};
      PERMISSION_MODULES.forEach(m => { initial[m.id] = 'viewer'; });
      setPermissions(initial);
    }
    setError('');
  }, [subadmin, isOpen]);

  if (!isOpen) return null;

  const handlePermissionChange = (moduleId, level) => {
    setPermissions(prev => ({
      ...prev,
      [moduleId]: level
    }));
  };

  const applyPreset = (presetFn) => {
    setPermissions(presetFn());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Please provide staff member name');
      return;
    }
    if (!formData.email.trim()) {
      setError('Please provide email address');
      return;
    }
    if (!isEdit && (!formData.password || formData.password.length < 6)) {
      setError('A secure password with at least 6 characters is required for new accounts');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        role: formData.role,
        status: formData.status,
        permissions
      };

      if (formData.password && formData.password.trim().length > 0) {
        payload.password = formData.password.trim();
      }

      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save admin account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-gray-100 my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-800 text-white flex items-center justify-center font-bold shadow-xs">
              {isEdit ? <ShieldCheck size={20} /> : <UserPlus size={20} />}
            </div>
            <div>
              <h3 className="font-display font-black text-xl text-gray-900">
                {isEdit ? `Edit Staff Privileges: ${subadmin.name}` : 'Add New Admin / Sub-Admin'}
              </h3>
              <p className="text-xs text-gray-500">
                Configure account credentials, role type, and tab access permissions
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <User size={13} className="text-gray-400" />
                <span>Full Name *</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Priya Sharma"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold focus:ring-2 focus:ring-brand-yellow outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Mail size={13} className="text-gray-400" />
                <span>Email Address *</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="priya@bookvardi.in"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold focus:ring-2 focus:ring-brand-yellow outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Phone size={13} className="text-gray-400" />
                <span>Phone (Optional)</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold focus:ring-2 focus:ring-brand-yellow outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Lock size={13} className="text-gray-400" />
                <span>Password {isEdit ? '(Leave blank to retain)' : '*'}</span>
              </label>
              <input
                type="password"
                required={!isEdit}
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder={isEdit ? '•••••••• (unchanged)' : 'Minimum 6 characters'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold focus:ring-2 focus:ring-brand-yellow outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Role Type</label>
              <select
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-800 bg-white focus:ring-2 focus:ring-brand-yellow outline-hidden cursor-pointer"
              >
                <option value="subadmin">Staff Sub-Admin (Restricted to tab permissions)</option>
                <option value="admin">Super Admin (Full administrative access across all tabs)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Account Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-800 bg-white focus:ring-2 focus:ring-brand-yellow outline-hidden cursor-pointer"
              >
                <option value="active">Active (Access Allowed)</option>
                <option value="suspended">Suspended (Access Revoked)</option>
              </select>
            </div>
          </div>

          {/* Section 2: Permission Matrix (only relevant if role is subadmin) */}
          {formData.role === 'admin' ? (
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex items-center gap-3 text-teal-900 text-xs">
              <ShieldCheck size={20} className="shrink-0 text-teal-700" />
              <div>
                <p className="font-bold">Super Admin Privilege Selected</p>
                <p className="text-teal-700">This account will have unrestricted editor access across all dashboard modules and can manage staff accounts.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
                    Tab Access Matrix & Permissions
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Assign Viewer (Read-only), Editor (Full actions), or None (Hidden tab)
                  </p>
                </div>

                {/* Role Presets */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase mr-1 flex items-center gap-1">
                    <Sparkles size={11} /> Presets:
                  </span>
                  {ROLE_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyPreset(preset.apply)}
                      className="px-2 py-1 bg-gray-100 hover:bg-teal-50 hover:text-teal-900 text-gray-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer border border-gray-200/60"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Permission Table / List */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100 max-h-72 overflow-y-auto">
                <div className="grid grid-cols-12 bg-gray-50 px-4 py-2 text-[10px] font-extrabold uppercase tracking-wider text-gray-500">
                  <div className="col-span-6 sm:col-span-7">Module / Tab</div>
                  <div className="col-span-6 sm:col-span-5 text-right sm:text-center">Assigned Permission</div>
                </div>

                {PERMISSION_MODULES.map((mod) => {
                  const currentLevel = permissions[mod.id] || 'none';

                  return (
                    <div key={mod.id} className="grid grid-cols-12 px-4 py-2.5 items-center hover:bg-gray-50/70 transition-colors">
                      <div className="col-span-6 sm:col-span-7 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-gray-900">{mod.label}</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-gray-100 text-gray-600">
                            {mod.category}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 truncate">{mod.description}</p>
                      </div>

                      <div className="col-span-6 sm:col-span-5 flex items-center justify-end sm:justify-center gap-1">
                        {/* None Button */}
                        <button
                          type="button"
                          onClick={() => handlePermissionChange(mod.id, 'none')}
                          className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                            currentLevel === 'none'
                              ? 'bg-rose-100 text-rose-800 ring-1 ring-rose-400/50'
                              : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                          title="No Access (Tab hidden)"
                        >
                          <Ban size={10} />
                          <span>None</span>
                        </button>

                        {/* Viewer Button */}
                        <button
                          type="button"
                          onClick={() => handlePermissionChange(mod.id, 'viewer')}
                          className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                            currentLevel === 'viewer'
                              ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-400/50'
                              : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                          title="View Only (Read metrics & tables, no actions)"
                        >
                          <Eye size={10} />
                          <span>Viewer</span>
                        </button>

                        {/* Editor Button */}
                        <button
                          type="button"
                          onClick={() => handlePermissionChange(mod.id, 'editor')}
                          className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                            currentLevel === 'editor'
                              ? 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-500/50'
                              : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                          title="Editor (Full write, approve, edit, delete access)"
                        >
                          <Edit3 size={10} />
                          <span>Editor</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 size={15} />
              <span>{submitting ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Staff Member')}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
