import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Package,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Plus,
  Trash2,
  UploadCloud,
  Check,
  Tag,
  DollarSign,
  Boxes,
  Eye,
  Info,
  ChevronDown,
  X,
  Sliders,
  ShieldCheck,
  Copy
} from 'lucide-react';
import { CATEGORIES } from '../../constants/categories';
import ImageUploadDropzone from '../common/ImageUploadDropzone';

// Quick Presets for Sizing Matrix
const SIZE_PRESETS = [
  {
    id: 'standard',
    label: 'Standard (S - XXL)',
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
  },
  {
    id: 'uniform_waist',
    label: 'Uniform Waist / Chest (26 - 38)',
    sizes: ['26', '28', '30', '32', '34', '36', '38']
  },
  {
    id: 'junior_age',
    label: 'Junior / Age (3Y - 12Y)',
    sizes: ['3-4 Yrs', '5-6 Yrs', '7-8 Yrs', '9-10 Yrs', '11-12 Yrs']
  },
  {
    id: 'shoes',
    label: 'Footwear (UK 3 - 10)',
    sizes: ['UK 3', 'UK 4', 'UK 5', 'UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10']
  },
  {
    id: 'single',
    label: 'Free Size',
    sizes: ['Free Size']
  }
];

export default function ProductFormPage({ product, sellers = [], onSave, onBack }) {
  const isEdit = Boolean(product);

  const [formData, setFormData] = useState({
    name: '',
    subtitle: '',
    price: '',
    originalPrice: '',
    category: 'uniforms',
    subCategory: '',
    schoolName: '',
    gender: 'Unisex',
    badge: 'NEW',
    stockQuantity: '50',
    sellerId: '',
    sellerName: '',
    paymentMethodAllowed: 'Both',
    approvalStatus: 'Approved',
    approvalComment: '',
    description: '',
    sku: '',
    image: '',
    images: []
  });

  const [sizeVariants, setSizeVariants] = useState([]);
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [batchBasePrice, setBatchBasePrice] = useState('');
  const [batchBaseMrp, setBatchBaseMrp] = useState('');
  const [batchBaseStock, setBatchBaseStock] = useState('20');
  
  // Modal for picking a gallery image for a specific variant
  const [activeVariantForGallery, setActiveVariantForGallery] = useState(null);
  
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'variants' | 'media'

  const fileInputRef = useRef(null);
  const [uploadingVariantIndex, setUploadingVariantIndex] = useState(null);

  // Initialize form
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (product) {
      const prodImages = Array.isArray(product.images) && product.images.length > 0 
        ? product.images 
        : (product.image ? [product.image] : []);

      setFormData({
        name: product.name || '',
        subtitle: product.subtitle || '',
        price: product.price !== undefined ? String(product.price) : '',
        originalPrice: product.originalPrice || product.mrp ? String(product.originalPrice || product.mrp) : '',
        category: product.category || 'uniforms',
        subCategory: product.subCategory || '',
        schoolName: product.schoolName || '',
        gender: product.gender || 'Unisex',
        badge: product.badge || 'NEW',
        stockQuantity: product.stockQuantity !== undefined ? String(product.stockQuantity) : (product.stock !== undefined ? String(product.stock) : '50'),
        sellerId: product.sellerId || sellers[0]?.id || 'SEL-101',
        sellerName: product.sellerName || sellers[0]?.storeName || sellers[0]?.name || 'Vardi Uniforms Pvt Ltd',
        paymentMethodAllowed: product.paymentMethodAllowed || 'Both',
        approvalStatus: product.approvalStatus || 'Approved',
        approvalComment: product.approvalComment || '',
        description: product.description || '',
        sku: product.sku || '',
        image: prodImages[0] || product.image || '',
        images: prodImages
      });

      // Load sizeVariants if existing
      if (Array.isArray(product.sizeVariants) && product.sizeVariants.length > 0) {
        setSizeVariants(product.sizeVariants.map(v => ({
          size: v.size || '',
          price: v.price !== undefined ? String(v.price) : String(product.price || ''),
          mrp: v.mrp !== undefined ? String(v.mrp) : String(product.originalPrice || product.mrp || ''),
          stock: v.stock !== undefined ? String(v.stock) : '20',
          image: v.image || '',
          sku: v.sku || (product.sku ? `${product.sku}-${v.size}` : '')
        })));
      } else if (Array.isArray(product.sizes) && product.sizes.length > 0) {
        // Migration: convert simple sizes array to sizeVariants with root price/image
        setSizeVariants(product.sizes.map(s => ({
          size: s,
          price: String(product.price || ''),
          mrp: String(product.originalPrice || product.mrp || ''),
          stock: '20',
          image: prodImages[0] || '',
          sku: product.sku ? `${product.sku}-${s}` : ''
        })));
      } else {
        setSizeVariants([]);
      }
    } else {
      const defaultSeller = sellers[0];
      setFormData({
        name: '',
        subtitle: '',
        price: '',
        originalPrice: '',
        category: 'uniforms',
        subCategory: '',
        schoolName: '',
        gender: 'Unisex',
        badge: 'NEW',
        stockQuantity: '50',
        sellerId: defaultSeller?.id || defaultSeller?._id || 'SEL-101',
        sellerName: defaultSeller?.storeName || defaultSeller?.name || 'Vardi Uniforms Pvt Ltd',
        paymentMethodAllowed: 'Both',
        approvalStatus: 'Approved',
        approvalComment: '',
        description: '',
        sku: `BV-PROD-${Math.floor(1000 + Math.random() * 9000)}`,
        image: '',
        images: []
      });
      setSizeVariants([]);
    }
  }, [product, sellers]);

  // Handle Preset Selection
  const applySizePreset = (presetSizes) => {
    const defaultPrice = formData.price || '499';
    const defaultMrp = formData.originalPrice || Math.round(Number(defaultPrice || 499) * 1.25).toString();
    const defaultImage = formData.images[0] || formData.image || '';

    const newVariants = presetSizes.map(size => {
      const existing = sizeVariants.find(v => v.size.toLowerCase() === size.toLowerCase());
      if (existing) return existing;
      return {
        size,
        price: defaultPrice,
        mrp: defaultMrp,
        stock: '25',
        image: defaultImage,
        sku: formData.sku ? `${formData.sku}-${size}` : `SKU-${size}`
      };
    });

    setSizeVariants(newVariants);
  };

  // Add a single custom size
  const handleAddCustomSize = (e) => {
    e?.preventDefault();
    const trimmed = customSizeInput.trim();
    if (!trimmed) return;
    if (sizeVariants.some(v => v.size.toLowerCase() === trimmed.toLowerCase())) {
      setError(`Size "${trimmed}" already exists in the variant list.`);
      return;
    }

    const defaultPrice = formData.price || '499';
    const defaultMrp = formData.originalPrice || Math.round(Number(defaultPrice || 499) * 1.25).toString();
    const defaultImage = formData.images[0] || formData.image || '';

    setSizeVariants(prev => [
      ...prev,
      {
        size: trimmed,
        price: defaultPrice,
        mrp: defaultMrp,
        stock: '25',
        image: defaultImage,
        sku: formData.sku ? `${formData.sku}-${trimmed}` : `SKU-${trimmed}`
      }
    ]);
    setCustomSizeInput('');
    setError('');
  };

  // Remove a size variant
  const handleRemoveVariant = (index) => {
    setSizeVariants(prev => prev.filter((_, idx) => idx !== index));
  };

  // Update a single field in a size variant
  const handleVariantChange = (index, field, value) => {
    setSizeVariants(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Batch fill empty prices/stock
  const handleBatchFill = () => {
    if (!batchBasePrice && !batchBaseMrp && !batchBaseStock) return;
    setSizeVariants(prev => prev.map(v => ({
      ...v,
      price: batchBasePrice ? batchBasePrice : v.price,
      mrp: batchBaseMrp ? batchBaseMrp : v.mrp,
      stock: batchBaseStock ? batchBaseStock : v.stock
    })));
  };

  // Handle uploading a custom image for a single variant
  const triggerVariantImageUpload = (index) => {
    setUploadingVariantIndex(index);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleVariantFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file || uploadingVariantIndex === null) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (dataUrl) {
        handleVariantChange(uploadingVariantIndex, 'image', dataUrl);
        // Also add to product gallery if not already there
        if (!formData.images.includes(dataUrl)) {
          setFormData(prev => ({
            ...prev,
            images: [dataUrl, ...prev.images]
          }));
        }
      }
      setUploadingVariantIndex(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Assign gallery image to active variant
  const assignGalleryImageToVariant = (imgUrl) => {
    if (activeVariantForGallery !== null && activeVariantForGallery >= 0) {
      handleVariantChange(activeVariantForGallery, 'image', imgUrl);
      setActiveVariantForGallery(null);
    }
  };

  // Calculate Metrics from Variants
  const validPrices = sizeVariants.map(v => Number(v.price)).filter(p => !isNaN(p) && p > 0);
  const minVariantPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;
  const maxVariantPrice = validPrices.length > 0 ? Math.max(...validPrices) : 0;
  const totalVariantStock = sizeVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Please provide a product title');
      setActiveTab('general');
      return;
    }

    if (sizeVariants.length > 0) {
      for (const variant of sizeVariants) {
        if (!variant.price || Number(variant.price) <= 0) {
          setError(`Please specify a valid selling price for size variant "${variant.size}".`);
          setActiveTab('variants');
          return;
        }
      }
    } else {
      if (!formData.price || Number(formData.price) <= 0) {
        setError('Please specify a valid base selling price.');
        setActiveTab('general');
        return;
      }
    }

    setSubmitting(true);

    try {
      const finalImages = (formData.images && formData.images.length > 0)
        ? formData.images
        : (formData.image ? [formData.image] : []);
      
      const primaryImg = finalImages[0] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80';

      const effectivePrice = sizeVariants.length > 0 ? minVariantPrice : Number(formData.price);
      const effectiveStock = sizeVariants.length > 0 ? totalVariantStock : Number(formData.stockQuantity || 0);
      const effectiveMrp = sizeVariants.length > 0
        ? (Number(sizeVariants[0]?.mrp) || Math.round(effectivePrice * 1.25))
        : (Number(formData.originalPrice) || Math.round(effectivePrice * 1.25));

      const payload = {
        ...formData,
        price: effectivePrice,
        originalPrice: effectiveMrp,
        mrp: effectiveMrp,
        stockQuantity: effectiveStock,
        stock: effectiveStock,
        image: primaryImg,
        images: finalImages,
        sizes: sizeVariants.map(v => v.size),
        sizeVariants: sizeVariants.map(v => ({
          size: v.size,
          price: Number(v.price) || effectivePrice,
          mrp: Number(v.mrp) || effectiveMrp,
          stock: Number(v.stock) || 0,
          image: v.image || primaryImg,
          sku: v.sku || `${formData.sku}-${v.size}`
        }))
      };

      await onSave(payload);
      onBack();
    } catch (err) {
      setError(err?.message || 'Failed to save product. Please review details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-28">
      {/* Hidden file input for size variant individual image upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleVariantFileSelected}
        accept="image/*"
        className="hidden"
      />

      {/* Top Header & Navigation Banner */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
              title="Return to Catalog"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-teal">
                  Catalog Manager
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-xs text-gray-500">
                  {isEdit ? 'Catalog Modification' : 'New Listing Creation'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
                {isEdit ? `Edit: ${formData.name || 'Catalog Item'}` : 'Create New Product'}
                {formData.badge && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-yellow/20 text-brand-teal font-extrabold border border-brand-yellow/30">
                    {formData.badge}
                  </span>
                )}
              </h1>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-5 py-2.2 text-xs font-bold bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 size={16} />
              <span>{submitting ? 'Saving...' : (isEdit ? 'Save Changes' : 'Publish to Catalog')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex border-b border-gray-200 gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'general'
                ? 'border-brand-teal text-brand-teal'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Package size={17} />
            <span>1. General Details</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('variants')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'variants'
                ? 'border-brand-teal text-brand-teal'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Sliders size={17} />
            <span>2. Size Variants & Pricing ({sizeVariants.length})</span>
            {sizeVariants.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-brand-yellow text-brand-teal-dark text-[10px] flex items-center justify-center font-black">
                {sizeVariants.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'media'
                ? 'border-brand-teal text-brand-teal'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <ImageIcon size={17} />
            <span>3. Media Gallery ({formData.images.length})</span>
          </button>
        </div>
      </div>

      {/* Main Form Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3 animate-fade-in">
            <AlertCircle size={20} className="shrink-0 text-red-500" />
            <div className="flex-1 font-medium">{error}</div>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-700 cursor-pointer">
              <X size={16} />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* TAB 1: GENERAL DETAILS */}
          {activeTab === 'general' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left 2 Cols: Main Info */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-200">
                  <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 mb-5">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
                      <Package size={17} />
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-base text-gray-900">Basic Information</h2>
                      <p className="text-xs text-gray-500">Provide product identity, title, and key attributes</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Product Title / Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Oxford Blue Unisex School Uniform Shirt"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow focus:border-transparent outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Subtitle / Highlights
                      </label>
                      <input
                        type="text"
                        value={formData.subtitle}
                        onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                        placeholder="e.g. 100% Cotton • Wrinkle Resistant • Half Sleeve"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow outline-hidden"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Primary Category <span className="text-red-500">*</span></label>
                        <select
                          value={formData.category}
                          onChange={e => setFormData({ ...formData, category: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow outline-hidden capitalize"
                        >
                          {CATEGORIES.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Sub-Category</label>
                        <input
                          type="text"
                          value={formData.subCategory}
                          onChange={e => setFormData({ ...formData, subCategory: e.target.value })}
                          placeholder="e.g. Shirts, Blazers, Lab Coats"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Associated School / Institution</label>
                        <input
                          type="text"
                          value={formData.schoolName}
                          onChange={e => setFormData({ ...formData, schoolName: e.target.value })}
                          placeholder="e.g. Delhi Public School (or blank if universal)"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Target Gender</label>
                        <select
                          value={formData.gender}
                          onChange={e => setFormData({ ...formData, gender: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow outline-hidden"
                        >
                          <option value="Unisex">Unisex / All</option>
                          <option value="Boy">Boys</option>
                          <option value="Girl">Girls</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Description & Care Instructions</label>
                      <textarea
                        rows={3}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Provide details about material, washing instructions, and fit..."
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow outline-hidden resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Base Pricing Card (When no size variants) */}
                <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-200">
                  <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
                        <DollarSign size={17} />
                      </div>
                      <div>
                        <h2 className="font-display font-bold text-base text-gray-900">Base Pricing & Inventory</h2>
                        <p className="text-xs text-gray-500">
                          {sizeVariants.length > 0 
                            ? 'Calculated automatically from your size variants matrix' 
                            : 'Set the product default price and available stock'}
                        </p>
                      </div>
                    </div>
                    {sizeVariants.length > 0 && (
                      <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                        Derived from {sizeVariants.length} Sizes
                      </span>
                    )}
                  </div>

                  {sizeVariants.length > 0 ? (
                    <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-teal-900">Configured via Size Variants</p>
                        <p className="text-xs text-teal-700 mt-0.5">
                          Starting Price: <span className="font-black text-gray-900">₹{minVariantPrice}</span> 
                          {maxVariantPrice > minVariantPrice && ` - ₹${maxVariantPrice}`} • Total Stock: <span className="font-black text-gray-900">{totalVariantStock}</span> units
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('variants')}
                        className="px-3.5 py-1.5 rounded-xl bg-teal-800 text-white text-xs font-bold hover:bg-teal-900 transition-colors cursor-pointer"
                      >
                        Adjust Sizes
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                          Selling Price (₹) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={formData.price}
                          onChange={e => setFormData({ ...formData, price: e.target.value })}
                          placeholder="e.g. 499"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                          MRP / Original (₹)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.originalPrice}
                          onChange={e => setFormData({ ...formData, originalPrice: e.target.value })}
                          placeholder="e.g. 699"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                          Inventory Stock
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.stockQuantity}
                          onChange={e => setFormData({ ...formData, stockQuantity: e.target.value })}
                          placeholder="e.g. 50"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow outline-hidden"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Col: Logistics & Meta */}
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-200">
                  <div className="flex items-center gap-2 pb-4 border-b border-gray-100 mb-4">
                    <Tag size={16} className="text-brand-teal" />
                    <h3 className="font-bold text-sm text-gray-900">Catalog Meta & Seller</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Assigned Seller</label>
                      <select
                        value={formData.sellerId}
                        onChange={e => {
                          const s = sellers.find(item => (item.id === e.target.value || item._id === e.target.value));
                          setFormData({
                            ...formData,
                            sellerId: e.target.value,
                            sellerName: s ? (s.storeName || s.name) : 'Direct Marketplace'
                          });
                        }}
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-brand-yellow outline-hidden"
                      >
                        {sellers.map(s => (
                          <option key={s.id || s._id} value={s.id || s._id}>
                            {s.storeName || s.name} ({s.status || 'Verified'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Badge Highlight</label>
                      <select
                        value={formData.badge}
                        onChange={e => setFormData({ ...formData, badge: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-brand-yellow outline-hidden"
                      >
                        <option value="BESTSELLER">⭐ BESTSELLER</option>
                        <option value="NEW">✨ NEW</option>
                        <option value="SALE">🔥 SALE</option>
                        <option value="POPULAR">⚡ POPULAR</option>
                        <option value="TOP PICK">🏆 TOP PICK</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Base Catalog SKU</label>
                      <input
                        type="text"
                        value={formData.sku}
                        onChange={e => setFormData({ ...formData, sku: e.target.value })}
                        placeholder="e.g. BV-SHIRT-101"
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-brand-yellow outline-hidden uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Payment Method Allowed</label>
                      <select
                        value={formData.paymentMethodAllowed}
                        onChange={e => setFormData({ ...formData, paymentMethodAllowed: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-bold focus:ring-2 focus:ring-brand-yellow outline-hidden bg-white text-gray-900"
                      >
                        <option value="Both">💳 Online & Cash on Delivery</option>
                        <option value="Online_Only">⚡ Online / Prepaid Only</option>
                        <option value="COD_Only">💵 Cash on Delivery (COD) Only</option>
                      </select>
                    </div>

                    <div className="pt-2 border-t border-gray-100">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Approval Status</label>
                      <select
                        value={formData.approvalStatus}
                        onChange={e => setFormData({ ...formData, approvalStatus: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-bold focus:ring-2 focus:ring-brand-yellow outline-hidden bg-white text-gray-900"
                      >
                        <option value="Approved">✅ Approved (Active in Store)</option>
                        <option value="Pending">⏳ Pending Review</option>
                        <option value="Rejected">❌ Rejected</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Primary Image Preview Card */}
                <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-200">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                    <span className="text-xs font-bold text-gray-700">Cover Thumbnail</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('media')}
                      className="text-xs font-bold text-brand-teal hover:underline cursor-pointer"
                    >
                      Manage Photos
                    </button>
                  </div>
                  {formData.images.length > 0 ? (
                    <div className="relative aspect-square rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
                      <img
                        src={formData.images[0]}
                        alt="Product Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div 
                      onClick={() => setActiveTab('media')}
                      className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:border-brand-teal transition-colors"
                    >
                      <ImageIcon className="text-gray-400 mb-2" size={28} />
                      <span className="text-xs font-bold text-gray-600">No image uploaded</span>
                      <span className="text-[10px] text-gray-400 mt-0.5">Click to upload photos in Media tab</span>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: SIZE VARIANTS & INDIVIDUAL PRICING / IMAGES */}
          {activeTab === 'variants' && (
            <div className="space-y-6">
              
              {/* Feature Hero Card */}
              <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-teal-950 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
                <div className="relative z-10 max-w-3xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-yellow text-brand-teal-dark text-xs font-black mb-3">
                    <Sparkles size={13} />
                    <span>Size-Specific Pricing & Imagery Matrix</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black mb-2">
                    Individual Size Prices, MRPs, & Photos
                  </h2>
                  <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed">
                    Set unique selling prices, maximum retail prices (MRP), stock levels, and assign custom photos for each specific size (e.g. Size 34 can have a different cut, price, and photo than Size 28). When shoppers select a size on the store, the exact photo and price instantly switch for them!
                  </p>
                </div>
              </div>

              {/* Quick Presets & Add Variant Controls */}
              <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-gray-100">
                  <div>
                    <h3 className="font-display font-bold text-base text-gray-900 flex items-center gap-2">
                      <Boxes size={18} className="text-brand-teal" />
                      Quick Size Presets
                    </h3>
                    <p className="text-xs text-gray-500">Click any sizing template to auto-populate standard sizes</p>
                  </div>
                  {sizeVariants.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSizeVariants([])}
                      className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer self-start md:self-auto"
                    >
                      Clear All Sizes
                    </button>
                  )}
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-2.5 pt-4 pb-5 border-b border-gray-100">
                  {SIZE_PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applySizePreset(preset.sizes)}
                      className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-brand-yellow/20 hover:border-brand-yellow text-gray-800 text-xs font-bold border border-gray-200 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus size={13} className="text-brand-teal" />
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>

                {/* Custom Size Addition & Batch Controls */}
                <div className="pt-5 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  
                  {/* Add Single Size */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customSizeInput}
                      onChange={e => setCustomSizeInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddCustomSize(e); }}
                      placeholder="Add custom size (e.g. 42, Junior-L, 40R)..."
                      className="flex-1 px-4 py-2 rounded-xl border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-brand-yellow outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomSize}
                      className="px-4 py-2 bg-brand-teal text-white rounded-xl text-xs font-bold hover:bg-brand-teal-dark transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <Plus size={14} />
                      <span>Add Size</span>
                    </button>
                  </div>

                  {/* Batch Fill Helper */}
                  {sizeVariants.length > 1 && (
                    <div className="flex items-center gap-2 p-2 rounded-2xl bg-amber-50/60 border border-amber-200/70">
                      <span className="text-[11px] font-bold text-amber-900 shrink-0 ml-1">Apply to all:</span>
                      <input
                        type="number"
                        placeholder="₹ Price"
                        value={batchBasePrice}
                        onChange={e => setBatchBasePrice(e.target.value)}
                        className="w-20 px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-xs outline-hidden"
                      />
                      <input
                        type="number"
                        placeholder="₹ MRP"
                        value={batchBaseMrp}
                        onChange={e => setBatchBaseMrp(e.target.value)}
                        className="w-20 px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-xs outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={handleBatchFill}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                      >
                        Fill
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Variant Matrix List */}
              {sizeVariants.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-200 shadow-xs">
                  <div className="w-14 h-14 rounded-2xl bg-brand-yellow/20 text-brand-teal flex items-center justify-center mx-auto mb-3 font-bold">
                    <Boxes size={28} />
                  </div>
                  <h3 className="font-display font-bold text-lg text-gray-900 mb-1">No Size Variants Configured Yet</h3>
                  <p className="text-xs text-gray-500 max-w-md mx-auto mb-5">
                    Select one of the size presets above (Standard, Uniforms, Junior, Footwear) or add custom sizes to unlock individual size prices and images.
                  </p>
                  <button
                    type="button"
                    onClick={() => applySizePreset(SIZE_PRESETS[0].sizes)}
                    className="px-5 py-2.5 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-2"
                  >
                    <Plus size={15} />
                    <span>Apply Standard Sizes (S, M, L, XL, XXL)</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
                      Configured Size Variants ({sizeVariants.length})
                    </span>
                    <span className="text-xs text-gray-500">
                      Price Range: <strong className="text-gray-900 font-bold">₹{minVariantPrice} - ₹{maxVariantPrice}</strong> • Total Stock: <strong className="text-gray-900 font-bold">{totalVariantStock}</strong>
                    </span>
                  </div>

                  {sizeVariants.map((variant, index) => (
                    <div
                      key={`${variant.size}-${index}`}
                      className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs hover:border-brand-teal/40 transition-all flex flex-col lg:flex-row lg:items-center gap-4"
                    >
                      {/* Size Badge & Label */}
                      <div className="flex items-center gap-3 lg:w-48 shrink-0">
                        <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 font-black flex items-center justify-center text-sm shadow-2xs">
                          {variant.size}
                        </div>
                        <div>
                          <input
                            type="text"
                            value={variant.size}
                            onChange={e => handleVariantChange(index, 'size', e.target.value)}
                            className="text-sm font-bold text-gray-900 border-b border-dashed border-gray-300 focus:border-brand-teal outline-hidden py-0.5"
                            title="Edit size label"
                          />
                          <p className="text-[11px] text-gray-400">Variant #{index + 1}</p>
                        </div>
                      </div>

                      {/* Pricing & Stock Fields */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 mb-1">
                            Selling Price (₹) *
                          </label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={variant.price}
                            onChange={e => handleVariantChange(index, 'price', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-xl border border-gray-300 text-xs font-bold focus:ring-2 focus:ring-brand-yellow outline-hidden"
                            placeholder="499"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 mb-1">
                            MRP (₹)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={variant.mrp}
                            onChange={e => handleVariantChange(index, 'mrp', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-xl border border-gray-300 text-xs font-bold focus:ring-2 focus:ring-brand-yellow outline-hidden"
                            placeholder="699"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 mb-1">
                            Stock Units
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={variant.stock}
                            onChange={e => handleVariantChange(index, 'stock', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-xl border border-gray-300 text-xs font-bold focus:ring-2 focus:ring-brand-yellow outline-hidden"
                            placeholder="20"
                          />
                        </div>
                      </div>

                      {/* Size-Specific Image Controls (The Key Request) */}
                      <div className="flex items-center gap-3 lg:w-80 shrink-0 border-t lg:border-t-0 lg:border-l border-gray-100 pt-3 lg:pt-0 lg:pl-4">
                        <div className="relative w-12 h-12 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 shrink-0 shadow-2xs group">
                          {variant.image ? (
                            <img
                              src={variant.image}
                              alt={`Size ${variant.size}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <ImageIcon size={18} />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-gray-700 truncate">
                            {variant.image ? 'Custom Size Photo' : 'Using Default Photo'}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <button
                              type="button"
                              onClick={() => setActiveVariantForGallery(index)}
                              className="text-[10px] font-bold text-brand-teal hover:text-brand-teal-dark bg-brand-teal/5 hover:bg-brand-teal/15 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                              title="Pick an uploaded image from the product gallery"
                            >
                              Gallery Pick
                            </button>
                            <button
                              type="button"
                              onClick={() => triggerVariantImageUpload(index)}
                              className="text-[10px] font-bold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                              title="Upload a new photo specifically for this size"
                            >
                              Upload
                            </button>
                            {variant.image && (
                              <button
                                type="button"
                                onClick={() => handleVariantChange(index, 'image', '')}
                                className="text-[10px] text-red-500 hover:text-red-700 px-1 py-0.5 cursor-pointer"
                                title="Clear variant image"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Delete Variant Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(index)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer shrink-0"
                          title="Remove size variant"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MEDIA GALLERY */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-200">
                <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 mb-5">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
                    <ImageIcon size={17} />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-base text-gray-900">Product Media Gallery</h2>
                    <p className="text-xs text-gray-500">
                      Upload high-resolution front, back, and detail photos. You can easily link any of these images to individual size variants in the "Size Variants & Pricing" tab.
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <ImageUploadDropzone
                    images={formData.images}
                    onChange={(newImgs) => {
                      setFormData({
                        ...formData,
                        images: newImgs,
                        image: newImgs[0] || ''
                      });
                    }}
                    maxImages={12}
                    helperText="Drag & drop product images here, or browse local files"
                  />

                  {formData.images.length > 0 && (
                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                      <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-brand-teal" />
                        <span>{formData.images.length} Image{formData.images.length > 1 ? 's' : ''} in Product Catalog</span>
                      </h4>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        The first image is your main catalog listing thumbnail. All images will be selectable when configuring individual size variants.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </form>
      </div>

      {/* MODAL / SHEET: Gallery Image Picker for a Specific Size Variant */}
      {activeVariantForGallery !== null && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-display font-bold text-base text-gray-900">
                  Select Image for Size: <span className="text-brand-teal">{sizeVariants[activeVariantForGallery]?.size}</span>
                </h3>
                <p className="text-xs text-gray-500">Pick any image from your uploaded product media</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveVariantForGallery(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {formData.images.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 my-4">
                <ImageIcon className="mx-auto text-gray-400 mb-2" size={28} />
                <p className="text-xs font-bold text-gray-700">No images in product gallery</p>
                <p className="text-[11px] text-gray-400 mt-0.5 mb-4">Please upload photos to the media gallery first</p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveVariantForGallery(null);
                    setActiveTab('media');
                  }}
                  className="px-4 py-2 bg-brand-teal text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Go to Media Tab
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 my-4 max-h-72 overflow-y-auto p-1">
                {formData.images.map((imgUrl, imgIdx) => {
                  const isSelected = sizeVariants[activeVariantForGallery]?.image === imgUrl;
                  return (
                    <div
                      key={imgIdx}
                      onClick={() => assignGalleryImageToVariant(imgUrl)}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all hover:scale-105 shadow-2xs ${
                        isSelected ? 'border-brand-teal ring-2 ring-brand-teal/40' : 'border-gray-200 hover:border-brand-teal/60'
                      }`}
                    >
                      <img src={imgUrl} alt={`Option ${imgIdx + 1}`} className="w-full h-full object-cover" />
                      {isSelected && (
                        <div className="absolute inset-0 bg-brand-teal/30 flex items-center justify-center text-white">
                          <CheckCircle2 size={22} className="drop-shadow-sm" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  triggerVariantImageUpload(activeVariantForGallery);
                  setActiveVariantForGallery(null);
                }}
                className="text-xs font-bold text-brand-teal hover:underline cursor-pointer"
              >
                + Upload a new custom photo instead
              </button>
              <button
                type="button"
                onClick={() => setActiveVariantForGallery(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-md border-t border-gray-200 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-600 hidden sm:inline">
              {sizeVariants.length > 0 ? (
                <span>
                  <strong>{sizeVariants.length} Sizes</strong> configured • Starting from <strong>₹{minVariantPrice}</strong>
                </span>
              ) : (
                <span>Single variant product</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
            >
              Cancel & Exit
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2.5 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark rounded-xl text-xs font-extrabold shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 size={16} />
              <span>{submitting ? 'Saving Catalog Item...' : (isEdit ? 'Save Product Changes' : 'Publish Product to Catalog')}</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
