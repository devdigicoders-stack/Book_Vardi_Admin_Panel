import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle,
  Clock, 
  Edit3, 
  Trash2, 
  Eye, 
  Tag,
  Store,
  ShieldCheck,
  Zap,
  Check,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';
import { CATEGORIES } from '../../constants/categories';
import ProductFormPage from './ProductFormPage';
import ProductReviewModal from '../modals/ProductReviewModal';

export default function ProductsTab() {
  const {
    products,
    addProduct,
    updateProduct,
    updateProductApprovalStatus,
    deleteProduct,
    sellers,
    isEditor
  } = useAdminData();

  const canEdit = isEditor ? isEditor('products') : true;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [viewMode, setViewMode] = useState('catalog'); // 'catalog' | 'form'
  const [editingProduct, setEditingProduct] = useState(null);
  const [reviewingProduct, setReviewingProduct] = useState(null);
  const [previewProduct, setPreviewProduct] = useState(null);

  // Status Metrics
  const pendingProducts = products.filter(p => p.approvalStatus === 'Pending');
  const approvedProducts = products.filter(p => p.approvalStatus === 'Approved' || !p.approvalStatus);
  const rejectedProducts = products.filter(p => p.approvalStatus === 'Rejected');

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (p.sellerName && p.sellerName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const currentStatus = p.approvalStatus || 'Approved';
    const matchesStatus = statusFilter === 'all' || currentStatus === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleOpenAdd = () => {
    if (!canEdit) return;
    setEditingProduct(null);
    setViewMode('form');
  };

  const handleOpenEdit = (prod) => {
    if (!canEdit) return;
    setEditingProduct(prod);
    setViewMode('form');
  };

  const handleSaveProduct = async (formData) => {
    if (!canEdit) return;
    if (editingProduct) {
      await updateProduct(editingProduct.id || editingProduct._id, formData);
    } else {
      await addProduct(formData);
    }
    setViewMode('catalog');
    setEditingProduct(null);
  };

  const handleDelete = (id, name) => {
    if (!canEdit) return;
    if (window.confirm(`Are you sure you want to remove "${name}" from the marketplace catalog?`)) {
      deleteProduct(id);
    }
  };

  const handleUpdateStatus = (productId, newStatus, remark) => {
    if (!canEdit) return;
    updateProductApprovalStatus(productId, newStatus, remark);
    if (previewProduct && previewProduct.id === productId) {
      setPreviewProduct(prev => prev ? {
        ...prev,
        approvalStatus: newStatus,
        approvalComment: remark,
        rejectionReason: newStatus === 'Rejected' ? remark : null
      } : null);
    }
  };

  if (viewMode === 'form') {
    return (
      <ProductFormPage
        product={editingProduct}
        sellers={sellers}
        onSave={handleSaveProduct}
        onBack={() => {
          setViewMode('catalog');
          setEditingProduct(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-2xl text-gray-900 flex items-center gap-2">
            <Package className="text-teal-700" size={24} /> Marketplace Products Catalog
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Monitor, inspect, approve, edit, or reject merchant inventory with audit remarks across uniforms, books & stationery.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {pendingProducts.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('Pending');
                setReviewingProduct(pendingProducts[0]);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer animate-pulse"
            >
              <Zap size={15} />
              <span>Review Urgent Queue ({pendingProducts.length})</span>
            </button>
          )}

          {canEdit && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={16} /> Add Catalog Product
            </button>
          )}
        </div>
      </div>

      {/* Urgent Approval Queue Banner */}
      {pendingProducts.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border border-amber-300/80 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs ring-4 ring-amber-100">
              <Clock size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm text-gray-900">Urgent Product Approval Queue</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-600 text-white shadow-2xs">
                  {pendingProducts.length} Pending Administrative Inspection
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1 max-w-2xl">
                Direct merchant submissions must undergo image quality inspection, pricing / MRP verification, and board policy checks before going live on the customer store.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('Pending')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'Pending' 
                  ? 'bg-amber-600 text-white shadow-xs' 
                  : 'bg-white text-gray-800 border border-gray-200 hover:bg-amber-50 hover:border-amber-300'
              }`}
            >
              Filter Queue ({pendingProducts.length})
            </button>
            <button
              type="button"
              onClick={() => setReviewingProduct(pendingProducts[0])}
              className="px-4 py-2 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck size={15} />
              <span>Inspect & Approve</span>
            </button>
          </div>
        </div>
      )}

      {/* Quick Status Pill Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scrollbar-none">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-teal-900 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          All Products ({products.length})
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Pending')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
            statusFilter === 'Pending'
              ? 'bg-amber-600 text-white shadow-xs'
              : pendingProducts.length > 0
                ? 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Clock size={13} className={pendingProducts.length > 0 ? 'text-amber-700 animate-spin-slow' : ''} />
          <span>⚡ Urgent Approval Queue ({pendingProducts.length})</span>
          {pendingProducts.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Approved')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
            statusFilter === 'Approved'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <CheckCircle2 size={13} className="text-emerald-600" />
          <span>Approved ({approvedProducts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Rejected')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
            statusFilter === 'Rejected'
              ? 'bg-rose-700 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <AlertTriangle size={13} className="text-rose-600" />
          <span>Rejected ({rejectedProducts.length})</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by product name, SKU, or seller..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 bg-white focus:ring-2 focus:ring-brand-yellow outline-hidden capitalize cursor-pointer"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 bg-white focus:ring-2 focus:ring-brand-yellow outline-hidden cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending Review (Urgent Queue)</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">Product Item</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price / MRP</th>
                <th className="px-4 py-3">Stock Level</th>
                <th className="px-4 py-3">Merchant / Seller</th>
                <th className="px-4 py-3">Approval Status & Remark</th>
                <th className="px-4 py-3 text-right">Review Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredProducts.map((p) => {
                const status = p.approvalStatus || 'Approved';
                const hasRemark = Boolean(p.approvalComment || p.rejectionReason);
                const remarkText = p.rejectionReason || p.approvalComment || '';

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50/70 transition-colors cursor-pointer"
                    onClick={() => setPreviewProduct(p)}
                  >
                    
                    {/* Thumbnail & Title */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img 
                          src={p.image || (Array.isArray(p.images) && p.images[0]) || 'https://images.unsplash.com/photo-1593032465175-481ac7f401a0?w=150'} 
                          alt={p.name} 
                          className="w-12 h-12 rounded-xl object-cover border border-gray-200 shrink-0 bg-white"
                        />
                        <div className="min-w-0 max-w-xs">
                          <div className="font-bold text-gray-900 truncate">{p.name}</div>
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5">{p.sku || `SKU-${p.id}`}</div>
                          {p.badge && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                              {p.badge}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 capitalize font-semibold text-gray-700 whitespace-nowrap">
                      {p.category}
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-900">₹{p.price}</span>
                        {Array.isArray(p.sizeVariants) && p.sizeVariants.length > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-teal-50 text-teal-800 border border-teal-200">
                            {p.sizeVariants.length} Sizes
                          </span>
                        )}
                      </div>
                      {p.originalPrice && p.originalPrice > p.price && (
                        <div className="text-[10px] text-gray-400 line-through">₹{p.originalPrice}</div>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        (p.stockQuantity ?? 50) <= 5 ? 'bg-rose-100 text-rose-800' :
                        (p.stockQuantity ?? 50) <= 15 ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {p.stockQuantity ?? 50} units
                      </span>
                    </td>

                    {/* Seller */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-gray-800 font-semibold flex items-center gap-1.5">
                        <Store size={13} className="text-teal-700" />
                        <span>{p.sellerName || 'Direct Marketplace'}</span>
                      </div>
                    </td>

                    {/* Approval Status & Remarks */}
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="space-y-1 max-w-xs">
                        <button
                          type="button"
                          onClick={() => setReviewingProduct(p)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase transition-all cursor-pointer shadow-2xs border ${
                            status === 'Approved' ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100' :
                            status === 'Rejected' ? 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100' :
                            'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 animate-pulse'
                          }`}
                          title="Click to review product and change approval status"
                        >
                          {status === 'Approved' && <CheckCircle2 size={12} className="text-emerald-600" />}
                          {status === 'Pending' && <Clock size={12} className="text-amber-600" />}
                          {status === 'Rejected' && <AlertTriangle size={12} className="text-rose-600" />}
                          <span>{status === 'Pending' ? 'Pending Review' : status}</span>
                        </button>

                        {/* Remark snippet */}
                        {hasRemark && (
                          <div
                            className={`text-[10px] truncate max-w-[200px] flex items-center gap-1 ${
                              status === 'Rejected' ? 'text-rose-700 font-medium' : 'text-gray-500'
                            }`}
                            title={remarkText}
                          >
                            <MessageSquare size={10} className="shrink-0 opacity-70" />
                            <span className="truncate">{remarkText}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setReviewingProduct(p)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold ${
                            status === 'Pending' 
                              ? 'bg-amber-500 text-white hover:bg-amber-600 px-2.5 shadow-2xs' 
                              : 'text-teal-800 hover:bg-teal-50'
                          }`}
                          title={canEdit ? "Review & Update Approval Status" : "Inspect Product Details (View-Only)"}
                        >
                          <ShieldCheck size={15} />
                          {status === 'Pending' && <span>Inspect</span>}
                        </button>
                        
                        {canEdit && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 text-gray-500 hover:text-teal-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit Details"
                            >
                              <Edit3 size={15} />
                            </button>

                            <button
                              onClick={() => handleDelete(p.id, p.name)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Product"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-gray-400 text-xs">
                    No products matched your search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Catalog Preview Modal */}
      {previewProduct && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Catalog Preview</p>
                <h3 className="font-display font-extrabold text-xl text-gray-900">{previewProduct.name}</h3>
              </div>
              <button
                onClick={() => setPreviewProduct(null)}
                className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-800 cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              <div className="p-5 border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50">
                <img
                  src={previewProduct.image || 'https://images.unsplash.com/photo-1593032465175-481ac7f401a0?w=800'}
                  alt={previewProduct.name}
                  className="w-full h-[300px] md:h-full object-contain rounded-2xl border border-gray-200 bg-white"
                />
              </div>

              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                    previewProduct.approvalStatus === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                    previewProduct.approvalStatus === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {previewProduct.approvalStatus || 'Approved'}
                  </span>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{previewProduct.badge || 'NEW'}</span>
                </div>

                <div>
                  <div className="text-[11px] uppercase tracking-wider text-gray-500 mb-1">Price</div>
                  <div className="text-3xl font-display font-extrabold text-gray-900">₹{previewProduct.price}</div>
                  {previewProduct.originalPrice && previewProduct.originalPrice > previewProduct.price && (
                    <div className="text-xs text-gray-400 line-through mt-1">₹{previewProduct.originalPrice}</div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-gray-50 p-3 border border-gray-100">
                    <div className="text-gray-500 uppercase tracking-wider">Category</div>
                    <div className="font-bold text-gray-900 mt-1 capitalize">{previewProduct.category}</div>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3 border border-gray-100">
                    <div className="text-gray-500 uppercase tracking-wider">Stock</div>
                    <div className="font-bold text-gray-900 mt-1">{previewProduct.stockQuantity ?? 50} units</div>
                  </div>
                </div>

                <div className="rounded-xl bg-gray-50 p-3 border border-gray-100 text-xs">
                  <div className="text-gray-500 uppercase tracking-wider mb-1">Seller</div>
                  <div className="font-bold text-gray-900">{previewProduct.sellerName || 'Direct Marketplace'}</div>
                  <div className="text-gray-500 mt-1">SKU: {previewProduct.sku || `SKU-${previewProduct.id}`}</div>
                </div>

                <div className="rounded-xl bg-gray-50 p-3 border border-gray-100 text-xs">
                  <div className="text-gray-500 uppercase tracking-wider mb-1">Approval Remark</div>
                  <div className="text-gray-700 leading-relaxed">
                    {previewProduct.approvalComment || previewProduct.rejectionReason || 'No remark added for this product yet.'}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      const toReview = previewProduct;
                      setPreviewProduct(null);
                      setReviewingProduct(toReview);
                    }}
                    className="px-4 py-2 rounded-xl bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <ShieldCheck size={14} /> Review & Approve
                  </button>
                  <button
                    onClick={() => setPreviewProduct(null)}
                    className="px-3 py-2 rounded-xl border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-100 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Product Review & Inspection Modal */}
      <ProductReviewModal
        isOpen={Boolean(reviewingProduct)}
        onClose={() => setReviewingProduct(null)}
        product={reviewingProduct}
        onUpdateStatus={handleUpdateStatus}
        readOnly={!canEdit}
      />

    </div>
  );
}
