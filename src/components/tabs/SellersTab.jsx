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
  Percent
} from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';
import SellerDetailModal from '../modals/SellerDetailModal';

export default function SellersTab() {
  const { 
    sellers, 
    approveSeller, 
    rejectSeller, 
    updateSellerCommission, 
    releaseSellerPayout,
    isEditor 
  } = useAdminData();

  const canEdit = isEditor ? isEditor('sellers') : true;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const filteredSellers = sellers.filter(s => {
    const query = searchTerm.toLowerCase();
    const store = (s.storeName || s.rawApplication?.storeName || s.businessName || '').toLowerCase();
    const owner = (s.ownerName || s.name || s.rawApplication?.ownerFullName || s.rawApplication?.sellerName || '').toLowerCase();
    const gstin = (s.gstin || s.rawApplication?.gstin || '').toLowerCase();
    const city = (s.city || s.rawApplication?.city || '').toLowerCase();
    return store.includes(query) || owner.includes(query) || gstin.includes(query) || city.includes(query);
  });

  const handleOpenDetail = (seller) => {
    setSelectedSeller(seller);
    setModalOpen(true);
  };

  const handleDirectApprove = (e, id) => {
    e.stopPropagation();
    approveSeller(id);
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
            Verify seller KYC, inspect business credentials, adjust marketplace commission rates & release settlements.
          </p>
        </div>

        <div className="text-xs text-gray-600 bg-teal-50 px-3.5 py-1.5 rounded-xl border border-teal-100 font-semibold">
          Total Active Sellers: <span className="font-extrabold text-teal-900">{sellers.length}</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs flex items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by store name, owner, city or GSTIN..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
          />
        </div>
      </div>

      {/* Sellers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSellers.map((seller) => (
          <div
            key={seller.id}
            onClick={() => handleOpenDetail(seller)}
            className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-4 relative"
          >
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

              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                seller.status === 'Verified' ? 'bg-emerald-100 text-emerald-800' :
                (seller.status === 'Pending Approval' || seller.status === 'Pending') ? 'bg-amber-100 text-amber-800' :
                'bg-rose-100 text-rose-800'
              }`}>
                {seller.status}
              </span>
            </div>

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

            {/* Bottom Actions */}
            <div className="pt-2 flex items-center justify-between border-t border-gray-100">
              <span className="text-[11px] font-semibold text-teal-700 flex items-center gap-1">
                <Star size={13} className="text-amber-400 fill-amber-400" />
                <span>{seller.rating > 0 ? seller.rating : 'New Seller'}</span>
              </span>

              {(seller.status === 'Pending Approval' || seller.status === 'Pending') ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetail(seller);
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-extrabold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                  >
                    <span>Review Application & Docs →</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDetail(seller);
                  }}
                  className="text-xs text-teal-800 hover:text-teal-950 font-bold flex items-center gap-1"
                >
                  <span>Inspect Details & Docs →</span>
                </button>
              )}
            </div>

          </div>
        ))}
      </div>

      {/* Seller Detail Modal */}
      <SellerDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        seller={selectedSeller}
        onApprove={approveSeller}
        onReject={rejectSeller}
        onUpdateCommission={updateSellerCommission}
        onReleasePayout={releaseSellerPayout}
        readOnly={!canEdit}
      />

    </div>
  );
}
