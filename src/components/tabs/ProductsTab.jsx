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
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Layers
} from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';
import { CATEGORIES } from '../../constants/categories';
import ProductFormPage from './ProductFormPage';
import ProductReviewModal from '../modals/ProductReviewModal';
import { resolveImageUrl, parseSizeVariants } from '../../utils/api';

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
  const [expandedProductId, setExpandedProductId] = useState(null);

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
            <option key="cat-all" value="all">All Categories</option>
            {CATEGORIES.map((c, idx) => {
              const catId = typeof c === 'string' ? c : (c.id || c.name || `cat-${idx}`);
              const catName = typeof c === 'string' ? c : (c.name || c.label || c.id);
              return (
                <option key={catId} value={catId}>
                  {catName}
                </option>
              );
            })}
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
                const pId = p._id || p.id;
                const isExpanded = expandedProductId === pId;
                const pVariants = parseSizeVariants(p);
                const hasVariants = pVariants.length > 0;

                return (
                  <React.Fragment key={pId}>
                    <tr
                      className="hover:bg-gray-50/70 transition-colors cursor-pointer"
                      onClick={() => setPreviewProduct(p)}
                    >
                      
                      {/* Thumbnail & Title */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {(() => {
                            const rawImg = p.image || (Array.isArray(p.images) && p.images[0]);
                            const imgUrl = rawImg ? resolveImageUrl(rawImg) : '';
                            return imgUrl ? (
                              <img 
                                src={imgUrl} 
                                alt={p.name} 
                                className="w-12 h-12 rounded-xl object-cover border border-gray-200 shrink-0 bg-white"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl border border-gray-200 shrink-0 bg-gray-100 flex items-center justify-center text-gray-400 text-[10px] font-bold">
                                No Img
                              </div>
                            );
                          })()}
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
                          {hasVariants && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedProductId(isExpanded ? null : pId);
                              }}
                              className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 flex items-center gap-1 cursor-pointer transition-colors"
                              title="Click to expand variant list & details"
                            >
                              <Layers size={11} />
                              <span>{p.sizeVariants.length} Variants</span>
                              {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                            </button>
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

                    {/* Inline Expandable Sub-row for Variant Products Expanded Details */}
                    {isExpanded && hasVariants && (
                      <tr className="bg-teal-50/40 border-y border-teal-100">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="space-y-3 bg-white p-4 rounded-xl border border-teal-200 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-teal-950 uppercase tracking-wider flex items-center gap-1.5">
                                <Layers size={14} className="text-teal-700" />
                                <span>Variant Products Expanded Details & Prices ({pVariants.length})</span>
                              </span>
                              <span className="text-[10px] text-gray-500 font-bold">SKU: {p.sku || 'N/A'}</span>
                            </div>

                            {/* Variant Preview Image Layout in Row */}
                            <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 border-b border-gray-100 scrollbar-thin">
                              {pVariants.map((v, vIdx) => {
                                const vRawImg = v.image || (Array.isArray(v.images) && v.images[0]) || p.image || (Array.isArray(p.images) && p.images[0]);
                                const vImgUrl = vRawImg ? resolveImageUrl(vRawImg) : '';
                                const vVal = v.measureValue || v.size || `Var #${vIdx + 1}`;

                                return (
                                  <div
                                    key={vIdx}
                                    className="flex items-center gap-2.5 p-2 rounded-xl bg-teal-50/60 border border-teal-200/80 shrink-0 min-w-[175px]"
                                  >
                                    {vImgUrl ? (
                                      <img
                                        src={vImgUrl}
                                        alt={vVal}
                                        className="w-12 h-12 rounded-lg object-cover border border-white shadow-2xs shrink-0 bg-white"
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                      />
                                    ) : (
                                      <div className="w-12 h-12 rounded-lg bg-teal-100 text-teal-950 font-bold text-xs flex items-center justify-center shrink-0 border border-teal-200">
                                        {vVal.slice(0, 3)}
                                      </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <div className="font-extrabold text-xs text-gray-900 truncate">{vVal}</div>
                                      <div className="text-[11px] font-bold text-teal-800 flex items-center gap-1 mt-0.5">
                                        <span>₹{v.price}</span>
                                        {(v.mrp || v.originalPrice) && (
                                          <span className="text-[9px] text-gray-400 line-through">₹{v.mrp || v.originalPrice}</span>
                                        )}
                                      </div>
                                      <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                                        {v.stockQuantity ?? v.stock ?? 0} in stock
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-[10px] border-b border-gray-200">
                                  <tr>
                                    <th className="px-3 py-2">Variant Value</th>
                                    <th className="px-3 py-2">Variant Photo</th>
                                    <th className="px-3 py-2">Scale</th>
                                    <th className="px-3 py-2">Price (₹)</th>
                                    <th className="px-3 py-2">MRP (₹)</th>
                                    <th className="px-3 py-2">Stock Quantity</th>
                                    <th className="px-3 py-2">SKU</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {pVariants.map((v, vIdx) => {
                                    const vRawImg = v.image || (Array.isArray(v.images) && v.images[0]) || p.image || (Array.isArray(p.images) && p.images[0]);
                                    const vImgUrl = vRawImg ? resolveImageUrl(vRawImg) : '';

                                    return (
                                      <tr key={vIdx} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 font-bold text-gray-900">
                                          {v.measureValue || v.size || `Variant #${vIdx + 1}`}
                                        </td>
                                        <td className="px-3 py-2">
                                          {vImgUrl ? (
                                            <img
                                              src={vImgUrl}
                                              alt={v.size}
                                              className="w-8 h-8 rounded-lg object-cover border border-gray-200 bg-white"
                                            />
                                          ) : (
                                            <span className="text-[10px] text-gray-400 italic">No photo</span>
                                          )}
                                        </td>
                                        <td className="px-3 py-2">
                                          <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 text-[10px] uppercase font-bold border border-teal-200">
                                            {v.measureScale || 'size'}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2 font-extrabold text-gray-900">₹{v.price}</td>
                                        <td className="px-3 py-2 text-gray-400 line-through">₹{v.mrp || v.originalPrice || Math.round(v.price * 1.25)}</td>
                                        <td className="px-3 py-2 font-bold text-emerald-700">{v.stockQuantity ?? v.stock ?? 0} units</td>
                                        <td className="px-3 py-2 font-mono text-[10px] text-gray-500">{v.sku || '-'}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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
                {(() => {
                  const rawImg = previewProduct.image || (Array.isArray(previewProduct.images) && previewProduct.images[0]);
                  const imgUrl = rawImg ? resolveImageUrl(rawImg) : '';
                  return imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={previewProduct.name}
                      className="w-full h-[300px] md:h-full object-contain rounded-2xl border border-gray-200 bg-white"
                    />
                  ) : (
                    <div className="w-full h-[300px] md:h-full rounded-2xl border border-gray-200 bg-gray-100 flex flex-col items-center justify-center text-gray-400 text-xs font-bold">
                      <Package size={32} className="mb-2 text-gray-300" />
                      <span>No Image Available</span>
                    </div>
                  );
                })()}
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

            {/* Variant Product Expanded Details Table at Bottom */}
            {(() => {
              const previewVariants = parseSizeVariants(previewProduct);
              if (previewVariants.length === 0) return null;

              return (
                <div className="p-5 border-t border-gray-100 bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-teal-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers size={14} className="text-teal-700" />
                      <span>Variant Products Expanded Details ({previewVariants.length})</span>
                    </h4>
                    <span className="text-[10px] text-gray-500 font-bold">SKU: {previewProduct.sku || 'N/A'}</span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-[10px] border-b border-gray-200">
                        <tr>
                          <th className="px-3 py-2">Variant Value</th>
                          <th className="px-3 py-2">Variant Photo</th>
                          <th className="px-3 py-2">Scale</th>
                          <th className="px-3 py-2">Price (₹)</th>
                          <th className="px-3 py-2">MRP (₹)</th>
                          <th className="px-3 py-2">Stock Quantity</th>
                          <th className="px-3 py-2">SKU</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {previewVariants.map((v, vIdx) => {
                          const vRawImg = v.image || (Array.isArray(v.images) && v.images[0]) || previewProduct.image || (Array.isArray(previewProduct.images) && previewProduct.images[0]);
                          const vImgUrl = vRawImg ? resolveImageUrl(vRawImg) : '';

                        return (
                          <tr key={vIdx} className="hover:bg-gray-50">
                            <td className="px-3 py-2 font-bold text-gray-900">
                              {v.measureValue || v.size || `Variant #${vIdx + 1}`}
                            </td>
                            <td className="px-3 py-2">
                              {vImgUrl ? (
                                <img
                                  src={vImgUrl}
                                  alt={v.size}
                                  className="w-8 h-8 rounded-lg object-cover border border-gray-200 bg-white"
                                />
                              ) : (
                                <span className="text-[10px] text-gray-400 italic">No photo</span>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 text-[10px] uppercase font-bold border border-teal-200">
                                {v.measureScale || 'size'}
                              </span>
                            </td>
                            <td className="px-3 py-2 font-extrabold text-gray-900">₹{v.price}</td>
                            <td className="px-3 py-2 text-gray-400 line-through">₹{v.mrp || v.originalPrice || Math.round(v.price * 1.25)}</td>
                            <td className="px-3 py-2 font-bold text-emerald-700">{v.stockQuantity ?? v.stock ?? 0} units</td>
                            <td className="px-3 py-2 font-mono text-[10px] text-gray-500">{v.sku || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
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
