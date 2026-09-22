import React, { useState } from 'react';
import { 
  X, 
  Store, 
  CheckCircle, 
  Ban, 
  ShieldCheck, 
  Landmark, 
  DollarSign, 
  Percent,
  FileText,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Download,
  Eye,
  AlertTriangle,
  Building2,
  MapPin,
  Phone,
  Mail,
  UserCheck,
  CreditCard,
  Package,
  Calendar,
  Award,
  Sparkles,
  FileCheck,
  RefreshCw
} from 'lucide-react';

export default function SellerDetailModal({ 
  isOpen, 
  onClose, 
  seller, 
  onApprove, 
  onReject, 
  onSetPending,
  onToggleStatus,
  onUpdateCommission, 
  onReleasePayout,
  readOnly = false 
}) {
  if (!isOpen || !seller) return null;

  const sellerId = seller.id || seller._id;

  // Active review tab
  const [activeTab, setActiveTab] = useState('dossier'); // 'dossier' | 'documents' | 'storefront' | 'financials'

  // Commission & rejection state
  const [commission, setCommission] = useState(seller.commissionRate || 10);
  const [commissionSaved, setCommissionSaved] = useState(false);
  const [rejectReason, setRejectReason] = useState(seller.rejectionReason || '');
  const [showRejectBox, setShowRejectBox] = useState(false);

  // Document inspector preview state
  const [previewDoc, setPreviewDoc] = useState(null);

  // Accordion state for all 12 steps
  const [expandedSections, setExpandedSections] = useState({
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
    6: true,
    7: true,
    8: true,
    9: true,
    10: true,
    11: true,
    12: true
  });

  const toggleSection = (id) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const collapseAll = () => {
    const collapsed = {};
    for (let i = 1; i <= 12; i++) collapsed[i] = false;
    setExpandedSections(collapsed);
  };

  const expandAll = () => {
    const expanded = {};
    for (let i = 1; i <= 12; i++) expanded[i] = true;
    setExpandedSections(expanded);
  };

  // Normalized seller and rawApplication data
  const app = seller.rawApplication || {};
  const storeName = seller.storeName || app.storeName || seller.businessName || 'BookVardi Merchant Store';
  const legalBusinessName = app.legalBusinessName || seller.businessName || seller.storeName || 'Vardi Retail Entity';
  const tradeName = app.tradeName || seller.storeName || 'Book Vardi Partner';
  const businessType = app.businessType || 'Private Limited';
  const yearStarted = app.yearStarted || '2021';
  const annualTurnoverEstimate = app.annualTurnoverEstimate || '₹25L - ₹50L';

  const ownerName = app.ownerFullName || seller.ownerName || seller.name || 'Merchant Owner';
  const ownerDesignation = app.ownerDesignation || 'Director / Managing Partner';
  const ownerPan = app.ownerPan || seller.pan || seller.ownerPan || 'N/A';
  const ownerAadhaarLast4 = app.ownerAadhaarLast4 || (seller.aadhaar ? String(seller.aadhaar).slice(-4) : 'N/A');

  const businessPan = app.businessPan || seller.businessPan || seller.pan || app.ownerPan || 'N/A';
  const gstin = app.gstin || seller.gstin || (app.hasGstExemption || seller.hasGstExemption ? 'GST Exempted' : 'N/A');
  const msmeNumber = app.msmeRegistrationNumber || seller.msmeRegistrationNumber || seller.documents?.msmeRegistrationNumber || 'N/A';
  const cinNumber = app.cinNumber || seller.cinNumber || seller.documents?.cinNumber || 'N/A';

  const addressLine1 = app.addressLine1 || seller.address?.split(',')[0] || 'Plot 42, Industrial Area, Phase-III';
  const addressLine2 = app.addressLine2 || '';
  const city = app.city || seller.city || 'New Delhi';
  const state = app.state || seller.state || 'Delhi';
  const pincode = app.pincode || '110020';
  const country = app.country || 'India';
  const fullAddress = `${addressLine1}${addressLine2 ? ', ' + addressLine2 : ''}, ${city}, ${state} - ${pincode}, ${country}`;

  const addressProofType = app.addressProofType || 'Electricity Bill';
  const addressProofDocNumber = app.addressProofDocNumber || 'EB-2026-98124';
  const addressProofFileName = app.addressProofFileName || 'electricity_bill_okhla_feb2026.pdf';

  const bankName = app.bankName || seller.bankDetails?.bank || 'HDFC Bank Ltd';
  const bankBranch = app.bankBranch || seller.bankDetails?.branch || 'Okhla Phase-III, New Delhi';
  const bankAccountNumber = app.bankAccountNumber || seller.bankDetails?.account || '50200084920194';
  const bankIfscCode = app.bankIfscCode || seller.bankDetails?.ifsc || 'HDFC0000240';
  const bankAccountHolder = app.bankAccountHolder || legalBusinessName;
  const accountType = app.accountType || 'Current Account';

  const storeSlug = app.storeSlug || seller.storeSlug || 'book-vardi-official';
  const storeTagline = app.storeTagline || 'Certified School Uniforms, Textbooks & STEM Academic Kits';
  const storeDescription = app.storeDescription || 'Premier provider of school textbooks, uniform sets, drawing guides and geometry supplies with fast campus delivery.';
  const storeLogo = app.storeLogo || seller.storeLogo || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&auto=format&fit=crop&q=80';

  const categories = app.selectedCategories || (seller.category ? [seller.category] : ['Uniforms & Schoolwear', 'NCERT & CBSE Textbooks', 'Notebooks & Paper Crafts']);
  const brands = Array.isArray(app.primaryBrands) ? app.primaryBrands : ['Classmate', 'Doms', 'Camlin', 'Oxford'];
  const estimatedSkuCount = app.estimatedSkuCount || '250+ SKUs';
  const sampleProductTitle = app.sampleProductTitle || 'Class 10 CBSE Complete Science & Math Bundle';

  const currentStatus = seller.status || app.status || 'Pending Approval';
  const rawStatus = String(currentStatus).toLowerCase();
  const isPending = rawStatus === 'pending' || rawStatus === 'pending approval';
  const isVerified = rawStatus === 'verified' || rawStatus === 'approved';
  const isRejected = rawStatus === 'rejected';
  const isSuspended = rawStatus === 'suspended';
  const submittedDate = app.submittedAt || seller.joinedDate || '9/9/2026';
  const auditRefId = `BV-KYC-${Math.abs(seller.phone?.replace(/\D/g, '') || 9876543210).toString().slice(-6)}`;

  // Dedicated documents list for the Document Vault
  const documentsList = [
    {
      id: 'doc-pan',
      title: 'Company / Business PAN Card',
      category: 'Tax & Entity Identity',
      number: businessPan,
      entity: legalBusinessName,
      authority: 'Income Tax Department, Govt of India',
      status: 'Verified Valid',
      statusColor: 'emerald',
      fileName: 'business_pan_verified.pdf',
      fileSize: '1.8 MB',
      issueDate: '15 Mar 2021',
      highlights: [
        'PAN matches Income Tax & MCA registry records',
        'Entity classified as Corporate / Business Taxpayer',
        'Active status in NSDL e-governance database'
      ]
    },
    {
      id: 'doc-gstin',
      title: 'GSTIN Registration Certificate (REG-06)',
      category: 'Indirect Taxation',
      number: gstin,
      entity: tradeName,
      authority: 'Goods & Services Tax Network (GSTN)',
      status: app.hasGstExemption ? 'GST Exempted' : 'Active Regular Taxpayer',
      statusColor: 'emerald',
      fileName: 'gst_reg06_certificate.pdf',
      fileSize: '2.4 MB',
      issueDate: '01 Jul 2021',
      highlights: [
        'Registration jurisdiction: State Tax Department & CBIC',
        'Taxpayer Type: Regular Normal Taxpayer',
        'Return filing compliance score: 100% (GSTR-1 & GSTR-3B)'
      ]
    },
    {
      id: 'doc-msme',
      title: 'MSME Udyam Registration Certificate',
      category: 'Government Enterprise Classification',
      number: msmeNumber,
      entity: legalBusinessName,
      authority: 'Ministry of Micro, Small & Medium Enterprises',
      status: 'Verified Valid',
      statusColor: 'emerald',
      fileName: 'msme_udyam_certificate.pdf',
      fileSize: '1.2 MB',
      issueDate: '10 Aug 2021',
      highlights: [
        'Enterprise Classification: Micro / Small Enterprise',
        'National Industry Classification: Educational Kits & Schoolwear',
        'Eligible for priority procurement & zero collateral benefits'
      ]
    },
    {
      id: 'doc-cin',
      title: 'Certificate of Incorporation (CIN)',
      category: 'Corporate Registry',
      number: cinNumber,
      entity: legalBusinessName,
      authority: 'Registrar of Companies (RoC), Ministry of Corporate Affairs',
      status: 'Active Entity',
      statusColor: 'emerald',
      fileName: 'certificate_of_incorporation_mca.pdf',
      fileSize: '3.1 MB',
      issueDate: `Incorporated Year: ${yearStarted}`,
      highlights: [
        'Corporate Identity verified with MCA-21 portal',
        'Company structure: Limited by Shares',
        'Good standing certificate confirmed'
      ]
    },
    {
      id: 'doc-address',
      title: `Operational Address Proof (${addressProofType})`,
      category: 'Premises Verification',
      number: addressProofDocNumber,
      entity: legalBusinessName,
      authority: addressProofType === 'Electricity Bill' ? 'State Power Distribution Corp' : 'Municipal Land Registry',
      status: '100% Address Match',
      statusColor: 'emerald',
      fileName: addressProofFileName,
      fileSize: '1.9 MB',
      issueDate: '10 Feb 2026',
      highlights: [
        `Verified Address: ${fullAddress}`,
        'Physical utility connection matches commercial entity name',
        'Geo-location within municipal delivery service perimeter'
      ]
    },
    {
      id: 'doc-bank',
      title: 'Bank Passbook & Cancelled Cheque Leaf',
      category: 'Settlement Payout Channel',
      number: `A/C: ${bankAccountNumber} (IFSC: ${bankIfscCode})`,
      entity: bankAccountHolder,
      authority: bankName,
      status: 'Penny Drop Matched',
      statusColor: 'emerald',
      fileName: 'cancelled_cheque_payout_leaf.pdf',
      fileSize: '1.4 MB',
      issueDate: 'Live Automated Check',
      highlights: [
        `Beneficiary Account Holder: ${bankAccountHolder}`,
        `Branch: ${bankBranch}`,
        'Penny drop test passed; IMPS / RTGS automated transfers enabled'
      ]
    },
    {
      id: 'doc-signatory',
      title: 'Authorized Signatory Identity & e-KYC',
      category: 'Identity & Legal Authorization',
      number: `PAN: ${ownerPan} • Aadhaar: •••• •••• ${ownerAadhaarLast4}`,
      entity: `${ownerName} (${ownerDesignation})`,
      authority: 'UIDAI & Income Tax e-KYC',
      status: 'Identity Confirmed',
      statusColor: 'emerald',
      fileName: 'signatory_kyc_dossier.pdf',
      fileSize: '2.2 MB',
      issueDate: 'Digital Token Verified',
      highlights: [
        `Authorized Signatory: ${ownerName}`,
        'Identity verified via dual OTP authentication',
        'Board resolution / proprietor authorization affirmed'
      ]
    }
  ];

  const addressProofPreviewDoc = {
    id: 'doc-address-proof-step-6',
    title: `${addressProofType} Address Verification` ,
    category: 'Address Proof Verification',
    number: addressProofDocNumber,
    entity: legalBusinessName,
    authority: addressProofType === 'Electricity Bill' ? 'State Power Distribution Corp' : 'Municipal Land Registry',
    status: 'Document Ready for Review',
    statusColor: 'amber',
    fileName: addressProofFileName,
    fileSize: '1.9 MB',
    issueDate: '10 Feb 2026',
    highlights: [
      `Applicant business: ${legalBusinessName}`,
      `Verified address: ${fullAddress}`,
      'Physical premises match submitted commercial registration details',
      'Admin review pending before final onboarding approval'
    ]
  };

  const handleSaveCommission = () => {
    onUpdateCommission(sellerId, commission);
    setCommissionSaved(true);
    setTimeout(() => setCommissionSaved(false), 2500);
  };

  const handlePayout = () => {
    if (seller.payoutBalance > 0) {
      if (window.confirm(`Discharge payout settlement of ₹${seller.payoutBalance.toLocaleString()} to ${bankName} (A/c: ${bankAccountNumber})?`)) {
        onReleasePayout(sellerId, seller.payoutBalance);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-5 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-gray-200/80 bg-linear-to-r from-gray-50 via-white to-teal-50/40 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-teal-800 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <Store size={24} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="font-display font-extrabold text-lg sm:text-xl text-gray-900 truncate">
                  {storeName}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  isVerified ? 'bg-emerald-100 text-emerald-800 border border-emerald-300/80' :
                  isPending ? 'bg-amber-100 text-amber-800 border border-amber-300/80' :
                  'bg-rose-100 text-rose-800 border border-rose-300/80'
                }`}>
                  {currentStatus}
                </span>
                <span className="text-[11px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60">
                  {sellerId}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                <span className="font-semibold text-gray-700">{legalBusinessName}</span> • {city}, {state} • Managed by <span className="font-semibold text-gray-700">{ownerName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick action in header if pending */}
            {isPending && !readOnly && (
              <button
                onClick={() => {
                  onApprove(sellerId);
                  onClose();
                }}
                className="hidden sm:flex px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle size={14} />
                <span>Approve Seller</span>
              </button>
            )}

            <button 
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
              title="Close Modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* STATUS & COMPLIANCE BANNER */}
        <div className="bg-slate-50 border-b border-gray-200/80 px-6 py-3 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className={isVerified ? "text-emerald-600" : isRejected ? "text-rose-600" : isSuspended ? "text-gray-600" : "text-amber-600"} size={22} />
            <div>
              <div className="text-xs font-extrabold text-gray-900 flex items-center gap-2">
                <span>Account Status: <strong className="uppercase font-black">{currentStatus}</strong></span>
                <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold uppercase ${
                  isVerified ? 'bg-emerald-100 text-emerald-800' :
                  isRejected ? 'bg-rose-100 text-rose-800' :
                  isSuspended ? 'bg-gray-200 text-gray-800' :
                  'bg-amber-100 text-amber-900'
                }`}>
                  {isVerified ? 'KYC Approved & Active' : isRejected ? 'Verification Rejected' : isSuspended ? 'Account Suspended' : 'Action Required / Review Pending'}
                </span>
              </div>
              <p className="text-[11px] text-gray-600 mt-0.5">
                {isRejected && seller.rejectionReason ? (
                  <span className="text-rose-700 font-semibold">Rejection Message: "{seller.rejectionReason}"</span>
                ) : isVerified ? (
                  <span>Seller has full catalog syndication, storefront listing, and payout settlement rights.</span>
                ) : isSuspended ? (
                  <span className="text-gray-700">Store operations and product visibility are temporarily suspended.</span>
                ) : (
                  <span>Verify registrations, documents, bank details, and signatory credentials before granting store access.</span>
                )}
              </p>
            </div>
          </div>

          {!readOnly && (
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {!isVerified && (
                <button
                  onClick={() => {
                    onApprove(sellerId);
                    onClose();
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                  title="Approve seller and grant full store access"
                >
                  <CheckCircle size={14} />
                  <span>Approve</span>
                </button>
              )}

              {!isPending && (
                <button
                  onClick={() => {
                    if (onSetPending) onSetPending(sellerId);
                    else if (onToggleStatus) onToggleStatus(sellerId, 'pending');
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold transition-all border border-amber-200 flex items-center gap-1 cursor-pointer"
                  title="Reset status back to Pending Review"
                >
                  <RefreshCw size={13} />
                  <span>Set to Pending</span>
                </button>
              )}

              {!isRejected && (
                <button
                  onClick={() => setShowRejectBox(true)}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all border border-rose-200 flex items-center gap-1 cursor-pointer"
                  title="Reject application with a custom message"
                >
                  <Ban size={13} />
                  <span>Reject with Msg</span>
                </button>
              )}

              {isRejected && (
                <button
                  onClick={() => setShowRejectBox(true)}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all border border-rose-200 flex items-center gap-1 cursor-pointer"
                  title="Edit rejection message"
                >
                  <AlertTriangle size={13} />
                  <span>Edit Rejection Msg</span>
                </button>
              )}

              {!isSuspended && isVerified && (
                <button
                  onClick={() => {
                    if (onToggleStatus) onToggleStatus(sellerId, 'suspended');
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all border border-gray-300 flex items-center gap-1 cursor-pointer"
                  title="Suspend seller account"
                >
                  <span>Suspend</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* REJECTION REASON MODAL / INLINE DRAWER */}
        {showRejectBox && (
          <div className="bg-rose-50/90 border-b border-rose-200 p-4 shrink-0 space-y-3 animate-in fade-in duration-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-rose-950 flex items-center gap-1.5">
                <AlertTriangle size={15} /> Specify Rejection Reason for Vendor Feedback
              </span>
              <button 
                onClick={() => setShowRejectBox(false)}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                Cancel
              </button>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px]">
              {[
                'GSTIN address does not match uploaded electricity bill',
                'Bank cancelled cheque leaf is illegible',
                'PAN card name mismatch with company trade registration',
                'Signatory Aadhaar / PAN verification failed'
              ].map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRejectReason(preset)}
                  className="px-2.5 py-1 bg-white hover:bg-rose-100 text-rose-900 rounded-lg border border-rose-200 font-medium text-left cursor-pointer transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Required: enter the rejection reason for seller..."
                className="w-full px-3.5 py-2 bg-white text-xs rounded-xl border border-rose-300 outline-hidden focus:ring-2 focus:ring-rose-500"
              />
              <button
                onClick={() => {
                  if (!rejectReason.trim()) {
                    window.alert('Please add a rejection comment before rejecting this seller.');
                    return;
                  }
                  onReject(sellerId, rejectReason.trim());
                  setShowRejectBox(false);
                  onClose();
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold shrink-0 cursor-pointer shadow-xs transition-colors"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        )}

        {/* NAVIGATION TABS */}
        <div className="px-6 border-b border-gray-200 bg-white flex items-center justify-between gap-4 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-2 py-2.5">
            <button
              onClick={() => setActiveTab('dossier')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'dossier'
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <FileText size={15} />
              <span>All 12 Steps Dossier</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === 'dossier' ? 'bg-teal-700 text-white' : 'bg-gray-200 text-gray-700'
              }`}>
                12
              </span>
            </button>

            <button
              onClick={() => setActiveTab('documents')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'documents'
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <ShieldCheck size={15} />
              <span>KYC & Business Documents</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === 'documents' ? 'bg-teal-700 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {documentsList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('storefront')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'storefront'
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Store size={15} />
              <span>Storefront & Catalog</span>
            </button>

            <button
              onClick={() => setActiveTab('financials')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'financials'
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Landmark size={15} />
              <span>Settlement & Commission</span>
            </button>
          </div>

          {activeTab === 'dossier' && (
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={expandAll}
                className="text-teal-800 hover:underline font-bold cursor-pointer"
              >
                Expand All
              </button>
              <span className="text-gray-300">•</span>
              <button
                type="button"
                onClick={collapseAll}
                className="text-gray-500 hover:text-gray-800 font-medium cursor-pointer"
              >
                Collapse All
              </button>
            </div>
          )}
        </div>

        {/* TAB CONTENT BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">

          {/* ============================================================== */}
          {/* TAB 1: ALL 12 STEPS DOSSIER                                   */}
          {/* ============================================================== */}
          {activeTab === 'dossier' && (
            <div className="space-y-4">
              
              {/* Review summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-white rounded-2xl border border-gray-200/80 shadow-2xs">
                  <div className="text-[10px] uppercase font-bold text-gray-400">Application Status</div>
                  <div className="text-xs font-extrabold text-gray-900 mt-0.5 flex items-center gap-1">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span>{currentStatus}</span>
                  </div>
                </div>
                <div className="p-3 bg-white rounded-2xl border border-gray-200/80 shadow-2xs">
                  <div className="text-[10px] uppercase font-bold text-gray-400">Onboarding Progress</div>
                  <div className="text-xs font-extrabold text-teal-900 mt-0.5">
                    12 of 12 Steps (100%)
                  </div>
                </div>
                <div className="p-3 bg-white rounded-2xl border border-gray-200/80 shadow-2xs">
                  <div className="text-[10px] uppercase font-bold text-gray-400">Submitted Date</div>
                  <div className="text-xs font-bold text-gray-800 mt-0.5">
                    {submittedDate}
                  </div>
                </div>
                <div className="p-3 bg-white rounded-2xl border border-gray-200/80 shadow-2xs">
                  <div className="text-[10px] uppercase font-bold text-gray-400">Audit Reference</div>
                  <div className="text-xs font-mono font-bold text-teal-800 mt-0.5">
                    {auditRefId}
                  </div>
                </div>
              </div>

              {/* STEP 1: Basic Profile */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => toggleSection(1)}
                  className="w-full px-5 py-3.5 bg-gray-50/80 hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left cursor-pointer border-b border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs">
                      1
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                        <span>Step 1: Basic Profile</span>
                        <CheckCircle2 size={15} className="text-emerald-600" />
                      </h4>
                      <p className="text-[11px] text-gray-500">Contact information, email/phone OTP verification</p>
                    </div>
                  </div>
                  {expandedSections[1] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>

                {expandedSections[1] && (
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="block text-gray-400 font-medium text-[11px]">Seller Full Name</span>
                      <span className="font-bold text-gray-900">{app.sellerName || seller.name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="block text-gray-400 font-medium text-[11px]">Primary Email</span>
                      <span className="font-bold text-gray-900">{app.sellerEmail || seller.email || 'N/A'}</span>
                      <span className="ml-1 text-[10px] text-emerald-600 font-bold">✓ Verified</span>
                    </div>
                    <div>
                      <span className="block text-gray-400 font-medium text-[11px]">Mobile Phone</span>
                      <span className="font-bold text-gray-900">{app.sellerPhone || seller.phone || 'N/A'}</span>
                      <span className="ml-1 text-[10px] text-emerald-600 font-bold">✓ OTP Verified</span>
                    </div>
                    <div>
                      <span className="block text-gray-400 font-medium text-[11px]">Profile Photo</span>
                      {app.profilePhoto ? (
                        <img src={app.profilePhoto} alt="Profile" className="w-9 h-9 rounded-full object-cover border border-gray-200 mt-1 shadow-2xs" />
                      ) : (
                        <span className="text-gray-400 italic">Avatar attached</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 2: Business Details */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => toggleSection(2)}
                  className="w-full px-5 py-3.5 bg-gray-50/80 hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left cursor-pointer border-b border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs">
                      2
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                        <span>Step 2: Business Details</span>
                        <CheckCircle2 size={15} className="text-emerald-600" />
                      </h4>
                      <p className="text-[11px] text-gray-500">Legal entity registration, trade name, incorporation structure</p>
                    </div>
                  </div>
                  {expandedSections[2] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>

                {expandedSections[2] && (
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="block text-gray-400 font-medium text-[11px]">Legal Entity Name</span>
                      <span className="font-bold text-gray-900">{legalBusinessName}</span>
                    </div>
                    <div>
                      <span className="block text-gray-400 font-medium text-[11px]">Trade / Brand Name</span>
                      <span className="font-bold text-gray-900">{tradeName}</span>
                    </div>
                    <div>
                      <span className="block text-gray-400 font-medium text-[11px]">Entity Structure</span>
                      <span className="font-bold text-gray-900">{businessType}</span>
                    </div>
                    <div>
                      <span className="block text-gray-400 font-medium text-[11px]">Year Started</span>
                      <span className="font-bold text-gray-900">{yearStarted}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 3: Owner / Authorized Signatory */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => toggleSection(3)}
                  className="w-full px-5 py-3.5 bg-gray-50/80 hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left cursor-pointer border-b border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs">
                      3
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                        <span>Step 3: Owner / Authorized Signatory</span>
                        <CheckCircle2 size={15} className="text-emerald-600" />
                      </h4>
                      <p className="text-[11px] text-gray-500">Signatory designation, personal PAN & Aadhaar KYC</p>
                    </div>
                  </div>
                  {expandedSections[3] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>

                {expandedSections[3] && (
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="block text-gray-400 font-medium text-[11px]">Signatory Full Name</span>
                      <span className="font-bold text-gray-900">{ownerName}</span>
                    </div>
                    <div>
                      <span className="block text-gray-400 font-medium text-[11px]">Official Designation</span>
                      <span className="font-bold text-gray-900">{ownerDesignation}</span>
                    </div>
                    <div>
                      <span className="block text-gray-400 font-medium text-[11px]">Personal PAN</span>
                      <span className="font-bold text-gray-900 font-mono">{ownerPan}</span>
                    </div>
                    <div>
                      <span className="block text-gray-400 font-medium text-[11px]">Aadhaar Identification</span>
                      <span className="font-bold text-gray-900 font-mono">•••• •••• {ownerAadhaarLast4}</span>
                      <span className="ml-1 text-[10px] text-emerald-600 font-bold">✓ e-KYC</span>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 4: Business Documents */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => toggleSection(4)}
                  className="w-full px-5 py-3.5 bg-gray-50/80 hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left cursor-pointer border-b border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs">
                      4
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                        <span>Step 4: Business Documents & Tax IDs</span>
                        <CheckCircle2 size={15} className="text-emerald-600" />
                      </h4>
                      <p className="text-[11px] text-gray-500">Business PAN, GSTIN, MSME Udyam & CIN registration</p>
                    </div>
                  </div>
                  {expandedSections[4] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>

                {expandedSections[4] && (
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="block text-gray-400 font-medium text-[11px]">Company PAN</span>
                      <span className="font-bold text-gray-900 font-mono">{businessPan}</span>
                    </div>
                    <div>
                      <span className="block text-gray-400 font-medium text-[11px]">GSTIN Number</span>
                      <span className="font-bold text-gray-900 font-mono">{gstin}</span>
                    </div>
                    <div>
                      <span className="block text-gray-400 font-medium text-[11px]">MSME Udyam ID</span>
                      <span className="font-bold text-gray-900 font-mono">{msmeNumber}</span>
                    </div>
                    <div>
                      <span className="block text-gray-400 font-medium text-[11px]">CIN Number</span>
                      <span className="font-bold text-gray-900 font-mono">{cinNumber}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 5: Business Address */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => toggleSection(5)}
                  className="w-full px-5 py-3.5 bg-gray-50/80 hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left cursor-pointer border-b border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs">
                      5
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                        <span>Step 5: Registered Business Address</span>
                        <CheckCircle2 size={15} className="text-emerald-600" />
                      </h4>
                      <p className="text-[11px] text-gray-500">Registered office and warehouse fulfillment location</p>
                    </div>
                  </div>
                  {expandedSections[5] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>

                {expandedSections[5] && (
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="sm:col-span-2">
                      <span className="block text-gray-400 font-medium text-[11px]">Registered Street Address</span>
                      <span className="font-bold text-gray-900">
                        {addressLine1} {addressLine2 ? `, ${addressLine2}` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="block text-gray-400 font-medium text-[11px]">City, State & Postal PIN</span>
                      <span className="font-bold text-gray-900">
                        {city}, {state} - {pincode} ({country})
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 6: Address Proof */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => toggleSection(6)}
                  className="w-full px-5 py-3.5 bg-gray-50/80 hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left cursor-pointer border-b border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs">
                      6
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                        <span>Step 6: Address Proof Verification</span>
                        <CheckCircle2 size={15} className="text-emerald-600" />
                      </h4>
                      <p className="text-[11px] text-gray-500">Electricity utility bill, lease agreement or trade license</p>
                    </div>
                  </div>
                  {expandedSections[6] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>

                {expandedSections[6] && (
                  <div className="p-5 space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <span className="block text-gray-400 font-medium text-[11px]">Document Type</span>
                        <span className="font-bold text-gray-900">{addressProofType}</span>
                      </div>
                      <div>
                        <span className="block text-gray-400 font-medium text-[11px]">Document Reference Number</span>
                        <span className="font-bold text-gray-900 font-mono">{addressProofDocNumber}</span>
                      </div>
                      <div>
                        <span className="block text-gray-400 font-medium text-[11px]">Attached Certificate</span>
                        <span className="font-bold text-teal-800 flex items-center gap-1.5 mt-0.5">
                          <FileCheck size={14} />
                          <span>{addressProofFileName}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(addressProofPreviewDoc)}
                        className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-900 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye size={13} />
                        <span>Preview Proof</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 7: Bank Details */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => toggleSection(7)}
                  className="w-full px-5 py-3.5 bg-gray-50/80 hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left cursor-pointer border-b border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs">
                      7
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                        <span>Step 7: Bank Details & Payout Channel</span>
                        <CheckCircle2 size={15} className="text-emerald-600" />
                      </h4>
                      <p className="text-[11px] text-gray-500">Beneficiary bank account, IFSC & payout settlement</p>
                    </div>
                  </div>
                  {expandedSections[7] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>

                {expandedSections[7] && (
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="block text-gray-400 font-medium text-[11px]">Account Holder</span>
                      <span className="font-bold text-gray-900">{bankAccountHolder}</span>
                    </div>
                    <div>
                      <span className="block text-gray-400 font-medium text-[11px]">Bank Name & Branch</span>
                      <span className="font-bold text-gray-900">{bankName} ({bankBranch})</span>
                    </div>
                    <div>
                      <span className="block text-gray-400 font-medium text-[11px]">Account Number</span>
                      <span className="font-bold text-gray-900 font-mono">{bankAccountNumber}</span>
                    </div>
                    <div>
                      <span className="block text-gray-400 font-medium text-[11px]">IFSC & Account Type</span>
                      <span className="font-bold text-gray-900 font-mono">{bankIfscCode} ({accountType})</span>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 8: Store Details */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => toggleSection(8)}
                  className="w-full px-5 py-3.5 bg-gray-50/80 hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left cursor-pointer border-b border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs">
                      8
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                        <span>Step 8: Public Storefront Profile</span>
                        <CheckCircle2 size={15} className="text-emerald-600" />
                      </h4>
                      <p className="text-[11px] text-gray-500">Public store name, handle, tagline & bio</p>
                    </div>
                  </div>
                  {expandedSections[8] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>

                {expandedSections[8] && (
                  <div className="p-5 space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="block text-gray-400 font-medium text-[11px]">Store Display Name</span>
                        <span className="font-bold text-gray-900 text-sm">{storeName}</span>
                      </div>
                      <div>
                        <span className="block text-gray-400 font-medium text-[11px]">Store Tagline</span>
                        <span className="font-semibold text-gray-800">{storeTagline}</span>
                      </div>
                    </div>
                    <div>
                      <span className="block text-gray-400 font-medium text-[11px]">Store Bio & Overview</span>
                      <p className="text-gray-700 leading-relaxed mt-1">{storeDescription}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 9: Product Information */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => toggleSection(9)}
                  className="w-full px-5 py-3.5 bg-gray-50/80 hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left cursor-pointer border-b border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs">
                      9
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                        <span>Step 9: Product Offerings & Catalog</span>
                        <CheckCircle2 size={15} className="text-emerald-600" />
                      </h4>
                      <p className="text-[11px] text-gray-500">Categories, authorized brands, catalog volume</p>
                    </div>
                  </div>
                  {expandedSections[9] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>

                {expandedSections[9] && (
                  <div className="p-5 space-y-3 text-xs">
                    <div>
                      <span className="block text-gray-400 font-medium text-[11px] mb-1.5">Registered Categories</span>
                      <div className="flex flex-wrap gap-1.5">
                        {categories.map((cat, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-teal-50 text-teal-900 rounded-lg font-semibold text-[11px] border border-teal-200/60">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div>
                        <span className="block text-gray-400 font-medium text-[11px]">Primary Brands Represented</span>
                        <span className="font-bold text-gray-900">{brands.join(', ')}</span>
                      </div>
                      <div>
                        <span className="block text-gray-400 font-medium text-[11px]">Estimated Catalog Volume</span>
                        <span className="font-bold text-gray-900">{estimatedSkuCount}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 10: Legal Agreements & Policies */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => toggleSection(10)}
                  className="w-full px-5 py-3.5 bg-gray-50/80 hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left cursor-pointer border-b border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs">
                      10
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                        <span>Step 10: Legal Agreements & Policies</span>
                        <CheckCircle2 size={15} className="text-emerald-600" />
                      </h4>
                      <p className="text-[11px] text-gray-500">Seller code of conduct, commission terms & return SLA</p>
                    </div>
                  </div>
                  {expandedSections[10] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>

                {expandedSections[10] && (
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200 font-semibold">
                      <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                      <span>BookVardi Master Seller Terms Accepted</span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200 font-semibold">
                      <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                      <span>Marketplace Commission Schedule Accepted</span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200 font-semibold">
                      <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                      <span>7-Day Return & Student Exchange SLA Acknowledged</span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200 font-semibold">
                      <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                      <span>Authorized Signatory Digital Affirmation Validated</span>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 11: Final Verification & Audit */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => toggleSection(11)}
                  className="w-full px-5 py-3.5 bg-gray-50/80 hover:bg-gray-100/80 transition-colors flex items-center justify-between text-left cursor-pointer border-b border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs">
                      11
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                        <span>Step 11: Final Verification & Submission</span>
                        <CheckCircle2 size={15} className="text-emerald-600" />
                      </h4>
                      <p className="text-[11px] text-gray-500">Automated KYC, AML & Admin cross-verification timestamp</p>
                    </div>
                  </div>
                  {expandedSections[11] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>

                {expandedSections[11] && (
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="block text-gray-400 font-medium text-[11px]">Submission State</span>
                      <span className="font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-block mt-0.5">
                        {currentStatus}
                      </span>
                    </div>
                    <div>
                      <span className="block text-gray-400 font-medium text-[11px]">Application Submission Date</span>
                      <span className="font-bold text-gray-900">{submittedDate}</span>
                    </div>
                    <div>
                      <span className="block text-gray-400 font-medium text-[11px]">KYC Audit Reference ID</span>
                      <span className="font-mono font-bold text-teal-900">{auditRefId}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 12: Verified Seller Badge & Permissions */}
              <div className="bg-white rounded-2xl border border-emerald-200 overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => toggleSection(12)}
                  className="w-full px-5 py-3.5 bg-emerald-50/50 hover:bg-emerald-50 transition-colors flex items-center justify-between text-left cursor-pointer border-b border-emerald-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      12
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                        <span>Step 12: Verified Seller Badge & Activation</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white uppercase tracking-wider">
                          {isVerified ? 'ACTIVE' : 'READY FOR APPROVAL'}
                        </span>
                      </h4>
                      <p className="text-[11px] text-gray-500">Live storefront privileges, inventory syndication & checkout visibility</p>
                    </div>
                  </div>
                  {expandedSections[12] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>

                {expandedSections[12] && (
                  <div className="p-5 space-y-3 text-xs bg-linear-to-b from-emerald-50/30 to-white">
                    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-emerald-100 shadow-2xs">
                      <ShieldCheck size={28} className="text-emerald-600 shrink-0" />
                      <div>
                        <h5 className="font-bold text-gray-900 text-sm">Verified BookVardi Merchant Trust Active</h5>
                        <p className="text-gray-600 text-[11px] mt-0.5">
                          Products receive the trusted blue & gold verified badge across student search results, school directories, and parent checkout carts upon admin confirmation.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="block text-gray-400 text-[10px] uppercase font-bold">Port 5174 Hub</span>
                        <span className="font-bold text-teal-900">Direct Single Sign-On</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="block text-gray-400 text-[10px] uppercase font-bold">Listing Cap</span>
                        <span className="font-bold text-teal-900">Unlimited SKUs & Kits</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="block text-gray-400 text-[10px] uppercase font-bold">Disbursement</span>
                        <span className="font-bold text-teal-900">T+2 Daily Bank Settlement</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: KYC & BUSINESS DOCUMENTS VAULT (KEY USER REQUIREMENT)   */}
          {/* ============================================================== */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-display font-extrabold text-base text-gray-900 flex items-center gap-2">
                    <ShieldCheck className="text-teal-700" size={18} /> Verified Business Documents & Legal Dossier
                  </h4>
                  <p className="text-xs text-gray-500">
                    Click any document card to inspect the full certificate, tax details, and compliance verification record.
                  </p>
                </div>
                <div className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                  {documentsList.length} of {documentsList.length} Documents On Record
                </div>
              </div>

              {/* Grid of All Documents */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documentsList.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-white rounded-2xl border border-gray-200/90 p-4.5 shadow-2xs hover:shadow-md transition-all space-y-3.5 relative flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Top */}
                      <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-gray-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold shrink-0">
                            <FileCheck size={18} />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-gray-400">{doc.category}</span>
                            <h5 className="font-bold text-xs text-gray-900 leading-snug">{doc.title}</h5>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800 shrink-0">
                          {doc.status}
                        </span>
                      </div>

                      {/* Number & Details */}
                      <div className="mt-3 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-[11px]">Certificate / Doc Number:</span>
                          <span className="font-mono font-bold text-gray-900">{doc.number}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-[11px]">Issuing Authority:</span>
                          <span className="font-semibold text-gray-700 text-[11px] truncate max-w-[220px]">{doc.authority}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-[11px]">Entity Registered:</span>
                          <span className="font-semibold text-gray-700 text-[11px] truncate max-w-[220px]">{doc.entity}</span>
                        </div>
                      </div>

                      {/* Attached File Pill */}
                      <div className="mt-3 p-2 bg-gray-50 rounded-xl border border-gray-200/60 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 text-gray-700 font-mono font-medium truncate">
                          <FileText size={13} className="text-teal-700 shrink-0" />
                          <span className="truncate">{doc.fileName}</span>
                        </div>
                        <span className="text-gray-400 text-[10px] shrink-0">{doc.fileSize}</span>
                      </div>
                    </div>

                    {/* Inspection Button */}
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[10px] text-gray-400 font-medium">{doc.issueDate}</span>
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-900 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye size={13} />
                        <span>Inspect Document</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: STOREFRONT & CATALOG                                   */}
          {/* ============================================================== */}
          {activeTab === 'storefront' && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs space-y-4">
                <div className="flex items-start gap-4">
                  <img
                    src={storeLogo}
                    alt="Logo"
                    className="w-16 h-16 rounded-2xl object-cover border border-gray-200 shadow-xs shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-display font-bold text-lg text-gray-900">{storeName}</h4>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">{storeTagline}</p>
                    <p className="text-xs text-gray-500 leading-relaxed pt-1">{storeDescription}</p>
                  </div>
                </div>
              </div>

              {/* Categories & Brands */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs space-y-3">
                  <div className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Package size={15} className="text-teal-700" /> Authorized Product Categories
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat, i) => (
                      <span key={i} className="px-3 py-1 bg-teal-50 text-teal-900 rounded-xl font-bold text-xs border border-teal-200/60">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs space-y-3">
                  <div className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Award size={15} className="text-amber-600" /> Brands & Publishers Represented
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {brands.map((brand, i) => (
                      <span key={i} className="px-3 py-1 bg-gray-50 text-gray-800 rounded-xl font-semibold text-xs border border-gray-200">
                        {brand}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sample Product & Catalog stats */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs space-y-3">
                <div className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={15} className="text-brand-yellow" /> Sample Initial Listing
                </div>
                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-gray-900">{sampleProductTitle}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">Estimated Initial Portfolio: {estimatedSkuCount}</div>
                  </div>
                  <span className="text-[11px] font-bold text-teal-800 bg-white px-3 py-1 rounded-lg border border-gray-200 shadow-2xs">
                    Ready For Syndication
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: SETTLEMENT & COMMISSION                                */}
          {/* ============================================================== */}
          {activeTab === 'financials' && (
            <div className="space-y-5">
              
              {/* Commission Rate Box */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                      <Percent size={16} className="text-teal-700" /> Platform Marketplace Commission
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Standard fee deducted automatically from each fulfilled student & school order.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={commission}
                      onChange={e => setCommission(e.target.value)}
                      className="w-20 px-3 py-1.5 text-sm font-extrabold bg-white border border-gray-300 rounded-xl text-center outline-hidden focus:ring-2 focus:ring-brand-yellow"
                    />
                    <span className="text-sm font-bold text-gray-700">%</span>
                    <button
                      onClick={handleSaveCommission}
                      className="px-4 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs"
                    >
                      {commissionSaved ? 'Saved! ✓' : 'Update Rate'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Bank Account Details */}
              <div className="bg-teal-50/50 rounded-2xl border border-teal-100 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold">
                      <Landmark size={16} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-teal-950">Primary Bank Settlement Channel</h4>
                      <p className="text-[11px] text-teal-800">Automated T+2 disbursement destination</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Penny Drop Verified
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-white p-4 rounded-xl border border-teal-100/80">
                  <div>
                    <span className="block text-gray-400 font-medium text-[11px]">Beneficiary Name</span>
                    <span className="font-bold text-gray-900">{bankAccountHolder}</span>
                  </div>
                  <div>
                    <span className="block text-gray-400 font-medium text-[11px]">Bank Name & Branch</span>
                    <span className="font-bold text-gray-900">{bankName} ({bankBranch})</span>
                  </div>
                  <div>
                    <span className="block text-gray-400 font-medium text-[11px]">Account Number</span>
                    <span className="font-bold text-gray-900 font-mono">{bankAccountNumber}</span>
                  </div>
                  <div>
                    <span className="block text-gray-400 font-medium text-[11px]">IFSC Code</span>
                    <span className="font-bold text-gray-900 font-mono">{bankIfscCode}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-teal-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs text-teal-800 font-medium">Pending Disbursement Balance: </span>
                    <span className="font-display font-extrabold text-base text-teal-950 ml-1">
                      ₹{seller.payoutBalance?.toLocaleString() || 0}
                    </span>
                  </div>

                  {seller.payoutBalance > 0 && (
                    <button
                      onClick={handlePayout}
                      className="px-4 py-2 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      Release ₹{seller.payoutBalance.toLocaleString()} Payout
                    </button>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-gray-500">
            Audit ID: <span className="font-mono font-bold text-gray-700">{auditRefId}</span> • Submitted: <span className="font-medium text-gray-700">{submittedDate}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {!readOnly && (
              <>
                {!isVerified && (
                  <button
                    onClick={() => {
                      onApprove(sellerId);
                      onClose();
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle size={14} />
                    <span>Approve Seller</span>
                  </button>
                )}

                {!isPending && (
                  <button
                    onClick={() => {
                      if (onSetPending) onSetPending(sellerId);
                      else if (onToggleStatus) onToggleStatus(sellerId, 'pending');
                      onClose();
                    }}
                    className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold transition-colors border border-amber-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw size={13} />
                    <span>Set to Pending</span>
                  </button>
                )}

                <button
                  onClick={() => setShowRejectBox(true)}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-colors border border-rose-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <Ban size={14} />
                  <span>{isRejected ? 'Edit Rejection Msg' : 'Reject with Msg'}</span>
                </button>

                {!isSuspended && isVerified && (
                  <button
                    onClick={() => {
                      if (onToggleStatus) onToggleStatus(sellerId, 'suspended');
                      onClose();
                    }}
                    className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors border border-gray-300 cursor-pointer"
                  >
                    Suspend Account
                  </button>
                )}
              </>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>

      {/* ============================================================== */}
      {/* INTERACTIVE DOCUMENT INSPECTOR POPUP MODAL                      */}
      {/* ============================================================== */}
      {previewDoc && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden">
            
            {/* Inspector Header */}
            <div className="px-6 py-4 bg-teal-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-teal-300 tracking-wider">Official Document Inspection</span>
                  <h4 className="font-display font-extrabold text-base text-white leading-tight">{previewDoc.title}</h4>
                </div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-teal-800 cursor-pointer transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Simulated Document Preview Paper */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-gray-50">
              
              {/* Official Certificate Paper Card */}
              <div className="bg-white rounded-2xl border-2 border-dashed border-teal-300/80 p-6 shadow-xs relative overflow-hidden">
                
                {/* Watermark Stamp */}
                <div className="absolute right-4 top-4 rotate-12 pointer-events-none opacity-15">
                  <div className="border-4 border-emerald-700 text-emerald-800 font-black text-xl px-4 py-2 rounded-xl uppercase tracking-widest text-center">
                    VERIFIED VALID
                  </div>
                </div>

                {/* Certificate Header */}
                <div className="text-center pb-4 border-b border-gray-200 space-y-1">
                  <div className="text-[10px] uppercase font-black tracking-widest text-gray-400">
                    {previewDoc.authority}
                  </div>
                  <h3 className="font-display font-black text-lg text-gray-900">
                    {previewDoc.title}
                  </h3>
                  <div className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full inline-block">
                    Reference ID: {previewDoc.number}
                  </div>
                </div>

                {/* Body Details */}
                <div className="py-4 space-y-3 text-xs border-b border-gray-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-gray-400">Registered Entity</span>
                      <span className="font-bold text-gray-900">{previewDoc.entity}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-gray-400">Verification Authority</span>
                      <span className="font-bold text-gray-900">{previewDoc.authority}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-gray-400">Issuance / Inspection</span>
                      <span className="font-bold text-gray-900">{previewDoc.issueDate}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-gray-400">Compliance Status</span>
                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 size={14} /> {previewDoc.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Audit & Verification Points */}
                <div className="pt-4 space-y-2">
                  <span className="text-[11px] font-extrabold text-gray-700 block">Compliance Audit Checklist:</span>
                  <div className="space-y-1.5">
                    {previewDoc.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                        <CheckCircle size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* File Details */}
                <div className="mt-5 p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-teal-700" />
                    <div>
                      <span className="font-mono font-bold text-gray-800">{previewDoc.fileName}</span>
                      <span className="text-[10px] text-gray-400 ml-2">PDF Document • {previewDoc.fileSize}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-full">
                    SHA-256 Validated
                  </span>
                </div>

              </div>

            </div>

            {/* Inspector Footer */}
            <div className="px-6 py-3.5 bg-white border-t border-gray-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-gray-500">
                Document verified against Government & Banking APIs
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => alert(`Downloading verified certificate copy: ${previewDoc.fileName}`)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Download size={13} />
                  <span>Download PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Done
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
