import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
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
  Sparkles,
  Layers,
  ShieldAlert,
  Info,
  Check
} from 'lucide-react';
import { PERMISSION_MODULES, ROLE_PRESETS } from '../modals/SubadminModal';

export default function SubadminFormPage({ subadmin, onSave, onBack }) {
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
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
  }, [subadmin]);

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
      setError('Please provide the staff member full name');
      return;
    }
    if (!formData.email.trim()) {
      setError('Please provide a valid email address');
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
    } catch (err) {
      setError(err.message || 'Failed to save admin account');
    } finally {
      setSubmitting(false);
    }
  };

  const categories = ['all', ...Array.from(new Set(PERMISSION_MODULES.map(m => m.category)))];

  const filteredModules = PERMISSION_MODULES.filter(m => 
    activeCategory === 'all' || m.category === activeCategory
  );

  // Permission summary counts
  const editorCount = Object.values(permissions).filter(l => l === 'editor').length;
  const viewerCount = Object.values(permissions).filter(l => l === 'viewer').length;
  const noneCount = PERMISSION_MODULES.length - (editorCount + viewerCount);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      
      {/* Top Breadcrumbs & Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200/80">
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:text-teal-900 hover:bg-teal-50 font-bold transition-all shadow-2xs cursor-pointer group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Team Directory</span>
          </button>
          <span className="text-gray-400">•</span>
          <span className="text-gray-500">Staff Administration</span>
          <span className="text-gray-400">•</span>
          <span className="font-bold text-teal-900">{isEdit ? `Edit: ${subadmin.name}` : 'New Staff Account'}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            <CheckCircle2 size={15} />
            <span>{submitting ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Staff Member')}</span>
          </button>
        </div>
      </div>

      {/* Page Title & Context Header */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-800 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
            {isEdit ? <ShieldCheck size={28} /> : <UserPlus size={28} />}
          </div>
          <div>
            <h1 className="font-display font-black text-2xl text-gray-900">
              {isEdit ? `Edit Staff Member: ${subadmin.name}` : 'Add New Admin / Sub-Admin'}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Configure personnel authentication credentials, account authority, and tab-by-tab operational access.
            </p>
          </div>
        </div>

        {/* Live Permission Pill Summary */}
        <div className="flex items-center gap-2 bg-gray-50 px-3.5 py-2 rounded-2xl border border-gray-200/70 text-xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">Access:</span>
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-800">
            {formData.role === 'admin' ? '14 Editors' : `${editorCount} Editors`}
          </span>
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-100 text-amber-900">
            {formData.role === 'admin' ? '0 Viewers' : `${viewerCount} Viewers`}
          </span>
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-rose-100 text-rose-800">
            {formData.role === 'admin' ? '0 None' : `${noneCount} None`}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center gap-2.5 shadow-xs">
          <AlertCircle size={18} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Section 1: Staff Credentials & Profile Details */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="font-display font-black text-base text-gray-900 flex items-center gap-2">
                <User size={18} className="text-teal-800" />
                <span>1. Account Credentials & Security</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Staff member identity, contact information, role authority, and login password
              </p>
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
              Required Info
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Full Name */}
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

            {/* Email Address */}
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

            {/* Contact Phone */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Phone size={13} className="text-gray-400" />
                <span>Contact Phone</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold focus:ring-2 focus:ring-brand-yellow outline-hidden"
              />
            </div>

            {/* Password */}
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

            {/* Role Authority */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Layers size={13} className="text-gray-400" />
                <span>Role Authority</span>
              </label>
              <select
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-800 bg-white focus:ring-2 focus:ring-brand-yellow outline-hidden cursor-pointer"
              >
                <option value="subadmin">Staff Sub-Admin (Restricted to assigned tab permissions)</option>
                <option value="admin">Super Admin (Full administrative access across all tabs)</option>
              </select>
            </div>

            {/* Account Status */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-gray-400" />
                <span>Account Status</span>
              </label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-800 bg-white focus:ring-2 focus:ring-brand-yellow outline-hidden cursor-pointer"
              >
                <option value="active">Active (Access Granted)</option>
                <option value="suspended">Suspended (Access Revoked immediately)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Tab-by-Tab Working Permission Matrix */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <h3 className="font-display font-black text-base text-gray-900 flex items-center gap-2">
                <ShieldCheck size={18} className="text-teal-800" />
                <span>2. Tab Working Access & Permission Matrix</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Configure module access individually: Viewer (read-only), Editor (full actions), or None (tab hidden).
              </p>
            </div>

            {/* Presets Bar */}
            {formData.role !== 'admin' && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase text-gray-400 flex items-center gap-1 mr-1">
                  <Sparkles size={12} className="text-brand-yellow" /> Presets:
                </span>
                {ROLE_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(preset.apply)}
                    className="px-2.5 py-1.5 bg-gray-100 hover:bg-teal-50 hover:text-teal-900 text-gray-700 rounded-xl text-[11px] font-bold transition-all cursor-pointer border border-gray-200/70"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {formData.role === 'admin' ? (
            <div className="p-6 bg-teal-50/70 border border-teal-200 rounded-2xl flex items-start gap-3.5 text-teal-900">
              <ShieldCheck size={24} className="text-teal-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Super Admin Privilege Selected</h4>
                <p className="text-xs text-teal-700 mt-1 leading-relaxed">
                  Accounts with the <strong>Super Admin</strong> role have unrestricted editor capabilities across all 14 dashboard modules and are authorized to manage team staff accounts. Individual tab restrictions do not apply to this account.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pb-2">
                <span className="text-[11px] font-bold text-gray-400 uppercase mr-1">Filter:</span>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer capitalize ${
                      activeCategory === cat
                        ? 'bg-teal-800 text-white shadow-2xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Matrix Table */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100">
                <div className="grid grid-cols-12 bg-gray-50/80 px-5 py-3 text-[10px] font-extrabold uppercase tracking-wider text-gray-500">
                  <div className="col-span-12 sm:col-span-7">Dashboard Module / Tab</div>
                  <div className="col-span-12 sm:col-span-5 text-left sm:text-right">Assigned Working Access</div>
                </div>

                {filteredModules.map((mod) => {
                  const currentLevel = permissions[mod.id] || 'none';

                  return (
                    <div 
                      key={mod.id} 
                      className="grid grid-cols-12 px-5 py-4 items-center hover:bg-teal-50/20 transition-colors gap-3 sm:gap-0"
                    >
                      {/* Module Info */}
                      <div className="col-span-12 sm:col-span-7 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-900">{mod.label}</span>
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200/60">
                            {mod.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">{mod.description}</p>
                      </div>

                      {/* 3-State Permission Segmented Control */}
                      <div className="col-span-12 sm:col-span-5 flex items-center justify-start sm:justify-end gap-1.5">
                        {/* None (Hidden) */}
                        <button
                          type="button"
                          onClick={() => handlePermissionChange(mod.id, 'none')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                            currentLevel === 'none'
                              ? 'bg-rose-100 text-rose-800 ring-2 ring-rose-400/60 shadow-2xs'
                              : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                          title="No Access: Tab is hidden completely from navigation"
                        >
                          <Ban size={12} />
                          <span>None</span>
                          {currentLevel === 'none' && <Check size={11} className="ml-0.5" />}
                        </button>

                        {/* Viewer (Read-only) */}
                        <button
                          type="button"
                          onClick={() => handlePermissionChange(mod.id, 'viewer')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                            currentLevel === 'viewer'
                              ? 'bg-amber-100 text-amber-900 ring-2 ring-amber-400/60 shadow-2xs'
                              : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                          title="Viewer: Can view tables and metrics, but cannot edit, approve, or delete"
                        >
                          <Eye size={12} />
                          <span>Viewer</span>
                          {currentLevel === 'viewer' && <Check size={11} className="ml-0.5" />}
                        </button>

                        {/* Editor (Full actions) */}
                        <button
                          type="button"
                          onClick={() => handlePermissionChange(mod.id, 'editor')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                            currentLevel === 'editor'
                              ? 'bg-emerald-100 text-emerald-900 ring-2 ring-emerald-500/60 shadow-2xs'
                              : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                          title="Editor: Unrestricted write, edit, approve, and delete permissions"
                        >
                          <Edit3 size={12} />
                          <span>Editor</span>
                          {currentLevel === 'editor' && <Check size={11} className="ml-0.5" />}
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          )}
        </div>

        {/* Section 3: Bottom Action Toolbar */}
        <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 z-20">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Info size={16} className="text-teal-700 shrink-0" />
            <span>
              Permissions take effect on the staff member's next console login or page refresh.
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 size={16} />
              <span>{submitting ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Staff Member')}</span>
            </button>
          </div>
        </div>

      </form>

    </div>
  );
}
