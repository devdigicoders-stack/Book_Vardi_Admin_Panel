import React, { useState, useMemo } from 'react';
import {
  Building2,
  Search,
  Send,
  UserCheck,
  Globe,
  Users,
  CheckCircle2,
  Clock,
  ChevronRight,
  DollarSign,
  Calendar,
  FileText,
  AlertCircle,
  X,
  Check,
  Store,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Eye
} from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';
import BulkOrderPreviewModal from './BulkOrderPreviewModal';

export default function BulkOrdersTab() {
  const { schoolOrders, sellers, distributeSchoolBulkOrder, approveSellerQuotation } = useAdminData();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Preview Expanded Detail Modal State
  const [previewOrder, setPreviewOrder] = useState(null);

  // Distribution Modal State
  const [distributeModalOrder, setDistributeModalOrder] = useState(null);
  const [distributeMode, setDistributeMode] = useState('direct'); // 'direct', 'selected', 'broadcast'
  const [selectedSingleSeller, setSelectedSingleSeller] = useState('');
  const [selectedMultipleSellers, setSelectedMultipleSellers] = useState([]);
  const [sellerSearchQuery, setSellerSearchQuery] = useState('');

  // View Quotations Modal State
  const [viewQuotesOrder, setViewQuotesOrder] = useState(null);

  // Active verified sellers
  const verifiedSellers = useMemo(() => {
    return (sellers || []).filter(s => 
      s.status === 'Verified' || s.status === 'approved' || s.status === 'Active'
    );
  }, [sellers]);

  const filteredSellersForModal = useMemo(() => {
    if (!sellerSearchQuery.trim()) return verifiedSellers;
    const q = sellerSearchQuery.toLowerCase();
    return verifiedSellers.filter(s => 
      (s.storeName || s.businessName || '').toLowerCase().includes(q) ||
      (s.ownerName || s.name || '').toLowerCase().includes(q) ||
      (s.city || '').toLowerCase().includes(q)
    );
  }, [verifiedSellers, sellerSearchQuery]);

  // Filtered Bulk Orders
  const filteredOrders = useMemo(() => {
    return (schoolOrders || []).filter(order => {
      const statusMatch = 
        statusFilter === 'All' ||
        (statusFilter === 'Pending' && (order.status === 'pending' || order.status === 'under_review')) ||
        (statusFilter === 'Distributed' && (order.status === 'published' || order.status === 'assigned')) ||
        (statusFilter === 'Quoted' && (order.status === 'quoted' || (order.quotations && order.quotations.length > 0))) ||
        (statusFilter === 'Accepted' && order.status === 'quote_accepted');

      const q = searchTerm.toLowerCase();
      const nameMatch = 
        (order.institutionName || order.schoolName || '').toLowerCase().includes(q) ||
        (order.contactName || order.contactPerson || '').toLowerCase().includes(q) ||
        (order.referenceId || '').toLowerCase().includes(q) ||
        (order.city || '').toLowerCase().includes(q);

      return statusMatch && nameMatch;
    });
  }, [schoolOrders, statusFilter, searchTerm]);

  // Handle Submit Distribution
  const handleConfirmDistribution = (e) => {
    e.preventDefault();
    if (!distributeModalOrder) return;

    if (distributeMode === 'direct' && !selectedSingleSeller) {
      alert('Please select a seller to assign this order to.');
      return;
    }

    if (distributeMode === 'selected' && selectedMultipleSellers.length === 0) {
      alert('Please select at least one seller to invite.');
      return;
    }

    distributeSchoolBulkOrder(distributeModalOrder.id || distributeModalOrder._id, {
      assignmentMode: distributeMode,
      sellerId: distributeMode === 'direct' ? selectedSingleSeller : null,
      invitedSellerIds: distributeMode === 'selected' ? selectedMultipleSellers : []
    });

    setDistributeModalOrder(null);
  };

  // Open Distribution Modal
  const handleOpenDistribute = (order) => {
    setDistributeModalOrder(order);
    setDistributeMode(order.assignmentMode || 'direct');
    setSelectedSingleSeller(order.sellerId ? (order.sellerId._id || order.sellerId.id || order.sellerId) : '');
    setSelectedMultipleSellers((order.invitedSellerIds || []).map(s => (s._id || s.id || s)));
    setSellerSearchQuery('');
  };

  // Toggle seller selection for multi-invite mode
  const toggleSellerSelect = (sellerId) => {
    setSelectedMultipleSellers(prev => 
      prev.includes(sellerId) ? prev.filter(id => id !== sellerId) : [...prev, sellerId]
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="text-teal-700" size={24} /> School & Institutional Bulk Orders Management
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Receive customer bulk inquiries, assign directly to specific sellers, invite selected vendors, or broadcast globally to receive price quotations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200">
            {schoolOrders.length} Total Bulk Inquiries
          </span>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-400 uppercase">Pending Review</div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">
            {schoolOrders.filter(o => o.status === 'pending' || !o.assignmentMode || o.assignmentMode === 'unassigned').length}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">Awaiting Admin distribution</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-400 uppercase">Active RFQ Invitations</div>
          <div className="text-2xl font-extrabold text-blue-600 mt-1">
            {schoolOrders.filter(o => o.status === 'published' || o.status === 'assigned').length}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">Distributed to Sellers</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-400 uppercase">Quotations Received</div>
          <div className="text-2xl font-extrabold text-purple-600 mt-1">
            {schoolOrders.filter(o => o.quotations && o.quotations.length > 0).length}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">Sellers submitted counter-offers</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-400 uppercase">Quotes Accepted / Assigned</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            {schoolOrders.filter(o => o.status === 'quote_accepted').length}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Finalized for fulfillment</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl shadow-xs border border-gray-100">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search school name, reference ID, city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {['All', 'Pending', 'Distributed', 'Quoted', 'Accepted'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 text-gray-400">
            <Building2 size={40} className="mx-auto mb-2 text-gray-300" />
            <h4 className="font-bold text-gray-700 text-sm">No School Bulk Orders Found</h4>
            <p className="text-xs text-gray-400 mt-1">Inquiries submitted by schools will appear here.</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const hasQuotes = Array.isArray(order.quotations) && order.quotations.length > 0;
            const quoteCount = order.quotations ? order.quotations.length : 0;

            return (
              <div
                key={order.id || order._id}
                className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs hover:border-teal-200 transition-all space-y-4"
              >
                {/* Card Top Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
                        {order.referenceId || `SCH-${order.id}`}
                      </span>
                      <h3 className="font-bold text-gray-900 text-base">
                        {order.institutionName || order.schoolName}
                      </h3>
                      {order.institutionType && (
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                          {order.institutionType}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-1.5">
                      <span className="flex items-center gap-1">
                        <UserCheck size={13} className="text-gray-400" />
                        {order.contactName || order.contactPerson} ({order.contactPhone})
                      </span>
                      {order.contactEmail && (
                        <span className="flex items-center gap-1">
                          <Mail size={13} className="text-gray-400" /> {order.contactEmail}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-teal-700 font-medium">
                        <MapPin size={13} /> {order.city}, {order.state}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      order.status === 'quote_accepted'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : order.status === 'quoted' || hasQuotes
                        ? 'bg-purple-50 text-purple-800 border-purple-200'
                        : order.status === 'published' || order.status === 'assigned'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {order.status === 'quote_accepted' ? 'Quote Accepted & Assigned' :
                       order.status === 'quoted' || hasQuotes ? `${quoteCount} Quotation(s) Received` :
                       order.status === 'published' ? 'Published for Bidding' :
                       order.status === 'assigned' ? 'Assigned to Seller' : 'Pending Distribution'}
                    </span>
                  </div>
                </div>

                {/* Requirement Demand Items */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50/80 p-4 rounded-xl text-xs">
                  <div className="md:col-span-2">
                    <div className="text-gray-400 font-semibold text-[11px] uppercase">Demanded Requirement Items</div>
                    <div className="font-bold text-gray-900 mt-1">
                      {order.requirementSummary || order.additionalNotes || 'Bulk uniform sets & stationery'}
                    </div>
                    {order.additionalNotes && (
                      <div className="text-[11px] text-gray-500 italic mt-1">"{order.additionalNotes}"</div>
                    )}
                  </div>

                  <div>
                    <div className="text-gray-400 font-semibold text-[11px] uppercase">Quantity & Budget</div>
                    <div className="font-extrabold text-gray-900 text-sm mt-1">
                      {order.totalQuantity || order.quantity || 100} Units
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Target Budget: {(order.targetBudgetPerKit || order.estimatedBudget) && Number(order.targetBudgetPerKit || order.estimatedBudget) > 0 ? `₹${Number(order.targetBudgetPerKit || order.estimatedBudget).toLocaleString()}` : 'Open to Quotes'}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-400 font-semibold text-[11px] uppercase">Distribution Mode</div>
                    <div className="mt-1 flex items-center gap-1.5 font-bold text-gray-800">
                      {order.assignmentMode === 'direct' && <><UserCheck size={14} className="text-blue-600" /> Direct Seller</>}
                      {order.assignmentMode === 'selected' && <><Users size={14} className="text-purple-600" /> Selected Sellers ({order.invitedSellerIds?.length || 0})</>}
                      {order.assignmentMode === 'broadcast' && <><Globe size={14} className="text-teal-600" /> Global Broadcast</>}
                      {(!order.assignmentMode || order.assignmentMode === 'unassigned') && (
                        <span className="text-amber-700 font-semibold flex items-center gap-1">
                          <AlertCircle size={13} /> Unassigned
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Seller Quotations Summary Bar */}
                {hasQuotes && (
                  <div className="bg-purple-50/60 border border-purple-200/70 p-3 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-purple-600" />
                      <span className="font-bold text-purple-900">
                        {quoteCount} Seller Quotations Submitted
                      </span>
                      <span className="text-[11px] text-purple-700">
                        (Lowest Quote: ₹{Math.min(...order.quotations.map(q => Number(q.quoteAmount))).toLocaleString()})
                      </span>
                    </div>

                    <button
                      onClick={() => setViewQuotesOrder(order)}
                      className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                    >
                      <span>Review Quotations</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}

                {/* Footer Action Buttons */}
                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-gray-400">
                    Created: {new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewOrder(order)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-teal-200"
                    >
                      <Eye size={14} />
                      <span>Expanded Detail</span>
                    </button>

                    <button
                      onClick={() => handleOpenDistribute(order)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      <Send size={14} />
                      <span>{order.assignmentMode && order.assignmentMode !== 'unassigned' ? 'Change Distribution Mode' : 'Distribute Order to Sellers'}</span>
                    </button>

                    {hasQuotes && (
                      <button
                        onClick={() => setViewQuotesOrder(order)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        <FileText size={14} />
                        <span>View Quotes ({quoteCount})</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* ========================================== */}
      {/* MODAL 1: ADMIN DISTRIBUTION MODAL (3 OPTIONS) */}
      {/* ========================================== */}
      {distributeModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 text-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h4 className="font-bold text-gray-900 text-base">Distribute School Bulk Order</h4>
                <p className="text-[11px] text-teal-800 font-bold mt-0.5">
                  {distributeModalOrder.institutionName || distributeModalOrder.schoolName} ({distributeModalOrder.referenceId})
                </p>
              </div>
              <button onClick={() => setDistributeModalOrder(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {/* 3 Distribution Option Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-gray-100 rounded-xl">
              <button
                type="button"
                onClick={() => setDistributeMode('direct')}
                className={`py-2 px-3 rounded-lg font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  distributeMode === 'direct'
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <UserCheck size={16} />
                <span>1. Direct Specific Seller</span>
              </button>

              <button
                type="button"
                onClick={() => setDistributeMode('selected')}
                className={`py-2 px-3 rounded-lg font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  distributeMode === 'selected'
                    ? 'bg-white text-purple-800 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users size={16} />
                <span>2. Selected Sellers</span>
              </button>

              <button
                type="button"
                onClick={() => setDistributeMode('broadcast')}
                className={`py-2 px-3 rounded-lg font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  distributeMode === 'broadcast'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Globe size={16} />
                <span>3. Global Broadcast</span>
              </button>
            </div>

            <form onSubmit={handleConfirmDistribution} className="space-y-4">
              
              {/* OPTION A: DIRECT ASSIGNMENT */}
              {distributeMode === 'direct' && (
                <div className="space-y-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <div className="text-xs text-blue-900 font-semibold">
                    Select a single specific seller from the list of approved vendors to assign this bulk order directly.
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Choose Seller *</label>
                    <select
                      value={selectedSingleSeller}
                      onChange={(e) => setSelectedSingleSeller(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600 text-xs bg-white font-medium"
                      required
                    >
                      <option value="">-- Select Approved Seller --</option>
                      {verifiedSellers.map((s) => (
                        <option key={s.id || s._id} value={s.id || s._id}>
                          {s.storeName || s.businessName || s.name} ({s.ownerName || s.name}) - {s.city || 'Delhi'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* OPTION B: INVITE SELECTED SELLERS */}
              {distributeMode === 'selected' && (
                <div className="space-y-3 bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                  <div className="text-xs text-purple-900 font-semibold flex items-center justify-between">
                    <span>Select multiple sellers to invite and accept this bulk order:</span>
                    <span className="font-mono text-purple-800 font-extrabold bg-purple-100 px-2 py-0.5 rounded">
                      {selectedMultipleSellers.length} Selected
                    </span>
                  </div>

                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search seller by name or city..."
                      value={sellerSearchQuery}
                      onChange={(e) => setSellerSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 bg-white text-xs focus:outline-none"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-gray-200 bg-white rounded-xl p-2">
                    {filteredSellersForModal.length === 0 ? (
                      <div className="text-center py-4 text-gray-400">No sellers match your search.</div>
                    ) : (
                      filteredSellersForModal.map((seller) => {
                        const sId = seller.id || seller._id;
                        const isChecked = selectedMultipleSellers.includes(sId);
                        return (
                          <label
                            key={sId}
                            onClick={() => toggleSellerSelect(sId)}
                            className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-purple-50 border-purple-300 text-purple-900 font-semibold'
                                : 'bg-white border-gray-100 hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}} // Handled by div click
                                className="accent-purple-700 rounded"
                              />
                              <div>
                                <div className="font-bold">{seller.storeName || seller.businessName || seller.name}</div>
                                <div className="text-[10px] text-gray-400">{seller.ownerName} • {seller.city || 'Delhi'}</div>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-gray-400">{seller.phone}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* OPTION C: GLOBAL BROADCAST */}
              {distributeMode === 'broadcast' && (
                <div className="space-y-2 bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                    <Globe size={16} /> Global Marketplace Broadcast
                  </div>
                  <p className="text-emerald-800 leading-relaxed">
                    This order will be published globally to all verified sellers in the marketplace. Every seller will receive a notification and have the option to accept or submit a counter quotation.
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setDistributeModalOrder(null)}
                  className="flex-1 py-2.5 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs cursor-pointer"
                >
                  Confirm & Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 2: VIEW & APPROVE SELLER QUOTATIONS */}
      {/* ========================================== */}
      {viewQuotesOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h4 className="font-bold text-gray-900 text-base">Seller Quotations & Negotiations</h4>
                <p className="text-[11px] text-purple-800 font-bold mt-0.5">
                  {viewQuotesOrder.institutionName || viewQuotesOrder.schoolName} ({viewQuotesOrder.referenceId})
                </p>
              </div>
              <button onClick={() => setViewQuotesOrder(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {(!viewQuotesOrder.quotations || viewQuotesOrder.quotations.length === 0) ? (
                <div className="text-center py-8 text-gray-400">No quotations submitted by sellers yet.</div>
              ) : (
                viewQuotesOrder.quotations.map((quote) => {
                  const qId = quote._id || quote.id;
                  const isApproved = quote.status === 'approved' || String(viewQuotesOrder.acceptedQuoteId) === String(qId);

                  return (
                    <div
                      key={qId}
                      className={`p-4 rounded-xl border transition-all space-y-3 ${
                        isApproved
                          ? 'bg-emerald-50/70 border-emerald-300'
                          : 'bg-white border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-extrabold text-sm text-gray-900">
                            {quote.sellerStoreName || quote.sellerName}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {quote.sellerPhone} • {quote.sellerCity}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-extrabold text-base text-teal-800">
                            ₹{Number(quote.quoteAmount).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            ₹{quote.unitPrice || Math.round(quote.quoteAmount / (viewQuotesOrder.totalQuantity || 100))} / unit
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                        <div>
                          <span className="text-gray-400 font-medium">Estimated Delivery:</span>
                          <span className="font-bold text-gray-800 ml-1">{quote.estimatedDeliveryDays || 7} Days</span>
                        </div>
                        <div>
                          <span className="text-gray-400 font-medium">Submitted On:</span>
                          <span className="font-bold text-gray-800 ml-1">
                            {new Date(quote.submittedAt || Date.now()).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                        {quote.notes && (
                          <div className="col-span-2 text-gray-600 italic">
                            "{quote.notes}"
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        {isApproved ? (
                          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1">
                            <CheckCircle2 size={14} /> Approved & Winning Seller Quote
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400">Status: {quote.status}</span>
                        )}

                        {!isApproved && (
                          <button
                            onClick={() => {
                              approveSellerQuotation(viewQuotesOrder.id || viewQuotesOrder._id, qId);
                              setViewQuotesOrder(null);
                            }}
                            className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                          >
                            Approve Quote & Assign
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setViewQuotesOrder(null)}
                className="px-5 py-2 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 3: EXPANDED BULK ORDER PREVIEW MODAL */}
      {/* ========================================== */}
      <BulkOrderPreviewModal
        order={previewOrder}
        onClose={() => setPreviewOrder(null)}
        userRole="admin"
        sellers={sellers}
        onDistribute={(orderId, payload) => {
          distributeSchoolBulkOrder(orderId, payload);
          setPreviewOrder(null);
        }}
        onApproveQuote={(orderId, quoteId) => {
          approveSellerQuotation(orderId, quoteId);
          setPreviewOrder(null);
        }}
      />

    </div>
  );
}
