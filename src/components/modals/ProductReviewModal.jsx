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
  Info
} from 'lucide-react';

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
  
  // Interactive admin compliance check marks
  const [checks, setChecks] = useState({
    images: true,
    pricing: true,
    specs: true,
    policy: true
  });

  const imagesList = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : (product.image ? [product.image] : ['https://images.unsplash.com/photo-1593032465175-481ac7f401a0?w=500']);

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
                  <img
                    src={imagesList[activeImageIdx] || imagesList[0]}
                    alt={product.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1593032465175-481ac7f401a0?w=500';
                    }}
                  />
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

              {/* Product Specifications Card */}
              <div className="bg-white rounded-2xl p-4 border border-gray-200/80 space-y-3">
                <div>
                  <h4 className="font-display font-extrabold text-base text-gray-900">
                    {product.name}
                  </h4>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {product.subtitle || 'Authentic school & student merchandise listed on Book Vardi.'}
                  </p>
                </div>

                {/* Price & Commercials */}
                <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-gray-500 block">Selling Price</span>
                    <span className="text-base font-extrabold text-gray-900">₹{product.price}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-gray-500 block">MRP / List Price</span>
                    <span className="text-base font-bold text-gray-400 line-through">
                      ₹{product.originalPrice || Math.round(product.price * 1.25)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-gray-500 block">Discount</span>
                    <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md inline-block mt-0.5">
                      {discountPercent}% OFF
                    </span>
                  </div>
                </div>

                {/* Specs Pill Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-[10px] text-gray-400 block font-bold uppercase">Stock Level</span>
                    <span className="font-extrabold text-gray-800 text-xs">
                      {product.stockQuantity ?? 50} units
                    </span>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-[10px] text-gray-400 block font-bold uppercase">Category</span>
                    <span className="font-extrabold text-gray-800 text-xs capitalize">
                      {product.category}
                    </span>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-[10px] text-gray-400 block font-bold uppercase">Target Gender</span>
                    <span className="font-extrabold text-gray-800 text-xs capitalize">
                      {product.gender || 'Unisex'}
                    </span>
                  </div>
                </div>

                {/* Sizes and Colors */}
                {(product.sizes || product.colors) && (
                  <div className="space-y-2 pt-1 border-t border-gray-100">
                    {product.sizes && (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-gray-500 w-16 shrink-0">Sizes:</span>
                        <div className="flex flex-wrap gap-1">
                          {(Array.isArray(product.sizes) ? product.sizes : String(product.sizes).split(',')).map((s, i) => (
                            <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 font-bold rounded-md text-[10px]">
                              {String(s).trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {product.colors && (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-gray-500 w-16 shrink-0">Colors:</span>
                        <div className="flex flex-wrap gap-1">
                          {(Array.isArray(product.colors) ? product.colors : String(product.colors).split(',')).map((c, i) => (
                            <span key={i} className="px-2 py-0.5 bg-teal-50 text-teal-800 font-semibold rounded-md text-[10px] border border-teal-100">
                              {String(c).trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Description */}
                {product.description && (
                  <div className="pt-2 border-t border-gray-100">
                    <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Description</span>
                    <p className="text-gray-700 text-xs leading-relaxed bg-gray-50 p-2.5 rounded-xl border border-gray-100">
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
    </div>
  );
}
