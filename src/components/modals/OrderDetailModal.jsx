import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShoppingBag, 
  Truck, 
  User, 
  MapPin, 
  CheckCircle, 
  AlertCircle, 
  RotateCcw,
  Ban,
  DollarSign,
  FileText,
  CreditCard,
  XCircle,
  Store,
  Phone,
  Copy,
  Check,
  ExternalLink,
  Lock
} from 'lucide-react';
import TaxInvoiceModal from './TaxInvoiceModal';

// Helper to generate dynamic tracking ID based on courier name
export const generateDynamicTrackingId = (courierName) => {
  const prefix = String(courierName || 'BLUEDART')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 10) || 'COURIER';
  const randomNum = Math.floor(10000000 + Math.random() * 90000000);
  return `${prefix}-${randomNum}`;
};

export const hasActiveReturnRequest = (order) => {
  if (!order) return false;
  const req = order.returnRequest;
  if (req && typeof req === 'object') {
    const type = req.requestType || req.type;
    const status = String(req.status || '').toLowerCase().trim();
    const invalidStatuses = ['', 'none', 'n/a', 'no_request', 'normal', 'null', 'undefined', 'requesting', 'requested'];
    
    if (type && !['none', 'n/a', ''].includes(String(type).toLowerCase())) return true;
    if (status && !invalidStatuses.includes(status)) return true;
    if (req.requestedAt) return true;
    if (req.reason && req.reason !== 'N/A' && req.reason.trim() !== '') return true;
  }
  
  const s = String(order.status || order.rawStatus || '').toLowerCase();
  const returnStatuses = [
    'return_requested', 'exchange_requested', 'return_approved', 'exchange_approved',
    'return_rejected', 'exchange_rejected', 'pickup_scheduled', 'product_received',
    'refund_initiated', 'refund_processed', 'refund_completed', 'exchanged', 'exchange_dispatched',
    'refund_requested', 'refunded'
  ];
  return returnStatuses.includes(s);
};

export default function OrderDetailModal({ 
  isOpen, 
  onClose, 
  order, 
  onUpdateStatus, 
  onUpdateTracking, 
  onCancelOrder, 
  onRefundOrder,
  onUpdateReturnExchangeStatus,
  readOnly = false 
}) {
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [newTracking, setNewTracking] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Pending');
  const [refundReason, setRefundReason] = useState('');
  const [showRefundPrompt, setShowRefundPrompt] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedAwb, setCopiedAwb] = useState(false);
  const [statusUpdatedToast, setStatusUpdatedToast] = useState(false);

  // Delivery Partner Decision State
  const [deliveryModeInput, setDeliveryModeInput] = useState('third_party'); // 'third_party' or 'self_delivery'
  const [courierInput, setCourierInput] = useState('Delhivery');
  const [driverNameInput, setDriverNameInput] = useState('');
  const [driverPhoneInput, setDriverPhoneInput] = useState('');
  const [vehicleNumberInput, setVehicleNumberInput] = useState('');

  const [returnActionState, setReturnActionState] = useState({
    showRejectInput: false,
    rejectionReason: '',
    showPickupInput: false,
    pickupDate: '',
    showRefundInput: false,
    refundTxnId: '',
    showDispatchInput: false,
    exchangeAwb: '',
    exchangeCourier: ''
  });

  const handleReturnExchangeStatusUpdate = async (newStatus, extraPayload = {}) => {
    const orderIdentifier = order?._id || order?.id || order?.orderId;
    if (onUpdateReturnExchangeStatus && orderIdentifier) {
      await onUpdateReturnExchangeStatus(orderIdentifier, {
        status: newStatus,
        ...extraPayload
      });
      setReturnActionState({
        showRejectInput: false,
        rejectionReason: '',
        showPickupInput: false,
        pickupDate: '',
        showRefundInput: false,
        refundTxnId: '',
        showDispatchInput: false,
        exchangeAwb: '',
        exchangeCourier: ''
      });
    }
  };

  useEffect(() => {
    if (order) {
      setNewTracking(order.trackingNumber || '');
      setSelectedStatus(order.status || 'Pending');

      const isSelf = order.deliveryMode === 'self_delivery' ||
        order.deliveryType === 'self_delivery' ||
        order.deliveryType === 'self' ||
        Boolean(order.selfDeliveryDetails?.deliveryPartnerToken || order.selfDeliveryDetails?.deliveryPersonName);

      setDeliveryModeInput(isSelf ? 'self_delivery' : 'third_party');
      setCourierInput(order.courierName || order.thirdPartyDetails?.courierName || 'Delhivery');
      setDriverNameInput(order.selfDeliveryDetails?.deliveryPersonName || '');
      setDriverPhoneInput(order.selfDeliveryDetails?.deliveryPersonPhone || '');
      setVehicleNumberInput(order.selfDeliveryDetails?.vehicleNumber || '');
    }
  }, [order]);

  const formattedShippingAddress = React.useMemo(() => {
    if (!order?.shippingAddress) return 'Customer Address';
    if (typeof order.shippingAddress === 'string') return order.shippingAddress;
    if (typeof order.shippingAddress === 'object') {
      const parts = [
        order.shippingAddress.name || order.shippingAddress.fullName,
        order.shippingAddress.addressLine || order.shippingAddress.street || order.shippingAddress.address || order.shippingAddress.addressLine1,
        order.shippingAddress.colony || order.shippingAddress.landmark,
        order.shippingAddress.city,
        order.shippingAddress.state,
        order.shippingAddress.pincode ? `- ${order.shippingAddress.pincode}` : null,
        order.shippingAddress.phone ? `(Phone: ${order.shippingAddress.phone})` : null
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : 'Delivery Address';
    }
    return String(order.shippingAddress);
  }, [order?.shippingAddress]);

  if (!isOpen || !order) return null;

  const handleSaveDeliveryDetails = () => {
    const isSelf = deliveryModeInput === 'self_delivery';
    let assignedTrackingNumber = '';
    let tokenVal = '';
    let selfTrackingLink = '';
    let carrierUrl = '';

    if (isSelf) {
      if (!driverNameInput.trim()) {
        alert('⚠️ Please enter Driver / Delivery Person Name.');
        return;
      }
      if (!driverPhoneInput.trim()) {
        alert('⚠️ Please enter Driver Phone Number.');
        return;
      }
      if (!vehicleNumberInput.trim()) {
        alert('⚠️ Please enter Vehicle Number (e.g. UP32 AB 1234).');
        return;
      }

      tokenVal = String(order.selfDeliveryDetails?.deliveryPartnerToken || `DLV-${Math.floor(100000 + Math.random() * 900000)}`).trim();
      const websiteOrigin = (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:5173` : 'http://localhost:5173');
      selfTrackingLink = `${websiteOrigin}/#delivery-partner?token=${encodeURIComponent(tokenVal)}`;
      assignedTrackingNumber = tokenVal;
    } else {
      if (!courierInput.trim()) {
        alert('⚠️ Please select or enter a Courier Partner Name.');
        return;
      }
      assignedTrackingNumber = newTracking.trim() || generateDynamicTrackingId(courierInput);
      setNewTracking(assignedTrackingNumber);

      const lowerCourier = courierInput.toLowerCase().trim();
      carrierUrl = lowerCourier.includes('bluedart') ? `https://www.bluedart.com/tracking?awb=${assignedTrackingNumber}` :
        lowerCourier.includes('delhivery') ? `https://www.delhivery.com/track/package/${assignedTrackingNumber}` :
        lowerCourier.includes('dtdc') ? `https://www.dtdc.in/tracking/shipment-tracking.asp?awb=${assignedTrackingNumber}` :
        lowerCourier.includes('ekart') ? `https://ekartlogistics.com/shipmenttrack/${assignedTrackingNumber}` :
        lowerCourier.includes('fedex') ? `https://www.fedex.com/fedextrack/?trknbr=${assignedTrackingNumber}` :
        lowerCourier.includes('shadowfax') ? `https://track.shadowfax.in/track?tracking_id=${assignedTrackingNumber}` :
        lowerCourier.includes('xpressbees') ? `https://www.xpressbees.com/track?shipment_id=${assignedTrackingNumber}` :
        lowerCourier.includes('indiapost') || lowerCourier.includes('speedpost') ? `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx?consignmentNo=${assignedTrackingNumber}` :
        `https://track.shiprocket.in/tracking/${assignedTrackingNumber}`;
    }

    const payload = {
      deliveryMode: deliveryModeInput,
      deliveryType: deliveryModeInput,
      courierName: !isSelf ? courierInput.trim() : '',
      trackingNumber: assignedTrackingNumber,
      trackingUrl: isSelf ? selfTrackingLink : carrierUrl,
      selfDeliveryDetails: isSelf ? {
        ...(order.selfDeliveryDetails || {}),
        deliveryPersonName: driverNameInput.trim(),
        deliveryPersonPhone: driverPhoneInput.trim(),
        vehicleNumber: vehicleNumberInput.trim(),
        deliveryPartnerToken: tokenVal,
        trackingUrl: selfTrackingLink
      } : undefined
    };

    const orderIdentifier = order._id || order.id || order.orderId;
    if (onUpdateTracking) {
      onUpdateTracking(orderIdentifier, payload.trackingNumber, payload);
    }
    if (onUpdateStatus) {
      onUpdateStatus(orderIdentifier, selectedStatus, payload);
    }
    alert(`✅ Delivery partner & tracking details saved successfully for Order #${order.id || order.orderId}!\n\nTracking Link: ${isSelf ? selfTrackingLink : carrierUrl}`);
  };

  const handleSaveTracking = () => {
    handleSaveDeliveryDetails();
  };

  const handleApplyStatusUpdate = (targetStatus) => {
    const statusToApply = targetStatus || selectedStatus;
    const orderIdentifier = order._id || order.id || order.orderId;
    setSelectedStatus(statusToApply);
    if (onUpdateStatus) {
      onUpdateStatus(orderIdentifier, statusToApply);
    }
    setStatusUpdatedToast(true);
    setTimeout(() => setStatusUpdatedToast(false), 2500);
  };

  const handleStatusChange = (status) => {
    handleApplyStatusUpdate(status);
  };

  const handleProcessRefund = () => {
    const orderIdentifier = order._id || order.id || order.orderId;
    onRefundOrder(orderIdentifier, order.total);
    setShowRefundPrompt(false);
    onClose();
  };

  const handleCancel = () => {
    const orderIdentifier = order._id || order.id || order.orderId;
    if (window.confirm(`Are you sure you want to cancel Order ${order.id || order.orderId}?`)) {
      onCancelOrder(orderIdentifier, 'Cancelled by Admin');
      onClose();
    }
  };

  const formattedCustomerName = typeof order?.customerName === 'object' 
    ? (order.customerName?.name || order.customerName?.fullName || 'Customer')
    : (order?.customerName || order?.customer?.name || 'Customer');

  const formattedCustomerEmail = typeof order?.customerEmail === 'object'
    ? (order.customerEmail?.email || '')
    : (order?.customerEmail || order?.customer?.email || '');

  const formattedCustomerPhone = typeof order?.customerPhone === 'object'
    ? (order.customerPhone?.phone || '')
    : (order?.customerPhone || order?.customer?.phone || '');

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-gray-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
              <ShoppingBag size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-lg text-gray-900">Order #{order.id}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                  order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                  (order.status === 'Out for Delivery' || order.status === 'out_for_delivery') ? 'bg-purple-100 text-purple-900 border border-purple-200' :
                  order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                  (order.status === 'Packed' || order.status === 'Confirmed') ? 'bg-indigo-100 text-indigo-800' :
                  order.status === 'Processing' ? 'bg-sky-100 text-sky-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {order.status}
                </span>
              </div>
              <p className="text-xs text-gray-500">Placed on {order.date} • {order.school || 'General Retail'}</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-6">

          {/* Customer Cancellation Alert Banner */}
          {(order.status === 'Cancelled' || order.cancellationReason || order.cancelledBy) && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-2 text-xs shadow-xs">
              <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-rose-700">
                <XCircle size={16} />
                <span>Order Cancelled by Customer</span>
              </div>
              <div className="p-3 bg-white/80 rounded-xl border border-rose-100 text-xs text-rose-900 space-y-1">
                <p><strong>Cancelled By:</strong> <span className="font-semibold text-gray-900">{order.cancelledBy || formattedCustomerName || 'Customer'}</span></p>
                <p><strong>Cancellation Reason:</strong> <span className="font-semibold text-gray-900">{order.cancellationReason || 'Cancelled by customer'}</span></p>
                {order.cancelledAt && (
                  <p className="text-[11px] text-gray-500">
                    <strong>Cancelled On:</strong> {new Date(order.cancelledAt).toLocaleString('en-IN')}
                  </p>
                )}
              </div>
              {order.refundStatus && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard size={15} className="text-emerald-700 shrink-0" />
                    <div>
                      <strong className="font-black text-emerald-900">Refund Status: </strong>
                      <span className="font-semibold">{order.refundStatus}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Customer Provided Receiving Payout Details Box */}
          {(() => {
            const details = order.refundDetails || order.returnRequest?.refundDetails;
            const hasValidDetails = details && Boolean(details.upiId || details.accountNumber);
            if (!hasValidDetails) return null;

            return (
              <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-950 space-y-2 text-xs shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-teal-800">
                    <CreditCard size={16} />
                    <span>Customer Receiving Refund Payout Account</span>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-700 text-white uppercase">
                    {details.method === 'UPI' ? 'UPI Transfer' : 'Bank Transfer'}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-teal-100 space-y-1.5 font-mono text-xs">
                  {details.method === 'UPI' ? (
                    <p><strong>UPI ID:</strong> <span className="text-teal-950 font-bold bg-teal-50 px-2 py-0.5 rounded">{details.upiId}</span></p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <p><strong>Account Holder:</strong> <span className="font-bold text-gray-900">{details.accountHolderName}</span></p>
                      <p><strong>Bank Name:</strong> <span className="font-bold text-gray-900">{details.bankName}</span></p>
                      <p><strong>Account Number:</strong> <span className="font-bold text-gray-900">{details.accountNumber}</span></p>
                      <p><strong>IFSC Code:</strong> <span className="font-bold text-gray-900">{details.ifscCode}</span></p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Return / Exchange Request Management Card */}
          {hasActiveReturnRequest(order) && (
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-amber-200/60 pb-2.5">
                <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-amber-900">
                  <RotateCcw size={16} className="text-amber-700" />
                  <span>{order.returnRequest.requestType === 'exchange' ? '🔄 Product Exchange Request' : '📦 Product Return & Refund Request'}</span>
                </div>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border ${
                  order.returnRequest.status?.includes('approved') ? 'bg-blue-100 text-blue-900 border-blue-300' :
                  order.returnRequest.status?.includes('completed') || order.returnRequest.status === 'exchanged' || order.returnRequest.status === 'refund_completed' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                  order.returnRequest.status === 'rejected' ? 'bg-rose-100 text-rose-900 border-rose-300' :
                  'bg-amber-100 text-amber-900 border-amber-300'
                }`}>
                  {order.returnRequest.status?.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-amber-100 space-y-1">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Reason for Request</div>
                  <div className="font-semibold text-gray-800">{order.returnRequest.reason || 'N/A'}</div>
                  {order.returnRequest.targetSize && (
                    <div className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded inline-block mt-1">
                      Requested Replacement Size: {order.returnRequest.targetSize}
                    </div>
                  )}
                  {order.returnRequest.rejectionReason && (
                    <div className="text-[11px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 block mt-1">
                      Rejection Reason: {order.returnRequest.rejectionReason}
                    </div>
                  )}
                </div>

                <div className="p-3 bg-white rounded-xl border border-amber-100 space-y-1 text-gray-700">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Logistics & Payout Details</div>
                  {order.returnRequest.pickupDate && (
                    <div><strong>Scheduled Pickup:</strong> {new Date(order.returnRequest.pickupDate).toLocaleDateString('en-IN')}</div>
                  )}
                  {order.returnRequest.refundTxnId && (
                    <div><strong>Refund Txn ID:</strong> <span className="font-mono font-bold text-emerald-800">{order.returnRequest.refundTxnId}</span></div>
                  )}
                  {order.returnRequest.exchangeAwb && (
                    <div><strong>Exchange AWB:</strong> <span className="font-mono font-bold text-blue-800">{order.returnRequest.exchangeAwb}</span> ({order.returnRequest.exchangeCourier || 'Courier'})</div>
                  )}
                  <div className="text-[10px] text-gray-400 pt-1">
                    Requested on: {order.returnRequest.requestedAt ? new Date(order.returnRequest.requestedAt).toLocaleString('en-IN') : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Admin Action Workflow Buttons */}
              {!readOnly && (
                <div className="pt-2 border-t border-amber-200/60 space-y-2">
                  <div className="text-[11px] font-bold text-amber-900">Admin Action Workflow:</div>
                  <div className="flex flex-wrap items-center gap-2">
                    {(order.returnRequest.status === 'return_requested' || order.returnRequest.status === 'exchange_requested') && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleReturnExchangeStatusUpdate(order.returnRequest.requestType === 'exchange' ? 'exchange_approved' : 'return_approved')}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          ✓ Approve Request
                        </button>
                        <button
                          type="button"
                          onClick={() => setReturnActionState(prev => ({ ...prev, showRejectInput: !prev.showRejectInput }))}
                          className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          ✕ Reject Request
                        </button>
                      </>
                    )}

                    {(order.returnRequest.status === 'return_approved' || order.returnRequest.status === 'exchange_approved') && (
                      <button
                        type="button"
                        onClick={() => setReturnActionState(prev => ({ ...prev, showPickupInput: !prev.showPickupInput }))}
                        className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        📅 Schedule Pickup
                      </button>
                    )}

                    {order.returnRequest.status === 'pickup_scheduled' && (
                      <button
                        type="button"
                        onClick={() => handleReturnExchangeStatusUpdate('product_received')}
                        className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        📦 Mark Product Received & Restore Stock
                      </button>
                    )}

                    {(order.returnRequest.status === 'product_received' || (order.returnRequest.requestType === 'return' && order.returnRequest.status === 'return_approved')) && order.returnRequest.requestType === 'return' && (
                      <button
                        type="button"
                        onClick={() => setReturnActionState(prev => ({ ...prev, showRefundInput: !prev.showRefundInput }))}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        💳 Mark Refund Completed
                      </button>
                    )}

                    {(order.returnRequest.status === 'product_received' || (order.returnRequest.requestType === 'exchange' && order.returnRequest.status === 'exchange_approved')) && order.returnRequest.requestType === 'exchange' && (
                      <button
                        type="button"
                        onClick={() => setReturnActionState(prev => ({ ...prev, showDispatchInput: !prev.showDispatchInput }))}
                        className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        🚚 Dispatch Replacement Unit
                      </button>
                    )}

                    {order.returnRequest.status === 'exchange_dispatched' && (
                      <button
                        type="button"
                        onClick={() => handleReturnExchangeStatusUpdate('exchanged')}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        ✓ Complete Exchange
                      </button>
                    )}
                  </div>

                  {returnActionState.showRejectInput && (
                    <div className="p-3 bg-white rounded-xl border border-rose-200 space-y-2">
                      <input
                        type="text"
                        placeholder="Reason for rejection (e.g., Item used or tag missing)"
                        value={returnActionState.rejectionReason}
                        onChange={e => setReturnActionState(prev => ({ ...prev, rejectionReason: e.target.value }))}
                        className="w-full px-3 py-1.5 text-xs border border-rose-300 rounded-lg outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => handleReturnExchangeStatusUpdate('rejected', { rejectionReason: returnActionState.rejectionReason })}
                        className="px-3 py-1 bg-rose-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Confirm Rejection
                      </button>
                    </div>
                  )}

                  {returnActionState.showPickupInput && (
                    <div className="p-3 bg-white rounded-xl border border-blue-200 space-y-2">
                      <label className="block text-[11px] font-bold text-gray-700">Select Pickup Date:</label>
                      <input
                        type="date"
                        value={returnActionState.pickupDate}
                        onChange={e => setReturnActionState(prev => ({ ...prev, pickupDate: e.target.value }))}
                        className="px-3 py-1.5 text-xs border border-blue-300 rounded-lg outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => handleReturnExchangeStatusUpdate('pickup_scheduled', { pickupDate: returnActionState.pickupDate })}
                        className="ml-2 px-3 py-1 bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Confirm Pickup Date
                      </button>
                    </div>
                  )}

                  {returnActionState.showRefundInput && (
                    <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-2">
                      <input
                        type="text"
                        placeholder="Enter Refund Transaction ID / Reference (e.g. TXN987654321)"
                        value={returnActionState.refundTxnId}
                        onChange={e => setReturnActionState(prev => ({ ...prev, refundTxnId: e.target.value }))}
                        className="w-full px-3 py-1.5 text-xs border border-emerald-300 rounded-lg outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => handleReturnExchangeStatusUpdate('refund_completed', { refundTxnId: returnActionState.refundTxnId })}
                        className="px-3 py-1 bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Confirm Refund Completed
                      </button>
                    </div>
                  )}

                  {returnActionState.showDispatchInput && (
                    <div className="p-3 bg-white rounded-xl border border-indigo-200 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Courier Partner Name (e.g. Delhivery)"
                          value={returnActionState.exchangeCourier}
                          onChange={e => setReturnActionState(prev => ({ ...prev, exchangeCourier: e.target.value }))}
                          className="px-3 py-1.5 text-xs border border-indigo-300 rounded-lg outline-hidden"
                        />
                        <input
                          type="text"
                          placeholder="Replacement AWB Tracking Number"
                          value={returnActionState.exchangeAwb}
                          onChange={e => setReturnActionState(prev => ({ ...prev, exchangeAwb: e.target.value }))}
                          className="px-3 py-1.5 text-xs border border-indigo-300 rounded-lg outline-hidden"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleReturnExchangeStatusUpdate('exchange_dispatched', { exchangeAwb: returnActionState.exchangeAwb, exchangeCourier: returnActionState.exchangeCourier })}
                        className="px-3 py-1 bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Confirm Replacement Dispatched
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Return/Exchange Event Timeline */}
              {Array.isArray(order.returnRequest.timeline) && order.returnRequest.timeline.length > 0 && (
                <div className="pt-2 border-t border-amber-200/60">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-900 mb-1.5">
                    Request Event Timeline Log
                  </div>
                  <div className="space-y-1 font-mono text-[11px]">
                    {order.returnRequest.timeline.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-gray-700">
                        <span className="text-amber-600 font-bold">•</span>
                        <span className="font-bold">{item.label}</span>
                        <span className="text-[10px] text-gray-400">({new Date(item.timestamp).toLocaleString('en-IN')})</span>
                        {item.note && <span className="text-gray-500 italic">- {item.note}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions Bar / View-Only Status */}
          {readOnly ? (
            <div className="bg-amber-50/70 rounded-xl p-3 border border-amber-200/70 flex items-center justify-between gap-3 text-xs">
              <span className="font-bold text-amber-900">Current Order Status: <span className="font-black text-amber-950">{order.status}</span></span>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">View-Only</span>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-gray-700">Order Status:</span>
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="bg-white border border-gray-300 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-teal-700 outline-hidden cursor-pointer shadow-2xs"
                >
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Processing">Processing</option>
                  <option value="Packed">Packed</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="refund_approved">Refund Approved</option>
                  <option value="refund_initiated">Refund Initiated</option>
                  <option value="refund_completed">Refund Completed</option>
                  <option value="return_requested">Return Requested</option>
                  <option value="return_approved">Return Approved</option>
                  <option value="product_return_received">Product Return Received</option>
                </select>

                <button
                  type="button"
                  onClick={() => handleApplyStatusUpdate(selectedStatus)}
                  className="px-3.5 py-1.5 bg-teal-800 hover:bg-teal-900 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {statusUpdatedToast ? (
                    <>
                      <Check size={14} className="text-emerald-300" />
                      <span>Updated Status!</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={14} />
                      <span>Update Status</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2">
                {order.status !== 'Cancelled' && (
                  <button
                    onClick={handleCancel}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Ban size={13} /> Cancel Order
                  </button>
                )}
                {order.paymentStatus === 'Paid' && (
                  <button
                    onClick={() => setShowRefundPrompt(!showRefundPrompt)}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw size={13} /> Issue Refund
                  </button>
                )}
                <button
                  onClick={() => setIsInvoiceOpen(true)}
                  className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-teal-200"
                >
                  <FileText size={13} /> Tax Invoice & Settlement
                </button>
              </div>
            </div>
          )}

          {/* Refund Box */}
          {showRefundPrompt && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
              <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <AlertCircle size={15} /> Confirm Refund Authorization of ₹{order.total}
              </div>
              <input
                type="text"
                value={refundReason}
                onChange={e => setRefundReason(e.target.value)}
                placeholder="Reason for refund (e.g. Defective item, customer return)"
                className="w-full px-3 py-2 bg-white rounded-lg border border-amber-300 text-xs outline-hidden"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowRefundPrompt(false)}
                  className="px-3 py-1 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessRefund}
                  className="px-3 py-1 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-md cursor-pointer"
                >
                  Confirm & Transfer ₹{order.total}
                </button>
              </div>
            </div>
          )}

          {/* Order Items Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2.5">
              Ordered Items ({order.items?.length || 0})
            </h4>
            <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
              {order.items?.map((item, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between gap-3 bg-white">
                  <div className="flex items-center gap-3">
                    <img 
                      src={item.image || 'https://images.unsplash.com/photo-1593032465175-481ac7f401a0?w=150'} 
                      alt={item.name} 
                      className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                    />
                    <div>
                      <div className="font-bold text-xs text-gray-900">{item.name}</div>
                      <div className="text-[11px] text-gray-500">
                        {item.size && `Size: ${item.size} • `}
                        {item.color && `Color: ${item.color} • `}
                        Qty: {(() => {
                          const isUnstitched = Boolean(
                            item.isMeterBased ||
                            item.unit === 'meter' ||
                            item.unit === 'm' ||
                            String(item.category || '').toLowerCase().includes('unstitched') ||
                            String(item.category || '').toLowerCase().includes('unstiched') ||
                            String(item.subCategory || '').toLowerCase().includes('unstitched') ||
                            String(item.subCategory || '').toLowerCase().includes('unstiched') ||
                            String(item.name || '').toLowerCase().includes('unstitched') ||
                            String(item.name || '').toLowerCase().includes('unstiched') ||
                            (Number(item.quantity || 1) % 1 !== 0)
                          );
                          const rawQty = Number(item.quantity || 1);
                          return isUnstitched ? rawQty.toFixed(2) : (rawQty % 1 === 0 ? rawQty : rawQty.toFixed(2));
                        })()}
                      </div>
                      <div className="text-[10px] text-teal-900 font-medium flex items-center gap-1 mt-0.5">
                        <Store size={10} className="text-teal-700 shrink-0" />
                        <span>Sold by: <strong className="font-bold text-teal-950">{item.storeName || item.sellerName || item.sellerDetails?.storeName || (typeof item.sellerId === 'object' ? item.sellerId.storeName : '') || order.sellerDetails?.storeName || 'Partner Merchant'}</strong></span>
                        {(item.sellerPhone || item.sellerDetails?.phone) && (
                          <span className="text-gray-500">({item.sellerPhone || item.sellerDetails?.phone})</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="font-bold text-xs text-gray-900">₹{item.price * item.quantity}</div>
                    <div className="text-[10px] text-gray-400">₹{item.price} each</div>
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      <span className={`inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                        item.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                        item.status === 'Shipped' || item.status === 'Out for Delivery' ? 'bg-purple-100 text-purple-800' :
                        item.status === 'Packed' ? 'bg-indigo-100 text-indigo-800' :
                        item.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                        item.status === 'Cancelled' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {item.status || order.status || 'Pending'}
                      </span>
                      {!readOnly && (
                        <select
                          value={item.status || order.status || 'Pending'}
                          onChange={(e) => {
                            const newSt = e.target.value;
                            if (onUpdateStatus) {
                              onUpdateStatus(order.id || order._id, newSt, { itemId: item._id || item.id || idx });
                            }
                          }}
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-gray-300 bg-white hover:border-teal-600 focus:outline-none cursor-pointer"
                          title="Update status for this specific item"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Processing">Processing</option>
                          <option value="Packed">Packed</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      )}
                    </div>
                    <span className={`inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded mt-0.5 ${(item.deliveryType === 'self' || item.deliveryType === 'self_delivery' || order.deliveryMode === 'self_delivery') ? 'bg-teal-100 text-teal-800' : 'bg-blue-100 text-blue-800'}`}>
                      {(item.deliveryType === 'self' || item.deliveryType === 'self_delivery' || order.deliveryMode === 'self_delivery') ? '🛵 Self-Delivery' : `🚚 ${item.thirdPartyDetails?.courierName || order.courierName || 'Courier'}`}
                    </span>
                  </div>
                </div>
              ))}
              {(() => {
                const subtotalVal = Number(order.subtotal || order.items?.reduce((acc, i) => acc + (Number(i.price || 0) * Number(i.quantity || 1)), 0) || order.total || 0);
                const shipVal = Number(order.shippingFee ?? order.shippingCost ?? 0);
                const couponVal = Number(order.discountAmount ?? order.discount ?? 0);
                const codFeeVal = Number(order.codFee ?? order.codCharges ?? 0);
                const grandVal = Number(order.total || order.totalAmount || (subtotalVal + shipVal + codFeeVal - couponVal));

                let totalTaxable = 0;
                let totalTax = 0;
                (order.items || []).forEach(item => {
                  const qty = Number(item.quantity || 1);
                  const unitPrice = Number(item.price || 0);
                  const grossPrice = unitPrice * qty;
                  const gstRate = Number(item.gstPercent ?? item.gstPercentage ?? item.gstRate ?? item.gst ?? 5);
                  if (gstRate > 0) {
                    const taxable = grossPrice / (1 + gstRate / 100);
                    totalTaxable += taxable;
                    totalTax += (grossPrice - taxable);
                  } else {
                    totalTaxable += grossPrice;
                  }
                });

                const parseStateKeyFromText = (text) => {
                  if (!text) return '';
                  const str = String(text).toLowerCase();
                  const states = [
                    { key: 'uttarpradesh', aliases: ['uttar pradesh', 'uttarpradesh', 'up', 'noida', 'lucknow', 'kanpur', 'ghaziabad', 'agra', 'varanasi', 'prayagraj'] },
                    { key: 'delhi', aliases: ['delhi', 'new delhi', 'nct of delhi', 'nct', 'dl'] },
                    { key: 'maharashtra', aliases: ['maharashtra', 'mumbai', 'pune', 'nagpur', 'thane', 'mh'] },
                    { key: 'karnataka', aliases: ['karnataka', 'bangalore', 'bengaluru', 'mysore', 'ka'] },
                    { key: 'tamilnadu', aliases: ['tamil nadu', 'tamilnadu', 'chennai', 'coimbatore', 'tn'] },
                    { key: 'haryana', aliases: ['haryana', 'gurugram', 'gurgaon', 'faridabad', 'hr'] },
                    { key: 'rajasthan', aliases: ['rajasthan', 'jaipur', 'jodhpur', 'udaipur', 'rj'] },
                    { key: 'westbengal', aliases: ['west bengal', 'westbengal', 'kolkata', 'wb'] },
                    { key: 'gujarat', aliases: ['gujarat', 'ahmedabad', 'surat', 'vadodara', 'gj'] },
                    { key: 'punjab', aliases: ['punjab', 'ludhiana', 'amritsar', 'pb'] },
                    { key: 'madhyapradesh', aliases: ['madhya pradesh', 'madhyapradesh', 'bhopal', 'indore', 'mp'] },
                    { key: 'bihar', aliases: ['bihar', 'patna', 'br'] },
                    { key: 'telangana', aliases: ['telangana', 'hyderabad', 'tg', 'ts'] },
                    { key: 'andhrapradesh', aliases: ['andhra pradesh', 'andhrapradesh', 'visakhapatnam', 'ap'] },
                    { key: 'kerala', aliases: ['kerala', 'kochi', 'thiruvananthapuram', 'kl'] },
                    { key: 'uttarakhand', aliases: ['uttarakhand', 'dehradun', 'uk'] }
                  ];

                  for (const st of states) {
                    for (const alias of st.aliases) {
                      if (new RegExp(`\\b${alias}\\b`, 'i').test(str)) {
                        return st.key;
                      }
                    }
                  }
                  return str.trim();
                };

                const getDynamicState = (obj, fallbackText) => {
                  if (obj && typeof obj === 'object') {
                    if (obj.state && String(obj.state).trim()) return parseStateKeyFromText(obj.state);
                    const combined = `${obj.street || ''} ${obj.addressLine || ''} ${obj.city || ''} ${obj.address || ''}`;
                    if (combined.trim()) return parseStateKeyFromText(combined);
                  }
                  return parseStateKeyFromText(fallbackText || '');
                };

                const firstSellerObj = order.items?.[0]?.sellerId;
                const sellerStateKey = getDynamicState(firstSellerObj, `${order.sellerState || ''} ${order.sellerCity || ''} ${order.sellerAddress || ''}`);
                const customerStateKey = getDynamicState(order.shippingAddress, typeof order.shippingAddress === 'string' ? order.shippingAddress : '');

                const isSameState = !sellerStateKey || !customerStateKey || sellerStateKey === customerStateKey;
                const sellerStateStr = (typeof firstSellerObj === 'object' ? firstSellerObj.state || firstSellerObj.city : '') || order.sellerState || sellerStateKey || 'Seller Location';
                const customerStateStr = (typeof order.shippingAddress === 'object' ? order.shippingAddress?.state || order.shippingAddress?.city : '') || customerStateKey || 'Customer Location';

                return (
                  <div className="p-3.5 bg-gray-50 border-t border-gray-200 space-y-2 text-xs">
                    <div className="flex justify-between text-gray-700">
                      <span>Items Subtotal:</span>
                      <span className="font-mono font-bold">₹{subtotalVal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500 text-[11px]">
                      <span>Base Taxable Value (Excl. GST):</span>
                      <span className="font-mono">₹{totalTaxable.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-800 text-[11px] bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                      <div>
                        <span className="font-bold block">GST Tax Breakdown ({isSameState ? 'Intra-State Same State' : 'Inter-State Different State'}):</span>
                        {isSameState ? (
                          <span className="text-[10px]">CGST (50%): ₹{(totalTax / 2).toFixed(2)} • SGST (50%): ₹{(totalTax / 2).toFixed(2)}</span>
                        ) : (
                          <span className="text-[10px]">IGST (Integrated 100%): ₹{totalTax.toFixed(2)} • Supply ({sellerStateStr} ➔ {customerStateStr})</span>
                        )}
                      </div>
                      <span className="font-mono font-bold self-center">₹{totalTax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Delivery Charges:</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {shipVal === 0 ? 'Not Applied (FREE)' : `₹${shipVal.toFixed(2)}`}
                      </span>
                    </div>
                    {codFeeVal > 0 && (
                      <div className="flex justify-between text-gray-700">
                        <span>COD / Convenience Fee:</span>
                        <span className="font-mono font-bold text-emerald-700">₹{codFeeVal.toFixed(2)}</span>
                      </div>
                    )}
                    {couponVal > 0 ? (
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span>Offer / Coupon Applied:</span>
                        <span className="font-mono">-₹{couponVal.toFixed(2)}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-gray-400 text-[11px]">
                        <span>Offer / Coupon:</span>
                        <span className="font-mono">Not Applied (₹0.00)</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-gray-300 flex items-center justify-between font-black text-gray-900">
                      <span className="text-xs">Total Order Amount</span>
                      <span className="font-display font-black text-base text-teal-900 font-mono">₹{grandVal.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Customer & Delivery Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Customer Details */}
            <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/60 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                <User size={14} className="text-teal-700" /> Customer Information
              </div>
              <div className="text-xs text-gray-900 font-semibold">{formattedCustomerName}</div>
              {formattedCustomerEmail && <div className="text-[11px] text-gray-600">{formattedCustomerEmail}</div>}
              {formattedCustomerPhone && <div className="text-[11px] text-gray-600">{formattedCustomerPhone}</div>}
              <div className="pt-2 text-[10px] text-gray-500 border-t border-gray-200">
                Payment: <span className="font-bold text-gray-800">{String(order.paymentMethod || 'Online')}</span> ({String(order.paymentStatus || 'Paid')})
              </div>
            </div>

            {/* Shipping & Tracking Information */}
            <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/60 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                <MapPin size={14} className="text-teal-700" /> Shipping Destination
              </div>
              <div className="text-xs text-gray-700 leading-relaxed">{formattedShippingAddress}</div>
              
              {/* Tracking ID Gate Display */}
              <div className="pt-2 border-t border-gray-200">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Logistics Tracking Status:
                </div>
                {(() => {
                  const normStatus = String(selectedStatus || order.status || '').toLowerCase().replace(/_/g, ' ');
                  const isOut = normStatus === 'out for delivery' || normStatus === 'delivered';
                  const isSelf = deliveryModeInput === 'self_delivery';
                  const isPartnerDecided = isSelf
                    ? Boolean(driverNameInput.trim() || driverPhoneInput.trim() || order.selfDeliveryDetails?.deliveryPartnerToken)
                    : Boolean(courierInput.trim() && (newTracking.trim() || order.trackingNumber));
                  const effectiveTracking = isSelf 
                    ? (order.selfDeliveryDetails?.deliveryPartnerToken || (driverNameInput.trim() ? newTracking.trim() : '')) 
                    : (newTracking.trim() || order.trackingNumber || '');

                  if (!isPartnerDecided || !effectiveTracking) {
                    return (
                      <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="font-bold flex items-center gap-1.5 text-[11px] text-amber-800">
                            <Truck size={13} className="text-amber-600" />
                            <span>Logistics Tracking ID:</span>
                          </div>
                          <span className="font-mono font-bold text-[11px] bg-white px-2 py-0.5 rounded border border-amber-300 text-amber-800">
                            Not Assigned
                          </span>
                        </div>
                        <p className="text-[10px] text-amber-700 leading-normal">
                          Dynamic Tracking ID will be automatically generated once a delivery partner (3rd-Party Courier or Direct Rider) is assigned.
                        </p>
                        <div className="text-[10px] space-y-0.5 pt-0.5 border-t border-amber-200/60">
                          <div>• Delivery Partner: <span className="text-rose-600 font-bold">✗ Not Assigned</span></div>
                          <div>• Logistics Tracking: <span className="text-amber-800 font-bold">Not Assigned</span></div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-950 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] text-emerald-900 flex items-center gap-1">
                          <CheckCircle size={12} className="text-emerald-600" /> Logistics Tracking ID
                        </span>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-700 text-white uppercase">
                          {isOut ? 'Out for Delivery' : 'Partner Assigned'}
                        </span>
                      </div>
                      <div className="font-mono font-bold text-gray-900 text-xs bg-white p-1.5 rounded border border-emerald-100 flex items-center justify-between">
                        <span>{effectiveTracking}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(effectiveTracking);
                            setCopiedAwb(true);
                            setTimeout(() => setCopiedAwb(false), 2000);
                          }}
                          className="px-2 py-0.5 text-[10px] font-sans font-bold bg-gray-100 hover:bg-gray-200 rounded cursor-pointer"
                        >
                          {copiedAwb ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

          </div>

          {/* Fulfillment Channel & Delivery Partner Assignment */}
          {(() => {
            const isSelf = deliveryModeInput === 'self_delivery';
            const normStatus = String(selectedStatus || order.status || '').toLowerCase().replace(/_/g, ' ');
            const isOut = normStatus === 'out for delivery' || normStatus === 'delivered';
            const isPartnerDecided = isSelf
              ? Boolean(driverNameInput.trim() || driverPhoneInput.trim() || order.selfDeliveryDetails?.deliveryPartnerToken)
              : Boolean(courierInput.trim() && newTracking.trim());
            const canSeeTracking = isOut && isPartnerDecided;

            const tokenVal = String(order.selfDeliveryDetails?.deliveryPartnerToken || newTracking.trim() || `DLV-${order.id}`).trim();
            const clientAppUrl = (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:5173` : 'http://localhost:5173');
            const selfDeliveryUrl = `${clientAppUrl}/#delivery-partner?token=${encodeURIComponent(tokenVal)}`;

            const sellerDetails = order.sellerDetails || order.items?.[0]?.sellerDetails || (order.items?.[0]?.sellerId && typeof order.items[0].sellerId === 'object' ? order.items[0].sellerId : null);
            const storeName = sellerDetails?.storeName || sellerDetails?.name || order.items?.[0]?.storeName || order.items?.[0]?.sellerName || 'Partner Merchant';
            const sellerContactPhone = sellerDetails?.phone || order.items?.[0]?.sellerPhone || '';

            return (
              <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-teal-950">
                    <Truck size={15} className="text-teal-700" />
                    <span>Fulfillment & Delivery Partner Assignment</span>
                  </div>
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full w-fit ${isSelf ? 'bg-teal-700 text-white' : 'bg-blue-700 text-white'}`}>
                    {isSelf ? '🛵 Direct Self-Delivery (Store Fleet)' : `🚚 3rd-Party Carrier (${courierInput})`}
                  </span>
                </div>

                {/* Delivery Mode Toggle Tabs */}
                {!readOnly && (
                  <div className="grid grid-cols-2 gap-2 bg-teal-100/60 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setDeliveryModeInput('third_party')}
                      className={`py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                        deliveryModeInput === 'third_party'
                          ? 'bg-white text-teal-900 shadow-xs'
                          : 'text-teal-800 hover:text-teal-950'
                      }`}
                    >
                      🚚 3rd-Party Courier (Delhivery / BlueDart)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryModeInput('self_delivery')}
                      className={`py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                        deliveryModeInput === 'self_delivery'
                          ? 'bg-white text-teal-900 shadow-xs'
                          : 'text-teal-800 hover:text-teal-950'
                      }`}
                    >
                      🛵 Direct Self-Delivery (Store Rider)
                    </button>
                  </div>
                )}

                {/* Delivery Partner Configuration Form */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  
                  {/* Seller / Store Summary Card */}
                  <div className="p-3 bg-white rounded-xl border border-teal-100 space-y-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                      <Store size={11} className="text-teal-700" /> Assigned Seller / Store
                    </span>
                    <div className="font-bold text-xs text-gray-900">{storeName}</div>
                    {sellerContactPhone && (
                      <div className="text-[11px] text-gray-600 flex items-center gap-1">
                        <Phone size={11} className="text-gray-400" /> {sellerContactPhone}
                      </div>
                    )}
                    <div className="text-[10px] text-gray-400 pt-0.5">
                      Fulfillment Mode: <strong className="text-gray-700">{isSelf ? 'Store Fleet Direct' : 'Logistics Partner'}</strong>
                    </div>
                  </div>

                  {/* Mode Specific Inputs */}
                  {deliveryModeInput === 'third_party' ? (
                    <div className="p-3 bg-white rounded-xl border border-teal-100 space-y-2">
                      <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                        <Truck size={11} className="text-teal-700" /> 3rd-Party Logistics Carrier
                      </span>
                      {readOnly ? (
                        <div className="text-xs">
                          <div className="font-bold text-gray-900">{courierInput}</div>
                          <div className="font-mono text-gray-600 text-[11px]">
                            AWB: {newTracking ? newTracking : <span className="text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-[10px]">Not Assigned</span>}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Select Courier Partner <span className="text-red-500">*</span></label>
                            <select
                              value={courierInput}
                              onChange={e => {
                                const selected = e.target.value;
                                setCourierInput(selected);
                                if (!newTracking.trim()) {
                                  setNewTracking(generateDynamicTrackingId(selected));
                                }
                              }}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg bg-white outline-hidden cursor-pointer"
                            >
                              <option value="Delhivery">Delhivery Express</option>
                              <option value="BlueDart">BlueDart Air</option>
                              <option value="DTDC">DTDC Courier</option>
                              <option value="Ekart">Ekart Logistics</option>
                              <option value="IndiaPost">SpeedPost / India Post</option>
                              <option value="Shiprocket">Shiprocket Automated</option>
                            </select>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <label className="block text-[10px] font-bold text-gray-600">Tracking AWB Number <span className="text-red-500">*</span></label>
                              <button
                                type="button"
                                onClick={() => setNewTracking(generateDynamicTrackingId(courierInput))}
                                className="text-[10px] text-teal-700 hover:text-teal-900 font-bold underline cursor-pointer"
                              >
                                ⚡ Generate Dynamic AWB
                              </button>
                            </div>
                            <input
                              type="text"
                              value={newTracking}
                              onChange={e => setNewTracking(e.target.value)}
                              placeholder="Click Generate or type AWB"
                              className="w-full px-2 py-1 text-xs font-mono border border-gray-300 rounded-lg outline-hidden"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Self Delivery Form */
                    <div className="p-3 bg-white rounded-xl border border-teal-100 space-y-2">
                      <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                        <User size={11} className="text-teal-700" /> Self-Delivery Driver / Rider Details
                      </span>
                      {readOnly ? (
                        <div className="text-xs space-y-1">
                          <div><strong>Driver:</strong> {driverNameInput || 'Store Fleet'}</div>
                          {driverPhoneInput && <div><strong>Phone:</strong> {driverPhoneInput}</div>}
                          {vehicleNumberInput && <div><strong>Vehicle:</strong> {vehicleNumberInput}</div>}
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Driver / Rider Name <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              value={driverNameInput}
                              onChange={e => setDriverNameInput(e.target.value)}
                              placeholder="Driver Name (e.g. Ramesh Kumar)"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg outline-hidden"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Phone Number <span className="text-red-500">*</span></label>
                              <input
                                type="text"
                                value={driverPhoneInput}
                                onChange={e => setDriverPhoneInput(e.target.value)}
                                placeholder="Phone (+91...)"
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg outline-hidden"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Vehicle Number <span className="text-red-500">*</span></label>
                              <input
                                type="text"
                                value={vehicleNumberInput}
                                onChange={e => setVehicleNumberInput(e.target.value)}
                                placeholder="Vehicle (e.g. UP32...)"
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg outline-hidden font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* Save Button for Admin */}
                {!readOnly && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleSaveDeliveryDetails}
                      className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Check size={14} />
                      <span>Save Delivery Partner & Tracking Details</span>
                    </button>
                  </div>
                )}

                {/* Active Tracking URL banner when Out for Delivery */}
                {canSeeTracking && (
                  <div className="p-2.5 bg-white rounded-xl border border-teal-100 space-y-1">
                    <span className="text-[10px] font-bold text-gray-600 flex items-center gap-1">
                      <ExternalLink size={11} className="text-teal-700" /> Active Tracking & Customer Verification Link:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        readOnly
                        value={isSelf ? selfDeliveryUrl : (order.trackingUrl || `https://track.shiprocket.in/tracking/${newTracking}`)}
                        className="flex-1 px-2.5 py-1 text-[11px] font-mono bg-gray-50 border border-gray-200 rounded-lg text-gray-700 truncate select-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const url = isSelf ? selfDeliveryUrl : (order.trackingUrl || `https://track.shiprocket.in/tracking/${newTracking}`);
                          navigator.clipboard.writeText(url);
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2000);
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold bg-teal-800 hover:bg-teal-900 text-white rounded-lg transition-colors cursor-pointer shrink-0"
                      >
                        {copiedLink ? 'Copied!' : 'Copy Link'}
                      </button>
                      <a
                        href={isSelf ? selfDeliveryUrl : (order.trackingUrl || `https://track.shiprocket.in/tracking/${newTracking}`)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 text-[11px] font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                      >
                        <ExternalLink size={11} /> Open Link
                      </a>
                    </div>
                  </div>
                )}

              </div>
            );
          })()}

        </div>

      </div>

      {/* Tax Invoice Modal with latest merged order state */}
      <TaxInvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        order={(() => {
          const isSelf = deliveryModeInput === 'self_delivery';
          const tokenVal = String(order.selfDeliveryDetails?.deliveryPartnerToken || newTracking.trim() || `DLV-${order.id}`).trim();
          const websiteOrigin = (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:5173` : 'http://localhost:5173');
          const selfTrackingLink = `${websiteOrigin}/#delivery-partner?token=${encodeURIComponent(tokenVal)}`;
          
          let carrierUrl = order.trackingUrl || '';
          if (!isSelf && newTracking.trim()) {
            const lowerCourier = courierInput.toLowerCase();
            carrierUrl = lowerCourier.includes('delhivery') ? `https://www.delhivery.com/track/package/${newTracking.trim()}` :
              lowerCourier.includes('bluedart') ? `https://www.bluedart.com/tracking?awb=${newTracking.trim()}` :
              lowerCourier.includes('dtdc') ? `https://www.dtdc.in/tracking/shipment-tracking.asp?awb=${newTracking.trim()}` :
              lowerCourier.includes('ekart') ? `https://ekartlogistics.com/shipmenttrack/${newTracking.trim()}` :
              `https://track.shiprocket.in/tracking/${newTracking.trim()}`;
          }

          return {
            ...order,
            status: selectedStatus || order.status,
            overallStatus: selectedStatus || order.status,
            deliveryMode: deliveryModeInput,
            deliveryType: deliveryModeInput,
            courierName: !isSelf ? courierInput : '',
            trackingNumber: !isSelf ? newTracking.trim() : tokenVal,
            trackingUrl: isSelf ? selfTrackingLink : carrierUrl,
            selfDeliveryDetails: isSelf ? {
              ...(order.selfDeliveryDetails || {}),
              deliveryPersonName: driverNameInput.trim(),
              deliveryPersonPhone: driverPhoneInput.trim(),
              vehicleNumber: vehicleNumberInput.trim(),
              deliveryPartnerToken: tokenVal,
              trackingUrl: selfTrackingLink
            } : order.selfDeliveryDetails
          };
        })()}
      />
    </div>
  );
}
