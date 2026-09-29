import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Edit3,
  Trash2,
  Eye,
  Store,
  School,
  TrendingDown,
  RefreshCw,
  X,
  Check,
  ShieldCheck,
  ArrowUpDown,
  Tag
} from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';
import AdminKitFormPage from './AdminKitFormPage';
import { resolveImageUrl } from '../../utils/api';

export default function KitsTab() {
  const {
    kits = [],
    isLoadingKits,
    addKit,
    updateKit,
    updateKitApprovalStatus,
    deleteKit,
    refreshKits,
    sellers = [],
    schools = [],
    products = [],
    isEditor
  } = useAdminData();

  const canEdit = isEditor ? isEditor('products') : true;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'Approved' | 'Pending' | 'Rejected'
  const [schoolFilter, setSchoolFilter] = useState('all');

  const [viewMode, setViewMode] = useState('catalog'); // 'catalog' | 'form'
  const [editingKit, setEditingKit] = useState(null);
  const [detailModalKit, setDetailModalKit] = useState(null);
  const [rejectModalKit, setRejectModalKit] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Status metrics
  const totalKits = kits.length;
  const approvedKits = kits.filter(k => k.approvalStatus === 'Approved' || !k.approvalStatus);
  const pendingKits = kits.filter(k => k.approvalStatus === 'Pending');
  const rejectedKits = kits.filter(k => k.approvalStatus === 'Rejected');

  // Filtered kits
  const filteredKits = useMemo(() => {
    return kits.filter(k => {
      const q = searchTerm.toLowerCase();
      const titleMatch = (k.title || k.name || '').toLowerCase().includes(q);
      const skuMatch = (k.sku || '').toLowerCase().includes(q);
      const sellerMatch = (k.sellerName || '').toLowerCase().includes(q);
      const schoolMatch = (k.schoolName || k.school || '').toLowerCase().includes(q);
      const matchesSearch = !q || titleMatch || skuMatch || sellerMatch || schoolMatch;

      const curStatus = k.approvalStatus || 'Approved';
      const matchesStatus = statusFilter === 'all' || curStatus === statusFilter;

      const curSchool = k.schoolName || k.school || '';
      const matchesSchool = schoolFilter === 'all' || curSchool === schoolFilter;

      return matchesSearch && matchesStatus && matchesSchool;
    });
  }, [kits, searchTerm, statusFilter, schoolFilter]);

  // Unique schools for filter dropdown
  const uniqueSchools = useMemo(() => {
    const set = new Set();
    kits.forEach(k => {
      const sch = k.schoolName || k.school;
      if (sch) set.add(sch);
    });
    return Array.from(set);
  }, [kits]);

  const handleOpenAdd = () => {
    if (!canEdit) return;
    setEditingKit(null);
    setViewMode('form');
  };

  const handleOpenEdit = (kit) => {
    if (!canEdit) return;
    setEditingKit(kit);
    setViewMode('form');
  };

  const handleSaveKit = async (formData) => {
    if (!canEdit) return;
    if (editingKit) {
      await updateKit(editingKit.id || editingKit._id, formData);
    } else {
      await addKit(formData);
    }
    setViewMode('catalog');
    setEditingKit(null);
  };

  const handleDelete = (id, title) => {
    if (!canEdit) return;
    if (window.confirm(`Are you sure you want to delete kit bundle "${title}"?`)) {
      deleteKit(id);
    }
  };

  const handleQuickApprove = (id) => {
    if (!canEdit) return;
    updateKitApprovalStatus(id, 'Approved', 'Approved by administrator');
  };

  const handleConfirmReject = () => {
    if (!rejectModalKit || !canEdit) return;
    updateKitApprovalStatus(
      rejectModalKit.id || rejectModalKit._id,
      'Rejected',
      rejectionReason.trim() || 'Requirements not met'
    );
    setRejectModalKit(null);
    setRejectionReason('');
  };

  if (viewMode === 'form') {
    return (
      <AdminKitFormPage
        kit={editingKit}
        sellers={sellers}
        schools={schools}
        existingProducts={products}
        onSave={handleSaveKit}
        onBack={() => {
          setViewMode('catalog');
          setEditingKit(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-2xl text-gray-900 flex items-center gap-2">
            <Boxes className="text-indigo-600" size={26} /> Kit & Bundle Management
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Oversee, inspect, approve, and build multi-item bundled packages for schools, uniforms, and book sets.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => refreshKits && refreshKits()}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200 rounded-xl transition-all"
            title="Refresh kits catalog"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingKits ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          {canEdit && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Kit Bundle</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Bundles</span>
            <Boxes className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2">{totalKits}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Active & archived kit offerings</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Approved & Live</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{approvedKits.length}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Visible to buyers on storefront</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Pending Review</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{pendingKits.length}</p>
          <p className="text-[11px] text-amber-600 mt-0.5">Awaiting admin compliance check</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Rejected</span>
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-700 mt-2">{rejectedKits.length}</p>
          <p className="text-[11px] text-rose-600 mt-0.5">Needs revision by seller</p>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search kits by title, SKU, seller name, or school..."
            className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-white border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Approval Statuses</option>
            <option value="Approved">Approved Only</option>
            <option value="Pending">Pending Review</option>
            <option value="Rejected">Rejected</option>
          </select>

          {/* School Filter */}
          {uniqueSchools.length > 0 && (
            <select
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm bg-white border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-indigo-500 max-w-[200px] truncate"
            >
              <option value="all">All Schools</option>
              {uniqueSchools.map(sch => (
                <option key={sch} value={sch}>{sch}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Kits Catalog Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {filteredKits.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Boxes className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-base font-bold text-gray-800">No Kit Bundles Found</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              {searchTerm || statusFilter !== 'all' || schoolFilter !== 'all'
                ? 'Try adjusting your search criteria or clearing filters.'
                : 'Get started by creating your first bundled kit package for school uniforms or book sets.'}
            </p>
            {canEdit && (
              <button
                type="button"
                onClick={handleOpenAdd}
                className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create First Kit</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Kit / Bundle Info</th>
                  <th className="py-3 px-4">School & Grade</th>
                  <th className="py-3 px-4">Constituent Items</th>
                  <th className="py-3 px-4">Pricing & Savings</th>
                  <th className="py-3 px-4">Seller & Stock</th>
                  <th className="py-3 px-4">Approval Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {filteredKits.map(k => {
                  const kitId = k.id || k._id;
                  const primaryImg = Array.isArray(k.images) && k.images.length > 0 ? k.images[0] : (k.image || '');
                  const price = Number(k.bundlePrice || k.price || 0);
                  const mrp = Number(k.totalMrp || k.mrp || k.originalPrice || price);
                  const savings = Math.max(0, mrp - price);
                  const discountPct = mrp > 0 ? Math.round((savings / mrp) * 100) : 0;
                  const itemsCount = Array.isArray(k.items) ? k.items.length : 0;
                  const curStatus = k.approvalStatus || 'Approved';

                  return (
                    <tr key={kitId} className="hover:bg-gray-50/70 transition-colors">
                      {/* Kit Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={resolveImageUrl(primaryImg)}
                            alt={k.title || k.name}
                            className="w-12 h-12 object-cover rounded-xl border border-gray-200 bg-gray-100 flex-shrink-0"
                            onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=Kit'; }}
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-gray-900 truncate max-w-[220px]">
                              {k.title || k.name}
                            </h4>
                            <div className="flex items-center space-x-1.5 text-[11px] text-gray-500 mt-0.5">
                              {k.sku && <span className="font-mono">{k.sku}</span>}
                              {k.sku && <span>•</span>}
                              <span className="capitalize">{k.subCategory || 'Uniform Kit'}</span>
                            </div>
                            {k.badgeTag && (
                              <span className="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-bold rounded bg-indigo-50 text-indigo-700">
                                {k.badgeTag}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* School & Grade */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="font-semibold text-gray-800 flex items-center space-x-1">
                            <School className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <span className="truncate max-w-[150px]">{k.schoolName || k.school || 'General / Universal'}</span>
                          </div>
                          <p className="text-[11px] text-gray-500 truncate max-w-[150px]">
                            {k.classGrade || 'All Classes'}
                          </p>
                        </div>
                      </td>

                      {/* Constituent Items */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => setDetailModalKit(k)}
                          className="group text-left"
                        >
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold text-xs group-hover:bg-indigo-100 transition-colors">
                            <Boxes className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{itemsCount} Line Items</span>
                          </span>
                          {itemsCount > 0 && (
                            <p className="text-[11px] text-gray-500 line-clamp-1 mt-1 max-w-[180px]">
                              {k.items.map(it => `${it.quantity}x ${it.name}`).join(', ')}
                            </p>
                          )}
                        </button>
                      </td>

                      {/* Pricing & Savings */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-baseline space-x-1.5">
                            <span className="font-black text-sm text-gray-900">₹{price}</span>
                            {mrp > price && (
                              <span className="text-[11px] text-gray-400 line-through">₹{mrp}</span>
                            )}
                          </div>
                          {savings > 0 && (
                            <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-50 text-emerald-700">
                              Save ₹{savings} ({discountPct}%)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Seller & Stock */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1 font-medium text-gray-800">
                            <Store className="w-3 h-3 text-gray-400" />
                            <span className="truncate max-w-[130px]">{k.sellerName || 'Marketplace'}</span>
                          </div>
                          <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded ${
                            Number(k.stock || k.stockQuantity || 0) > 0
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}>
                            {Number(k.stock || k.stockQuantity || 0)} in stock
                          </span>
                        </div>
                      </td>

                      {/* Approval Status */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            curStatus === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            curStatus === 'Rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {curStatus === 'Approved' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                            {curStatus === 'Rejected' && <AlertTriangle className="w-3 h-3 mr-1" />}
                            {curStatus === 'Pending' && <Clock className="w-3 h-3 mr-1" />}
                            {curStatus}
                          </span>

                          {curStatus === 'Rejected' && (k.approvalComment || k.rejectionReason) && (
                            <p className="text-[10px] text-rose-600 line-clamp-1 max-w-[140px]" title={k.approvalComment || k.rejectionReason}>
                              {k.approvalComment || k.rejectionReason}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {/* Quick Approve / Reject for Pending */}
                          {canEdit && curStatus !== 'Approved' && (
                            <button
                              type="button"
                              onClick={() => handleQuickApprove(kitId)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Quick Approve Kit"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}

                          {canEdit && curStatus !== 'Rejected' && (
                            <button
                              type="button"
                              onClick={() => setRejectModalKit(k)}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Reject / Request Revision"
                            >
                              <AlertTriangle className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setDetailModalKit(k)}
                            className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Inspect Kit Breakdown"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {canEdit && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(k)}
                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Edit Kit Bundle"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(kitId, k.title || k.name)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Delete Kit"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Kit Inclusions Modal */}
      {detailModalKit && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-50 text-indigo-700 uppercase">
                  Kit Bundle Breakdown
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-1">
                  {detailModalKit.title || detailModalKit.name}
                </h3>
              </div>
              <button
                onClick={() => setDetailModalKit(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Constituent Line Items ({detailModalKit.items?.length || 0})
              </p>
              <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                {(detailModalKit.items || []).map((item, idx) => (
                  <div key={idx} className="p-3 bg-gray-50/50 flex items-center justify-between text-xs">
                    <div>
                      <h5 className="font-bold text-gray-900">{item.name}</h5>
                      <div className="flex items-center space-x-2 text-gray-500 text-[11px]">
                        <span>Unit MRP: ₹{item.unitPrice}</span>
                        {item.size && <span>• Size: {item.size}</span>}
                        {item.color && <span>• Color: {item.color}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {item.quantity}x = ₹{(item.unitPrice || 0) * (item.quantity || 1)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-indigo-50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-indigo-700">Combined Items MRP</p>
                <p className="text-lg font-black text-indigo-950">₹{detailModalKit.totalMrp || detailModalKit.bundlePrice || 0}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-emerald-700">Bundle Price</p>
                <p className="text-lg font-black text-emerald-800">₹{detailModalKit.bundlePrice || 0}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setDetailModalKit(null)}
                className="px-4 py-2 bg-gray-800 text-white text-xs font-semibold rounded-xl hover:bg-gray-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModalKit && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold text-gray-900">Reject Kit Bundle</h3>
              </div>
              <button
                onClick={() => setRejectModalKit(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Provide feedback for the merchant regarding why this bundle cannot be approved:
            </p>

            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Constituent item sizing missing or bundled price exceeds individual total MRP."
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500"
            />

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalKit(null)}
                className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
