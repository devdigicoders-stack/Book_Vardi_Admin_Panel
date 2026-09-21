import React, { useState } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  Store, 
  GraduationCap, 
  AlertTriangle, 
  CreditCard, 
  ArrowUpRight, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Users,
  Package,
  Sparkles,
  Filter
} from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';

export default function DashboardTab({ onNavigateTab }) {
  const { 
    products, 
    orders, 
    sellers, 
    schools, 
    users, 
    reviews,
    supportTickets, 
    auditLog, 
    approveSeller 
  } = useAdminData();

  const [approvalCategoryFilter, setApprovalCategoryFilter] = useState('all');

  // Metrics Calculations - dynamically derived from live database records
  const totalGMV = orders.reduce((sum, o) => sum + Number(o.totalAmount || o.total || 0), 0);
  const platformCommission = Math.round(orders.reduce((sum, o) => sum + (Number(o.totalAmount || o.total || 0) * 0.10), 0));
  const totalPendingPayout = sellers.reduce((sum, s) => sum + Number(s.payoutBalance || s.walletBalance || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'Pending' || o.overallStatus === 'pending' || o.status === 'placed').length;
  const pendingSellers = sellers.filter(s => s.status === 'Pending Approval' || s.status === 'Pending' || s.status === 'pending');
  const pendingProducts = products.filter(p => p.approvalStatus === 'Pending' || p.approvalStatus === 'pending');
  const pendingReviews = (reviews || []).filter(r => r.status === 'Pending Approval' || r.status === 'Pending' || r.status === 'pending');
  const lowStockCount = products.filter(p => Number(p.stockQuantity ?? p.stock ?? 50) <= 10).length;
  const activeSchoolsCount = schools.filter(s => s.status === 'Partner Active' || s.status === 'active').length || schools.length;

  const kpis = [
    {
      label: 'Gross Merchandise Value (GMV)',
      value: `₹${totalGMV.toLocaleString()}`,
      change: `${orders.length} total orders recorded`,
      icon: <TrendingUp size={20} className="text-emerald-700" />,
      bg: 'bg-emerald-50/80',
      border: 'border-emerald-200'
    },
    {
      label: 'Net Platform Commission (10%)',
      value: `₹${platformCommission.toLocaleString()}`,
      change: totalPendingPayout > 0 ? `₹${totalPendingPayout.toLocaleString()} pending settlement` : 'Settlements up to date',
      icon: <CreditCard size={20} className="text-teal-700" />,
      bg: 'bg-teal-50/80',
      border: 'border-teal-200'
    },
    {
      label: 'Active Platform Orders',
      value: orders.length,
      change: `${pendingOrders} awaiting fulfillment`,
      icon: <ShoppingBag size={20} className="text-blue-700" />,
      bg: 'bg-blue-50/80',
      border: 'border-blue-200'
    },
    {
      label: 'Verified Vendors / Sellers',
      value: sellers.length,
      change: `${pendingSellers.length} pending KYC review`,
      icon: <Store size={20} className="text-amber-700" />,
      bg: 'bg-amber-50/80',
      border: 'border-amber-200'
    },
    {
      label: 'Partner Schools Onboarded',
      value: schools.length,
      change: `${activeSchoolsCount} active institutional partners`,
      icon: <GraduationCap size={20} className="text-purple-700" />,
      bg: 'bg-purple-50/80',
      border: 'border-purple-200'
    },
    {
      label: 'Critical Stock Alerts',
      value: lowStockCount,
      change: 'Items ≤ 10 units threshold',
      icon: <AlertTriangle size={20} className="text-rose-700" />,
      bg: 'bg-rose-50/80',
      border: 'border-rose-200'
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-900 to-brand-teal text-white rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-brand-yellow/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-brand-yellow text-brand-teal-dark tracking-wider uppercase inline-flex items-center gap-1 mb-2">
              <Sparkles size={12} /> Marketplace Operations Center
            </span>
            <h2 className="font-display text-2xl md:text-3xl font-extrabold text-white">
              Platform Overview & Health
            </h2>
            <p className="text-xs text-teal-100 max-w-xl mt-1">
              Real-time monitoring across customer storefront, merchant partner hubs, institutional bulk orders, and financial commission payouts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigateTab('sellers')}
              className="px-4 py-2 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Review Pending Sellers ({pendingSellers.length})
            </button>
            <button
              onClick={() => onNavigateTab('products')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Manage Catalog
            </button>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi, index) => (
          <div
            key={index}
            className={`p-5 rounded-2xl border ${kpi.border} ${kpi.bg} shadow-xs hover:shadow-md transition-shadow bg-white`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-500">{kpi.label}</span>
              <div className="p-2.5 rounded-xl bg-white shadow-2xs border border-gray-100">
                {kpi.icon}
              </div>
            </div>
            <div className="font-display text-2xl font-extrabold text-gray-900 mb-1">
              {kpi.value}
            </div>
            <div className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
              <ArrowUpRight size={13} className="text-emerald-600" />
              <span>{kpi.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Action Hub & Moderation Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pending Approvals Queue */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-teal-700" />
              <h3 className="font-display font-bold text-base text-gray-900">Urgent Approval Queue</h3>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 self-start sm:self-auto">
              {pendingSellers.length + pendingProducts.length + pendingReviews.length} Pending Actions
            </span>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'all', label: 'All Items', count: pendingSellers.length + pendingProducts.length + pendingReviews.length },
              { id: 'sellers', label: 'Sellers', count: pendingSellers.length },
              { id: 'products', label: 'Products', count: pendingProducts.length },
              { id: 'reviews', label: 'Reviews', count: pendingReviews.length }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setApprovalCategoryFilter(cat.id)}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  approvalCategoryFilter === cat.id
                    ? 'bg-teal-800 text-white shadow-2xs'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ${
                  approvalCategoryFilter === cat.id ? 'bg-teal-700 text-white' : 'bg-gray-200 text-gray-800'
                }`}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto no-scrollbar hide-scrollbar pr-1">
            {/* Pending Sellers */}
            {(approvalCategoryFilter === 'all' || approvalCategoryFilter === 'sellers') && pendingSellers.map(seller => (
              <div key={seller.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-gray-900">
                      {seller.storeName || seller.rawApplication?.storeName || seller.businessName}
                    </span>
                    <span className="px-2 py-0.2 rounded-md text-[9px] font-bold bg-amber-100 text-amber-800">
                      KYC Review
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    GSTIN: {seller.gstin || seller.rawApplication?.gstin || 'Pending'} • {seller.city || seller.rawApplication?.city || 'Delhi'}
                  </div>
                </div>
                <button
                  onClick={() => onNavigateTab('sellers')}
                  className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  Review Docs →
                </button>
              </div>
            ))}

            {/* Pending Products */}
            {(approvalCategoryFilter === 'all' || approvalCategoryFilter === 'products') && pendingProducts.map(prod => (
              <div key={prod.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={prod.image} alt={prod.name} className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-gray-900 truncate">{prod.name}</span>
                      <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-blue-100 text-blue-800 shrink-0">Product</span>
                    </div>
                    <div className="text-[11px] text-gray-500 truncate">₹{prod.price} • By {prod.sellerName || 'Merchant'}</div>
                  </div>
                </div>
                <button
                  onClick={() => onNavigateTab('products')}
                  className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  Review →
                </button>
              </div>
            ))}

            {/* Pending Customer Reviews */}
            {(approvalCategoryFilter === 'all' || approvalCategoryFilter === 'reviews') && pendingReviews.map(rev => (
              <div key={rev.id || rev._id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-gray-900 truncate">{rev.productName || 'Customer Review'}</span>
                    <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-purple-100 text-purple-800 shrink-0">Review</span>
                  </div>
                  <div className="text-[11px] text-gray-500 truncate mt-0.5">By {rev.customerName || 'User'} • Rating: ★{rev.rating || 5}</div>
                </div>
                <button
                  onClick={() => onNavigateTab('reviews')}
                  className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  Moderate →
                </button>
              </div>
            ))}

            {/* Empty state */}
            {((approvalCategoryFilter === 'all' && pendingSellers.length === 0 && pendingProducts.length === 0 && pendingReviews.length === 0) ||
              (approvalCategoryFilter === 'sellers' && pendingSellers.length === 0) ||
              (approvalCategoryFilter === 'products' && pendingProducts.length === 0) ||
              (approvalCategoryFilter === 'reviews' && pendingReviews.length === 0)) && (
              <div className="py-8 text-center text-gray-400 text-xs">
                <CheckCircle2 size={28} className="mx-auto text-emerald-500 mb-1.5 opacity-80" />
                No pending items in this category! All clear.
              </div>
            )}
          </div>
        </div>

        {/* Real-Time Platform Audit Log */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-teal-700" />
              <h3 className="font-display font-bold text-base text-gray-900">Recent Admin Activity Log</h3>
            </div>
            <span className="text-xs text-gray-400">Live feed</span>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto no-scrollbar pr-1">
            {auditLog.map(entry => (
              <div key={entry.id} className="p-3 rounded-xl bg-gray-50 border border-gray-200/60 flex items-start justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{entry.action}</span>
                    <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full">
                      {entry.user}
                    </span>
                  </div>
                  <div className="text-gray-600 mt-1 leading-snug">{entry.details}</div>
                </div>
                <span className="text-[10px] text-gray-400 whitespace-nowrap">{entry.time}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
