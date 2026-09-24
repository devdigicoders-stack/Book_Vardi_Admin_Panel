import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  AlertTriangle,
  Sparkles,
  Store,
  Tag,
  Check,
  Package,
  Layers,
  Info,
  Image as ImageIcon,
} from 'lucide-react';
import { resolveImageUrl, parseSizeVariants } from '../../utils/api';

const REJECTION_PRESETS = [
  'Poor or blurry image quality / non-neutral background',
  'Selling price or MRP mismatch with marketplace standards',
  'Incomplete material, size chart, or curriculum specification',
  'Misleading title or incorrect school category assignment',
  'Counterfeit, trademark infringement, or unverified brand',
  'Inventory discrepancy / unrealistic stock volume listed'
];

export default function ProductReviewModal({
  isOpen,
  onClose,
  product,
  onUpdateStatus,
  readOnly = false
}) {
  if (!isOpen || !product) return null;

  const [selectedStatus, setSelectedStatus] = useState(product.approvalStatus || 'Pending');
  const [remark, setRemark] = useState(product.approvalComment || product.rejectionReason || '');
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [validationError, setValidationError] = useState('');
  const [previewImageModalUrl, setPreviewImageModalUrl] = useState(null);
  const [previewImageModalTitle, setPreviewImageModalTitle] = useState('');
  
  // Interactive admin compliance check marks
  const [checks, setChecks] = useState({
    images: true,
    pricing: true,
    specs: true,
    policy: true
  });

  const getProductGallery = (prod) => {
    if (!prod) return [];
    const list = [];
    const extractUrl = (val) => {
      if (!val) return '';
      if (typeof val === 'string') return val.trim();
      if (typeof val === 'object') return (val.url || val.src || val.path || val.data || val.link || '').trim();
      return '';
    };

    const primary = extractUrl(prod.image || prod.coverImage || prod.imageUrl || prod.photo || prod.primaryImage);
    if (primary) list.push(primary);

    if (Array.isArray(prod.images)) {
      prod.images.forEach(img => {
        const u = extractUrl(img);
        if (u && !list.includes(u)) list.push(u);
      });
    }

    if (Array.isArray(prod.sizeVariants)) {
      prod.sizeVariants.forEach(v => {
        const vImg = extractUrl(v.image);
        if (vImg && !list.includes(vImg)) list.push(vImg);
        if (Array.isArray(v.images)) {
          v.images.forEach(img => {
            const u = extractUrl(img);
            if (u && !list.includes(u)) list.push(u);
          });
        }
      });
    }

    const resolved = list.map(img => resolveImageUrl(img)).filter(Boolean);
    return [...new Set(resolved)];
  };

  const imagesList = getProductGallery(product);

  useEffect(() => {
    setSelectedStatus(product.approvalStatus || 'Pending');
    setRemark(product.approvalComment || product.rejectionReason || '');
    setActiveImageIdx(0);
    setValidationError('');
    setChecks({ images: true, pricing: true, specs: true, policy: true });
  }, [product]);

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    setValidationError('');
    if (status === 'Approved' && (!remark || remark.startsWith('Poor') || remark.startsWith('Selling') || remark.startsWith('Incomplete'))) {
      setRemark('Verified and approved for marketplace catalog.');
    } else if (status === 'Rejected' && (!remark || remark === 'Verified and approved for marketplace catalog.')) {
      setRemark('');
    }
  };

  const handleApplyPreset = (preset) => {
    setRemark(preset);
    setValidationError('');
  };

  const handleSaveDecision = (e) => {
    e?.preventDefault();
    const trimmedRemark = remark.trim();

    // STRICT VALIDATION: Rejection requires a mandatory comment/remark
    if (selectedStatus === 'Rejected') {
      if (!trimmedRemark) {
        setValidationError('Rejection remark is strictly mandatory. Please state the reason so the seller can address the issues.');
        return;
      }
      if (trimmedRemark.length < 5) {
        setValidationError('Please provide a meaningful rejection remark (at least 5 characters).');
        return;
      }
    }

    setValidationError('');
    onUpdateStatus(product.id, selectedStatus, trimmedRemark);
    onClose();
  };

  const discountPercent = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const isPending = product.approvalStatus === 'Pending';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gray-50/90 border-b border-gray-200/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${
              isPending 
                ? 'bg-amber-100 text-amber-900 ring-2 ring-amber-300' 
                : product.approvalStatus === 'Rejected'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-emerald-100 text-emerald-800'
            }`}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-extrabold text-lg text-gray-900">
                  Product Approval & Quality Inspection
                </h3>
                {isPending && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white animate-pulse">
                    <Clock size={11} /> URGENT APPROVAL QUEUE
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                <span>SKU: <strong className="font-mono text-gray-700">{product.sku || `SKU-${product.id}`}</strong></span>
                <span>•</span>
                <span>Category: <strong className="capitalize text-gray-700">{product.category}</strong></span>
                <span>•</span>
                <span>Merchant: <strong className="text-teal-800">{product.sellerName || 'Direct Marketplace'}</strong></span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-6 space-y-6 text-xs flex-1">
          
          {/* Main Inspection Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Visual Gallery & Product Info (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Image Preview Box */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/80">
                <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-white border border-gray-200 flex items-center justify-center">
                  {imagesList[activeImageIdx] ? (
                    <img
                      src={imagesList[activeImageIdx]}
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 text-gray-400">
                      <Loader2 className="w-8 h-8 animate-spin text-teal-700" />
                      <span className="text-xs mt-2 font-medium">Loading image...</span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold">
                    Image {activeImageIdx + 1} of {imagesList.length}
                  </div>
                  {product.badge && (
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-brand-yellow text-brand-teal-dark text-[10px] font-extrabold tracking-wide">
                      {product.badge}
                    </div>
                  )}
                </div>

                {/* Thumbnail Strip */}
                {imagesList.length > 1 && (
                  <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
                    {imagesList.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImageIdx(idx)}
                        className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                          activeImageIdx === idx
                            ? 'border-teal-700 ring-2 ring-teal-200 scale-105'
                            : 'border-gray-200 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Comprehensive Specifications & Details Card */}
              <div className="bg-white rounded-2xl p-4 border border-gray-200/80 space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-display font-extrabold text-base text-gray-900">
                      {product.name}
                    </h4>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                      product.isMeterBased || product.unit === 'meter'
                        ? 'bg-teal-50 text-teal-800 border-teal-200'
                        : 'bg-blue-50 text-blue-800 border-blue-200'
                    }`}>
                      {product.isMeterBased || product.unit === 'meter' ? '✂️ Unstitched Fabric (Meters)' : '👔 Ready-To-Wear (Pieces)'}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {product.subtitle || 'Authentic school & student merchandise listed on Book Vardi.'}
                  </p>
                </div>

                {/* Commercials: Price, MRP, Discount & GST */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-gray-500 block">Selling Price</span>
                    <span className="text-base font-extrabold text-gray-900">₹{product.price}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-gray-500 block">MRP / List Price</span>
                    <span className="text-base font-bold text-gray-400 line-through">
                      ₹{product.originalPrice || product.mrp || Math.round(product.price * 1.25)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-gray-500 block">Discount</span>
                    <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md inline-block mt-0.5">
                      {discountPercent}% OFF
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-gray-500 block">GST Tax Rate</span>
                    <span className="text-xs font-extrabold text-purple-800 bg-purple-100/80 px-2 py-0.5 rounded-md inline-block mt-0.5">
                      {product.gst ?? product.gstPercentage ?? 5}% GST
                    </span>
                  </div>
                </div>

                {/* Specs Pill Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-[10px] text-gray-400 block font-bold uppercase">Stock Level</span>
                    <span className="font-extrabold text-gray-800 text-xs">
                      {product.stockQuantity ?? product.stock ?? 50} units
                    </span>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-[10px] text-gray-400 block font-bold uppercase">Category</span>
                    <span className="font-extrabold text-gray-800 text-xs capitalize">
                      {product.subCategory ? `${product.category} > ${product.subCategory}` : (product.category || 'N/A')}
                    </span>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-[10px] text-gray-400 block font-bold uppercase">Brand</span>
                    <span className="font-extrabold text-gray-800 text-xs">
                      {product.brand || 'Unbranded / Generic'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-[10px] text-gray-400 block font-bold uppercase">Material / Fabric</span>
                    <span className="font-extrabold text-gray-800 text-xs">
                      {product.material || 'Not specified'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-[10px] text-gray-400 block font-bold uppercase">Target School</span>
                    <span className="font-extrabold text-gray-800 text-xs">
                      {product.schoolName || product.school || 'General Academic'}
                      {product.schoolCode ? ` (${product.schoolCode})` : ''}
                    </span>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-[10px] text-gray-400 block font-bold uppercase">Grade / Class</span>
                    <span className="font-extrabold text-gray-800 text-xs">
                      {product.classGrade || product.className || 'All Grades'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-[10px] text-gray-400 block font-bold uppercase">Target Gender & Age</span>
                    <span className="font-extrabold text-gray-800 text-xs">
                      {product.gender || 'Unisex'} • {product.ageGroup || (Array.isArray(product.ages) && product.ages.length > 0 ? product.ages.join(', ') : 'All Ages')}
                    </span>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-[10px] text-gray-400 block font-bold uppercase">Return Policy</span>
                    <span className={`font-extrabold text-xs ${product.isReturnable === false ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {product.isReturnable === false ? 'Non-Returnable' : `${product.returnWindowDays || 7}-Day Easy Returns`}
                    </span>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-[10px] text-gray-400 block font-bold uppercase">Payment Methods</span>
                    <span className="font-extrabold text-gray-800 text-xs">
                      {product.paymentMethodAllowed || 'Both (Online & COD)'}
                    </span>
                  </div>
                </div>

                {/* Fabric / Meter Quantity Pricing Rule Callout */}
                {(product.isMeterBased || product.unit === 'meter') && (
                  <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl text-xs text-teal-950 font-medium">
                    ✂️ <strong>Fabric Meter Pricing Rule:</strong> Sold per meter. Min order: <strong>{product.minMeter || 0.5}m</strong>, Step: <strong>{product.meterStep || 0.5}m</strong>.
                    Formula: <span className="font-mono font-bold text-teal-900">{`{Customer Selected Meters} × ₹${product.price}/meter`}</span>.
                  </div>
                )}

                {/* Product Scale Variants Matrix (250g, 3pcs, 3metre, Sizes, etc.) */}
                {(() => {
                  const variantsList = parseSizeVariants(product);
                  if (variantsList.length === 0) return null;

                  return (
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Layers size={14} className="text-teal-700" />
                          <span>Product Variants Matrix & Detail Photos ({variantsList.length})</span>
                        </span>
                        <span className="text-[10px] font-bold text-gray-500">Click photo to view high-res</span>
                      </div>

                      {/* Variant Preview Image Layout in Row */}
                      <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 border-b border-gray-100 scrollbar-thin">
                        {variantsList.map((v, vIdx) => {
                          const vRawImg = v.image || (Array.isArray(v.images) && v.images[0]) || product.image || (Array.isArray(product.images) && product.images[0]);
                          const vImgUrl = vRawImg ? resolveImageUrl(vRawImg) : '';
                          const vVal = v.measureValue || v.size || `Var #${vIdx + 1}`;

                          return (
                            <div
                              key={vIdx}
                              onClick={() => {
                                if (vImgUrl) {
                                  setPreviewImageModalUrl(vImgUrl);
                                  setPreviewImageModalTitle(`Variant: ${vVal}`);
                                }
                              }}
                              className="flex items-center gap-2.5 p-2 rounded-xl bg-teal-50/60 hover:bg-teal-100/70 border border-teal-200/80 shrink-0 min-w-[175px] cursor-pointer transition-all"
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

                      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-[10px] border-b border-gray-200">
                            <tr>
                              <th className="px-3 py-2">Variant Value</th>
                              <th className="px-3 py-2">Variant Photos</th>
                              <th className="px-3 py-2">Scale</th>
                              <th className="px-3 py-2">Price (₹)</th>
                              <th className="px-3 py-2">MRP (₹)</th>
                              <th className="px-3 py-2">Stock</th>
                              <th className="px-3 py-2">SKU</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {variantsList.map((v, vIdx) => {
                              const rawVImages = Array.isArray(v.images) && v.images.length > 0
                                ? v.images
                                : (v.image ? [v.image] : []);
                              const vImages = rawVImages.map(img => resolveImageUrl(img)).filter(Boolean);

                            return (
                              <tr key={vIdx} className="hover:bg-gray-50">
                                <td className="px-3 py-2 font-bold text-gray-900">
                                  {v.measureValue || v.size || `Variant #${vIdx + 1}`}
                                </td>
                                <td className="px-3 py-2">
                                  {vImages.length > 0 ? (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {vImages.map((img, imgIdx) => (
                                        <button
                                          key={imgIdx}
                                          type="button"
                                          onClick={() => {
                                            setPreviewImageModalUrl(img);
                                            setPreviewImageModalTitle(`Variant: ${v.measureValue || v.size || `#${vIdx + 1}`} (Photo ${imgIdx + 1})`);
                                          }}
                                          className="relative group w-9 h-9 rounded-lg overflow-hidden border border-gray-200 hover:border-teal-600 hover:ring-2 hover:ring-teal-200 transition-all cursor-pointer bg-gray-50 shrink-0"
                                          title="Click to view full photo"
                                        >
                                          <img src={img} alt="" className="w-full h-full object-cover" />
                                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                            <Eye size={12} />
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-gray-400 italic">No photos</span>
                                  )}
                                </td>
                                <td className="px-3 py-2">
                                  <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] uppercase font-bold">
                                    {v.measureScale || 'size'}
                                  </span>
                                </td>
                                <td className="px-3 py-2 font-extrabold text-gray-900">₹{v.price}</td>
                                <td className="px-3 py-2 text-gray-400 line-through">₹{v.mrp || Math.round(v.price * 1.25)}</td>
                                <td className="px-3 py-2 font-bold text-emerald-700">{v.stock}</td>
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

                {/* Sizes, Colors & Tags */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  {product.sizes && (!product.sizeVariants || product.sizeVariants.length === 0) && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-gray-500 w-20 shrink-0">Sizes / Options:</span>
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(product.sizes) ? product.sizes : String(product.sizes).split(',')).map((s, i) => (
                          <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-800 font-bold rounded-md text-[10px]">
                            {String(s).trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {product.colors && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-gray-500 w-20 shrink-0">Colors:</span>
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(product.colors) ? product.colors : String(product.colors).split(',')).map((c, i) => (
                          <span key={i} className="px-2 py-0.5 bg-teal-50 text-teal-800 font-bold rounded-md text-[10px] border border-teal-100">
                            {String(c).trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {product.tags && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-gray-500 w-20 shrink-0">Tags:</span>
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(product.tags) ? product.tags : String(product.tags).split(',')).map((t, i) => (
                          <span key={i} className="px-2 py-0.5 bg-amber-50 text-amber-900 font-bold rounded-md text-[10px] border border-amber-200">
                            #{String(t).trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Apparel Size Chart Table (if available) */}
                {product.sizeChart && Array.isArray(product.sizeChart.rows) && product.sizeChart.rows.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <span className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider block">
                      📐 Size Measurement Chart (Inches)
                    </span>
                    <div className="overflow-x-auto rounded-xl border border-indigo-100 bg-indigo-50/30">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-indigo-100/70 text-indigo-950 font-bold uppercase text-[10px]">
                          <tr>
                            <th className="p-2">Size</th>
                            <th className="p-2">Chest</th>
                            <th className="p-2">Length</th>
                            <th className="p-2">Sleeve</th>
                            <th className="p-2">Waist</th>
                            <th className="p-2">Shoulder</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-indigo-100 bg-white">
                          {product.sizeChart.rows.map((row, rIdx) => (
                            <tr key={rIdx}>
                              <td className="p-2 font-bold text-gray-900">{row.size}</td>
                              <td className="p-2 text-gray-700">{row.chest || '-'}</td>
                              <td className="p-2 text-gray-700">{row.length || '-'}</td>
                              <td className="p-2 text-gray-700">{row.sleeve || '-'}</td>
                              <td className="p-2 text-gray-700">{row.waist || '-'}</td>
                              <td className="p-2 text-gray-700">{row.shoulder || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Description */}
                {product.description && (
                  <div className="pt-2 border-t border-gray-100">
                    <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Detailed Description</span>
                    <p className="text-gray-700 text-xs leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100 whitespace-pre-line">
                      {product.description}
                    </p>
                  </div>
                )}
              </div>

            </div>

            {/* Right Column: Pre-Approval Checklist & Decision Selector (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Pre-Approval Quality Checklist */}
              <div className="bg-white rounded-2xl p-4 border border-gray-200/80 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-teal-700" />
                    Inspection Checklist
                  </h4>
                  <span className="text-[10px] text-gray-400 font-medium">Verified standards</span>
                </div>

                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 p-2 rounded-xl bg-gray-50 hover:bg-gray-100/80 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checks.images}
                      onChange={e => setChecks({ ...checks, images: e.target.checked })}
                      className="mt-0.5 rounded text-teal-700 focus:ring-teal-500"
                    />
                    <div className="text-[11px]">
                      <span className="font-bold text-gray-800 block">Image Quality & Compliance</span>
                      <span className="text-gray-500 text-[10px]">Clear photos, no watermarks, accurate merchandise</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2 rounded-xl bg-gray-50 hover:bg-gray-100/80 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checks.pricing}
                      onChange={e => setChecks({ ...checks, pricing: e.target.checked })}
                      className="mt-0.5 rounded text-teal-700 focus:ring-teal-500"
                    />
                    <div className="text-[11px]">
                      <span className="font-bold text-gray-800 block">Pricing & MRP Verification</span>
                      <span className="text-gray-500 text-[10px]">Complies with school board & fair trade guidelines</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2 rounded-xl bg-gray-50 hover:bg-gray-100/80 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checks.specs}
                      onChange={e => setChecks({ ...checks, specs: e.target.checked })}
                      className="mt-0.5 rounded text-teal-700 focus:ring-teal-500"
                    />
                    <div className="text-[11px]">
                      <span className="font-bold text-gray-800 block">Accurate Category & Specifications</span>
                      <span className="text-gray-500 text-[10px]">Valid sizing, material descriptions, and board curriculum</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2 rounded-xl bg-gray-50 hover:bg-gray-100/80 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checks.policy}
                      onChange={e => setChecks({ ...checks, policy: e.target.checked })}
                      className="mt-0.5 rounded text-teal-700 focus:ring-teal-500"
                    />
                    <div className="text-[11px]">
                      <span className="font-bold text-gray-800 block">Merchant Policy & Authenticity</span>
                      <span className="text-gray-500 text-[10px]">Verified seller with active GST / KYC clearance</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Approval Decision Form */}
              <div className="bg-white rounded-2xl p-4 border border-gray-200/80 space-y-4 shadow-2xs">
                <div>
                  <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                    Approval Decision *
                  </label>
                  
                  {/* Decision Selection Cards */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* Approve Option */}
                    <button
                      type="button"
                      onClick={() => handleStatusChange('Approved')}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        selectedStatus === 'Approved'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-extrabold ring-2 ring-emerald-300'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 font-semibold'
                      }`}
                    >
                      <CheckCircle2 size={16} className={`mx-auto mb-1 ${selectedStatus === 'Approved' ? 'text-emerald-600' : 'text-gray-400'}`} />
                      <div className="text-xs">Approve</div>
                      <div className="text-[9px] text-gray-400 mt-0.5">Publish live</div>
                    </button>

                    {/* Pending Option */}
                    <button
                      type="button"
                      onClick={() => handleStatusChange('Pending')}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        selectedStatus === 'Pending'
                          ? 'border-amber-500 bg-amber-50 text-amber-900 font-extrabold ring-2 ring-amber-300'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 font-semibold'
                      }`}
                    >
                      <Clock size={16} className={`mx-auto mb-1 ${selectedStatus === 'Pending' ? 'text-amber-500' : 'text-gray-400'}`} />
                      <div className="text-xs">Hold Pending</div>
                      <div className="text-[9px] text-gray-400 mt-0.5">Keep in queue</div>
                    </button>

                    {/* Reject Option */}
                    <button
                      type="button"
                      onClick={() => handleStatusChange('Rejected')}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        selectedStatus === 'Rejected'
                          ? 'border-rose-600 bg-rose-50 text-rose-900 font-extrabold ring-2 ring-rose-300'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 font-semibold'
                      }`}
                    >
                      <AlertTriangle size={16} className={`mx-auto mb-1 ${selectedStatus === 'Rejected' ? 'text-rose-600' : 'text-gray-400'}`} />
                      <div className="text-xs">Reject</div>
                      <div className="text-[9px] text-gray-400 mt-0.5">Remark required</div>
                    </button>
                  </div>
                </div>

                {/* Comment / Remark Box */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-gray-700">
                      {selectedStatus === 'Rejected' ? (
                        <span className="text-rose-700 flex items-center gap-1 font-extrabold">
                          <AlertTriangle size={13} /> Rejection Reason / Remark (Mandatory) *
                        </span>
                      ) : (
                        <span className="text-gray-700">Approval Comment / Admin Note (Optional)</span>
                      )}
                    </label>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {remark.length} chars
                    </span>
                  </div>

                  <textarea
                    rows={3}
                    value={remark}
                    onChange={e => {
                      setRemark(e.target.value);
                      if (validationError) setValidationError('');
                    }}
                    placeholder={
                      selectedStatus === 'Rejected'
                        ? 'Explain why this product is rejected (e.g. poor image quality, pricing discrepancy). This remark will be sent to the merchant...'
                        : 'Optional note for audit logs or internal review...'
                    }
                    className={`w-full p-3 rounded-xl border text-xs focus:ring-2 outline-hidden transition-colors resize-none ${
                      selectedStatus === 'Rejected' && (!remark.trim() || validationError)
                        ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30 text-rose-900'
                        : 'border-gray-300 focus:ring-brand-yellow text-gray-800'
                    }`}
                  />

                  {/* Validation Error Message */}
                  {validationError && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-semibold flex items-center gap-1.5">
                      <AlertCircle size={14} className="shrink-0 text-rose-600" />
                      <span>{validationError}</span>
                    </div>
                  )}

                  {/* Quick-Pick Rejection Presets */}
                  {selectedStatus === 'Rejected' && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                        Quick Rejection Presets (Click to insert):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {REJECTION_PRESETS.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleApplyPreset(preset)}
                            className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-rose-100 text-gray-700 hover:text-rose-800 text-[10px] font-medium border border-gray-200 transition-colors text-left cursor-pointer"
                          >
                            + {preset.slice(0, 32)}...
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Previous History Callout if already reviewed */}
                {(product.approvalComment || product.rejectionReason) && (
                  <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[11px] text-gray-600">
                    <span className="font-bold text-gray-700 block">Existing Remark:</span>
                    <p className="mt-0.5 italic">"{product.rejectionReason || product.approvalComment}"</p>
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200/80 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-gray-500">
            Current Status: <strong className="font-bold text-gray-800">{product.approvalStatus || 'Pending'}</strong>
            {selectedStatus !== product.approvalStatus && (
              <span className="ml-1 text-teal-700 font-bold">➔ changing to {selectedStatus}</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
            >
              {readOnly ? 'Close Preview' : 'Cancel'}
            </button>
            {!readOnly && (
              <button
                type="button"
                onClick={handleSaveDecision}
                className={`px-5 py-2.5 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer ${
                  selectedStatus === 'Approved'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : selectedStatus === 'Rejected'
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-amber-500 hover:bg-amber-600 text-white'
                }`}
              >
                <Check size={16} />
                <span>Confirm {selectedStatus} Decision</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* High-Res Image Lightbox Modal */}
      {previewImageModalUrl && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-4 shadow-2xl border border-gray-100 flex flex-col space-y-3 max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h4 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                <ImageIcon size={18} className="text-teal-700" />
                <span>{previewImageModalTitle || 'Variant Detail Photo'}</span>
              </h4>
              <button
                type="button"
                onClick={() => setPreviewImageModalUrl(null)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center">
              <img
                src={previewImageModalUrl}
                alt="Enlarged Detail"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="w-full h-full hidden flex-col items-center justify-center text-gray-400 gap-2">
                <ImageIcon size={36} />
                <span className="text-xs font-medium">Unable to load photo</span>
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setPreviewImageModalUrl(null)}
                className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
