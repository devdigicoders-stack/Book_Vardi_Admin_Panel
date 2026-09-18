import React, { useState, useEffect } from 'react';
import { X, Package, CheckCircle2 } from 'lucide-react';
import { CATEGORIES } from '../../constants/categories';
import ImageUploadDropzone from '../common/ImageUploadDropzone';

export default function ProductModal({ isOpen, onClose, onSave, product = null, sellers = [] }) {
  const [formData, setFormData] = useState({
    name: '',
    subtitle: '',
    price: '',
    originalPrice: '',
    category: 'uniforms',
    badge: 'NEW',
    stockQuantity: '50',
    sellerId: 'SEL-101',
    sellerName: 'Vardi Uniforms Pvt Ltd',
    image: '',
    images: [],
    sku: ''
  });

  const getInitialImages = (p) => {
    if (!p) return [];
    if (Array.isArray(p.images) && p.images.length > 0) return p.images;
    if (p.image) return [p.image];
    return [];
  };

  useEffect(() => {
    if (product) {
      const prodImages = getInitialImages(product);
      setFormData({
        name: product.name || '',
        subtitle: product.subtitle || '',
        price: product.price || '',
        originalPrice: product.originalPrice || '',
        category: product.category || 'uniforms',
        badge: product.badge || 'NEW',
        stockQuantity: product.stockQuantity ?? 50,
        sellerId: product.sellerId || 'SEL-101',
        sellerName: product.sellerName || 'Vardi Uniforms Pvt Ltd',
        paymentMethodAllowed: product.paymentMethodAllowed || 'Both',
        image: prodImages[0] || product.image || '',
        images: prodImages,
        sku: product.sku || ''
      });
    } else {
      setFormData({
        name: '',
        subtitle: '',
        price: '',
        originalPrice: '',
        category: 'uniforms',
        badge: 'NEW',
        stockQuantity: '50',
        sellerId: sellers[0]?.id || 'SEL-101',
        sellerName: sellers[0]?.storeName || 'Vardi Uniforms Pvt Ltd',
        paymentMethodAllowed: 'Both',
        image: '',
        images: [],
        sku: `BV-PROD-${Math.floor(100 + Math.random() * 900)}`
      });
    }
  }, [product, sellers, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) return;
    const finalImages = (formData.images && formData.images.length > 0) 
      ? formData.images 
      : (formData.image ? [formData.image] : []);
    const primaryImg = finalImages[0] || formData.image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80';

    onSave({
      ...formData,
      image: primaryImg,
      images: finalImages
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-gray-200">
        
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
              <Package size={18} />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-gray-900">
                {product ? 'Edit Product' : 'Add New Product'}
              </h3>
              <p className="text-xs text-gray-500">Marketplace catalog entry with drag & drop images</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Product Title *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Boys Summer Uniform Shirt"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow focus:border-transparent outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Subtitle / Key Specification</label>
            <input
              type="text"
              value={formData.subtitle}
              onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder="e.g. 100% Cotton • Half Sleeve"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow focus:border-transparent outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Selling Price (₹) *</label>
              <input
                type="number"
                required
                min="1"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">MRP / Original (₹)</label>
              <input
                type="number"
                min="1"
                value={formData.originalPrice}
                onChange={e => setFormData({ ...formData, originalPrice: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow outline-hidden capitalize"
              >
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Stock Quantity</label>
              <input
                type="number"
                min="0"
                value={formData.stockQuantity}
                onChange={e => setFormData({ ...formData, stockQuantity: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Badge Tag</label>
              <select
                value={formData.badge}
                onChange={e => setFormData({ ...formData, badge: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow outline-hidden"
              >
                <option value="BESTSELLER">BESTSELLER</option>
                <option value="NEW">NEW</option>
                <option value="SALE">SALE</option>
                <option value="POPULAR">POPULAR</option>
                <option value="TOP PICK">TOP PICK</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Assigned Seller</label>
              <select
                value={formData.sellerId}
                onChange={e => {
                  const s = sellers.find(item => item.id === e.target.value);
                  setFormData({
                    ...formData,
                    sellerId: e.target.value,
                    sellerName: s ? (s.storeName || s.name) : 'Direct Marketplace'
                  });
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow outline-hidden"
              >
                {sellers.map(s => (
                  <option key={s.id} value={s.id}>{s.storeName || s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Customer Payment Method Allowed *</label>
            <select
              value={formData.paymentMethodAllowed || 'Both'}
              onChange={e => setFormData({ ...formData, paymentMethodAllowed: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-bold focus:ring-2 focus:ring-brand-yellow outline-hidden bg-white text-gray-900"
            >
              <option value="Both">💳 Both Online Payment & Cash on Delivery (COD)</option>
              <option value="Online_Only">⚡ Online / Prepaid Only (UPI, Credit/Debit Cards, Net Banking)</option>
              <option value="COD_Only">💵 Cash on Delivery (COD) Only</option>
            </select>
          </div>

          {/* DRAG & DROP MULTI-IMAGE UPLOAD COMPONENT */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700">
              Product Images (Drag & Drop Multiple Files) *
            </label>
            <ImageUploadDropzone
              images={formData.images}
              onChange={(newImgs) => {
                setFormData({
                  ...formData,
                  images: newImgs,
                  image: newImgs[0] || ''
                });
              }}
              maxImages={8}
              helperText="Drag & drop product photos here, or browse files"
            />
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
              <span>{product ? 'Save Changes' : 'Publish to Catalog'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
