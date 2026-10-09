import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Eye, 
  Truck, 
  CheckCircle, 
  RotateCcw, 
  Ban, 
  Building2,
  Calendar,
  DollarSign,
  Lock,
  AlertCircle,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';
import OrderDetailModal, { hasActiveReturnRequest } from '../modals/OrderDetailModal';
import BulkOrderPreviewModal from './BulkOrderPreviewModal';

export const isOutForDelivery = (status) => {
  if (!status) return false;
  const s = String(status).trim().toLowerCase().replace(/_/g, ' ');
  return s === 'out for delivery' || s === 'delivered';
};

export const isDeliveryPartnerDecided = (order) => {
  if (!order) return false;
  const mode = String(order.deliveryMode || order.deliveryType || '').toLowerCase();
  const isSelf = mode === 'self_delivery' || mode === 'self' || Boolean(order.selfDeliveryDetails?.deliveryPartnerToken || order.selfDeliveryDetails?.deliveryPersonName);
  const validCourier = Boolean(order.courierName && order.courierName !== 'N/A');
  const isThirdParty = mode === 'third_party' || Boolean(validCourier || order.thirdPartyDetails?.courierName);
  if (isSelf) {
    return Boolean(order.selfDeliveryDetails?.deliveryPersonName || order.selfDeliveryDetails?.deliveryPartnerToken || mode === 'self_delivery' || mode === 'self');
  }
  if (isThirdParty) {
    return Boolean(validCourier || order.thirdPartyDetails?.courierName);
  }
  return Boolean(order.deliveryPartner || validCourier || order.selfDeliveryDetails?.deliveryPersonName);
};

export const canViewTracking = (order) => {
  return isOutForDelivery(order?.status) && isDeliveryPartnerDecided(order);
};

export const isReturnOrExchangeOrder = (o) => {
  return hasActiveReturnRequest(o);
};

export default function OrdersTab() {
  const { 
    orders, 
    schoolOrders, 
    updateOrderStatus, 
    updateReturnExchangeStatus, 
    cancelOrder, 
    refundOrder, 
    updateOrderTracking,
    distributeSchoolBulkOrder,
    approveSellerQuotation,
    updateSchoolOrderStatusAndTracking,
    sellers,
    isEditor 
  } = useAdminData();

  const canEdit = isEditor ? isEditor('orders') : true;

  const [orderType, setOrderType] = useState('retail'); // 'retail', 'returns', 'school'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBulkOrder, setSelectedBulkOrder] = useState(null);

  const activeModalOrder = useMemo(() => {
    if (!selectedOrder) return null;
    const sId = selectedOrder._id || selectedOrder.id || selectedOrder.orderId;
    return (orders || []).find(o => o._id === sId || o.id === sId || o.orderId === sId) || selectedOrder;
  }, [orders, selectedOrder]);

  const returnRequestsCount = useMemo(() => {
    return (orders || []).filter(isReturnOrExchangeOrder).length;
  }, [orders]);

  // Filter regular retail orders
  const filteredRetailOrders = useMemo(() => {
    return (orders || []).filter(o => {
      const searchLower = searchTerm.toLowerCase();
      const custName = typeof o.customerName === 'object' ? (o.customerName?.name || '') : String(o.customerName || '');
      const matchesSearch = !searchTerm ||
                            o.id.toLowerCase().includes(searchLower) ||
                            custName.toLowerCase().includes(searchLower) ||
                            (o.trackingNumber && o.trackingNumber.toLowerCase().includes(searchLower)) ||
                            (o.school && o.school.toLowerCase().includes(searchLower));

      if (!matchesSearch) return false;

      if (statusFilter === 'all') return true;
      if (statusFilter === 'returns_exchanges') {
        return isReturnOrExchangeOrder(o);
      }

      const normStatus = String(o.status || '').toLowerCase().replace(/_/g, ' ');
      const normFilter = String(statusFilter).toLowerCase().replace(/_/g, ' ');
      return o.status === statusFilter || 
             o.rawStatus === statusFilter || 
             normStatus === normFilter ||
             (o.returnRequest && (o.returnRequest.status === statusFilter || o.returnRequest.status === statusFilter.toLowerCase().replace(/ /g, '_')));
    });
  }, [orders, searchTerm, statusFilter]);

  // Filter returns & exchanges orders
  const filteredReturnOrders = useMemo(() => {
    return (orders || []).filter(o => {
      if (!isReturnOrExchangeOrder(o)) return false;

      const searchLower = searchTerm.toLowerCase();
      const custName = typeof o.customerName === 'object' ? (o.customerName?.name || '') : String(o.customerName || '');
      const returnReason = String(o.returnRequest?.reason || '').toLowerCase();
      const targetSize = String(o.returnRequest?.targetSize || '').toLowerCase();

      const matchesSearch = !searchTerm ||
                            o.id.toLowerCase().includes(searchLower) ||
                            custName.toLowerCase().includes(searchLower) ||
                            returnReason.includes(searchLower) ||
                            targetSize.includes(searchLower) ||
                            (o.school && o.school.toLowerCase().includes(searchLower)) ||
                            (o.returnRequest?.refundTxnId && o.returnRequest.refundTxnId.toLowerCase().includes(searchLower)) ||
                            (o.returnRequest?.exchangeAwb && o.returnRequest.exchangeAwb.toLowerCase().includes(searchLower));

      if (!matchesSearch) return false;

      if (statusFilter === 'all' || statusFilter === 'returns_exchanges') return true;

      const normFilter = String(statusFilter).toLowerCase().replace(/ /g, '_');
      const reqStatus = String(o.returnRequest?.status || '').toLowerCase().replace(/ /g, '_');
      const orderStatus = String(o.status || '').toLowerCase().replace(/ /g, '_');

      return reqStatus === normFilter || 
             reqStatus.replace(/_/g, ' ') === normFilter.replace(/_/g, ' ') ||
             orderStatus === normFilter ||
             orderStatus.replace(/_/g, ' ') === normFilter.replace(/_/g, ' ');
    });
  }, [orders, searchTerm, statusFilter]);

  // Filter school bulk orders
  const filteredSchoolOrders = useMemo(() => {
    return (schoolOrders || []).filter(s => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm ||
                            (s.schoolName || s.institutionName || '').toLowerCase().includes(q) ||
                            (s.contactPerson || s.contactName || '').toLowerCase().includes(q) ||
                            (s.id || '').toLowerCase().includes(q) ||
                            (s.referenceId || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (statusFilter === 'all') return true;
      const sStatus = String(s.status || '').toLowerCase();
      const normFilter = String(statusFilter).toLowerCase();
      return sStatus === normFilter ||
             (normFilter === 'quote_accepted' && (s.status === 'quote_accepted' || s.acceptedQuoteId));
    });
  }, [schoolOrders, searchTerm, statusFilter]);

  const handleOpenDetail = (order) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Heading */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-2xl text-gray-900 flex items-center gap-2">
            <ShoppingBag className="text-teal-700" size={24} /> Marketplace Orders Management
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Full oversight of customer retail checkouts, institutional school bulk POs, shipment tracking, returns, exchanges & refunds.
          </p>
        </div>

        {/* Order Type Toggle */}
        <div className="bg-gray-200/80 p-1 rounded-xl flex items-center gap-1">
          <button
            onClick={() => {
              setOrderType('retail');
              setStatusFilter('all');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              orderType === 'retail' ? 'bg-white text-teal-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Retail Orders ({orders.length})
          </button>
          <button
            onClick={() => {
              setOrderType('returns');
              setStatusFilter('all');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              orderType === 'returns' ? 'bg-white text-amber-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <RotateCcw size={13} className="text-amber-600" /> Returns & Exchanges ({returnRequestsCount})
          </button>
          <button
            onClick={() => {
              setOrderType('school');
              setStatusFilter('all');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              orderType === 'school' ? 'bg-white text-teal-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            School Bulk POs ({schoolOrders.length})
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={
              orderType === 'school'
                ? "Search school name or contact..."
                : orderType === 'returns'
                ? "Search by order ID, customer, reason, size or AWB..."
                : "Search order ID, customer or tracking..."
            }
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 bg-white focus:ring-2 focus:ring-brand-yellow outline-hidden cursor-pointer"
          >
            {orderType === 'retail' && (
              <>
                <option value="all">All Order Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Shipped">Shipped</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
                <option value="returns_exchanges">Return / Exchange Requests</option>
              </>
            )}
            {orderType === 'returns' && (
              <>
                <option value="all">All Return & Exchange Statuses</option>
                <option value="return_requested">Return Requested</option>
                <option value="exchange_requested">Exchange Requested</option>
                <option value="return_approved">Return Approved</option>
                <option value="exchange_approved">Exchange Approved</option>
                <option value="pickup_scheduled">Pickup Scheduled</option>
                <option value="product_received">Product Received</option>
                <option value="refund_completed">Refund Completed</option>
                <option value="exchange_dispatched">Exchange Dispatched</option>
                <option value="exchanged">Exchanged</option>
                <option value="rejected">Rejected</option>
              </>
            )}
            {orderType === 'school' && (
              <>
                <option value="all">All PO Statuses</option>
                <option value="pending">Pending</option>
                <option value="quote_accepted">Quote Accepted</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Orders View */}
      {orderType === 'school' ? (
        /* School Bulk Orders View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSchoolOrders.map((sch) => {
            const hasWinningQuote = sch.status === 'quote_accepted' || sch.acceptedQuoteId || (Array.isArray(sch.quotations) && sch.quotations.some(q => q.status === 'approved'));
            const winningQuote = Array.isArray(sch.quotations) ? sch.quotations.find(q => q.status === 'approved' || String(q._id) === String(sch.acceptedQuoteId)) : null;

            return (
              <div key={sch.id} className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-gray-900">{sch.schoolName}</h4>
                        <div className="text-[11px] text-gray-500">{sch.contactPerson} • {sch.contactPhone}</div>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      hasWinningQuote ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {hasWinningQuote ? 'Quote Accepted' : sch.status}
                    </span>
                  </div>

                  {/* Winning Quote Banner */}
                  {hasWinningQuote && (
                    <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Sparkles size={14} className="text-emerald-700" />
                        <span>Winning Quotation Accepted by Buyer</span>
                      </div>
                      <span className="font-mono font-black text-emerald-900">
                        ₹{Number(winningQuote?.quoteAmount || sch.quoteAmount || sch.estimatedBudget || 0).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Logistics Tracking on Bulk PO card when quote accepted */}
                  {(() => {
                    const normStatus = String(sch.deliveryStatus || sch.status || '').toLowerCase().replace(/_/g, ' ');
                    const isOut = normStatus === 'out for delivery' || normStatus === 'delivered';
                    const isSelf = String(sch.deliveryMode || '').toLowerCase().includes('self') || Boolean(sch.selfDeliveryDetails?.deliveryPartnerToken || sch.selfDeliveryDetails?.deliveryPersonName);
                    const isThirdParty = String(sch.deliveryMode || '').toLowerCase().includes('third') || Boolean(sch.courierName);
                    const hasPartner = isSelf || isThirdParty || Boolean(sch.courierName || sch.selfDeliveryDetails?.deliveryPersonName);
                    const canViewTracking = isOut && hasPartner && Boolean(sch.trackingNumber || sch.selfDeliveryDetails?.deliveryPartnerToken);

                    if (canViewTracking) {
                      const trackNum = sch.trackingNumber || sch.selfDeliveryDetails?.deliveryPartnerToken;
                      const trackLink = sch.trackingUrl || sch.selfDeliveryDetails?.trackingUrl;
                      return (
                        <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between text-xs text-teal-900">
                          <div className="flex items-center gap-1.5 font-bold">
                            <Truck size={14} className="text-teal-700" />
                            <span>{isSelf ? '🛵 Self-Delivery' : `🚚 ${sch.courierName || 'Courier'}`}:</span>
                            <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-teal-200">{trackNum}</span>
                          </div>
                          {trackLink && (
                            <a
                              href={trackLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-teal-700 hover:text-teal-900 font-bold underline flex items-center gap-0.5 text-[11px]"
                            >
                              Track <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      );
                    } else if (hasWinningQuote) {
                      return (
                        <div className="p-2 bg-gray-50 border border-gray-200 rounded-xl text-[10px] text-gray-500 flex items-center gap-1.5">
                          <Lock size={12} className="text-gray-400" />
                          <span>
                            {isOut ? 'Out for Delivery (Delivery partner pending)' : 'Tracking available once Out for Delivery & partner decided'}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-700">
                    <div className="font-semibold text-gray-900 mb-1">Requirement Summary:</div>
                    {sch.requirementSummary}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 text-center">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <div className="text-[10px] text-gray-400 font-bold uppercase">Volume</div>
                      <div className="font-bold text-xs text-gray-800 mt-0.5">{sch.quantity} Units</div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <div className="text-[10px] text-gray-400 font-bold uppercase">Quoted Val</div>
                      <div className="font-bold text-xs text-emerald-700 mt-0.5">₹{sch.quoteAmount?.toLocaleString()}</div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <div className="text-[10px] text-gray-400 font-bold uppercase">Target Date</div>
                      <div className="font-bold text-xs text-gray-800 mt-0.5">{sch.deadline || sch.targetDeliveryDate || 'Flexible'}</div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-[11px] text-gray-500 font-mono">
                    Ref: {sch.referenceId || sch.id}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedBulkOrder(sch)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Eye size={13} /> View & Manage PO
                  </button>
                </div>
              </div>
            );
          })}

          {filteredSchoolOrders.length === 0 && (
            <div className="col-span-full bg-white rounded-2xl border border-gray-200/80 p-12 text-center text-gray-400 text-xs space-y-2">
              <Building2 size={28} className="mx-auto text-gray-300" />
              <div className="font-bold text-gray-600">No school bulk orders found</div>
              <p className="text-[11px] text-gray-400">
                Try adjusting your search query or status filter.
              </p>
            </div>
          )}
        </div>
      ) : orderType === 'returns' ? (
        /* Returns & Exchanges View */
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-amber-50/60 text-gray-700 font-bold uppercase text-[10px] tracking-wider border-b border-amber-100">
                <tr>
                  <th className="px-4 py-3">Order ID & Date</th>
                  <th className="px-4 py-3">Customer & School</th>
                  <th className="px-4 py-3">Request Type</th>
                  <th className="px-4 py-3">Reason / Details</th>
                  <th className="px-4 py-3">Return Status</th>
                  <th className="px-4 py-3">Resolution / Tracking</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredReturnOrders.map((order) => {
                  const req = order.returnRequest;
                  const isExchange = req?.requestType === 'exchange' || String(order.status).toLowerCase().includes('exchange');
                  const statusKey = String(req?.status || order.status || '').toLowerCase().replace(/ /g, '_');
                  
                  return (
                    <tr key={order.id} className="hover:bg-amber-50/30 transition-colors">
                      {/* Order ID & Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-gray-900 font-mono">{order.id}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{order.date}</div>
                        {req?.requestedAt && (
                          <div className="text-[9px] text-amber-700 font-semibold mt-0.5">
                            Req: {new Date(req.requestedAt).toLocaleDateString('en-IN')}
                          </div>
                        )}
                      </td>

                      {/* Customer & School */}
                      <td className="px-4 py-3">
                        <div className="font-bold text-gray-900">{order.customerName}</div>
                        <div className="text-[10px] text-teal-700 font-medium truncate max-w-xs">{order.school}</div>
                        {order.customerPhone && (
                          <div className="text-[10px] text-gray-400">{order.customerPhone}</div>
                        )}
                      </td>

                      {/* Request Type */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isExchange ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
                              <RotateCcw size={10} className="text-purple-600" /> Size Exchange
                            </span>
                            {req?.targetSize && (
                              <div className="text-[10px] font-bold text-purple-900">
                                Target Size: <span className="underline">{req.targetSize}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                              <RotateCcw size={10} className="text-amber-600" /> Return & Refund
                            </span>
                            <div className="text-[10px] font-bold text-teal-950 font-display">
                              ₹{order.total}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Reason / Details */}
                      <td className="px-4 py-3 max-w-xs">
                        <div className="font-semibold text-gray-800 text-xs line-clamp-2" title={req?.reason || 'Customer requested return'}>
                          {req?.reason || 'Customer requested return'}
                        </div>
                        {req?.rejectionReason && (
                          <div className="text-[10px] font-bold text-rose-700 mt-0.5" title={`Rejection Reason: ${req.rejectionReason}`}>
                            Rejected: {req.rejectionReason}
                          </div>
                        )}
                      </td>

                      {/* Return Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                          statusKey.includes('approved') ? 'bg-blue-100 text-blue-900 border-blue-300' :
                          statusKey.includes('completed') || statusKey === 'exchanged' || statusKey === 'refund_completed' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                          statusKey === 'rejected' ? 'bg-rose-100 text-rose-900 border-rose-300' :
                          statusKey === 'pickup_scheduled' ? 'bg-indigo-100 text-indigo-900 border-indigo-300' :
                          statusKey === 'product_received' ? 'bg-purple-100 text-purple-900 border-purple-300' :
                          statusKey === 'exchange_dispatched' ? 'bg-teal-100 text-teal-900 border-teal-300' :
                          'bg-amber-100 text-amber-900 border-amber-300'
                        }`}>
                          {(req?.status || order.status || 'Pending').replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Resolution / Tracking */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        {req?.pickupDate && (
                          <div className="text-[11px] text-gray-700">
                            <span className="font-bold text-gray-500">Pickup: </span>
                            {new Date(req.pickupDate).toLocaleDateString('en-IN')}
                          </div>
                        )}
                        {req?.refundTxnId && (
                          <div className="text-[11px]">
                            <span className="font-bold text-gray-500">Txn: </span>
                            <span className="font-mono font-bold text-emerald-700">{req.refundTxnId}</span>
                          </div>
                        )}
                        {req?.exchangeAwb && (
                          <div className="text-[11px]">
                            <span className="font-bold text-gray-500">AWB: </span>
                            <span className="font-mono font-bold text-blue-700">{req.exchangeAwb}</span>
                            <span className="text-[10px] text-gray-400 ml-1">({req.exchangeCourier || 'Courier'})</span>
                          </div>
                        )}
                        {!req?.pickupDate && !req?.refundTxnId && !req?.exchangeAwb && (
                          <span className="text-gray-400 text-[11px]">Awaiting action</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleOpenDetail(order)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-amber-200"
                        >
                          <RotateCcw size={13} /> Manage Request
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredReturnOrders.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-4 py-12 text-center text-gray-400 text-xs">
                      <div className="max-w-xs mx-auto space-y-2">
                        <RotateCcw size={28} className="mx-auto text-gray-300" />
                        <div className="font-bold text-gray-600">No return or exchange requests found</div>
                        <p className="text-[11px] text-gray-400">
                          Customer return and exchange requests will appear here once initiated.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Retail Orders View */
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Customer & School</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Tracking Number</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredRetailOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/70 transition-colors">
                    
                    {/* Order ID & Date */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-bold text-gray-900 font-mono">{order.id}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{order.date}</div>
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-900">{order.customerName}</div>
                      <div className="text-[10px] text-teal-700 font-medium truncate max-w-xs">{order.school}</div>
                    </td>

                    {/* Items */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-bold text-gray-800">{order.itemsCount || order.items?.length || 1} item(s)</span>
                    </td>

                    {/* Total & Payment */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-extrabold text-teal-950 font-display">₹{order.total}</div>
                      <div className="text-[10px] text-gray-500 font-semibold">{order.paymentMethod}</div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col items-start gap-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                          order.status === 'Cancelled' ? 'bg-rose-100 text-rose-800' :
                          (order.status === 'Out for Delivery' || order.status === 'out_for_delivery') ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                          order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {order.status}
                        </span>
                        {hasActiveReturnRequest(order) && (
                          <span className="text-[9px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                            <RotateCcw size={9} /> {order.returnRequest.requestType === 'exchange' ? 'Exchange Req' : 'Return Req'}
                          </span>
                        )}
                        {(order.status === 'Cancelled' || order.cancellationReason) && (
                          <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 truncate max-w-[130px]" title={`Cancelled by ${order.cancelledBy || 'Customer'}. Reason: ${order.cancellationReason || 'Customer requested cancellation'}`}>
                            Reason: {order.cancellationReason || 'Cancelled'}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Tracking - ONLY seen when product is out for delivery AND delivery partner decided */}
                    <td className="px-4 py-3 whitespace-nowrap text-xs">
                      {(() => {
                        const isOut = isOutForDelivery(order.status);
                        const hasPartner = isDeliveryPartnerDecided(order);

                        if (!isOut) {
                          return (
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500 border border-gray-200"
                              title="Tracking number is hidden until product is marked Out for Delivery"
                            >
                              <Lock size={10} className="text-gray-400" /> Awaiting Out for Delivery
                            </span>
                          );
                        }

                        if (!hasPartner) {
                          return (
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200"
                              title="Delivery partner (3rd-party courier or self-delivery) not decided yet"
                            >
                              <AlertCircle size={10} className="text-amber-600" /> Partner Not Decided
                            </span>
                          );
                        }

                        // Both Out for Delivery AND Delivery Partner Decided!
                        const isSelf = String(order.deliveryMode || order.deliveryType || '').toLowerCase().includes('self') || Boolean(order.selfDeliveryDetails?.deliveryPartnerToken);
                        const trackingNo = order.trackingNumber || (isSelf ? order.selfDeliveryDetails?.deliveryPartnerToken : order.thirdPartyDetails?.trackingNumber) || 'Assigned';
                        const trackingUrl = order.trackingUrl || order.selfDeliveryDetails?.trackingUrl || order.thirdPartyDetails?.trackingUrl;
                        const partnerName = isSelf
                          ? (order.selfDeliveryDetails?.deliveryPersonName ? `Rider: ${order.selfDeliveryDetails.deliveryPersonName}` : 'Store Fleet')
                          : (order.courierName || order.thirdPartyDetails?.courierName || '3rd-Party Courier');

                        return (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 font-mono font-bold text-gray-900 text-xs">
                              <span>{trackingNo}</span>
                              {trackingUrl && (
                                <a
                                  href={trackingUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-teal-700 hover:text-teal-900 transition-colors cursor-pointer"
                                  title="Open Direct Live Tracking"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink size={11} />
                                </a>
                              )}
                            </div>
                            <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                              isSelf ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'bg-blue-50 text-blue-800 border border-blue-200'
                            }`}>
                              {isSelf ? `🛵 ${partnerName}` : `🚚 ${partnerName}`}
                            </span>
                          </div>
                        );
                      })()}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenDetail(order)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Eye size={13} /> View & Manage
                      </button>
                    </td>

                  </tr>
                ))}

                {filteredRetailOrders.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-4 py-12 text-center text-gray-400 text-xs">
                      <div className="max-w-xs mx-auto space-y-2">
                        <ShoppingBag size={28} className="mx-auto text-gray-300" />
                        <div className="font-bold text-gray-600">No retail orders found</div>
                        <p className="text-[11px] text-gray-400">
                          Try adjusting your search query or status filter.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedOrder(null);
        }}
        order={activeModalOrder}
        onUpdateStatus={async (ordId, st, extra) => {
          const updated = await updateOrderStatus(ordId, st, extra);
          if (updated) {
            setSelectedOrder(updated);
          }
        }}
        onUpdateTracking={updateOrderTracking}
        onCancelOrder={cancelOrder}
        onRefundOrder={refundOrder}
        onUpdateReturnExchangeStatus={updateReturnExchangeStatus}
        readOnly={!canEdit}
      />

      {/* School Bulk Order Preview & Quotation Modal */}
      {selectedBulkOrder && (
        <BulkOrderPreviewModal
          order={selectedBulkOrder}
          onClose={() => setSelectedBulkOrder(null)}
          userRole="admin"
          sellers={sellers}
          onDistribute={(orderId, payload) => {
            if (distributeSchoolBulkOrder) distributeSchoolBulkOrder(orderId, payload);
            setSelectedBulkOrder(null);
          }}
          onUpdateLogistics={(orderId, payload) => {
            if (updateSchoolOrderStatusAndTracking) updateSchoolOrderStatusAndTracking(orderId, payload);
            setSelectedBulkOrder(prev => (prev && (prev.id === orderId || prev._id === orderId) ? { ...prev, ...payload } : prev));
          }}
        />
      )}

    </div>
  );
}
