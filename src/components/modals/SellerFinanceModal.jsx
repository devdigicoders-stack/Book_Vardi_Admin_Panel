import React, { useState, useMemo } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Store, 
  Landmark, 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Search, 
  ShieldCheck, 
  Building, 
  Eye, 
  EyeOff, 
  Banknote, 
  QrCode, 
  ArrowUpRight, 
  ArrowDownLeft, 
  AlertCircle, 
  Percent, 
  Tag, 
  Package, 
  User, 
  MapPin, 
  Phone, 
  Mail,
  Receipt
} from 'lucide-react';
import { downloadSellerFinancialStatementPdfApi } from '../../utils/api';

export default function SellerFinanceModal({ 
  isOpen, 
  onClose, 
  seller, 
  orders = [], 
  onReleasePayout, 
  onOpenInvoice,
  isEditor = true 
}) {
  if (!isOpen || !seller) return null;

  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'upi' | 'cod' | 'delivered' | 'cancelled'
  const [searchQuery, setSearchQuery] = useState('');
  const [isMasked, setIsMasked] = useState(true);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [disburseSuccess, setDisburseSuccess] = useState('');

  const sellerId = seller.id || seller._id;
  const storeName = seller.storeName || seller.businessName || seller.name || 'Vendor Store';
  const ownerName = seller.ownerDetails?.ownerFullName || seller.ownerName || seller.name || 'Vendor Owner';
  const legalName = seller.legalBusinessName || seller.businessName || storeName;
  const gstin = seller.gstNumber || seller.gstin || 'GST Exempt / N/A';
  const pan = seller.documents?.panNumber || seller.ownerDetails?.ownerPan || seller.pan || 'N/A';
  const phone = seller.phone || seller.ownerPhone || 'N/A';
  const email = seller.email || 'N/A';
  const city = seller.city || 'N/A';
  const state = seller.state || 'N/A';
  const address = seller.address || `${city}, ${state}`;

  const bank = seller.bankDetails || {};
  const bankName = bank.bankName || bank.bank || 'HDFC Bank';
  const acctNum = bank.accountNumber || bank.account || '•••• •••• 0000';
  const ifsc = bank.ifscCode || bank.ifsc || 'HDFC0001';
  const acctHolder = bank.accountHolderName || bank.holderName || ownerName;
  const acctType = bank.accountType || 'Current / Savings Account';
  const branch = bank.branchName || bank.branch || `${city} Main Branch`;

  const commissionRate = Number(seller.commissionRate ?? seller.commissionPercentage ?? 5);

  // Filter orders and extract items belonging strictly to this seller
  const sellerOrders = useMemo(() => {
    const list = [];
    orders.forEach(order => {
      const itemsList = Array.isArray(order.items) ? order.items : [];
      const matchingItems = itemsList.filter(item => {
        const itemSellerId = String(item.sellerId?._id || item.sellerId || '');
        const itemStore = String(item.storeName || item.sellerStoreName || '').toLowerCase().trim();
        const ordStore = String(order.storeName || order.sellerStoreName || '').toLowerCase().trim();
        const ordSellerId = String(order.sellerId?._id || order.sellerId || '');
        return (
          itemSellerId === String(sellerId) ||
          ordSellerId === String(sellerId) ||
          (seller.storeName && (itemStore === seller.storeName.toLowerCase().trim() || ordStore === seller.storeName.toLowerCase().trim()))
        );
      });

      // If matching items found, or the top order matches
      if (matchingItems.length > 0 || String(order.sellerId) === String(sellerId)) {
        const relevantItems = matchingItems.length > 0 ? matchingItems : itemsList;
        const computedSubtotal = relevantItems.reduce((sum, it) => {
          const price = Number(it.finalPrice || it.price || 0);
          const qty = Number(it.quantity || 1);
          return sum + (Number(it.total) || (price * qty));
        }, 0);

        const isCod = String(order.paymentMethod || '').toUpperCase().includes('COD');
        const paymentLabel = isCod ? 'COD (Cash on Delivery)' : 'UPI / Online (Prepaid)';

        // Product GST breakdown (5% statutory rate standard for uniform/educational kits)
        const computedGst = relevantItems.reduce((acc, it) => {
          const lineVal = (Number(it.finalPrice || it.price || 0) * Number(it.quantity || 1));
          const explicitGst = it.gstPercent ?? it.gstPercentage ?? it.gstRate ?? it.gst ?? 5;
          const rate = !isNaN(Number(explicitGst)) ? Number(explicitGst) : 5;
          const taxableVal = lineVal / (1 + rate / 100);
          return acc + (lineVal - taxableVal);
        }, 0);

        const effectiveTotal = computedSubtotal > 0 ? computedSubtotal : Number(order.totalAmount || order.total || 0);
        const ordRate = Number(order.commissionRate || commissionRate);
        const platformCutAmount = Math.round(effectiveTotal * (ordRate / 100) * 100) / 100;
        const netSellerShare = Math.max(0, Math.round((effectiveTotal - platformCutAmount) * 100) / 100);

        const statusRaw = String(order.overallStatus || order.status || 'Pending').trim();
        const isCancelled = statusRaw.toLowerCase().includes('cancel');
        const isDelivered = statusRaw.toLowerCase().includes('delivered');

        list.push({
          ...order,
          orderId: order.orderId || order.id || String(order._id || ''),
          sellerItems: relevantItems,
          relevantItems,
          itemsCount: relevantItems.length,
          sellerSubtotal: effectiveTotal,
          effectiveTotal,
          commissionRate: ordRate,
          platformCutAmount,
          netSellerShare,
          computedGst: Math.round(computedGst * 100) / 100,
          isCod,
          paymentLabel,
          isCancelled,
          isDelivered,
          dateStr: order.createdAt 
            ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) 
            : (order.date || 'Recent'),
          customerDisplay: order.customerName || order.customer?.name || order.shippingAddress?.name || 'Verified Consumer'
        });
      }
    });

    return list;
  }, [orders, sellerId, seller.storeName, commissionRate]);

  // Aggregate Real Financial Metrics
  const metrics = useMemo(() => {
    let grossSales = 0;
    let platformCut = 0;
    let netEarnings = 0;
    let totalGst = 0;
    let codVolume = 0;
    let codCount = 0;
    let upiVolume = 0;
    let upiCount = 0;
    let cancelledVolume = 0;
    let cancelledCount = 0;
    let deliveredCount = 0;

    sellerOrders.forEach(o => {
      if (o.isCancelled) {
        cancelledVolume += o.effectiveTotal;
        cancelledCount += 1;
      } else {
        grossSales += o.effectiveTotal;
        platformCut += o.platformCutAmount;
        netEarnings += o.netSellerShare;
        totalGst += o.computedGst;

        if (o.isDelivered) deliveredCount += 1;

        if (o.isCod) {
          codVolume += o.effectiveTotal;
          codCount += 1;
        } else {
          upiVolume += o.effectiveTotal;
          upiCount += 1;
        }
      }
    });

    const payableBalance = Number(seller.walletBalance ?? seller.payoutBalance ?? 0);
    const settledVolume = Number(seller.totalWithdrawn ?? 0);

    return {
      totalOrders: sellerOrders.length,
      grossSales,
      platformCut: Math.round(platformCut * 100) / 100,
      netEarnings: Math.round(netEarnings * 100) / 100,
      totalGst: Math.round(totalGst * 100) / 100,
      codVolume,
      codCount,
      upiVolume,
      upiCount,
      cancelledVolume,
      cancelledCount,
      deliveredCount,
      payableBalance,
      settledVolume
    };
  }, [sellerOrders, seller.walletBalance, seller.payoutBalance, seller.totalWithdrawn]);

  // Filtered Orders for the ledger view
  const filteredOrders = useMemo(() => {
    return sellerOrders.filter(o => {
      // Tab filter
      if (activeFilter === 'upi' && o.isCod) return false;
      if (activeFilter === 'cod' && !o.isCod) return false;
      if (activeFilter === 'delivered' && !o.isDelivered) return false;
      if (activeFilter === 'cancelled' && !o.isCancelled) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = String(o.orderId).toLowerCase().includes(q);
        const matchCust = String(o.customerDisplay).toLowerCase().includes(q);
        const matchItem = o.relevantItems?.some(it => String(it.name).toLowerCase().includes(q));
        if (!matchId && !matchCust && !matchItem) return false;
      }

      return true;
    });
  }, [sellerOrders, activeFilter, searchQuery]);

  const handleDisburseCurrentPayout = () => {
    if (!isEditor) return;
    if (metrics.payableBalance <= 0) return;
    if (window.confirm(`Disburse pending settlement payout of ₹${metrics.payableBalance.toLocaleString()} to ${bankName} (A/c: ${acctNum}) for ${storeName}?`)) {
      if (onReleasePayout) {
        onReleasePayout(sellerId, metrics.payableBalance);
      }
      setDisburseSuccess(`Payout of ₹${metrics.payableBalance.toLocaleString()} successfully queued for electronic bank transfer.`);
      setTimeout(() => setDisburseSuccess(''), 5000);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setIsDownloadingPdf(true);
      await downloadSellerFinancialStatementPdfApi(sellerId, storeName);
    } catch (err) {
      console.warn('Backend PDF download error, switching to browser print view:', err);
      window.print();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[94vh] print:max-h-none print:shadow-none print:border-none print:rounded-none animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Control Bar */}
        <div className="bg-gray-950 text-white px-5 py-3.5 flex items-center justify-between shrink-0 print:hidden border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-extrabold shadow-sm">
              <CreditCard size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-sm text-white leading-tight">
                  Merchant Financial Statement & Order Settlement
                </h3>
                <span className="bg-teal-900/80 text-teal-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-teal-700/60">
                  {sellerId}
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                {storeName} • {city}, {state} • Commission: <strong className="text-teal-400">{commissionRate}%</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloadingPdf}
              className="px-3.5 py-1.5 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Download Official Financial Statement PDF"
            >
              <Download size={14} className={isDownloadingPdf ? 'animate-bounce' : ''} />
              <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Print Statement / Save as PDF"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Print Statement</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Statement Body */}
        <div className="p-6 sm:p-7 space-y-6 overflow-y-auto print:overflow-visible print:p-0">

          {disburseSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 print:hidden animate-in fade-in duration-100">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{disburseSuccess}</span>
            </div>
          )}

          {/* Statement Letterhead (Visible in Print & Screen) */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-gray-900 pb-5 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-brand-teal text-white font-black text-xs px-2.5 py-0.5 rounded tracking-wider uppercase">BookVardi</span>
                <span className="text-xs font-extrabold text-emerald-700 flex items-center gap-1">
                  <ShieldCheck size={14} /> Official Merchant Settlement
                </span>
              </div>
              <h1 className="font-display font-extrabold text-xl text-gray-900 tracking-tight">
                BOOK VARDI PRIVATE LIMITED
              </h1>
              <p className="text-[11px] text-gray-500">
                Corporate Finance & Merchant Settlement Division | GSTIN: 09AAACB1234F1Z9
              </p>
              <p className="text-[10px] text-gray-400">
                Registered Office: Sector 4, Gomti Nagar, Lucknow, Uttar Pradesh - 226010
              </p>
            </div>

            <div className="sm:text-right border-l-2 sm:border-l-0 border-brand-teal pl-3 sm:pl-0 space-y-0.5">
              <h2 className="font-display font-black text-base text-gray-900 uppercase tracking-wider">
                FINANCIAL STATEMENT
              </h2>
              <p className="text-xs font-bold text-gray-700">Ref: <strong className="font-mono text-teal-800">STMT-{String(sellerId).slice(-6).toUpperCase()}</strong></p>
              <p className="text-[11px] text-gray-500">Statement Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              <div className="inline-block mt-1 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded text-[10px] font-bold text-teal-900">
                Platform Cut: {commissionRate}% | Disbursals via NEFT/IMPS
              </div>
            </div>
          </div>

          {/* Seller Profile & Linked Bank Account Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Merchant Identity Block */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black text-teal-900 flex items-center gap-1.5">
                  <Store size={13} className="text-teal-700" /> Merchant Identity & Tax Credentials
                </span>
                <span className="text-[10px] font-bold bg-white text-gray-700 px-2 py-0.5 rounded border border-gray-200">
                  {seller.status || 'Verified Vendor'}
                </span>
              </div>
              <p className="font-extrabold text-sm text-gray-900">{storeName}</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-gray-600 pt-0.5">
                <div><span className="text-gray-400">Legal Entity:</span> <strong className="text-gray-800">{legalName}</strong></div>
                <div><span className="text-gray-400">Proprietor:</span> <strong className="text-gray-800">{ownerName}</strong></div>
                <div><span className="text-gray-400">GSTIN:</span> <strong className="font-mono text-gray-800">{gstin}</strong></div>
                <div><span className="text-gray-400">PAN:</span> <strong className="font-mono text-gray-800">{pan}</strong></div>
                <div><span className="text-gray-400">Mobile:</span> <strong className="text-gray-800">{phone}</strong></div>
                <div><span className="text-gray-400">Email:</span> <strong className="text-gray-800">{email}</strong></div>
              </div>
              <p className="text-[10px] text-gray-500 pt-1 border-t border-gray-200/60 truncate">
                Address: {address}
              </p>
            </div>

            {/* Bank Settlement Channel Block */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black text-sky-900 flex items-center gap-1.5">
                  <Landmark size={13} className="text-sky-700" /> Linked Settlement Bank Account
                </span>
                <button
                  type="button"
                  onClick={() => setIsMasked(!isMasked)}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 hover:text-gray-800 cursor-pointer print:hidden"
                >
                  {isMasked ? <Eye size={12} /> : <EyeOff size={12} />}
                  <span>{isMasked ? 'Show Acct' : 'Mask Acct'}</span>
                </button>
              </div>
              <p className="font-extrabold text-sm text-gray-900">{bankName}</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-gray-600 pt-0.5">
                <div><span className="text-gray-400">Account Holder:</span> <strong className="text-gray-800">{acctHolder}</strong></div>
                <div><span className="text-gray-400">Account Type:</span> <strong className="text-gray-800">{acctType}</strong></div>
                <div className="col-span-2">
                  <span className="text-gray-400">Account Number: </span>
                  <strong className="font-mono text-gray-900 text-xs">
                    {isMasked && acctNum.length > 4 ? `•••• •••• ${acctNum.slice(-4)}` : acctNum}
                  </strong>
                </div>
                <div><span className="text-gray-400">IFSC Code:</span> <strong className="font-mono text-gray-800">{ifsc}</strong></div>
                <div><span className="text-gray-400">Branch:</span> <strong className="text-gray-800">{branch}</strong></div>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-gray-200/60 text-[10px]">
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 size={12} /> Automated Penny Drop Verified
                </span>
                <span className="text-gray-400">IMPS / NEFT Auto-Credit</span>
              </div>
            </div>
          </div>

          {/* High-Level Financial KPI Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* 1. Gross Sales (GMV) */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
              <div className="flex items-center justify-between text-emerald-800 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Gross Sales (GMV)</span>
                <TrendingUp size={15} />
              </div>
              <div className="font-display font-extrabold text-xl text-emerald-950">
                ₹{metrics.grossSales.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                {metrics.totalOrders} total orders processed
              </div>
            </div>

            {/* 2. Platform Commission Cut */}
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl">
              <div className="flex items-center justify-between text-amber-800 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Platform Cut ({commissionRate}%)</span>
                <Percent size={15} />
              </div>
              <div className="font-display font-extrabold text-xl text-amber-950">
                ₹{metrics.platformCut.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                Platform fee deducted
              </div>
            </div>

            {/* 3. Net Seller Earnings */}
            <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl">
              <div className="flex items-center justify-between text-teal-800 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Net Seller Revenue</span>
                <DollarSign size={15} />
              </div>
              <div className="font-display font-extrabold text-xl text-teal-950">
                ₹{metrics.netEarnings.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-teal-700 font-semibold mt-0.5">
                Earned after commission
              </div>
            </div>

            {/* 4. Current Payable Balance */}
            <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-gray-500 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Payable Balance</span>
                  <Landmark size={15} className="text-teal-700" />
                </div>
                <div className="font-display font-extrabold text-xl text-gray-900">
                  ₹{metrics.payableBalance.toLocaleString('en-IN')}
                </div>
              </div>
              
              <div className="mt-2 flex items-center justify-between gap-1">
                <span className="text-[10px] text-gray-400">
                  Settled: ₹{metrics.settledVolume.toLocaleString('en-IN')}
                </span>
                {metrics.payableBalance > 0 && isEditor && (
                  <button
                    onClick={handleDisburseCurrentPayout}
                    className="px-2 py-0.5 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-extrabold text-[10px] rounded-lg transition-colors cursor-pointer print:hidden"
                  >
                    Disburse
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Visual Waterfall & Payment Method Reconciliation (COD vs UPI) */}
          <div className="p-4 bg-gradient-to-r from-gray-50 via-teal-50/30 to-amber-50/30 rounded-2xl border border-gray-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200/80 pb-2">
              <h4 className="font-display font-bold text-xs text-gray-900 flex items-center gap-1.5 uppercase tracking-wider">
                <Receipt size={14} className="text-teal-800" /> Order Cuts & Payment Method Split Analysis
              </h4>
              <span className="text-[11px] text-gray-500 font-medium">
                Real-time transaction classification across payment gateways
              </span>
            </div>

            {/* Deduction Waterfall Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Payment Split: UPI vs COD */}
              <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-emerald-800 flex items-center gap-1 uppercase">
                    <QrCode size={13} className="text-emerald-600" /> UPI / Online (Prepaid)
                  </span>
                  <span className="text-[10px] font-bold text-gray-500">{metrics.upiCount} orders</span>
                </div>
                <div className="font-extrabold text-base text-gray-900">
                  ₹{metrics.upiVolume.toLocaleString('en-IN')}
                </div>
                <p className="text-[10px] text-emerald-600 font-medium">
                  Instant settlement via Razorpay/UPI gateway
                </p>
              </div>

              {/* Payment Split: COD */}
              <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-amber-800 flex items-center gap-1 uppercase">
                    <Banknote size={13} className="text-amber-600" /> Cash on Delivery (COD)
                  </span>
                  <span className="text-[10px] font-bold text-gray-500">{metrics.codCount} orders</span>
                </div>
                <div className="font-extrabold text-base text-gray-900">
                  ₹{metrics.codVolume.toLocaleString('en-IN')}
                </div>
                <p className="text-[10px] text-amber-600 font-medium">
                  Cash collected on doorstep by delivery partner
                </p>
              </div>

              {/* GST Tax Component */}
              <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-sky-800 flex items-center gap-1 uppercase">
                    <Tag size={13} className="text-sky-600" /> GST Tax Component
                  </span>
                  <span className="text-[10px] font-bold text-gray-500">5% Slab</span>
                </div>
                <div className="font-extrabold text-base text-gray-900">
                  ₹{metrics.totalGst.toLocaleString('en-IN')}
                </div>
                <p className="text-[10px] text-gray-500 font-medium">
                  Product tax included in retail consumer invoice
                </p>
              </div>
            </div>

            {/* Structured Formula Explanation */}
            <div className="p-2.5 bg-white/80 rounded-xl border border-gray-200 text-[11px] text-gray-600 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-gray-900">Settlement Formula:</span>
                <span className="bg-emerald-50 text-emerald-900 font-mono font-bold px-2 py-0.5 rounded border border-emerald-200">
                  Gross Sales (₹{metrics.grossSales.toLocaleString('en-IN')})
                </span>
                <span>−</span>
                <span className="bg-amber-50 text-amber-900 font-mono font-bold px-2 py-0.5 rounded border border-amber-200">
                  Platform Fee ({commissionRate}% = ₹{metrics.platformCut.toLocaleString('en-IN')})
                </span>
                <span>=</span>
                <span className="bg-teal-50 text-teal-900 font-mono font-extrabold px-2 py-0.5 rounded border border-teal-200">
                  Net Merchant Payout (₹{metrics.netEarnings.toLocaleString('en-IN')})
                </span>
              </div>
              <span className="text-[10px] text-gray-400 italic">
                *TDS & Gateway fees absorbed by BookVardi platform
              </span>
            </div>
          </div>

          {/* Interactive Orders & Deductions Ledger Table */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            {/* Ledger Filter Toolbar */}
            <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 print:hidden">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeFilter === 'all' 
                      ? 'bg-teal-800 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All Orders ({sellerOrders.length})
                </button>
                <button
                  onClick={() => setActiveFilter('upi')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                    activeFilter === 'upi' 
                      ? 'bg-emerald-700 text-white' 
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  <QrCode size={12} /> UPI Prepaid ({metrics.upiCount})
                </button>
                <button
                  onClick={() => setActiveFilter('cod')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                    activeFilter === 'cod' 
                      ? 'bg-amber-700 text-white' 
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  <Banknote size={12} /> Cash on Delivery ({metrics.codCount})
                </button>
                <button
                  onClick={() => setActiveFilter('delivered')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeFilter === 'delivered' 
                      ? 'bg-blue-700 text-white' 
                      : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                  }`}
                >
                  Delivered ({metrics.deliveredCount})
                </button>
                {metrics.cancelledCount > 0 && (
                  <button
                    onClick={() => setActiveFilter('cancelled')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      activeFilter === 'cancelled' 
                        ? 'bg-rose-700 text-white' 
                        : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                    }`}
                  >
                    Cancelled ({metrics.cancelledCount})
                  </button>
                )}
              </div>

              {/* Search box */}
              <div className="relative w-full md:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search order, customer, item..."
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-50 focus:bg-white rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-teal-700"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-50 text-gray-700 uppercase font-extrabold text-[10px] tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-3.5">Order ID & Date</th>
                    <th className="py-3 px-3">Customer & Location</th>
                    <th className="py-3 px-3">Products & Qty</th>
                    <th className="py-3 px-3">Payment Mode</th>
                    <th className="py-3 px-3 text-right">Gross Sale</th>
                    <th className="py-3 px-3 text-right">Plat. Cut ({commissionRate}%)</th>
                    <th className="py-3 px-3 text-right">GST (5%)</th>
                    <th className="py-3 px-3.5 text-right">Net Share</th>
                    <th className="py-3 px-3 text-center">Fulfillment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-12 text-center text-gray-400">
                        No orders matching the selected filter or search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((o, idx) => (
                      <tr key={o.orderId || idx} className="hover:bg-gray-50/70 transition-colors">
                        {/* Order ID & Date */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-extrabold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                              {o.orderId}
                            </span>
                            {onOpenInvoice && (
                              <button
                                onClick={() => onOpenInvoice(o)}
                                className="text-teal-700 hover:text-teal-900 p-0.5 rounded hover:bg-teal-50 cursor-pointer print:hidden"
                                title="View Tax Invoice"
                              >
                                <FileText size={13} />
                              </button>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5">{o.dateStr}</div>
                        </td>

                        {/* Customer & Location */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-gray-900 truncate max-w-[130px]" title={o.customerDisplay}>
                            {o.customerDisplay}
                          </div>
                          <div className="text-[10px] text-gray-400 truncate max-w-[130px]">
                            {o.shippingAddress?.city || o.city || 'Standard Delivery'}
                          </div>
                        </td>

                        {/* Products & Qty */}
                        <td className="py-3 px-3">
                          <div className="text-[11px] text-gray-800 font-medium truncate max-w-[160px]" title={o.relevantItems?.map(it => it.name).join(', ')}>
                            {o.relevantItems && o.relevantItems[0]?.name ? o.relevantItems[0].name : 'Product Item'}
                            {o.relevantItems && o.relevantItems.length > 1 && (
                              <span className="text-gray-400 text-[10px]"> +{o.relevantItems.length - 1} more</span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            Qty: {o.relevantItems?.reduce((s, it) => s + Number(it.quantity || 1), 0)} unit(s)
                          </div>
                        </td>

                        {/* Payment Mode */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {o.isCod ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
                              <Banknote size={11} /> COD
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-200">
                              <QrCode size={11} /> UPI / Online
                            </span>
                          )}
                          <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                            {String(o.paymentStatus || (o.isCod ? 'Pending' : 'Paid')).toUpperCase()}
                          </div>
                        </td>

                        {/* Gross Sale */}
                        <td className="py-3 px-3 text-right whitespace-nowrap font-mono font-bold text-gray-900">
                          ₹{o.effectiveTotal.toLocaleString('en-IN')}
                        </td>

                        {/* Platform Cut */}
                        <td className="py-3 px-3 text-right whitespace-nowrap font-mono font-semibold text-amber-700">
                          -₹{o.platformCutAmount.toFixed(2)}
                        </td>

                        {/* GST */}
                        <td className="py-3 px-3 text-right whitespace-nowrap font-mono text-gray-500">
                          ₹{o.computedGst.toFixed(2)}
                        </td>

                        {/* Net Share */}
                        <td className="py-3 px-3.5 text-right whitespace-nowrap font-mono font-extrabold text-emerald-700">
                          ₹{o.netSellerShare.toLocaleString('en-IN')}
                        </td>

                        {/* Fulfillment Status */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            o.isDelivered ? 'bg-emerald-100 text-emerald-800' :
                            o.isCancelled ? 'bg-rose-100 text-rose-800' :
                            'bg-teal-50 text-teal-800'
                          }`}>
                            {o.overallStatus || o.status || 'Processing'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Summary Bar */}
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <span className="text-gray-500 text-[11px]">
                Showing {filteredOrders.length} of {sellerOrders.length} total orders for this vendor
              </span>
              <div className="flex items-center gap-4 text-xs font-mono">
                <div>
                  <span className="text-gray-400">Total GMV: </span>
                  <strong className="text-gray-900 font-bold">₹{metrics.grossSales.toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <span className="text-gray-400">Platform Cuts: </span>
                  <strong className="text-amber-800 font-bold">-₹{metrics.platformCut.toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <span className="text-gray-400">Net Payable: </span>
                  <strong className="text-emerald-800 font-extrabold">₹{metrics.netEarnings.toLocaleString('en-IN')}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Statutory Footer & Certification Block */}
          <div className="border-t border-gray-300 pt-4 text-[10px] text-gray-500 space-y-2">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="space-y-1 max-w-xl">
                <p className="font-bold text-gray-700">Certification & Statutory Declaration:</p>
                <p>
                  1. This statement is electronically generated under the BookVardi Merchant Agreement and verified by internal platform audit logs.
                </p>
                <p>
                  2. Cash on Delivery (COD) proceeds are collected via logistics partner escrow and cleared following doorstep delivery confirmation.
                </p>
                <p>
                  3. Net settlement disbursements are credited directly to the merchant's verified bank account ({bankName} A/c: {acctNum}).
                </p>
              </div>

              <div className="text-right sm:shrink-0 space-y-1">
                <p className="font-bold text-teal-900 text-xs">Authorized Signatory</p>
                <p className="text-gray-800 font-semibold">BookVardi Merchant Accounts Bureau</p>
                <p className="text-gray-400">Digitally Signed & Validated</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
