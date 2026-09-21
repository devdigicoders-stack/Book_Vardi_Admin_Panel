import React, { useState } from 'react';
import { 
  Store, 
  Search, 
  ShieldCheck, 
  CheckCircle, 
  Ban, 
  DollarSign, 
  ExternalLink,
  MapPin,
  Star,
  Building2,
  Percent,
  RefreshCw,
  AlertTriangle,
  Clock,
  Filter
} from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';
import SellerDetailModal from '../modals/SellerDetailModal';

export default function SellersTab() {
  const { 
    sellers, 
    approveSeller, 
    rejectSeller, 
    setPendingSeller,
    toggleSellerStatus,
    updateSellerCommission, 
    releaseSellerPayout,
    isEditor 
  } = useAdminData();

  const canEdit = isEditor ? isEditor('sellers') : true;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState('all');
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Status counts
  const counts = {
    all: sellers.length,
    pending: sellers.filter(s => {
      const st = String(s.status || '').toLowerCase();
      return st === 'pending' || st === 'pending approval';
    }).length,
    approved: sellers.filter(s => {
      const st = String(s.status || '').toLowerCase();
      return st === 'approved' || st === 'verified';
    }).length,
    rejected: sellers.filter(s => String(s.status || '').toLowerCase() === 'rejected').length,
    suspended: sellers.filter(s => String(s.status || '').toLowerCase() === 'suspended').length,
  };

  const filteredSellers = sellers.filter(s => {
    const st = String(s.status || '').toLowerCase();

    if (selectedStatusTab === 'pending' && !(st === 'pending' || st === 'pending approval')) return false;
    if (selectedStatusTab === 'approved' && !(st === 'approved' || st === 'verified')) return false;
    if (selectedStatusTab === 'rejected' && st !== 'rejected') return false;
    if (selectedStatusTab === 'suspended' && st !== 'suspended') return false;

    if (!searchTerm.trim()) return true;

    const query = searchTerm.toLowerCase();
    const store = (s.storeName || s.rawApplication?.storeName || s.businessName || '').toLowerCase();
    const owner = (s.ownerName || s.name || s.rawApplication?.ownerFullName || s.rawApplication?.sellerName || '').toLowerCase();
    const gstin = (s.gstin || s.rawApplication?.gstin || '').toLowerCase();
    const city = (s.city || s.rawApplication?.city || '').toLowerCase();
    const statusStr = (s.status || '').toLowerCase();
    return store.includes(query) || owner.includes(query) || gstin.includes(query) || city.includes(query) || statusStr.includes(query);
  });

  const handleOpenDetail = (seller) => {
    setSelectedSeller(seller);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-2xl text-gray-900 flex items-center gap-2">
            <Store className="text-teal-700" size={24} /> Vendor & Merchant Management
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Verify seller KYC, inspect business credentials, adjust marketplace status (Approval, Pending & Rejection with Msg).
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold bg-teal-50 px-3.5 py-1.5 rounded-xl border border-teal-100">
          <span>Total Registered Vendors:</span>
          <span className="font-extrabold text-teal-900">{sellers.length}</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs space-y-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'All Vendors', count: counts.all, color: 'bg-gray-100 text-gray-800' },
            { id: 'pending', label: 'Pending Approval', count: counts.pending, color: 'bg-amber-100 text-amber-900' },
            { id: 'approved', label: 'Approved / Verified', count: counts.approved, color: 'bg-emerald-100 text-emerald-900' },
            { id: 'rejected', label: 'Rejected', count: counts.rejected, color: 'bg-rose-100 text-rose-900' },
            { id: 'suspended', label: 'Suspended', count: counts.suspended, color: 'bg-gray-200 text-gray-900' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatusTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                selectedStatusTab === tab.id
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                selectedStatusTab === tab.id ? 'bg-teal-700 text-white' : tab.color
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by store name, owner, city, status or GSTIN..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
          />
        </div>
      </div>

      {/* Sellers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSellers.map((seller) => {
          const sellerId = seller.id || seller._id;
          const statusLower = String(seller.status || '').toLowerCase();
          const isVerified = statusLower === 'verified' || statusLower === 'approved';
          const isPending = statusLower === 'pending' || statusLower === 'pending approval';
          const isRejected = statusLower === 'rejected';
          const isSuspended = statusLower === 'suspended';

          return (
            <div
              key={sellerId}
              onClick={() => handleOpenDetail(seller)}
              className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-4 relative flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Top Bar */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-sm shrink-0">
                      <Store size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-900 leading-snug">
                        {seller.storeName || seller.rawApplication?.storeName || seller.businessName}
                      </h3>
                      <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={12} className="text-gray-400" /> {seller.city || seller.rawApplication?.city || 'New Delhi'}
                      </div>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                    isVerified ? 'bg-emerald-100 text-emerald-800 border border-emerald-300/60' :
                    isPending ? 'bg-amber-100 text-amber-800 border border-amber-300/60' :
                    isRejected ? 'bg-rose-100 text-rose-800 border border-rose-300/60' :
                    'bg-gray-200 text-gray-800 border border-gray-300/60'
                  }`}>
                    {seller.status || 'Pending'}
                  </span>
                </div>

                {/* Rejection reason banner if rejected */}
                {isRejected && seller.rejectionReason && (
                  <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-200 text-xs text-rose-800 space-y-0.5">
                    <span className="font-bold block text-[10px] uppercase text-rose-900 flex items-center gap-1">
                      <AlertTriangle size={12} /> Rejection Message:
                    </span>
                    <p className="text-[11px] leading-snug italic">{seller.rejectionReason}</p>
                  </div>
                )}

                {/* Business IDs */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold">GSTIN</span>
                    <div className="font-mono font-semibold text-gray-800 truncate">
                      {seller.gstin || seller.rawApplication?.gstin || (seller.rawApplication?.hasGstExemption ? 'Exempted' : '07AAAAA0000A1Z5')}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Commission</span>
                    <div className="font-bold text-teal-900">{seller.commissionRate || 10}% Fee</div>
                  </div>
                </div>

                {/* Performance Stats */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100">
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase font-bold">Total Sales</div>
                    <div className="font-display font-extrabold text-sm text-gray-900 mt-0.5">
                      ₹{seller.totalSales?.toLocaleString() || 0}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-gray-400 uppercase font-bold">Pending Payout</div>
                    <div className="font-display font-bold text-xs text-amber-800 mt-0.5">
                      ₹{seller.payoutBalance?.toLocaleString() || 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Actions */}
              <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
                {canEdit && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {!isVerified && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          approveSeller(sellerId);
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                        title="Approve seller"
                      >
                        <CheckCircle size={12} />
                        <span>Approve</span>
                      </button>
                    )}

                    {!isPending && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingSeller(sellerId);
                        }}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-[11px] font-bold border border-amber-200 transition-all flex items-center gap-1 cursor-pointer"
                        title="Set to pending"
                      >
                        <RefreshCw size={11} />
                        <span>Pending</span>
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetail(seller);
                      }}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg text-[11px] font-bold border border-rose-200 transition-all flex items-center gap-1 cursor-pointer"
                      title="Reject or edit rejection message"
                    >
                      <Ban size={11} />
                      <span>{isRejected ? 'Msg' : 'Reject'}</span>
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[11px] font-semibold text-teal-700 flex items-center gap-1">
                    <Star size={13} className="text-amber-400 fill-amber-400" />
                    <span>{seller.rating > 0 ? seller.rating : 'New Seller'}</span>
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetail(seller);
                    }}
                    className="text-xs text-teal-800 hover:text-teal-950 font-extrabold flex items-center gap-1"
                  >
                    <span>Full Details & Dossier →</span>
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {filteredSellers.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500 space-y-2">
          <Store size={36} className="mx-auto text-gray-300" />
          <p className="font-bold text-gray-700">No sellers found for selected status or search query.</p>
          <p className="text-xs text-gray-400">Try changing the status tab or clearing search parameters.</p>
        </div>
      )}

      {/* Seller Detail Modal */}
      <SellerDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        seller={selectedSeller}
        onApprove={approveSeller}
        onReject={rejectSeller}
        onSetPending={setPendingSeller}
        onToggleStatus={toggleSellerStatus}
        onUpdateCommission={updateSellerCommission}
        onReleasePayout={releaseSellerPayout}
        readOnly={!canEdit}
      />

    </div>
  );
}
