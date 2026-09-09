import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle, 
  Ban, 
  Edit3, 
  Trash2, 
  Eye, 
  Tag,
  Store
} from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';
import { CATEGORIES } from '../../data/mockData';
import ProductModal from '../modals/ProductModal';

export default function ProductsTab() {
  const {
    products,
    addProduct,
    updateProduct,
    updateProductApprovalStatus,
    deleteProduct,
    sellers
  } = useAdminData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [approvalEditor, setApprovalEditor] = useState(null);
  const [previewProduct, setPreviewProduct] = useState(null);
  const [remark, setRemark] = useState('');

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (p.sellerName && p.sellerName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesStatus = statusFilter === 'all' || p.approvalStatus === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setModalOpen(true);
  };

  const handleSaveProduct = (formData) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, formData);
    } else {
      addProduct(formData);
    }
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from the marketplace catalog?`)) {
      deleteProduct(id);
    }
  };

  const openApprovalEditor = (product) => {
    setApprovalEditor({
      productId: product.id,
      currentStatus: product.approvalStatus || 'Pending',
      remark: product.approvalComment || product.rejectionReason || ''
    });
    setRemark(product.approvalComment || product.rejectionReason || '');
  };

  const saveApprovalUpdate = () => {
    if (!approvalEditor) return;

    const trimmedRemark = remark.trim();
    if (approvalEditor.currentStatus === 'Rejected' || approvalEditor.currentStatus === 'Pending' && !trimmedRemark && approvalEditor.currentStatus === 'Rejected') {
      // This prevents an empty rejection remark when the selected status is Rejected.
    }

    if (approvalEditor.currentStatus === 'Rejected' && !trimmedRemark) {
      window.alert('Please add a rejection remark before saving this status.');
      return;
    }

    updateProductApprovalStatus(approvalEditor.productId, approvalEditor.currentStatus, trimmedRemark);
    setApprovalEditor(null);
    setRemark('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-2xl text-gray-900 flex items-center gap-2">
            <Package className="text-teal-700" size={24} /> Marketplace Products Catalog
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Monitor, approve, edit, and delist merchant inventory across school uniforms, books & stationery.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus size={16} /> Add Catalog Product
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
            placeholder="Search by name, SKU, or seller..."
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
            <option value="Approved">Approved</option>
            <option value="Pending">Pending Review</option>
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
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price / MRP</th>
                <th className="px-4 py-3">Stock Level</th>
                <th className="px-4 py-3">Merchant / Seller</th>
                <th className="px-4 py-3">Approval</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredProducts.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-gray-50/70 transition-colors cursor-pointer"
                  onClick={() => setPreviewProduct(p)}
                >
                  
                  {/* Thumbnail & Title */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={p.image || 'https://images.unsplash.com/photo-1593032465175-481ac7f401a0?w=150'} 
                        alt={p.name} 
                        className="w-12 h-12 rounded-xl object-cover border border-gray-200 shrink-0"
                      />
                      <div>
                        <div className="font-bold text-gray-900 max-w-xs truncate">{p.name}</div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">{p.sku || `SKU-${p.id}`}</div>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3 capitalize font-semibold text-gray-700">
                    {p.category}
                  </td>

                  {/* Price */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-bold text-gray-900">₹{p.price}</div>
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

                  {/* Approval Status */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openApprovalEditor(p)}
                      className={`inline-flex items-center justify-center min-w-[120px] px-2.5 py-1.5 rounded-full text-[10px] font-extrabold uppercase transition-colors cursor-pointer ${
                        p.approvalStatus === 'Approved' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' :
                        p.approvalStatus === 'Rejected' ? 'bg-rose-100 text-rose-800 hover:bg-rose-200' :
                        'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      }`}
                      title="Change approval status"
                    >
                      {p.approvalStatus || 'Approved'}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openApprovalEditor(p)}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                        title="Update Approval Status"
                      >
                        <Tag size={15} />
                      </button>
                      
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
                    </div>
                  </td>

                </tr>
              ))}

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
                  className="w-full h-[300px] md:h-full object-cover rounded-2xl border border-gray-200"
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
                  <div className="text-gray-500 uppercase tracking-wider mb-1">Remark</div>
                  <div className="text-gray-700 leading-relaxed">
                    {previewProduct.approvalComment || previewProduct.rejectionReason || 'No remark added for this product yet.'}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      setPreviewProduct(null);
                      openApprovalEditor(previewProduct);
                    }}
                    className="px-3 py-2 rounded-xl bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark text-xs font-bold cursor-pointer"
                  >
                    Review Status
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

      {approvalEditor && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Update Product Status</h3>
              <button
                onClick={() => {
                  setApprovalEditor(null);
                  setRemark('');
                }}
                className="text-gray-400 hover:text-gray-700 text-xl leading-none cursor-pointer"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Status
            </label>
            <select
              value={approvalEditor.currentStatus}
              onChange={e => setApprovalEditor(prev => prev ? { ...prev, currentStatus: e.target.value } : prev)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-brand-yellow outline-hidden"
            >
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>

            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mt-4 mb-2">
              {approvalEditor.currentStatus === 'Rejected' ? 'Remark / rejection reason (required)' : 'Remark / note (optional)'}
            </label>
            <textarea
              value={remark}
              onChange={e => setRemark(e.target.value)}
              rows={4}
              placeholder={approvalEditor.currentStatus === 'Rejected' ? 'Add the reason this product is being rejected...' : 'Add a note for this status update...'}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-brand-yellow outline-hidden resize-none"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setApprovalEditor(null);
                  setRemark('');
                }}
                className="px-3 py-2 rounded-xl border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={saveApprovalUpdate}
                className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                  approvalEditor.currentStatus === 'Rejected'
                    ? 'bg-rose-600 text-white hover:bg-rose-700'
                    : approvalEditor.currentStatus === 'Approved'
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-amber-500 text-white hover:bg-amber-600'
                }`}
              >
                Save Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Add/Edit Modal */}
      <ProductModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveProduct}
        product={editingProduct}
        sellers={sellers}
      />

    </div>
  );
}
