import React, { useState } from 'react';
import { X, Tag, CheckCircle2 } from 'lucide-react';

export default function CouponModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    discountType: 'percentage',
    discountValue: 15,
    minOrderValue: 499,
    maxDiscount: 200,
    validUntil: '2026-11-30',
    usageLimit: 500
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.code.trim()) return;
    onSave({
      ...formData,
      code: formData.code.toUpperCase().trim(),
      discountValue: Number(formData.discountValue),
      minOrderValue: Number(formData.minOrderValue),
      maxDiscount: Number(formData.maxDiscount),
      usageLimit: Number(formData.usageLimit)
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200">
        
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
              <Tag size={18} />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-gray-900">Create Promo Code</h3>
              <p className="text-xs text-gray-500">Discount campaigns & coupons</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Coupon Code *</label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g. FESTIVE20"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-mono uppercase focus:ring-2 focus:ring-brand-yellow outline-hidden"
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
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Discount Type</label>
              <select
                value={formData.discountType}
                onChange={e => setFormData({ ...formData, discountType: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow outline-hidden"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Min Order (₹)</label>
              <input
                type="number"
                value={formData.minOrderValue}
                onChange={e => setFormData({ ...formData, minOrderValue: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Max Cap (₹)</label>
              <input
                type="number"
                value={formData.maxDiscount}
                onChange={e => setFormData({ ...formData, maxDiscount: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Expiry Date</label>
              <input
                type="date"
                value={formData.validUntil}
                onChange={e => setFormData({ ...formData, validUntil: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Total Limit</label>
              <input
                type="number"
                value={formData.usageLimit}
                onChange={e => setFormData({ ...formData, usageLimit: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow outline-hidden"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.2 text-xs font-bold bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 size={15} />
              <span>Launch Coupon</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
