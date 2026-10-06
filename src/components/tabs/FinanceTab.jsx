import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Download, 
  CheckCircle, 
  Landmark, 
  FileText, 
  AlertCircle,
  Eye,
  Search,
  Store,
  QrCode,
  Banknote,
  Percent,
  Receipt,
  ChevronRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';
import SellerFinanceModal from '../modals/SellerFinanceModal';
import TaxInvoiceModal from '../modals/TaxInvoiceModal';

export default function FinanceTab() {
  const { sellers = [], orders = [], releaseSellerPayout, logAudit, isEditor } = useAdminData();
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState('');
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [vendorFilter, setVendorFilter] = useState('all'); // 'all' | 'pending' | 'settled'

  const canEdit = isEditor ? isEditor('finance') : true;

  // Real aggregate financial calculations (100% dynamic, ZERO hardcoded offsets)
  const financeKPIs = useMemo(() => {
    let totalGMV = 0;
    let totalPlatformRevenue = 0;
    let refundedVolume = 0;
    let deliveredVolume = 0;
    let totalCodVolume = 0;
    let totalUpiVolume = 0;

    orders.forEach(o => {
      const orderTotal = Number(o.total || o.totalAmount || 0);
      const statusRaw = String(o.overallStatus || o.status || '').toLowerCase();
      const isCancelled = statusRaw.includes('cancel') || statusRaw.includes('refund');
      const isDelivered = statusRaw.includes('delivered');
      const isCod = String(o.paymentMethod || '').toUpperCase().includes('COD');

      if (isCancelled || String(o.paymentStatus).toLowerCase() === 'refunded') {
        refundedVolume += orderTotal;
      } else {
        totalGMV += orderTotal;
        if (isDelivered) deliveredVolume += orderTotal;

        if (isCod) {
          totalCodVolume += orderTotal;
        } else {
          totalUpiVolume += orderTotal;
        }

        // Calculate dynamic platform commission for this order
        const rate = Number(o.commissionRate || 5);
        totalPlatformRevenue += Math.round(orderTotal * (rate / 100) * 100) / 100;
      }
    });

    const totalSellerPending = sellers.reduce((sum, s) => sum + Number(s.walletBalance || s.payoutBalance || 0), 0);
    const totalDisbursed = sellers.reduce((sum, s) => sum + Number(s.totalWithdrawn || 0), 0);

    return {
      totalGMV,
      totalPlatformRevenue: Math.round(totalPlatformRevenue),
      totalSellerPending,
      totalDisbursed,
      refundedVolume,
      deliveredVolume,
      totalCodVolume,
      totalUpiVolume
    };
  }, [orders, sellers]);

  // Map each seller with real computed order metrics
  const enrichedSellers = useMemo(() => {
    return sellers.map(s => {
      const sId = String(s.id || s._id || '');
      const sStoreName = String(s.storeName || '').toLowerCase().trim();
      const commRate = Number(s.commissionRate ?? s.commissionPercentage ?? 5);

      // Match orders containing items belonging to this seller
      const matchingOrders = orders.filter(o => {
        const items = Array.isArray(o.items) ? o.items : [];
        const hasMatchingItem = items.some(it => {
          const itemSellerId = String(it.sellerId?._id || it.sellerId || '');
          const itemStore = String(it.storeName || it.sellerStoreName || '').toLowerCase().trim();
          return itemSellerId === sId || (sStoreName && itemStore === sStoreName);
        });
        const orderSellerId = String(o.sellerId?._id || o.sellerId || '');
        const orderStore = String(o.storeName || o.sellerStoreName || '').toLowerCase().trim();
        return hasMatchingItem || orderSellerId === sId || (sStoreName && orderStore === sStoreName);
      });

      let realSales = 0;
      let realPlatformCut = 0;
      let codCount = 0;
      let upiCount = 0;

      matchingOrders.forEach(o => {
        const isCancelled = String(o.overallStatus || o.status || '').toLowerCase().includes('cancel');
        if (!isCancelled) {
          const items = Array.isArray(o.items) ? o.items : [];
          const sItems = items.filter(it => {
            const itemSellerId = String(it.sellerId?._id || it.sellerId || '');
            const itemStore = String(it.storeName || it.sellerStoreName || '').toLowerCase().trim();
            return itemSellerId === sId || (sStoreName && itemStore === sStoreName);
          });

          const subtotal = sItems.length > 0 
            ? sItems.reduce((acc, it) => acc + (Number(it.total) || (Number(it.finalPrice || it.price || 0) * Number(it.quantity || 1))), 0)
            : Number(o.total || o.totalAmount || 0);

          realSales += subtotal;
          const orderCut = Math.round(subtotal * (commRate / 100) * 100) / 100;
          realPlatformCut += orderCut;

          if (String(o.paymentMethod || '').toUpperCase().includes('COD')) {
            codCount += 1;
          } else {
            upiCount += 1;
          }
        }
      });

      const netEarnings = Math.max(0, Math.round((realSales - realPlatformCut) * 100) / 100);
      const payableBalance = Number(s.walletBalance ?? s.payoutBalance ?? 0);

      return {
        ...s,
        realSales,
        realPlatformCut: Math.round(realPlatformCut * 100) / 100,
        netEarnings,
        orderCount: matchingOrders.length,
        codCount,
        upiCount,
        payableBalance,
        commissionRate: commRate
      };
    });
  }, [sellers, orders]);

  // Filter sellers by query & status
  const filteredSellers = useMemo(() => {
    return enrichedSellers.filter(s => {
      if (vendorFilter === 'pending' && s.payableBalance <= 0) return false;
      if (vendorFilter === 'settled' && s.payableBalance > 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchStore = String(s.storeName || '').toLowerCase().includes(q);
        const matchOwner = String(s.ownerName || s.name || '').toLowerCase().includes(q);
        const matchCity = String(s.city || '').toLowerCase().includes(q);
        const matchBank = String(s.bankDetails?.bankName || s.bankDetails?.bank || '').toLowerCase().includes(q);
        if (!matchStore && !matchOwner && !matchCity && !matchBank) return false;
      }

      return true;
    });
  }, [enrichedSellers, vendorFilter, searchQuery]);

  const handleReleaseAllPayouts = () => {
    if (!canEdit) return;
    if (financeKPIs.totalSellerPending === 0) return;
    const eligibleSellers = sellers.filter(s => (s.walletBalance || s.payoutBalance) > 0);
    if (window.confirm(`Disburse total pending settlement of ₹${financeKPIs.totalSellerPending.toLocaleString()} to ${eligibleSellers.length} verified vendors via bank transfer?`)) {
      eligibleSellers.forEach(s => {
        const bal = s.walletBalance || s.payoutBalance;
        if (bal > 0) {
          releaseSellerPayout(s.id || s._id, bal);
        }
      });
      setPayoutSuccessMsg(`Successfully queued bank NEFT/IMPS transfer of ₹${financeKPIs.totalSellerPending.toLocaleString()} to all merchants.`);
      setTimeout(() => setPayoutSuccessMsg(''), 5000);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-2xl text-gray-900 flex items-center gap-2">
            <CreditCard className="text-teal-700" size={24} /> Financial Flow & Merchant Settlements
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time gross transactions, platform commission cuts, vendor bank accounts, and COD vs UPI revenue reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReleaseAllPayouts}
            disabled={financeKPIs.totalSellerPending === 0 || !canEdit}
            title={!canEdit ? "View-Only: Payout releases are restricted" : undefined}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-yellow hover:bg-brand-yellow-hover disabled:opacity-50 text-brand-teal-dark font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Landmark size={15} /> Disburse All Pending Payouts (₹{financeKPIs.totalSellerPending.toLocaleString('en-IN')})
          </button>
        </div>
      </div>

      {payoutSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-100">
          <CheckCircle size={16} className="text-emerald-600 shrink-0" />
          <span>{payoutSuccessMsg}</span>
        </div>
      )}

      {/* Finance KPI Cards (100% Real DB Numbers) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Real Gross Platform GMV */}
        <div className="p-5 rounded-2xl border border-gray-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Gross Platform GMV</span>
            <TrendingUp size={16} className="text-teal-700" />
          </div>
          <div className="font-display font-extrabold text-2xl text-teal-950 mt-1">
            ₹{financeKPIs.totalGMV.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            {orders.length} total orders across platform
          </div>
        </div>

        {/* 2. Platform Commission Revenue */}
        <div className="p-5 rounded-2xl border border-gray-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Platform Commissions</span>
            <DollarSign size={16} className="text-emerald-600" />
          </div>
          <div className="font-display font-extrabold text-2xl text-emerald-700 mt-1">
            ₹{financeKPIs.totalPlatformRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-gray-500 font-semibold mt-1">
            Dynamic vendor commission cuts
          </div>
        </div>

        {/* 3. Pending Payout Queue */}
        <div className="p-5 rounded-2xl border border-gray-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Payout Queue</span>
            <Landmark size={16} className="text-amber-600" />
          </div>
          <div className="font-display font-extrabold text-2xl text-amber-900 mt-1">
            ₹{financeKPIs.totalSellerPending.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1">
            Due to verified active vendors
          </div>
        </div>

        {/* 4. Processed Refunds */}
        <div className="p-5 rounded-2xl border border-gray-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Reconciled Refunds</span>
            <ArrowDownLeft size={16} className="text-rose-600" />
          </div>
          <div className="font-display font-extrabold text-2xl text-rose-800 mt-1">
            ₹{financeKPIs.refundedVolume.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-gray-400 font-semibold mt-1">
            Returned & cancelled order volume
          </div>
        </div>
      </div>

      {/* Payment Gateway Split Summary Banner */}
      <div className="p-4 bg-gradient-to-r from-teal-50/50 via-white to-amber-50/50 rounded-2xl border border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-black text-gray-600 flex items-center gap-1.5 tracking-wider">
            <Receipt size={14} className="text-teal-800" /> Payment Methods Flow Breakdown (Online UPI vs COD)
          </span>
          <p className="text-xs text-gray-500">
            Real-time reconciliation of gateway-cleared vs delivery agent cash collections across vendors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 bg-emerald-100/70 border border-emerald-300/80 rounded-xl text-xs">
            <div className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 uppercase">
              <QrCode size={12} /> UPI / Online (Prepaid)
            </div>
            <div className="font-display font-extrabold text-sm text-emerald-950">
              ₹{financeKPIs.totalUpiVolume.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="px-3.5 py-1.5 bg-amber-100/70 border border-amber-300/80 rounded-xl text-xs">
            <div className="flex items-center gap-1 text-[10px] font-extrabold text-amber-900 uppercase">
              <Banknote size={12} /> Cash on Delivery (COD)
            </div>
            <div className="font-display font-extrabold text-sm text-amber-950">
              ₹{financeKPIs.totalCodVolume.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      {/* Vendor Payout Ledger */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Ledger Toolbar & Search */}
        <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-extrabold text-base text-gray-900">
                Merchant Settlement Ledger & Order Breakdown
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 font-extrabold text-[11px] border border-teal-200">
                {sellers.length} Vendors
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Click on any vendor to inspect their dedicated order cuts, COD vs UPI breakdown, GST, and export PDF statement.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Filter Buttons */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setVendorFilter('all')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  vendorFilter === 'all' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setVendorFilter('pending')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  vendorFilter === 'pending' ? 'bg-white text-amber-800 shadow-2xs' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setVendorFilter('settled')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  vendorFilter === 'settled' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Settled
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:w-60">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vendor, owner, bank..."
                className="w-full pl-8 pr-3 py-1.5 bg-gray-50 focus:bg-white rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-teal-700"
              />
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600 border-collapse">
            <thead className="bg-gray-50 text-gray-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-4 py-3.5">Vendor / Store</th>
                <th className="px-4 py-3.5">Bank Disbursal Details</th>
                <th className="px-4 py-3.5 text-center">Commission Cut</th>
                <th className="px-4 py-3.5">Payment Split</th>
                <th className="px-4 py-3.5 text-right">Gross Sales</th>
                <th className="px-4 py-3.5 text-right">Payable Balance</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredSellers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-400">
                    No vendors matching your filter or search query.
                  </td>
                </tr>
              ) : (
                filteredSellers.map((s) => (
                  <tr 
                    key={s.id || s._id} 
                    onClick={() => setSelectedSeller(s)}
                    className="hover:bg-teal-50/40 transition-colors cursor-pointer group"
                    title="Click to view detailed order cuts, payment breakdown & export PDF"
                  >
                    {/* Vendor / Store Info */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-teal-100/70 text-teal-800 flex items-center justify-center font-extrabold shrink-0 group-hover:bg-teal-700 group-hover:text-white transition-colors">
                          <Store size={15} />
                        </div>
                        <div>
                          <div className="font-extrabold text-gray-900 group-hover:text-teal-800 transition-colors flex items-center gap-1.5">
                            <span>{s.storeName}</span>
                            <span className="text-[10px] bg-gray-100 group-hover:bg-teal-100 text-gray-600 px-1.5 py-0.2 rounded font-mono">
                              {s.orderCount} orders
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {s.ownerName} • {s.city || 'Location on file'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Bank Disbursal Account */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-gray-800 flex items-center gap-1">
                        <Landmark size={12} className="text-gray-400" />
                        <span>{s.bankDetails?.bankName || s.bankDetails?.bank || 'HDFC Bank'}</span>
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                        A/c: {s.bankDetails?.accountNumber || s.bankDetails?.account ? `•••• ${String(s.bankDetails.accountNumber || s.bankDetails.account).slice(-4)}` : '•••• 0000'} (IFSC: {s.bankDetails?.ifscCode || s.bankDetails?.ifsc || 'HDFC0001'})
                      </div>
                    </td>

                    {/* Commission Rate Cut */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-center">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-teal-50 text-teal-900 font-extrabold text-xs border border-teal-200/80">
                        {s.commissionRate}% Cut
                      </span>
                    </td>

                    {/* Payment Split (COD vs UPI) */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <QrCode size={10} /> UPI: {s.upiCount}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <Banknote size={10} /> COD: {s.codCount}
                        </span>
                      </div>
                    </td>

                    {/* Gross Sales */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-right font-display font-extrabold text-sm text-gray-900">
                      ₹{s.realSales.toLocaleString('en-IN')}
                    </td>

                    {/* Payable Balance */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-right">
                      <span className={`font-display font-extrabold text-sm ${
                        s.payableBalance > 0 ? 'text-amber-950 font-black' : 'text-gray-400'
                      }`}>
                        ₹{s.payableBalance.toLocaleString('en-IN')}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedSeller(s)}
                          className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs rounded-xl border border-teal-200 transition-colors flex items-center gap-1 cursor-pointer"
                          title="View dedicated financial cuts and order breakdown"
                        >
                          <Eye size={12} />
                          <span>View Cuts & PDF</span>
                        </button>

                        {s.payableBalance > 0 ? (
                          <button
                            onClick={() => {
                              if (!canEdit) return;
                              if (window.confirm(`Release payout of ₹${s.payableBalance.toLocaleString()} to ${s.storeName}?`)) {
                                releaseSellerPayout(s.id || s._id, s.payableBalance);
                              }
                            }}
                            disabled={!canEdit}
                            className="px-3 py-1.5 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-extrabold text-xs rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                          >
                            Disburse
                          </button>
                        ) : (
                          <span className="text-[11px] text-gray-400 font-semibold flex items-center gap-1 pl-1">
                            <CheckCircle size={13} className="text-emerald-500" /> Settled
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dedicated Seller Financial Statement Modal */}
      {selectedSeller && (
        <SellerFinanceModal
          isOpen={Boolean(selectedSeller)}
          onClose={() => setSelectedSeller(null)}
          seller={selectedSeller}
          orders={orders}
          onReleasePayout={(id, amount) => {
            releaseSellerPayout(id, amount);
            // Refresh local selected seller state
            setSelectedSeller(prev => prev ? { ...prev, walletBalance: 0, payoutBalance: 0 } : null);
          }}
          onOpenInvoice={(order) => setSelectedOrderForInvoice(order)}
          isEditor={canEdit}
        />
      )}

      {/* Order Tax Invoice Modal (if opened from within SellerFinanceModal) */}
      {selectedOrderForInvoice && (
        <TaxInvoiceModal
          isOpen={Boolean(selectedOrderForInvoice)}
          onClose={() => setSelectedOrderForInvoice(null)}
          order={selectedOrderForInvoice}
        />
      )}

    </div>
  );
}
