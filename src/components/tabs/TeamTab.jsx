import React, { useState } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  UserPlus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  AlertTriangle,
  UserX,
  UserCheck,
  Lock,
  Mail,
  Phone,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';
import { PERMISSION_MODULES } from '../modals/SubadminModal';
import SubadminFormPage from './SubadminFormPage';

export default function TeamTab() {
  const { 
    subadmins, 
    addSubadmin, 
    updateSubadmin, 
    deleteSubadmin, 
    adminUser,
    isSuperAdmin 
  } = useAdminData();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [viewMode, setViewMode] = useState('directory'); // 'directory' | 'form'
  const [editingSubadmin, setEditingSubadmin] = useState(null);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Count metrics
  const totalStaff = subadmins.length;
  const activeCount = subadmins.filter(s => s.status === 'active').length;
  const superAdminCount = subadmins.filter(s => s.role === 'admin' || s.role === 'super_admin').length;
  const suspendedCount = subadmins.filter(s => s.status === 'suspended').length;

  const filteredStaff = subadmins.filter(s => {
    const matchesSearch = (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.phone || '').includes(searchTerm);
    const matchesRole = roleFilter === 'all' || s.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleOpenAdd = () => {
    setEditingSubadmin(null);
    setViewMode('form');
    setActionError('');
    setActionSuccess('');
  };

  const handleOpenEdit = (sub) => {
    setEditingSubadmin(sub);
    setViewMode('form');
    setActionError('');
    setActionSuccess('');
  };

  const handleSaveSubadmin = async (formData) => {
    try {
      if (editingSubadmin) {
        const id = editingSubadmin._id || editingSubadmin.id;
        await updateSubadmin(id, formData);
        setActionSuccess(`Permissions updated successfully for ${formData.name}`);
      } else {
        await addSubadmin(formData);
        setActionSuccess(`Staff sub-admin "${formData.name}" created successfully`);
      }
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setActionError(err.message || 'Operation failed');
      throw err;
    }
  };

  const handleDelete = async (sub) => {
    const id = sub._id || sub.id;
    if (sub.role === 'admin' || sub.role === 'super_admin') {
      if (!window.confirm(`Warning: "${sub.name}" is a Super Admin. Are you sure you want to remove this account?`)) {
        return;
      }
    } else {
      if (!window.confirm(`Are you sure you want to revoke access and delete account for "${sub.name}"?`)) {
        return;
      }
    }

    try {
      await deleteSubadmin(id);
      setActionSuccess(`Staff account "${sub.name}" deleted`);
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      setActionError(err.message || 'Failed to delete staff member');
    }
  };

  const handleToggleStatus = async (sub) => {
    const id = sub._id || sub.id;
    const newStatus = sub.status === 'active' ? 'suspended' : 'active';
    try {
      await updateSubadmin(id, { status: newStatus });
      setActionSuccess(`${sub.name} is now ${newStatus}`);
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      setActionError(err.message || 'Failed to update status');
    }
  };

  const getPermissionSummary = (sub) => {
    if (sub.role === 'admin' || sub.role === 'super_admin') {
      return { type: 'all', label: 'All Tabs (Super Admin)' };
    }
    const perms = sub.permissions || {};
    let editors = 0;
    let viewers = 0;
    Object.values(perms).forEach(level => {
      if (level === 'editor') editors++;
      else if (level === 'viewer') viewers++;
    });
    return { type: 'split', editors, viewers, total: PERMISSION_MODULES.length };
  };

  if (!isSuperAdmin()) {
    return (
      <div className="p-8 bg-white rounded-3xl border border-rose-100 shadow-xs text-center space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert size={32} />
        </div>
        <h2 className="font-display font-extrabold text-xl text-gray-900">Restricted Administration Area</h2>
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          Only authorized Super Administrators have security privileges to manage staff accounts and role-based permissions.
        </p>
      </div>
    );
  }

  // Dedicated Full-Page View for Add / Edit Sub-Admin
  if (viewMode === 'form') {
    return (
      <SubadminFormPage
        subadmin={editingSubadmin}
        onSave={async (formData) => {
          await handleSaveSubadmin(formData);
          setViewMode('directory');
        }}
        onBack={() => setViewMode('directory')}
      />
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-black text-2xl text-gray-900 flex items-center gap-2.5">
            <Shield className="text-teal-800" size={26} /> 
            <span>Staff RBAC & Sub-Admin Management</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Create administrators & sub-admins, define module working access, and assign granular viewer / editor permissions.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 shrink-0"
        >
          <UserPlus size={16} />
          <span>Add Admin / Sub-Admin</span>
        </button>
      </div>

      {/* Alerts */}
      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-xs">
          <AlertTriangle size={16} className="text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-gray-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Staff</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{totalStaff}</p>
          <span className="text-[10px] text-gray-400">All registered admins</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-teal-100 bg-gradient-to-br from-white to-teal-50/40 shadow-xs">
          <p className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">Active Staff</p>
          <p className="text-2xl font-black text-teal-950 mt-1">{activeCount}</p>
          <span className="text-[10px] text-teal-700">Access currently granted</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/40 shadow-xs">
          <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Super Admins</p>
          <p className="text-2xl font-black text-emerald-950 mt-1">{superAdminCount}</p>
          <span className="text-[10px] text-emerald-700">Unrestricted full control</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-rose-100 bg-gradient-to-br from-white to-rose-50/30 shadow-xs">
          <p className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Suspended</p>
          <p className="text-2xl font-black text-rose-950 mt-1">{suspendedCount}</p>
          <span className="text-[10px] text-rose-700">Access revoked</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search staff by name, email, phone..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold focus:ring-2 focus:ring-brand-yellow outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 bg-white focus:ring-2 focus:ring-brand-yellow outline-hidden cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="subadmin">Staff Sub-Admins</option>
            <option value="admin">Super Admins</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 bg-white focus:ring-2 focus:ring-brand-yellow outline-hidden cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* Staff Directory Table */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Staff Member</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Tab Permissions</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <Shield size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-gray-600">No staff members found</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Try adjusting your search criteria or create a new sub-admin.</p>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((sub) => {
                  const id = sub._id || sub.id;
                  const isCurrentLoggedUser = (adminUser?.email && sub.email && adminUser.email.toLowerCase() === sub.email.toLowerCase());
                  const summary = getPermissionSummary(sub);

                  return (
                    <tr key={id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Name & Contact */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 font-bold flex items-center justify-center text-xs shrink-0">
                            {sub.name ? sub.name.charAt(0).toUpperCase() : 'A'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-gray-900">{sub.name || 'Unnamed Admin'}</span>
                              {isCurrentLoggedUser && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-teal-100 text-teal-900">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Mail size={11} className="text-gray-400" />
                                <span>{sub.email}</span>
                              </span>
                              {sub.phone && (
                                <span className="flex items-center gap-1">
                                  • <Phone size={11} className="text-gray-400" />
                                  <span>{sub.phone}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        {sub.role === 'admin' || sub.role === 'super_admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                            <ShieldCheck size={11} />
                            Super Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-900">
                            <Layers size={11} />
                            Staff Sub-Admin
                          </span>
                        )}
                      </td>

                      {/* Permissions Preview */}
                      <td className="py-3.5 px-4">
                        {summary.type === 'all' ? (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            Full Access (14 Modules)
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                            {summary.editors > 0 && (
                              <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                <Edit3 size={10} />
                                {summary.editors} Editor
                              </span>
                            )}
                            {summary.viewers > 0 && (
                              <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1">
                                <Eye size={10} />
                                {summary.viewers} Viewer
                              </span>
                            )}
                            {summary.editors === 0 && summary.viewers === 0 && (
                              <span className="text-[10px] text-gray-400 font-semibold italic">
                                No tabs granted
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleStatus(sub)}
                          disabled={isCurrentLoggedUser}
                          title={isCurrentLoggedUser ? 'Cannot suspend your own logged-in account' : 'Click to toggle status'}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold cursor-pointer transition-colors ${
                            sub.status === 'active'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                          } ${isCurrentLoggedUser ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          {sub.status === 'active' ? (
                            <>
                              <UserCheck size={11} />
                              Active
                            </>
                          ) : (
                            <>
                              <UserX size={11} />
                              Suspended
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(sub)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-teal-900 hover:bg-teal-50 border border-transparent hover:border-teal-200 transition-colors cursor-pointer"
                            title="Edit Permissions & Details"
                          >
                            <Edit3 size={15} />
                          </button>
                          
                          <button
                            onClick={() => handleDelete(sub)}
                            disabled={isCurrentLoggedUser}
                            className={`p-1.5 rounded-lg text-gray-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer ${
                              isCurrentLoggedUser ? 'opacity-30 cursor-not-allowed' : ''
                            }`}
                            title={isCurrentLoggedUser ? 'Cannot delete current account' : 'Delete Account'}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
