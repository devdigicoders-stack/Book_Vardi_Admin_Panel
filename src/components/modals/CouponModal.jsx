import React, { useState, useMemo } from 'react';
import { X, Tag, CheckCircle2, Layers, Package, Boxes, Search } from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';

export default function CouponModal({ isOpen, onClose, onSave }) {
  const { products = [], kits = [] } = useAdminData();

  const [formData, setFormData] = useState({
    code: '',
    title: '',
    scope: 'storewide', // 'storewide' | 'specific_product' | 'specific_kit' | 'all_kits'
    discountType: 'percentage',
    discountValue: 15,
    minOrderValue: 499,
    maxDiscount: 200,
    validUntil: '2026-11-30',
    usageLimit: 500
  });

  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [kitSearchQuery, setKitSearchQuery] = useState('');
  const [selectedKit, setSelectedKit] = useState(null);

  const searchableProducts = useMemo(() => {
    if (!productSearchQuery.trim()) return (products || []).slice(0, 8);
    const q = productSearchQuery.trim().toLowerCase();
    return (products || []).filter((p) => {
      const matchId = String(p.id || p._id).toLowerCase().includes(q);
      const matchName = (p.name || p.title || '').toLowerCase().includes(q);
      const matchSku = p.sku ? String(p.sku).toLowerCase().includes(q) : false;
      return matchId || matchName || matchSku;
    });
  }, [products, productSearchQuery]);

  const searchableKits = useMemo(() => {
    if (!kitSearchQuery.trim()) return (kits || []).slice(0, 8);
    const q = kitSearchQuery.trim().toLowerCase();
    return (kits || []).filter((k) => {
      const matchId = String(k.id || k._id).toLowerCase().includes(q);
      const matchTitle = (k.title || k.name || '').toLowerCase().includes(q);
      return matchId || matchTitle;
    });
  }, [kits, kitSearchQuery]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.code.trim()) return;
    const cleanCode = formData.code.toUpperCase().trim();
    const discNum = Number(formData.discountValue);
    const minNum = Number(formData.minOrderValue || 0);
    const maxDiscNum = Number(formData.maxDiscount || 0);
    const limitNum = Number(formData.usageLimit || 0);
    const discType = formData.discountType;
    const backendType = discType === 'flat' ? 'fixed' : 'percentage';

    const specificKitId = formData.scope === 'specific_kit' ? String(selectedKit?.id || selectedKit?._id || '') : '';
    const specificKitTitle = formData.scope === 'specific_kit' ? String(selectedKit?.title || selectedKit?.name || '') : '';
    const specificKitImage = formData.scope === 'specific_kit' ? String(selectedKit?.image || selectedKit?.coverImage || '') : '';

    onSave({
      ...formData,
      code: cleanCode,
      title: (formData.title || '').trim() || `${cleanCode} Promo Offer`,
      discount: discNum,
      discountValue: discNum,
      type: backendType,
      discountType: discType,
      minAmount: minNum,
      minOrderValue: minNum,
      minOrderAmount: minNum,
      maxDiscount: maxDiscNum,
      expiryDate: formData.validUntil,
      validUntil: formData.validUntil,
      usageLimit: limitNum,
      applicableScope: formData.scope,
      specificProductId: formData.scope === 'specific_product' ? String(selectedProduct?.id || selectedProduct?._id || '') : '',
      specificProductName: formData.scope === 'specific_product' ? String(selectedProduct?.name || selectedProduct?.title || '') : '',
      applicableProducts: formData.scope === 'specific_product' && selectedProduct ? [String(selectedProduct.id || selectedProduct._id)] : [],
      specificKitId,
      specificKitTitle,
      specificKitImage,
      applicableKits: specificKitId ? [specificKitId] : []
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-gray-200 text-xs">
        
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
              <Tag size={16} />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-gray-900">Create Promo Code</h3>
              <p className="text-[11px] text-gray-500">Discount campaigns & coupons</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Scrollable Form Body with Hidden Scrollbar */}
          <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-3" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Coupon Code *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. FESTIVE20 or KITFEST20"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-mono uppercase focus:ring-2 focus:ring-brand-yellow outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Campaign Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Festival Season 20% Off"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
              />
            </div>

            {/* Scope Selection */}
            <div className="space-y-2 p-3 bg-gray-50 rounded-2xl border border-gray-100">
              <label className="font-bold text-gray-800 text-[11px] block">Applicability Scope</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, scope: 'storewide' });
                    setSelectedProduct(null);
                    setSelectedKit(null);
                  }}
                  className={`py-1.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer text-xs ${
                    formData.scope === 'storewide'
                      ? 'bg-teal-800 text-white shadow-xs'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <Layers size={13} />
                  <span>All Products & Kits</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, scope: 'all_kits' });
                    setSelectedProduct(null);
                    setSelectedKit(null);
                  }}
                  className={`py-1.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer text-xs ${
                    formData.scope === 'all_kits'
                      ? 'bg-indigo-700 text-white shadow-xs'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <Boxes size={13} />
                  <span>All Kits Only</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, scope: 'specific_product' });
                    setSelectedKit(null);
                  }}
                  className={`py-1.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer text-xs ${
                    formData.scope === 'specific_product'
                      ? 'bg-amber-500 text-teal-950 shadow-xs'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <Package size={13} />
                  <span>Specific Product</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, scope: 'specific_kit' });
                    setSelectedProduct(null);
                  }}
                  className={`py-1.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer text-xs ${
                    formData.scope === 'specific_kit'
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <Boxes size={13} />
                  <span>Specific Kit</span>
                </button>
              </div>

              {/* Specific Product Picker */}
              {formData.scope === 'specific_product' && (
                <div className="pt-2 space-y-2">
                  <label className="font-semibold text-gray-700 text-[11px]">Select Target Product</label>
                  {selectedProduct ? (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900 truncate text-xs">{selectedProduct.name || selectedProduct.title}</div>
                        <div className="text-[10px] text-emerald-800 font-mono">ID: {selectedProduct.id || selectedProduct._id}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedProduct(null)}
                        className="text-gray-400 hover:text-gray-700 p-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search product name or ID..."
                          value={productSearchQuery}
                          onChange={(e) => setProductSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600"
                        />
                      </div>
                      <div className="max-h-32 overflow-y-auto rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
                        {searchableProducts.length === 0 ? (
                          <div className="p-2 text-center text-gray-400 text-[11px]">No products found.</div>
                        ) : (
                          searchableProducts.map((p) => (
                            <div
                              key={p.id || p._id}
                              onClick={() => {
                                setSelectedProduct(p);
                                setProductSearchQuery('');
                              }}
                              className="p-2 flex items-center justify-between hover:bg-teal-50 cursor-pointer"
                            >
                              <div className="truncate font-bold text-gray-900 text-[11px]">{p.name || p.title}</div>
                              <span className="text-[10px] text-teal-700 font-bold shrink-0">Select</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Specific Kit Picker */}
              {formData.scope === 'specific_kit' && (
                <div className="pt-2 space-y-2">
                  <label className="font-semibold text-gray-700 text-[11px]">Select Target Kit</label>
                  {selectedKit ? (
                    <div className="p-2.5 bg-purple-50 border border-purple-300 rounded-xl flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900 truncate text-xs">{selectedKit.title || selectedKit.name}</div>
                        <div className="text-[10px] text-purple-800 font-mono">Kit ID: {selectedKit.id || selectedKit._id}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedKit(null)}
                        className="text-gray-400 hover:text-gray-700 p-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search kit title or ID..."
                          value={kitSearchQuery}
                          onChange={(e) => setKitSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-xl border border-gray-200 focus:outline-none focus:border-purple-600"
                        />
                      </div>
                      <div className="max-h-32 overflow-y-auto rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
                        {searchableKits.length === 0 ? (
                          <div className="p-2 text-center text-gray-400 text-[11px]">No kits found.</div>
                        ) : (
                          searchableKits.map((k) => (
                            <div
                              key={k.id || k._id}
                              onClick={() => {
                                setSelectedKit(k);
                                setKitSearchQuery('');
                              }}
                              className="p-2 flex items-center justify-between hover:bg-purple-50 cursor-pointer"
                            >
                              <div className="truncate font-bold text-gray-900 text-[11px]">{k.title || k.name}</div>
                              <span className="text-[10px] text-purple-700 font-bold shrink-0">Select</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Discount Type</label>
                <select
                  value={formData.discountType}
                  onChange={e => setFormData({ ...formData, discountType: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat Cash (₹)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Discount Value</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.discountValue}
                  onChange={e => setFormData({ ...formData, discountValue: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Min Order (₹)</label>
                <input
                  type="number"
                  value={formData.minOrderValue}
                  onChange={e => setFormData({ ...formData, minOrderValue: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Max Cap (₹)</label>
                <input
                  type="number"
                  value={formData.maxDiscount}
                  onChange={e => setFormData({ ...formData, maxDiscount: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={e => setFormData({ ...formData, validUntil: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Total Limit</label>
                <input
                  type="number"
                  value={formData.usageLimit}
                  onChange={e => setFormData({ ...formData, usageLimit: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Fixed Footer Actions */}
          <div className="p-3.5 border-t border-gray-100 shrink-0 bg-gray-50/70 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-200/80 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle2 size={14} />
              <span>Launch Coupon</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
