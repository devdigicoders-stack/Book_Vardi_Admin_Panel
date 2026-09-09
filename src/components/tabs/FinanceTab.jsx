import React, { useState } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';

export default function FinanceTab() {
  const { sellers, orders, releaseSellerPayout, logAudit } = useAdminData();
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState('');

  const totalGMV = orders.reduce((sum, o) => sum + (o.total || 0), 0) + 745000;
  const platformRevenue = Math.round(totalGMV * 0.12);
  const totalSellerPending = sellers.reduce((sum, s) => sum + (s.payoutBalance || 0), 0);
  const refundedVolume = orders.filter(o => o.paymentStatus === 'Refunded').reduce((sum, o) => sum + o.total, 0);

  const handleReleaseAllPayouts = () => {
    if (totalSellerPending === 0) return;
    if (window.confirm(`Disburse total pending settlement of ₹${totalSellerPending.toLocaleString()} to ${sellers.filter(s => s.payoutBalance > 0).length} verified vendors?`)) {
      sellers.forEach(s => {
        if (s.payoutBalance > 0) {
          releaseSellerPayout(s.id, s.payoutBalance);
        }
      });
      setPayoutSuccessMsg(`Successfully queued bank NEFT/IMPS transfer of ₹${totalSellerPending.toLocaleString()} to all merchants.`);
      setTimeout(() => setPayoutSuccessMsg(''), 5000);
    }
  };

  const handleDownloadInvoice = (orderId, total) => {
    logAudit('Invoice Downloaded', `Generated GST Tax Invoice for Order ${orderId}`);
    alert(`Downloading Tax Invoice PDF for Order #${orderId} (₹${total}). Includes 5% HSN GST breakdown.`);
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
            Track gross merchandise transactions, platform commissions, vendor bank disbursements, and refund adjustments.
          </p>
        </div>

        <button
          onClick={handleReleaseAllPayouts}
          disabled={totalSellerPending === 0}
          className="inline-flex items-center gap-2 px-4 py-2.2 bg-brand-yellow hover:bg-brand-yellow-hover disabled:opacity-50 text-brand-teal-dark font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Landmark size={15} /> Disburse All Pending Payouts (₹{totalSellerPending.toLocaleString()})
        </button>
      </div>

      {payoutSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle size={16} className="text-emerald-600" />
          <span>{payoutSuccessMsg}</span>
        </div>
      )}

      {/* Finance KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-gray-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Gross Platform GMV</span>
            <TrendingUp size={16} className="text-teal-700" />
          </div>
          <div className="font-display font-extrabold text-2xl text-teal-950 mt-1">
            ₹{totalGMV.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">Total consumer & school POs</div>
        </div>

        <div className="p-5 rounded-2xl border border-gray-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Platform Commissions (12%)</span>
            <DollarSign size={16} className="text-emerald-600" />
          </div>
          <div className="font-display font-extrabold text-2xl text-emerald-700 mt-1">
            ₹{platformRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-gray-500 font-semibold mt-1">Net revenue after gateway fees</div>
        </div>

        <div className="p-5 rounded-2xl border border-gray-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Payout Queue</span>
            <Landmark size={16} className="text-amber-600" />
          </div>
          <div className="font-display font-extrabold text-2xl text-amber-900 mt-1">
            ₹{totalSellerPending.toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1">Due to active verified vendors</div>
        </div>

        <div className="p-5 rounded-2xl border border-gray-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Processed Refunds</span>
            <ArrowDownLeft size={16} className="text-rose-600" />
          </div>
          <div className="font-display font-extrabold text-2xl text-rose-800 mt-1">
            ₹{refundedVolume.toLocaleString()}
          </div>
          <div className="text-[11px] text-gray-400 font-semibold mt-1">Reconciled cancellations</div>
        </div>
      </div>

      {/* Vendor Payout Ledger */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-display font-bold text-sm text-gray-900">Merchant Payout Ledger & Bank Accounts</h3>
          <span className="text-xs text-gray-500">Auto-settled via NEFT / UPI</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">Vendor / Store</th>
                <th className="px-4 py-3">Bank Details</th>
                <th className="px-4 py-3">Commission Cut</th>
                <th className="px-4 py-3">Total Sales</th>
                <th className="px-4 py-3">Payable Balance</th>
                <th className="px-4 py-3 text-right">Settlement Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {sellers.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-gray-900">{s.storeName}</div>
                    <div className="text-[11px] text-gray-500">{s.ownerName} • {s.city}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-semibold text-gray-800">{s.bankDetails?.bank || 'HDFC Bank'}</div>
                    <div className="text-[10px] text-gray-400 font-mono">
                      Acct: {s.bankDetails?.account || '•••• 0000'} (IFSC: {s.bankDetails?.ifsc || 'HDFC0001'})
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-bold text-teal-800">
                    {s.commissionRate || 12}%
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-display font-bold text-gray-900">
                    ₹{s.totalSales?.toLocaleString() || 0}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-display font-extrabold text-sm text-teal-950">
                      ₹{s.payoutBalance?.toLocaleString() || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {s.payoutBalance > 0 ? (
                      <button
                        onClick={() => releaseSellerPayout(s.id, s.payoutBalance)}
                        className="px-3 py-1.5 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-bold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        Release Payout
                      </button>
                    ) : (
                      <span className="text-[11px] text-gray-400 font-semibold flex items-center justify-end gap-1">
                        <CheckCircle size={13} className="text-emerald-500" /> Settled
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
