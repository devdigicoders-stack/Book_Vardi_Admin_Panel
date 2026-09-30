import React, { useState, useEffect, useMemo } from 'react';
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
  Check,
  Tag,
  Boxes,
  Eye,
  Info,
  ChevronDown,
  X,
  Save,
  RotateCcw,
  CreditCard,
  BookOpen,
  Search,
  School,
  Percent,
  TrendingDown,
  DollarSign,
  ShieldCheck,
  Store,
  UserCheck,
  Clock,
  Ban
} from 'lucide-react';
import ImageUploadDropzone from '../common/ImageUploadDropzone';
import { resolveImageUrl } from '../../utils/api';
import SchoolSelectorWithCustom from './SchoolSelectorWithCustom';

const KIT_BADGES = [
  'School Approved',
  'Best Seller',
  'New Arrival',
  'Verified KV',
  'Trending',
  'Special Offer'
];

export const GRADE_OPTIONS = [
  'Nursery', 'LKG', 'UKG',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11', 'Class 12', 'General / All Classes'
];

const dedupeImages = (imgs = []) => {
  const seen = new Set();
  return (Array.isArray(imgs) ? imgs : []).filter(img => {
    if (!img || typeof img !== 'string') return false;
    const clean = img.trim();
    if (seen.has(clean)) return false;
    seen.add(clean);
    return true;
  });
};

export default function AdminKitFormPage({
  kit,
  sellers = [],
  schools = [],
  existingProducts = [],
  onSave,
  onBack
}) {
  const isEdit = Boolean(kit);

  // Active form tab
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'items' | 'pricing' | 'media' | 'inventory' | 'payment'

  // General Kit State
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    schoolName: '',
    schoolCode: '',
    sellerId: '',
    sellerName: '',
    gender: 'Unisex',
    badgeTag: 'School Approved',
    category: 'kits',
    subCategory: 'School Uniform Kit',
    description: '',
    sku: '',
    gst: '5',
    isGstInclusive: true,
    bundlePrice: '',
    stock: '50',
    inventoryMode: 'fixed', // 'fixed' | 'dynamic'
    lowStockThreshold: '5',
    paymentMethodAllowed: 'Both',
    status: isEdit ? (kit?.status || 'available') : 'pending',
    approvalStatus: isEdit ? (kit?.approvalStatus || 'Approved') : 'Pending',
    approvalComment: '',
    image: '',
    images: []
  });

  // Multi-select Grades
  const [selectedGrades, setSelectedGrades] = useState([]);

  // Bundling Mode: 'catalog' | 'scratch'
  const [bundlingMode, setBundlingMode] = useState('catalog');

  // Bundled Line Items
  const [kitItems, setKitItems] = useState([]);

  // Scratch line item input state
  const [scratchItem, setScratchItem] = useState({
    name: '',
    quantity: 1,
    unitPrice: '',
    size: '',
    color: ''
  });

  // Catalog Picker state
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState('all');

  // Seller search state
  const [sellerSearch, setSellerSearch] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Initialize or populate form on edit
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (kit) {
      const rawImgs = Array.isArray(kit.images) && kit.images.length > 0
        ? kit.images
        : (kit.image ? [kit.image] : []);
      const imgs = dedupeImages(rawImgs);

      const gradeStr = kit.classGrade || kit.className || '';
      const initialGrades = typeof gradeStr === 'string'
        ? gradeStr.split(',').map(s => s.trim()).filter(Boolean)
        : (Array.isArray(gradeStr) ? gradeStr : []);
      setSelectedGrades(initialGrades);

      setFormData({
        title: kit.title || kit.name || '',
        subtitle: kit.subtitle || '',
        schoolName: kit.schoolName || kit.school || '',
        schoolCode: kit.schoolCode || '',
        sellerId: kit.sellerId?._id || kit.sellerId?.id || kit.sellerId || '',
        sellerName: kit.sellerName || kit.sellerId?.storeName || kit.sellerId?.name || '',
        gender: kit.gender || 'Unisex',
        badgeTag: kit.badgeTag || kit.badge || 'School Approved',
        category: kit.category || 'kits',
        subCategory: kit.subCategory || 'School Uniform Kit',
        description: kit.description || '',
        sku: kit.sku || '',
        gst: kit.gst !== undefined ? String(kit.gst) : '5',
        isGstInclusive: kit.isGstInclusive !== undefined ? Boolean(kit.isGstInclusive) : true,
        bundlePrice: kit.bundlePrice !== undefined ? String(kit.bundlePrice) : (kit.price !== undefined ? String(kit.price) : ''),
        stock: kit.stock !== undefined ? String(kit.stock) : (kit.stockQuantity !== undefined ? String(kit.stockQuantity) : '50'),
        inventoryMode: kit.inventoryMode || 'fixed',
        lowStockThreshold: kit.lowStockThreshold !== undefined ? String(kit.lowStockThreshold) : '5',
        paymentMethodAllowed: kit.paymentMethodAllowed || 'Both',
        status: kit.status || 'available',
        approvalStatus: kit.approvalStatus || 'Approved',
        approvalComment: kit.approvalComment || kit.rejectionReason || '',
        image: imgs[0] || '',
        images: imgs
      });

      if (Array.isArray(kit.items) && kit.items.length > 0) {
        setKitItems(kit.items.map(it => ({
          productId: it.productId?._id || it.productId?.id || it.productId || null,
          name: it.name || it.title || 'Item',
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || Number(it.price) || 0,
          totalPrice: (Number(it.unitPrice) || Number(it.price) || 0) * (Number(it.quantity) || 1),
          originalPrice: Number(it.originalPrice || it.mrp) || Number(it.unitPrice) || 0,
          size: it.size || '',
          color: it.color || '',
          image: it.image || (it.productId?.images?.[0] || it.productId?.image || '')
        })));
      }
    } else {
      setFormData({
        title: '',
        subtitle: '',
        schoolName: '',
        schoolCode: '',
        sellerId: sellers.length > 0 ? (sellers[0]._id || sellers[0].id) : '',
        sellerName: sellers.length > 0 ? (sellers[0].storeName || sellers[0].name) : '',
        gender: 'Unisex',
        badgeTag: 'School Approved',
        category: 'kits',
        subCategory: 'School Uniform Kit',
        description: '',
        sku: `BV-KIT-${Math.floor(100000 + Math.random() * 900000)}`,
        gst: '5',
        isGstInclusive: true,
        bundlePrice: '',
        stock: '50',
        inventoryMode: 'fixed',
        lowStockThreshold: '5',
        paymentMethodAllowed: 'Both',
        status: 'available',
        approvalStatus: 'Approved',
        approvalComment: '',
        image: '',
        images: []
      });
      setSelectedGrades([]);
      setKitItems([]);
    }
  }, [kit, sellers]);

  // Handle grade toggle
  const toggleGrade = (grade) => {
    setSelectedGrades(prev => {
      if (prev.includes(grade)) return prev.filter(g => g !== grade);
      return [...prev, grade];
    });
  };

  // Calculations for Kit
  const calculatedTotalMrp = useMemo(() => {
    return kitItems.reduce((acc, item) => {
      const lineTotal = (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1);
      return acc + lineTotal;
    }, 0);
  }, [kitItems]);

  const effectiveBundlePrice = useMemo(() => {
    const val = Number(formData.bundlePrice);
    if (!isNaN(val) && val > 0) return val;
    return calculatedTotalMrp > 0 ? Math.round(calculatedTotalMrp * 0.85) : 0;
  }, [formData.bundlePrice, calculatedTotalMrp]);

  const savingsAmount = useMemo(() => {
    return Math.max(0, calculatedTotalMrp - effectiveBundlePrice);
  }, [calculatedTotalMrp, effectiveBundlePrice]);

  const discountPercent = useMemo(() => {
    if (calculatedTotalMrp <= 0) return 0;
    return Math.round((savingsAmount / calculatedTotalMrp) * 100);
  }, [calculatedTotalMrp, savingsAmount]);

  // Dynamic stock calculated automatically from availability of individual constituent products
  const dynamicKitStock = useMemo(() => {
    if (kitItems.length === 0) return 0;
    const stocks = kitItems.map(item => {
      const matchedProd = (existingProducts || []).find(p => String(p.id || p._id) === String(item.productId));
      const availableProdStock = Number(matchedProd?.stock ?? matchedProd?.stockQuantity ?? item.stock ?? 25);
      const qtyRequired = Math.max(1, Number(item.quantity) || 1);
      return Math.floor(availableProdStock / qtyRequired);
    });
    return Math.min(...stocks);
  }, [kitItems, existingProducts]);

  // Derived effective GST from constituent products as previously defined on each product
  const derivedProductGst = useMemo(() => {
    if (kitItems.length === 0) return 5;
    const totalVal = kitItems.reduce((acc, it) => acc + (Number(it.unitPrice) || 0) * (Number(it.quantity) || 1), 0);
    if (totalVal <= 0) return 5;
    const totalGstWeighted = kitItems.reduce((acc, it) => {
      const matchedP = (existingProducts || []).find(p => String(p.id || p._id) === String(it.productId));
      const itemGst = Number(matchedP?.gstPercentage || matchedP?.gst || it.gst || 5);
      return acc + itemGst * ((Number(it.unitPrice) || 0) * (Number(it.quantity) || 1));
    }, 0);
    return Math.round(totalGstWeighted / totalVal);
  }, [kitItems, existingProducts]);

  // Filter catalog products for adding into kit
  const filteredCatalogProducts = useMemo(() => {
    return (existingProducts || []).filter(p => {
      const pName = (p.name || p.title || '').toLowerCase();
      const pSku = (p.sku || '').toLowerCase();
      const s = catalogSearch.toLowerCase();
      const matchesSearch = !s || pName.includes(s) || pSku.includes(s);
      const matchesCat = catalogCategoryFilter === 'all' || p.category === catalogCategoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [existingProducts, catalogSearch, catalogCategoryFilter]);

  // Filter sellers for dropdown
  const filteredSellers = useMemo(() => {
    if (!sellerSearch) return sellers;
    const s = sellerSearch.toLowerCase();
    return sellers.filter(sel => 
      (sel.storeName && sel.storeName.toLowerCase().includes(s)) ||
      (sel.name && sel.name.toLowerCase().includes(s)) ||
      (sel.email && sel.email.toLowerCase().includes(s)) ||
      (sel.phone && sel.phone.includes(s))
    );
  }, [sellers, sellerSearch]);

  // Add product from catalog into kit
  const handleAddCatalogProduct = (product) => {
    const existingIndex = kitItems.findIndex(it => it.productId === (product.id || product._id));
    if (existingIndex > -1) {
      setKitItems(prev => prev.map((item, idx) => {
        if (idx === existingIndex) {
          const nextQty = item.quantity + 1;
          return {
            ...item,
            quantity: nextQty,
            totalPrice: item.unitPrice * nextQty
          };
        }
        return item;
      }));
      return;
    }

    const price = Number(product.price || product.bundlePrice || product.mrp || 0);
    const primaryImg = Array.isArray(product.images) && product.images.length > 0
      ? product.images[0]
      : (product.image || '');

    const newItem = {
      productId: product.id || product._id,
      name: product.name || product.title || 'Product',
      quantity: 1,
      unitPrice: price,
      totalPrice: price,
      originalPrice: Number(product.mrp || product.originalPrice || price),
      size: (product.sizeVariants && product.sizeVariants[0]?.size) || (product.sizes && product.sizes[0]) || '',
      color: product.color || '',
      image: primaryImg
    };

    setKitItems(prev => [...prev, newItem]);
  };

  // Add custom line item (scratch mode)
  const handleAddScratchItem = (e) => {
    e.preventDefault();
    if (!scratchItem.name.trim()) return;
    const price = Number(scratchItem.unitPrice) || 0;
    const qty = Number(scratchItem.quantity) || 1;

    setKitItems(prev => [
      ...prev,
      {
        productId: null,
        name: scratchItem.name.trim(),
        quantity: qty,
        unitPrice: price,
        totalPrice: price * qty,
        originalPrice: price,
        size: scratchItem.size.trim(),
        color: scratchItem.color.trim(),
        image: ''
      }
    ]);

    setScratchItem({
      name: '',
      quantity: 1,
      unitPrice: '',
      size: '',
      color: ''
    });
  };

  // Update item line quantity
  const handleItemQuantityChange = (index, delta) => {
    setKitItems(prev => prev.map((it, idx) => {
      if (idx === index) {
        const nextQty = Math.max(1, it.quantity + delta);
        return {
          ...it,
          quantity: nextQty,
          totalPrice: it.unitPrice * nextQty
        };
      }
      return it;
    }));
  };

  // Update item unit price directly
  const handleItemPriceChange = (index, newPrice) => {
    const p = Math.max(0, Number(newPrice) || 0);
    setKitItems(prev => prev.map((it, idx) => {
      if (idx === index) {
        return {
          ...it,
          unitPrice: p,
          totalPrice: p * it.quantity
        };
      }
      return it;
    }));
  };

  // Remove item from kit
  const handleRemoveItem = (index) => {
    setKitItems(prev => prev.filter((_, idx) => idx !== index));
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Please provide a Kit / Bundle Title.');
      setActiveTab('general');
      return;
    }

    if (kitItems.length === 0) {
      setError('A Kit Bundle must contain at least 1 bundled item. Please add items in the "Items & Pricing" tab.');
      setActiveTab('items');
      return;
    }

    const priceToSave = Number(formData.bundlePrice) || effectiveBundlePrice;
    if (priceToSave <= 0) {
      setError('Please set a valid Bundle Price in the "Items & Pricing" tab.');
      setActiveTab('items');
      return;
    }

    const primaryImg = formData.images[0] || formData.image || '';
    if (!primaryImg) {
      setError('Please upload at least one image or thumbnail for this Kit Bundle in the "Media" tab.');
      setActiveTab('media');
      return;
    }

    setSubmitting(true);

    try {
      const rawStock = Number(formData.stock);
      const isIndependent = formData.inventoryMode === 'fixed' || (!isNaN(rawStock) && rawStock > 0 && formData.inventoryMode !== 'dynamic');
      const finalStock = isIndependent ? (rawStock || 0) : dynamicKitStock;
      const finalMode = isIndependent ? 'fixed' : 'dynamic';
      const finalGst = derivedProductGst || 5;
      const isApproved = formData.approvalStatus === 'Approved';

      const payload = {
        title: formData.title.trim(),
        name: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        schoolName: formData.schoolName.trim(),
        schoolCode: formData.schoolCode.trim(),
        sellerId: formData.sellerId || null,
        sellerName: formData.sellerName || '',
        classGrade: selectedGrades.join(', '),
        gender: formData.gender,
        badgeTag: formData.badgeTag,
        category: formData.category || 'kits',
        subCategory: formData.subCategory || 'School Uniform Kit',
        description: formData.description,
        sku: formData.sku.trim() || `BV-KIT-${Date.now().toString().slice(-6)}`,
        gst: finalGst,
        gstPercentage: finalGst,
        isGstInclusive: true, // Applied as previously on constituent products
        totalMrp: calculatedTotalMrp,
        mrp: calculatedTotalMrp,
        bundlePrice: priceToSave,
        price: priceToSave,
        savingsAmount: Math.max(0, calculatedTotalMrp - priceToSave),
        discountPercentage: calculatedTotalMrp > 0 ? Math.round(((calculatedTotalMrp - priceToSave) / calculatedTotalMrp) * 100) : 0,
        stock: finalStock,
        stockQuantity: finalStock,
        independentStock: isIndependent ? (rawStock || 0) : 0,
        inventoryMode: finalMode,
        lowStockThreshold: Number(formData.lowStockThreshold) || 5,
        paymentMethodAllowed: formData.paymentMethodAllowed,
        status: isApproved ? 'available' : (formData.approvalStatus === 'Rejected' ? 'inactive' : 'pending'),
        approvalStatus: formData.approvalStatus,
        isApproved: isApproved,
        approvalComment: formData.approvalComment,
        image: primaryImg,
        images: formData.images.length > 0 ? formData.images : [primaryImg],
        items: kitItems.map(it => ({
          productId: it.productId || null,
          name: it.name,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          price: it.unitPrice,
          totalPrice: it.totalPrice,
          originalPrice: it.originalPrice || it.unitPrice,
          size: it.size || '',
          color: it.color || '',
          image: it.image || ''
        }))
      };

      await onSave(payload);
    } catch (err) {
      console.error('Error saving kit bundle:', err);
      setError(err?.message || 'Failed to save kit bundle. Please check your network and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { id: 'general', label: '1. General Info', icon: BookOpen },
    { id: 'items', label: `2. Items & Pricing (${kitItems.length})`, icon: Boxes },
    { id: 'media', label: `3. Media (${formData.images.length})`, icon: ImageIcon },
    { id: 'inventory', label: '4. Stock & Logistics', icon: Layers },
    { id: 'payment', label: '5. Payment & Policies', icon: CreditCard }
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Admin Kit Bundle Creator
              </span>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                formData.approvalStatus === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                formData.approvalStatus === 'Rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {formData.approvalStatus}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
              {isEdit ? `Edit Kit: ${formData.title || 'Untitled'}` : 'Create New School Kit / Bundle'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Bundle uniforms, notebooks, stationery, and accessories into an all-in-one package for schools & parents.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium text-sm transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm shadow-md hover:shadow-lg transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving Kit...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isEdit ? 'Update Kit' : 'Save & Publish Kit'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between text-sm animate-shake">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="bg-white border border-gray-200 rounded-xl p-1.5 shadow-sm flex items-center space-x-1 overflow-x-auto scrollbar-none">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Form Tabs (Left) & Real-time Live Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Form Tab Contents */}
        <div className="lg:col-span-2 space-y-6">
          {/* TAB 1: GENERAL INFO */}
          {activeTab === 'general' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  <span>General Kit Information & Seller Assignment</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Define the primary bundle name, assign seller, target school, and grade classification.
                </p>
              </div>

              {/* Admin Specific: Seller Assignment & Approval Status */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-bold text-slate-800">Admin Governance & Catalog Approval</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Seller Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Assigned Seller / Store <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.sellerId}
                      onChange={(e) => {
                        const selId = e.target.value;
                        const sel = sellers.find(s => (s._id || s.id) === selId);
                        setFormData(prev => ({
                          ...prev,
                          sellerId: selId,
                          sellerName: sel ? (sel.storeName || sel.name || 'Store') : ''
                        }));
                      }}
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">-- Select Marketplace Seller --</option>
                      {sellers.map(s => (
                        <option key={s._id || s.id} value={s._id || s.id}>
                          {s.storeName || s.name} ({s.email || s.phone || 'Seller'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Admin Approval Status Toggle */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Catalog Visibility & Review Status
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'Approved', label: 'Approve & Publish' },
                        { id: 'Pending', label: 'Keep in Pending' },
                        { id: 'Rejected', label: 'Reject Kit' }
                      ].map(opt => {
                        const isCur = formData.approvalStatus === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              approvalStatus: opt.id,
                              status: opt.id === 'Approved' ? 'available' : (opt.id === 'Rejected' ? 'inactive' : 'pending')
                            }))}
                            className={`px-2 py-2 text-xs font-bold rounded-lg border text-center transition-all ${
                              isCur
                                ? opt.id === 'Approved' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                   : opt.id === 'Rejected' ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                                   : 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      Default is Pending Review. Hidden from public catalog until approved by an administrator.
                    </p>
                  </div>
                </div>

                {formData.approvalStatus === 'Rejected' && (
                  <div>
                    <label className="block text-xs font-semibold text-rose-700 mb-1">
                      Rejection Reason / Admin Feedback
                    </label>
                    <input
                      type="text"
                      value={formData.approvalComment}
                      onChange={(e) => setFormData(prev => ({ ...prev, approvalComment: e.target.value }))}
                      placeholder="e.g. Incomplete constituent sizes or image quality does not meet marketplace standards"
                      className="w-full px-3 py-2 text-sm bg-white border border-rose-300 rounded-xl focus:ring-2 focus:ring-rose-500 text-rose-900"
                    />
                  </div>
                )}
              </div>

              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Bundle / Kit Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Kendriya Vidyalaya Class 1 Complete Uniform & Books Kit"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Kit Subtitle / Highlights
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                    placeholder="e.g. Includes 2 Shirts, 1 Trouser, Belt, Socks & Full NCERT Class 1 Books Set"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Universal / Open for All Schools Quick Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <School size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <span>Open for All Schools (Universal Kit)</span>
                      {(formData.schoolName?.toLowerCase().includes('all school') || formData.schoolCode === 'ALL') && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Enable this if this kit bundle is general and applicable for students of any school.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const isAll = formData.schoolName?.toLowerCase().includes('all school') || formData.schoolCode === 'ALL';
                    if (isAll) {
                      setFormData(prev => ({
                        ...prev,
                        schoolName: '',
                        schoolCode: ''
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        schoolName: 'All Schools (Open for All Schools)',
                        schoolCode: 'ALL'
                      }));
                    }
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                    (formData.schoolName?.toLowerCase().includes('all school') || formData.schoolCode === 'ALL')
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50'
                  }`}
                >
                  {(formData.schoolName?.toLowerCase().includes('all school') || formData.schoolCode === 'ALL') ? (
                    <>
                      <Check size={13} />
                      <span>All Schools Enabled</span>
                    </>
                  ) : (
                    <span>Make Open for All Schools</span>
                  )}
                </button>
              </div>

              {/* Searchable School Selector with Custom Option */}
              <div className="pt-2 border-t border-gray-100">
                <SchoolSelectorWithCustom
                  selectedSchoolName={formData.schoolName}
                  selectedSchoolCode={formData.schoolCode}
                  onSelectSchool={(schoolObj) => {
                    setFormData(prev => ({
                      ...prev,
                      schoolName: schoolObj.name || '',
                      schoolCode: schoolObj.schoolCode || schoolObj.code || ''
                    }));
                  }}
                  userRole="admin"
                  required={true}
                />
              </div>

              {/* Target Grades / Classes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-700">
                    Target Class / Grades (Select all that apply)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGrades(GRADE_OPTIONS);
                      }}
                      className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      Select All Classes
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedGrades([])}
                      className="text-[11px] font-bold text-gray-400 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {GRADE_OPTIONS.map(grade => {
                    const isSelected = selectedGrades.includes(grade);
                    return (
                      <button
                        key={grade}
                        type="button"
                        onClick={() => toggleGrade(grade)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                        }`}
                      >
                        {grade}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category, Gender, Badge Tag */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Kit Sub-Category
                  </label>
                  <select
                    value={formData.subCategory}
                    onChange={(e) => setFormData(prev => ({ ...prev, subCategory: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="School Uniform Kit">School Uniform Kit</option>
                    <option value="Books & Stationery Kit">Books & Stationery Kit</option>
                    <option value="Complete Academic Kit">Complete Academic Kit</option>
                    <option value="Sports & Activity Kit">Sports & Activity Kit</option>
                    <option value="Winter Uniform Kit">Winter Uniform Kit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Target Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="Unisex">Unisex / All Students</option>
                    <option value="Boys">Boys</option>
                    <option value="Girls">Girls</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Badge / Tag
                  </label>
                  <select
                    value={formData.badgeTag}
                    onChange={(e) => setFormData(prev => ({ ...prev, badgeTag: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {KIT_BADGES.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Kit Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Kit Description & Inclusions Breakdown
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide a comprehensive breakdown of everything included in this kit bundle, fabric specifications, publisher details, wash care, etc."
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* TAB 2: KIT ITEMS / BUNDLE CONTENTS */}
          {activeTab === 'items' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                    <Boxes className="w-5 h-5 text-indigo-600" />
                    <span>Constituent Kit Items ({kitItems.length})</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Add catalog products or custom scratch items to assemble this bundle.
                  </p>
                </div>

                {/* Mode Selector */}
                <div className="inline-flex p-1 bg-gray-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setBundlingMode('catalog')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      bundlingMode === 'catalog'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Select from Catalog
                  </button>
                  <button
                    type="button"
                    onClick={() => setBundlingMode('scratch')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      bundlingMode === 'scratch'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    + Custom Scratch Item
                  </button>
                </div>
              </div>

              {/* Mode A: Catalog Picker */}
              {bundlingMode === 'catalog' && (
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={catalogSearch}
                        onChange={(e) => setCatalogSearch(e.target.value)}
                        placeholder="Search products by title, SKU, or category..."
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      />
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    </div>

                    <select
                      value={catalogCategoryFilter}
                      onChange={(e) => setCatalogCategoryFilter(e.target.value)}
                      className="px-3 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="all">All Categories</option>
                      <option value="uniforms">Uniforms</option>
                      <option value="ncert">NCERT / Books</option>
                      <option value="notebooks">Notebooks</option>
                      <option value="shoes">Shoes</option>
                      <option value="bags">Bags & Bottles</option>
                    </select>
                  </div>

                  {/* Scrollable list of matched products */}
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1 divide-y divide-gray-100">
                    {filteredCatalogProducts.length === 0 ? (
                      <p className="text-xs text-gray-500 py-4 text-center">
                        No catalog items found matching your search.
                      </p>
                    ) : (
                      filteredCatalogProducts.map(prod => {
                        const inKit = kitItems.some(it => it.productId === (prod.id || prod._id));
                        return (
                          <div
                            key={prod.id || prod._id}
                            className="flex items-center justify-between py-2 pt-2 bg-white px-3 rounded-lg border border-gray-100 hover:border-indigo-200 transition-all"
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <img
                                src={resolveImageUrl(prod.images?.[0] || prod.image || '')}
                                alt={prod.name}
                                className="w-10 h-10 object-cover rounded-lg bg-gray-50 border border-gray-200 flex-shrink-0"
                                onError={(e) => { e.target.src = 'https://placehold.co/80x80?text=BV'; }}
                              />
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-gray-800 truncate">{prod.name || prod.title}</h4>
                                <div className="flex items-center space-x-2 text-[11px] text-gray-500">
                                  <span className="font-semibold text-gray-900">₹{prod.price || prod.bundlePrice || 0}</span>
                                  {prod.sku && <span>• SKU: {prod.sku}</span>}
                                  {prod.sellerName && <span>• By: {prod.sellerName}</span>}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddCatalogProduct(prod)}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center space-x-1 transition-all ${
                                inKit
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
                              }`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{inKit ? 'Add Another' : 'Add to Kit'}</span>
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Mode B: Scratch Line Item Creator */}
              {bundlingMode === 'scratch' && (
                <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center space-x-2 text-amber-800 text-xs font-semibold">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Create Line Item From Scratch</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        value={scratchItem.name}
                        onChange={(e) => setScratchItem(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Item name (e.g. KV School Belt)"
                        className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        min="1"
                        value={scratchItem.quantity}
                        onChange={(e) => setScratchItem(prev => ({ ...prev, quantity: e.target.value }))}
                        placeholder="Qty"
                        className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        min="0"
                        value={scratchItem.unitPrice}
                        onChange={(e) => setScratchItem(prev => ({ ...prev, unitPrice: e.target.value }))}
                        placeholder="Unit MRP ₹"
                        className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={handleAddScratchItem}
                        className="w-full h-full min-h-[38px] bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Item</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Current Constituent Items Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-500 font-semibold px-2">
                  <span>ITEM DETAILS</span>
                  <span>QTY & LINE TOTAL</span>
                </div>

                {kitItems.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center space-y-2">
                    <Boxes className="w-10 h-10 text-gray-300 mx-auto" />
                    <p className="text-sm font-semibold text-gray-600">No items added to this bundle yet</p>
                    <p className="text-xs text-gray-400">
                      Use the catalog search above or create custom items to build this kit.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {kitItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-all"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">{item.name}</h4>
                            <div className="flex items-center space-x-2 text-[11px] text-gray-500">
                              <span>Unit MRP: ₹{item.unitPrice}</span>
                              {item.size && <span>• Size: {item.size}</span>}
                              {item.color && <span>• Color: {item.color}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          {/* Qty Stepper */}
                          <div className="flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden">
                            <button
                              type="button"
                              onClick={() => handleItemQuantityChange(idx, -1)}
                              className="px-2 py-1 text-gray-600 hover:bg-gray-100 text-xs font-bold"
                            >
                              -
                            </button>
                            <span className="px-2.5 py-1 text-xs font-bold text-gray-900">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleItemQuantityChange(idx, 1)}
                              className="px-2 py-1 text-gray-600 hover:bg-gray-100 text-xs font-bold"
                            >
                              +
                            </button>
                          </div>

                          {/* Line total */}
                          <div className="text-right min-w-[70px]">
                            <p className="text-xs font-bold text-gray-900">
                              ₹{item.unitPrice * item.quantity}
                            </p>
                            <p className="text-[10px] text-gray-400">Total MRP</p>
                          </div>

                          {/* Delete Item */}
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Remove from bundle"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Summary row */}
                    <div className="flex items-center justify-between p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl mt-4">
                      <div>
                        <p className="text-xs font-bold text-indigo-900">Bundle MRP Sum</p>
                        <p className="text-[11px] text-indigo-700">Combined MRP of all individual items</p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-indigo-950">₹{calculatedTotalMrp}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Kit Bundle Pricing & Discount Section (Merged from Step 3) */}
              <div className="pt-4 border-t border-gray-100 space-y-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-bold text-gray-900">Kit Bundle Pricing & Savings</h3>
                </div>

                {/* Savings Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5">
                    <p className="text-[11px] font-semibold text-gray-500">Total Items MRP</p>
                    <p className="text-lg font-black text-gray-900 mt-0.5">₹{calculatedTotalMrp}</p>
                    <p className="text-[10px] text-gray-400">Sum of constituent products</p>
                  </div>

                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5">
                    <p className="text-[11px] font-semibold text-indigo-700">Kit Selling Price</p>
                    <p className="text-lg font-black text-indigo-900 mt-0.5">₹{effectiveBundlePrice}</p>
                    <p className="text-[10px] text-indigo-600">Bundle package rate</p>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
                    <p className="text-[11px] font-semibold text-emerald-700">Customer Savings</p>
                    <p className="text-lg font-black text-emerald-800 mt-0.5">
                      ₹{savingsAmount} <span className="text-[11px] font-bold text-emerald-600">({discountPercent}% OFF)</span>
                    </p>
                    <p className="text-[10px] text-emerald-600">Direct bundle discount</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Kit Bundle Selling Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-400 font-bold">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={formData.bundlePrice}
                        onChange={(e) => setFormData(prev => ({ ...prev, bundlePrice: e.target.value }))}
                        placeholder={calculatedTotalMrp > 0 ? String(Math.round(calculatedTotalMrp * 0.85)) : 'e.g. 1999'}
                        className="w-full pl-8 pr-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-gray-900"
                      />
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Discounted bundle package price for students & parents.
                    </p>
                  </div>

                  {/* GST Notice - Applied as previously on products */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-center">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Product-Inherited GST Structure</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      GST is applied directly from constituent products (0% Books, 5% Uniforms, 12% Shoes).
                      Effective derived GST rate: <span className="font-black text-indigo-700">~{derivedProductGst}%</span> (inclusive, no extra kit surcharge).
                    </p>
                  </div>
                </div>

                {/* Inclusive GST checkbox */}
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-900">Price is Inclusive of Product GST</p>
                    <p className="text-[10px] text-gray-500">Checkout price incorporates constituent product taxes directly.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.isGstInclusive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isGstInclusive: e.target.checked }))}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('media')}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all"
                >
                  Next: Media & Images →
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: MEDIA & IMAGES */}
          {activeTab === 'media' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                  <ImageIcon className="w-5 h-5 text-indigo-600" />
                  <span>Media & Product Photos ({formData.images.length})</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Upload high-resolution kit flatlays, packaging photos, or detailed constituent closeups.
                </p>
              </div>

              <ImageUploadDropzone
                images={formData.images}
                onChange={(newImgs) => {
                  setFormData(prev => ({
                    ...prev,
                    images: newImgs,
                    image: newImgs[0] || ''
                  }));
                }}
                maxImages={8}
                helperText="Drag & drop kit photos here, or click to browse files"
              />

              {/* Direct Image URL input */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Or Paste External Image URL
                </label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    id="adminKitUrlInput"
                    placeholder="https://example.com/kit-cover.jpg"
                    className="flex-1 px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const inp = document.getElementById('adminKitUrlInput');
                      if (inp && inp.value.trim()) {
                        const val = inp.value.trim();
                        setFormData(prev => ({
                          ...prev,
                          images: dedupeImages([...prev.images, val]),
                          image: prev.image || val
                        }));
                        inp.value = '';
                      }
                    }}
                    className="px-4 py-2 bg-gray-800 text-white rounded-xl text-xs font-semibold hover:bg-gray-900 transition-all"
                  >
                    Add URL
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('inventory')}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all"
                >
                  Next: Stock & Logistics →
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: STOCK & LOGISTICS */}
          {activeTab === 'inventory' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                  <Package className="w-5 h-5 text-indigo-600" />
                  <span>Stock Availability & Logistics Rules</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Set independent pre-packed bundle stock or let it update automatically from constituent item availability.
                </p>
              </div>

              {/* Stock Mode Selection Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      inventoryMode: 'fixed',
                      stock: prev.stock && Number(prev.stock) > 0 ? prev.stock : '50'
                    }));
                  }}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.inventoryMode === 'fixed'
                      ? 'border-indigo-600 bg-indigo-50/20 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-indigo-600" /> Independent Bundle Stock
                    </span>
                    <input
                      type="radio"
                      name="adminStockMode"
                      checked={formData.inventoryMode === 'fixed'}
                      onChange={() => {
                        setFormData(prev => ({
                          ...prev,
                          inventoryMode: 'fixed',
                          stock: prev.stock && Number(prev.stock) > 0 ? prev.stock : '50'
                        }));
                      }}
                      className="accent-indigo-600"
                    />
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Set a fixed, dedicated stock count for pre-boxed / pre-assembled kit packages in warehouse.
                  </p>
                </div>

                <div
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      inventoryMode: 'dynamic',
                      stock: String(dynamicKitStock)
                    }));
                  }}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.inventoryMode === 'dynamic'
                      ? 'border-indigo-600 bg-indigo-50/20 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" /> Auto-Update (Dynamic)
                    </span>
                    <input
                      type="radio"
                      name="adminStockMode"
                      checked={formData.inventoryMode === 'dynamic'}
                      onChange={() => {
                        setFormData(prev => ({
                          ...prev,
                          inventoryMode: 'dynamic',
                          stock: String(dynamicKitStock)
                        }));
                      }}
                      className="accent-indigo-600"
                    />
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Automatically computes bundle stock from constituent items ({dynamicKitStock} kits ready).
                  </p>
                </div>
              </div>

              {/* Status Alert Banner */}
              {formData.inventoryMode === 'fixed' ? (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold">Independent Stock Active:</span> Kit availability is locked to dedicated pre-packed units ({formData.stock || 0} kits).
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="font-bold">Auto-Updating Active:</span> Kit stock is dynamically calculated as{' '}
                    <span className="font-black underline">{dynamicKitStock} kits</span> based on constituent warehouse inventory.
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Stock Quantity */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {formData.inventoryMode === 'fixed' ? 'Independent Kit Stock Count *' : 'Available Kit Stock (Auto-Computed)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    readOnly={formData.inventoryMode === 'dynamic'}
                    value={formData.inventoryMode === 'dynamic' ? dynamicKitStock : formData.stock}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                    placeholder={formData.inventoryMode === 'dynamic' ? String(dynamicKitStock) : "50"}
                    className={`w-full px-3.5 py-2.5 text-sm rounded-xl font-bold ${
                      formData.inventoryMode === 'dynamic'
                        ? 'bg-gray-100 border border-gray-300 text-gray-700 cursor-not-allowed'
                        : 'bg-white border border-gray-300 focus:ring-2 focus:ring-indigo-500'
                    }`}
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    {formData.inventoryMode === 'fixed'
                      ? 'Pre-packed bundles ready to ship independently.'
                      : 'Updated automatically as constituent stock changes.'}
                  </p>
                </div>

                {/* SKU Code */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Kit SKU Code
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                      placeholder="BV-KIT-001"
                      className="flex-1 px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const gen = `BV-KIT-${Math.floor(100000 + Math.random() * 900000)}`;
                        setFormData(prev => ({ ...prev, sku: gen }));
                      }}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                    >
                      Generate
                    </button>
                  </div>
                </div>
              </div>

              {/* Component Availability Breakdown Table */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-indigo-600" /> Constituent Component Availability
                  </h4>
                  <span className="text-[11px] text-gray-500 font-medium">
                    {kitItems.length} items in bundle
                  </span>
                </div>

                {kitItems.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No items added to kit yet. Add items in Step 2.</p>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold text-[11px]">
                        <tr>
                          <th className="px-3 py-2">Item Name</th>
                          <th className="px-3 py-2 text-center">Qty / Kit</th>
                          <th className="px-3 py-2 text-center">Warehouse Stock</th>
                          <th className="px-3 py-2 text-center">Max Kits Possible</th>
                          <th className="px-3 py-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {kitItems.map((item, idx) => {
                          const matched = (existingProducts || []).find(p => String(p.id || p._id) === String(item.productId));
                          const available = Number(matched?.stock ?? matched?.stockQuantity ?? item.stock ?? 25);
                          const qtyReq = Math.max(1, Number(item.quantity) || 1);
                          const maxKits = Math.floor(available / qtyReq);
                          const isBottleneck = maxKits === dynamicKitStock;

                          return (
                            <tr key={idx} className={isBottleneck && dynamicKitStock < 10 ? 'bg-amber-50/50' : ''}>
                              <td className="px-3 py-2 font-medium text-gray-900">
                                <div>{item.name || matched?.name || `Item #${idx + 1}`}</div>
                                {item.size && <div className="text-[10px] text-gray-400">Size: {item.size}</div>}
                              </td>
                              <td className="px-3 py-2 text-center font-bold text-gray-700">{qtyReq}</td>
                              <td className="px-3 py-2 text-center font-bold text-gray-700">{available}</td>
                              <td className="px-3 py-2 text-center">
                                <span className={`font-black ${isBottleneck ? 'text-amber-600' : 'text-gray-900'}`}>
                                  {maxKits} kits
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right">
                                {isBottleneck ? (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                                    Limiting Factor
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px]">
                                    Sufficient
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Low Stock Threshold */}
              <div className="pt-2 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Low Stock Alert Threshold
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.lowStockThreshold}
                    onChange={(e) => setFormData(prev => ({ ...prev, lowStockThreshold: e.target.value }))}
                    placeholder="5"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Receive warning when kit stock drops below this number.</p>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('payment')}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Next: Payment & Policies →
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: PAYMENT & POLICIES */}
          {activeTab === 'payment' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  <span>Payment Methods & Fulfillment Terms</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Define acceptable payment types and customer fulfillment policies.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Payment Methods Allowed
                  </label>
                  <select
                    value={formData.paymentMethodAllowed}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentMethodAllowed: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Both">Both (Online UPI/Cards & Cash on Delivery)</option>
                    <option value="Online">Online Payments Only (Prepaid)</option>
                    <option value="COD">Cash on Delivery (COD) Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Marketplace Availability Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="available">Available / Active</option>
                    <option value="out_of_stock">Out of Stock</option>
                    <option value="discontinued">Discontinued</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Action Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium text-sm transition-all"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm shadow-md hover:shadow-lg transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Kit...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEdit ? 'Update Kit Bundle' : 'Create & Publish Kit'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Sticky Live Kit Card Preview */}
        <div className="sticky top-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center space-x-1.5">
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              <span>Live Website Preview</span>
            </span>
            <span className="text-[11px] text-gray-400">Real-time render</span>
          </div>

          {/* Interactive Card */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all">
            {/* Card Image Banner */}
            <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
              <img
                src={resolveImageUrl(formData.images[0] || formData.image || '')}
                alt={formData.title || 'Kit Preview'}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                onError={(e) => {
                  e.target.src = 'https://placehold.co/400x300?text=Kit+Bundle+Preview';
                }}
              />

              {/* Badges Overlay */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                {formData.badgeTag && (
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-indigo-600 text-white shadow-sm">
                    {formData.badgeTag}
                  </span>
                )}
                {formData.schoolName && (
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-white/90 backdrop-blur text-gray-800 shadow-sm truncate max-w-[200px]">
                    🏫 {formData.schoolName}
                  </span>
                )}
              </div>

              {discountPercent > 0 && (
                <div className="absolute top-3 right-3">
                  <span className="px-2.5 py-1 text-xs font-black rounded-lg bg-rose-600 text-white shadow-sm flex items-center space-x-1">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>{discountPercent}% OFF</span>
                  </span>
                </div>
              )}

              {/* Items Count Pill */}
              <div className="absolute bottom-3 left-3">
                <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-black/70 backdrop-blur text-white flex items-center space-x-1">
                  <Boxes className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{kitItems.length} constituent items</span>
                </span>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-4 space-y-3">
              <div>
                <div className="flex items-center space-x-1.5 text-[11px] text-indigo-600 font-semibold mb-1">
                  <span>{formData.subCategory || 'Kit Bundle'}</span>
                  {selectedGrades.length > 0 && (
                    <>
                      <span>•</span>
                      <span className="truncate">{selectedGrades.slice(0, 2).join(', ')}{selectedGrades.length > 2 ? ` +${selectedGrades.length - 2}` : ''}</span>
                    </>
                  )}
                </div>
                <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-2">
                  {formData.title || 'Untitled School Kit Bundle'}
                </h3>
                {formData.subtitle && (
                  <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                    {formData.subtitle}
                  </p>
                )}
              </div>

              {/* Included items mini pills */}
              {kitItems.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Bundle Contents:
                  </p>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-hidden">
                    {kitItems.slice(0, 4).map((it, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-[11px] rounded bg-gray-100 text-gray-700 truncate max-w-[180px]"
                      >
                        {it.quantity}x {it.name}
                      </span>
                    ))}
                    {kitItems.length > 4 && (
                      <span className="px-1.5 py-0.5 text-[11px] rounded bg-indigo-50 text-indigo-700 font-bold">
                        +{kitItems.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Price & Savings */}
              <div className="pt-2 border-t border-gray-100 flex items-baseline justify-between">
                <div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-xl font-black text-gray-900">
                      ₹{effectiveBundlePrice}
                    </span>
                    {calculatedTotalMrp > effectiveBundlePrice && (
                      <span className="text-xs text-gray-400 line-through">
                        ₹{calculatedTotalMrp}
                      </span>
                    )}
                  </div>
                  {savingsAmount > 0 && (
                    <p className="text-[11px] font-bold text-emerald-600">
                      You save ₹{savingsAmount}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                    Number(formData.stock) > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {Number(formData.stock) > 0 ? `${formData.stock} In Stock` : 'Out of Stock'}
                  </span>
                </div>
              </div>

              {/* Admin Metadata Pill */}
              <div className="pt-2 border-t border-dashed border-gray-200 flex items-center justify-between text-[11px] text-gray-500">
                <span className="flex items-center space-x-1">
                  <Store className="w-3 h-3 text-gray-400" />
                  <span className="truncate max-w-[120px]">{formData.sellerName || 'Unassigned Seller'}</span>
                </span>
                <span className={`px-2 py-0.5 rounded font-bold ${
                  formData.approvalStatus === 'Approved' ? 'bg-emerald-50 text-emerald-700' :
                  formData.approvalStatus === 'Rejected' ? 'bg-rose-50 text-rose-700' :
                  'bg-amber-50 text-amber-700'
                }`}>
                  {formData.approvalStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
