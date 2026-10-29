import useModalBackTrap from '../../hooks/useModalBackTrap';
import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ArrowLeft,
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
  Lock,
  Loader2,
  MessageSquare
} from 'lucide-react';
import TaxInvoiceModal, { parseStateInfo } from './TaxInvoiceModal';
import { resendRiderWhatsAppApi, SERVER_URL } from '../../utils/api';
import { generateRiderWhatsAppMessage, buildRiderWhatsAppUrl } from '../../utils/whatsappRiderHelper';
import { useToast } from '../../context/ToastContext';
import { useAdminData } from '../../context/AdminDataContext';

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
    const invalidStatuses = ['', 'none', 'n/a', 'no_request', 'normal', 'null', 'undefined'];
    
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
  useModalBackTrap(isOpen, onClose);
  const [currentOrder, setCurrentOrder] = useState(order);
  const toast = useToast();
  const adminCtx = typeof useAdminData === 'function' ? useAdminData() : {};
  const sellers = adminCtx?.sellers || [];
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [newTracking, setNewTracking] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(order?.overallStatus || order?.status || 'Pending');
  const [refundReason, setRefundReason] = useState('');
  const [showRefundPrompt, setShowRefundPrompt] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedAwb, setCopiedAwb] = useState(false);
  const [statusUpdatedToast, setStatusUpdatedToast] = useState(false);

  const displayOrder = currentOrder || order;

  // Helper to reliably resolve initial delivery mode from order data
  const resolveOrderDeliveryMode = (ord) => {
    if (!ord) return 'third_party';
    const m = String(ord.deliveryMode || ord.deliveryType || '').toLowerCase();
    const c = String(ord.courierName || ord.carrier || ord.thirdPartyDetails?.courierName || '').trim();
    const hasCourier = m.includes('third') || m.includes('courier') || Boolean(c && c !== 'N/A' && c !== 'null');
    const hasSelf = m.includes('self') || ord.settlementRule === 'COD_SELF_DELIVERY' || Boolean(ord.selfDeliveryDetails?.deliveryPartnerToken || ord.selfDeliveryDetails?.deliveryPersonName || ord.deliveryOtp);
    if (hasSelf && !hasCourier) return 'self_delivery';
    if (hasCourier) return 'third_party';
    return m === 'self_delivery' ? 'self_delivery' : 'third_party';
  };

  // Delivery Partner Decision State
  const [deliveryModeInput, setDeliveryModeInput] = useState(() => resolveOrderDeliveryMode(order));
  const [courierInput, setCourierInput] = useState(() => order?.courierName || order?.thirdPartyDetails?.courierName || '');
  const [driverNameInput, setDriverNameInput] = useState('');
  const [driverPhoneInput, setDriverPhoneInput] = useState('');
  const [vehicleNumberInput, setVehicleNumberInput] = useState('');

  // Automated WhatsApp dispatch state
  const [isSavingDelivery, setIsSavingDelivery] = useState(false);
  const [isResendingWhatsApp, setIsResendingWhatsApp] = useState(false);
  const [whatsappSentRef, setWhatsappSentRef] = useState(null);

  // Workflow action loading and feedback state
  const [actionLoadingKey, setActionLoadingKey] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null); // { type: 'success' | 'error', message: string }

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

  const handleReturnExchangeStatusUpdate = async (newStatus, extraPayload = {}, actionKey = 'workflow') => {
    const orderIdentifier = order?._id || order?.id || order?.orderId;
    if (!orderIdentifier) {
      if (toast?.error) toast.error('Order identifier missing');
      return;
    }

    setActionLoadingKey(actionKey);
    setActionFeedback(null);

    try {
      let res;
      if (onUpdateReturnExchangeStatus) {
        res = await onUpdateReturnExchangeStatus(orderIdentifier, {
          status: newStatus,
          ...extraPayload
        });
      }

      if (res && res.success === false) {
        const errorMsg = res.message || 'Failed to update Return/Exchange status';
        setActionFeedback({ type: 'error', message: errorMsg });
        if (toast?.error) {
          toast.error(errorMsg);
        }
        return;
      }

      // Optimistically / immediately update local currentOrder so the UI steps advance right away!
      const updatedOrder = res?.order || {};
      setCurrentOrder(prev => ({
        ...(prev || order),
        ...updatedOrder,
        status: updatedOrder.status || (prev || order).status,
        overallStatus: updatedOrder.overallStatus || (prev || order).overallStatus,
        returnRequest: updatedOrder.returnRequest || {
          ...((prev || order).returnRequest || {}),
          status: newStatus,
          ...extraPayload
        }
      }));

      const readableStatus = String(newStatus).replace(/_/g, ' ');
      const successMsg = `Return/Exchange status updated to ${readableStatus}`;
      setActionFeedback({ type: 'success', message: successMsg });
      if (toast?.success) {
        toast.success(successMsg);
      }

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
    } catch (err) {
      const errorMsg = err.message || 'Failed to update Return/Exchange status. Please verify server connection.';
      setActionFeedback({ type: 'error', message: errorMsg });
      if (toast?.error) {
        toast.error(errorMsg);
      }
    } finally {
      setActionLoadingKey(null);
    }
  };

  const activeOrderIdRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !order) {
      activeOrderIdRef.current = null;
      return;
    }

    const orderId = order?._id || order?.id || order?.orderId;
    const isNewOrderSelection = activeOrderIdRef.current !== orderId;

    if (isNewOrderSelection) {
      activeOrderIdRef.current = orderId;
      setCurrentOrder(order);
      setNewTracking(order.trackingNumber || '');
      setSelectedStatus(order.overallStatus || order.status || 'Pending');

      const resolvedMode = resolveOrderDeliveryMode(order);
      setDeliveryModeInput(resolvedMode);
      setCourierInput(order.courierName || order.thirdPartyDetails?.courierName || (resolvedMode === 'self_delivery' ? '' : 'Delhivery'));
      setDriverNameInput(order.selfDeliveryDetails?.deliveryPersonName || '');
      setDriverPhoneInput(order.selfDeliveryDetails?.deliveryPersonPhone || '');
      setVehicleNumberInput(order.selfDeliveryDetails?.vehicleNumber || '');

      if (order.selfDeliveryDetails?.whatsappStatus) {
        setWhatsappSentRef({
          messageId: order.selfDeliveryDetails.whatsappMessageId,
          sentTo: order.selfDeliveryDetails.whatsappSentTo,
          sentAt: order.selfDeliveryDetails.whatsappSentAt
        });
      } else {
        setWhatsappSentRef(null);
      }
    } else {
      // Same order background sync from polling:
      // Update non-input fields without wiping the user's actively typed inputs
      setCurrentOrder(prev => ({
        ...(prev || order),
        ...order,
        deliveryMode: deliveryModeInput,
        selfDeliveryDetails: {
          ...(order.selfDeliveryDetails || {}),
          deliveryPersonName: driverNameInput || prev?.selfDeliveryDetails?.deliveryPersonName || order.selfDeliveryDetails?.deliveryPersonName,
          deliveryPersonPhone: driverPhoneInput || prev?.selfDeliveryDetails?.deliveryPersonPhone || order.selfDeliveryDetails?.deliveryPersonPhone,
          vehicleNumber: vehicleNumberInput || prev?.selfDeliveryDetails?.vehicleNumber || order.selfDeliveryDetails?.vehicleNumber
        }
      }));
    }
  }, [isOpen, order?._id, order?.id, order?.orderId]);

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

  const handleSaveDeliveryDetails = async () => {
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
      const websiteOrigin = (import.meta.env.VITE_WEBSITE_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:5173` : 'http://localhost:5173')).replace(/\/+$/, '');
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

    setIsSavingDelivery(true);
    const orderIdentifier = order._id || order.id || order.orderId;
    try {
      if (onUpdateTracking) {
        await onUpdateTracking(orderIdentifier, payload.trackingNumber, payload);
      }
      if (onUpdateStatus) {
        await onUpdateStatus(orderIdentifier, selectedStatus, payload);
      }

      // Immediately sync local state so UI updates without needing reload
      const updatedSelfDetails = isSelf ? {
        ...(order.selfDeliveryDetails || {}),
        deliveryPersonName: driverNameInput.trim(),
        deliveryPersonPhone: driverPhoneInput.trim(),
        vehicleNumber: vehicleNumberInput.trim(),
        deliveryPartnerToken: tokenVal,
        trackingUrl: selfTrackingLink
      } : undefined;

      const updatedItems = (order.items || []).map(it => ({
        ...it,
        deliveryType: isSelf ? 'self_delivery' : 'third_party',
        thirdPartyDetails: isSelf ? undefined : {
          courierName: courierInput.trim(),
          trackingNumber: assignedTrackingNumber,
          trackingUrl: carrierUrl
        },
        selfDeliveryDetails: isSelf ? updatedSelfDetails : undefined
      }));

      setCurrentOrder(prev => ({
        ...(prev || order),
        ...payload,
        items: updatedItems,
        courierName: isSelf ? '' : courierInput.trim(),
        selfDeliveryDetails: updatedSelfDetails,
        trackingNumber: payload.trackingNumber,
        trackingUrl: payload.trackingUrl,
        status: selectedStatus,
        overallStatus: selectedStatus
      }));

      if (isSelf) {
        alert(`✅ Delivery partner & driver details saved successfully for Order #${order.id || order.orderId}!\n\nDriver: ${driverNameInput.trim()} (${driverPhoneInput.trim()})\nVehicle: ${vehicleNumberInput.trim()}`);
      } else {
        alert(`✅ Delivery partner & tracking details saved successfully for Order #${order.id || order.orderId}!\n\nTracking Link: ${carrierUrl}`);
      }
    } finally {
      setIsSavingDelivery(false);
    }
  };

  const handleResendRiderWhatsApp = async () => {
    const orderIdentifier = order._id || order.id || order.orderId;
    if (!orderIdentifier || !driverPhoneInput.trim()) {
      alert('⚠️ No rider phone number found to send WhatsApp message.');
      return;
    }
    const tokenVal = String(order.selfDeliveryDetails?.deliveryPartnerToken || newTracking.trim() || `DLV-${order.id}`).trim();
    const websiteOrigin = (import.meta.env.VITE_WEBSITE_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:5173` : 'http://localhost:5173')).replace(/\/+$/, '');
    const selfTrackingLink = `${websiteOrigin}/#delivery-partner?token=${encodeURIComponent(tokenVal)}`;

    const waMsg = generateRiderWhatsAppMessage({
      order,
      driverName: driverNameInput.trim(),
      vehicleNumber: vehicleNumberInput.trim(),
      trackingLink: selfTrackingLink
    });
    const waUrl = buildRiderWhatsAppUrl({ phone: driverPhoneInput, message: waMsg });
    if (waUrl) {
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }
    setIsResendingWhatsApp(true);
    try {
      await resendRiderWhatsAppApi(orderIdentifier);
    } catch (err) {
      console.warn('Backend resend log:', err);
    } finally {
      setIsResendingWhatsApp(false);
    }
  };

  const handleSaveTracking = () => {
    handleSaveDeliveryDetails();
  };

  const handleApplyStatusUpdate = async (targetStatus) => {
    const statusToApply = targetStatus || selectedStatus;
    const activeOrder = displayOrder || order;
    if (!activeOrder) return;
    const orderIdentifier = activeOrder._id || activeOrder.id || activeOrder.orderId;
    setSelectedStatus(statusToApply);
    setActionLoadingKey('status');
    setActionFeedback(null);

    // Fulfillment forward milestone ranks
    const STATUS_PROGRESSION_RANK = {
      pending: 0,
      placed: 0,
      confirmed: 1,
      processing: 2,
      packed: 3,
      shipped: 4,
      in_transit: 4,
      out_for_delivery: 5,
      delivered: 6,
      completed: 6
    };
    const targetKey = String(statusToApply || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
    const targetRank = STATUS_PROGRESSION_RANK[targetKey];

    // Optimistically apply forward promotion to local items
    if (Array.isArray(activeOrder.items)) {
      const updatedItems = activeOrder.items.map(it => {
        const itKey = String(it.status || 'Pending').toLowerCase().trim().replace(/[\s-]+/g, '_');
        if (itKey === 'cancelled' || itKey === 'canceled') return it;
        if (targetRank !== undefined) {
          const itRank = STATUS_PROGRESSION_RANK[itKey] !== undefined ? STATUS_PROGRESSION_RANK[itKey] : 0;
          if (itRank < targetRank) {
            return { ...it, status: statusToApply };
          }
          return it;
        } else if (targetKey === 'cancelled') {
          return { ...it, status: 'Cancelled' };
        }
        return it;
      });
      setCurrentOrder(prev => ({
        ...prev,
        status: statusToApply,
        overallStatus: statusToApply,
        items: updatedItems
      }));
    }

    try {
      if (onUpdateStatus) {
        await onUpdateStatus(orderIdentifier, statusToApply);
      }
      setStatusUpdatedToast(true);
      if (toast?.success) {
        toast.success(`Order status updated to ${statusToApply}`);
      }
      setActionFeedback({ type: 'success', message: `Order status successfully updated to ${statusToApply}` });
      setTimeout(() => setStatusUpdatedToast(false), 2500);
    } catch (err) {
      const errMsg = err.message || 'Failed to update order status';
      setActionFeedback({ type: 'error', message: errMsg });
      if (toast?.error) {
        toast.error(errMsg);
      }
    } finally {
      setActionLoadingKey(null);
    }
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
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-gray-200 print:hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-all cursor-pointer border border-gray-200"
              title="Back to Orders List"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
              <ShoppingBag size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-lg text-gray-900">Order #{order.id}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  (displayOrder?.overallStatus || displayOrder?.status) === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                  (displayOrder?.overallStatus || displayOrder?.status) === 'Cancelled' ? 'bg-red-100 text-red-800' :
                  ((displayOrder?.overallStatus || displayOrder?.status) === 'Out for Delivery' || (displayOrder?.overallStatus || displayOrder?.status) === 'out_for_delivery') ? 'bg-purple-100 text-purple-900 border border-purple-200' :
                  (displayOrder?.overallStatus || displayOrder?.status) === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                  ((displayOrder?.overallStatus || displayOrder?.status) === 'Packed' || (displayOrder?.overallStatus || displayOrder?.status) === 'Confirmed') ? 'bg-indigo-100 text-indigo-800' :
                  (displayOrder?.overallStatus || displayOrder?.status) === 'Processing' ? 'bg-sky-100 text-sky-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {displayOrder?.overallStatus || displayOrder?.status}
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

              {Boolean(order.returnRequest?.type === 'exchange' || order.returnRequest?.requestType === 'exchange' || String(order.status).toLowerCase().includes('exchange')) && (() => {
                const targetReturnItem = (order.items || []).find(it => 
                  (order.returnRequest?.itemId && String(it._id || it.id || it.productId) === String(order.returnRequest.itemId)) ||
                  (order.returnRequest?.itemName && it.name === order.returnRequest.itemName)
                ) || order.items?.[0] || {};

                return (
                <div className="p-3.5 bg-gradient-to-r from-purple-50 via-indigo-50 to-teal-50 border border-purple-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-extrabold text-xs uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                      <span>🔄</span> Exchange Items & Financial Action
                    </span>
                    {order.returnRequest?.priceAdjustmentType === 'extra_payment' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-amber-200 text-amber-950 border border-amber-300">
                        💰 Collect Extra: +₹{order.returnRequest.priceDifference}
                      </span>
                    )}
                    {order.returnRequest?.priceAdjustmentType === 'partial_refund' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-emerald-200 text-emerald-950 border border-emerald-300">
                        💸 Refund Customer: ₹{Math.abs(order.returnRequest.priceDifference)}
                      </span>
                    )}
                    {order.returnRequest?.priceAdjustmentType === 'none' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-blue-200 text-blue-950 border border-blue-300">
                        ⚖️ Equal Value (₹0)
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-2.5 rounded-lg border border-purple-100">
                      <span className="text-[10px] font-bold uppercase text-purple-600 block">Original Item to Collect:</span>
                      <strong className="text-gray-900">{order.returnRequest?.itemName || targetReturnItem?.name}</strong>
                      <div className="text-[11px] text-gray-600 mt-0.5 font-mono">
                        Spec: {targetReturnItem?.size ? `Size ${targetReturnItem.size}` : (order.returnRequest?.isMeterBased ? `${targetReturnItem?.quantity}m` : 'Base Item')} • Price: ₹{order.returnRequest?.originalItemPrice || targetReturnItem?.finalPrice || targetReturnItem?.price || 0}
                      </div>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-purple-100">
                      <span className="text-[10px] font-bold uppercase text-indigo-600 block">Replacement Item to Send:</span>
                      <strong className="text-gray-900">{order.returnRequest?.itemName || targetReturnItem?.name}</strong>
                      <div className="text-[11px] text-indigo-900 font-extrabold mt-0.5 font-mono">
                        Requested: {order.returnRequest?.exchangeLength ? `${order.returnRequest.exchangeLength} Meter(s)` : (order.returnRequest?.exchangeSize || order.returnRequest?.targetSize || 'Replacement')} • Price: ₹{order.returnRequest?.replacementItemPrice || order.returnRequest?.originalItemPrice || targetReturnItem?.finalPrice || targetReturnItem?.price || 0}
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] rounded-lg p-2.5 bg-white/90 border border-purple-200 font-semibold text-purple-950 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-950">
                      <span>🔄 1-Round Doorstep Swap:</span>
                      <span className="font-normal text-gray-700">Rider delivers replacement unit & collects original return item in a single trip.</span>
                    </div>
                    {order.returnRequest?.priceAdjustmentType === 'extra_payment' ? (
                      <div className="text-amber-900 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                        ⚠️ <strong>Delivery Rider Instruction:</strong> Rider must collect <strong>₹{order.returnRequest.priceDifference} in cash or UPI</strong> from the customer upon delivering replacement.
                      </div>
                    ) : order.returnRequest?.priceAdjustmentType === 'partial_refund' ? (
                      <div className="text-emerald-900 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                        ✅ <strong>Delivery Rider Instruction:</strong> Rider collects <strong>₹0</strong>. Partial refund of ₹{Math.abs(order.returnRequest.priceDifference)} is credited directly to customer's account.
                      </div>
                    ) : (
                      <div className="text-emerald-900 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                        ✅ <strong>Delivery Rider Instruction:</strong> Rider collects <strong>₹0</strong> (Equal price exchange).
                      </div>
                    )}
                  </div>
                </div>
                );
              })()}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-amber-100 space-y-1">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Reason for Request</div>
                  <div className="font-semibold text-gray-800">{order.returnRequest.reason || 'N/A'}</div>
                  {(order.returnRequest.exchangeSize || order.returnRequest.targetSize || order.returnRequest.exchangeLength) && (
                    <div className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-1 rounded inline-flex items-center gap-1.5 flex-wrap mt-1">
                      <span>
                        {order.returnRequest.isMeterBased || order.returnRequest.exchangeLength
                          ? 'Requested Length:'
                          : String(order.returnRequest.exchangeSize || order.returnRequest.targetSize || '').toLowerCase().includes('kids') || String(order.returnRequest.exchangeSize || order.returnRequest.targetSize || '').toLowerCase().includes('uk/ind')
                          ? 'Requested Shoe Size:'
                          : String(order.returnRequest.exchangeSize || order.returnRequest.targetSize || '').toLowerCase().includes('line') || String(order.returnRequest.exchangeSize || order.returnRequest.targetSize || '').toLowerCase().includes('pack') || String(order.returnRequest.exchangeSize || order.returnRequest.targetSize || '').toLowerCase().includes('class') || String(order.returnRequest.exchangeSize || order.returnRequest.targetSize || '').toLowerCase().includes('replacement')
                          ? 'Requested Variant:'
                          : 'Requested Replacement Size:'}{' '}
                        <strong>
                          {order.returnRequest.exchangeLength
                            ? `${order.returnRequest.exchangeLength} Meter(s)`
                            : (order.returnRequest.exchangeSize || order.returnRequest.targetSize)}
                        </strong>
                      </span>
                      {order.returnRequest.priceAdjustmentType === 'extra_payment' && (
                        <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                          +₹{order.returnRequest.priceDifference} Extra
                        </span>
                      )}
                      {order.returnRequest.priceAdjustmentType === 'partial_refund' && (
                        <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                          ₹{Math.abs(order.returnRequest.priceDifference)} Refund
                        </span>
                      )}
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
                  <div className="text-[11px] font-bold text-amber-900 flex items-center justify-between flex-wrap gap-1">
                    <span>
                      Admin Action Workflow for: <strong className="text-amber-950 underline">{order.returnRequest?.itemName || (order.items || []).find(it => String(it._id || it.id) === String(order.returnRequest?.itemId))?.name || 'Item'}</strong>
                      {(() => {
                        const tgt = (order.items || []).find(it => String(it._id || it.id) === String(order.returnRequest?.itemId));
                        const sName = tgt?.storeName || tgt?.sellerName || tgt?.sellerDetails?.storeName;
                        return sName ? <span className="text-[10px] font-normal text-amber-700 ml-1.5">(Sold by: {sName})</span> : null;
                      })()}
                    </span>
                    {actionLoadingKey && (
                      <span className="text-[10px] text-amber-700 flex items-center gap-1 font-semibold animate-pulse">
                        <Loader2 size={12} className="animate-spin text-amber-600" /> Processing action...
                      </span>
                    )}
                  </div>

                  {/* Inline Action Feedback Banner */}
                  {actionFeedback && (
                    <div className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 transition-all ${
                      actionFeedback.type === 'success' 
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs' 
                        : 'bg-rose-50 border-rose-300 text-rose-900 shadow-xs'
                    }`}>
                      <div className="flex items-center gap-2">
                        {actionFeedback.type === 'success' ? (
                          <CheckCircle size={15} className="text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle size={15} className="text-rose-600 shrink-0" />
                        )}
                        <span>{actionFeedback.message}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setActionFeedback(null)} 
                        className="text-gray-400 hover:text-gray-700 font-bold px-1.5 py-0.5 rounded cursor-pointer"
                        title="Dismiss"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {(() => {
                    const retReq = displayOrder?.returnRequest || order?.returnRequest || {};
                    const retStatus = String(retReq.status || '').toLowerCase().trim();
                    const retType = String(retReq.type || retReq.requestType || (retStatus.includes('exchange') ? 'exchange' : 'return')).toLowerCase().trim();
                    const isExchange = retType === 'exchange';
                    const isReturn = retType === 'return';

                    const isRequested = ['requested', 'return_requested', 'exchange_requested'].includes(retStatus);
                    const isApproved = ['approved', 'return_approved', 'exchange_approved'].includes(retStatus);
                    const isPickupScheduled = retStatus === 'pickup_scheduled';
                    const isProductReceived = ['product_received', 'product_return_received'].includes(retStatus);
                    const isExchangeDispatched = retStatus === 'exchange_dispatched';

                    return (
                      <div className="flex flex-wrap items-center gap-2">
                        {isRequested && (
                          <>
                            <button
                              type="button"
                              disabled={Boolean(actionLoadingKey)}
                              onClick={() => handleReturnExchangeStatusUpdate(isExchange ? 'exchange_approved' : 'return_approved', {}, 'approve')}
                              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                            >
                              {actionLoadingKey === 'approve' ? (
                                <>
                                  <Loader2 size={13} className="animate-spin text-white" />
                                  <span>Approving {isExchange ? 'Exchange' : 'Return'}...</span>
                                </>
                              ) : (
                                <span>✓ Approve {isExchange ? 'Exchange' : 'Return'}</span>
                              )}
                            </button>
                            <button
                              type="button"
                              disabled={Boolean(actionLoadingKey)}
                              onClick={() => setReturnActionState(prev => ({ ...prev, showRejectInput: !prev.showRejectInput }))}
                              className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                            >
                              <span>✕ Reject Request</span>
                            </button>
                          </>
                        )}

                        {/* For Returns: Schedule pickup */}
                        {isApproved && isReturn && (
                          <button
                            type="button"
                            disabled={Boolean(actionLoadingKey)}
                            onClick={() => setReturnActionState(prev => ({ ...prev, showPickupInput: !prev.showPickupInput }))}
                            className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                          >
                            <span>📅 Schedule Return Pickup</span>
                          </button>
                        )}

                        {/* For Exchanges: Direct 1-Round Doorstep Swap (Delivers Replacement + Picks Up Return at same time) */}
                        {(isApproved || isPickupScheduled || isProductReceived) && isExchange && !isExchangeDispatched && (
                          <button
                            type="button"
                            disabled={Boolean(actionLoadingKey)}
                            onClick={() => setReturnActionState(prev => ({ ...prev, showDispatchInput: !prev.showDispatchInput }))}
                            className="px-3.5 py-1.5 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                          >
                            <span>🚚 Dispatch Replacement & Doorstep Swap</span>
                          </button>
                        )}

                        {/* For Returns: Mark product received and restore stock */}
                        {isPickupScheduled && isReturn && (
                          <button
                            type="button"
                            disabled={Boolean(actionLoadingKey)}
                            onClick={() => handleReturnExchangeStatusUpdate('product_received', {}, 'received')}
                            className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                          >
                            {actionLoadingKey === 'received' ? (
                              <>
                                <Loader2 size={13} className="animate-spin text-white" />
                                <span>Restoring Stock...</span>
                              </>
                            ) : (
                              <span>📦 Mark Product Received & Restore Stock</span>
                            )}
                          </button>
                        )}

                        {/* For Returns: Mark Refund Completed */}
                        {isProductReceived && isReturn && (
                          <button
                            type="button"
                            disabled={Boolean(actionLoadingKey)}
                            onClick={() => setReturnActionState(prev => ({ ...prev, showRefundInput: !prev.showRefundInput }))}
                            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                          >
                            <span>💳 Mark Refund Completed</span>
                          </button>
                        )}

                        {/* For Exchanges: Complete Doorstep Swap (Replacement Delivered & Returned Unit Restocked in 1 round) */}
                        {(isExchangeDispatched || (isProductReceived && isExchange)) && (
                          <button
                            type="button"
                            disabled={Boolean(actionLoadingKey)}
                            onClick={() => handleReturnExchangeStatusUpdate('exchanged', {}, 'complete')}
                            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                          >
                            {actionLoadingKey === 'complete' ? (
                              <>
                                <Loader2 size={13} className="animate-spin text-white" />
                                <span>Completing Exchange...</span>
                              </>
                            ) : (
                              <span>✓ Complete Doorstep Swap (Replacement Delivered & Old Item Restocked)</span>
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })()}

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
                        disabled={Boolean(actionLoadingKey) || !returnActionState.rejectionReason.trim()}
                        onClick={() => handleReturnExchangeStatusUpdate('rejected', { rejectionReason: returnActionState.rejectionReason }, 'reject')}
                        className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        {actionLoadingKey === 'reject' ? (
                          <>
                            <Loader2 size={13} className="animate-spin text-white" />
                            <span>Rejecting...</span>
                          </>
                        ) : (
                          <span>Confirm Rejection</span>
                        )}
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
                        disabled={Boolean(actionLoadingKey)}
                        onClick={() => handleReturnExchangeStatusUpdate('pickup_scheduled', { pickupDate: returnActionState.pickupDate }, 'pickup')}
                        className="ml-2 px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        {actionLoadingKey === 'pickup' ? (
                          <>
                            <Loader2 size={13} className="animate-spin text-white" />
                            <span>Scheduling Pickup...</span>
                          </>
                        ) : (
                          <span>Confirm Pickup Date</span>
                        )}
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
                        disabled={Boolean(actionLoadingKey)}
                        onClick={() => handleReturnExchangeStatusUpdate('refund_completed', { refundTxnId: returnActionState.refundTxnId }, 'refund')}
                        className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        {actionLoadingKey === 'refund' ? (
                          <>
                            <Loader2 size={13} className="animate-spin text-white" />
                            <span>Confirming Refund...</span>
                          </>
                        ) : (
                          <span>Confirm Refund Completed</span>
                        )}
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
                        disabled={Boolean(actionLoadingKey)}
                        onClick={() => handleReturnExchangeStatusUpdate('exchange_dispatched', { exchangeAwb: returnActionState.exchangeAwb, exchangeCourier: returnActionState.exchangeCourier }, 'dispatch')}
                        className="px-3.5 py-1.5 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        {actionLoadingKey === 'dispatch' ? (
                          <>
                            <Loader2 size={13} className="animate-spin text-white" />
                            <span>Dispatching Replacement...</span>
                          </>
                        ) : (
                          <span>Confirm Replacement Dispatched</span>
                        )}
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
              <span className="font-bold text-amber-900">Current Order Status: <span className="font-black text-amber-950">{displayOrder?.overallStatus || displayOrder?.status}</span></span>
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
                </select>

                <button
                  type="button"
                  disabled={Boolean(actionLoadingKey)}
                  onClick={() => handleApplyStatusUpdate(selectedStatus)}
                  className={`px-3.5 py-1.5 bg-teal-800 hover:bg-teal-900 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                    actionLoadingKey === 'status' ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {actionLoadingKey === 'status' ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-white" />
                      <span>Updating Status...</span>
                    </>
                  ) : statusUpdatedToast ? (
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
                {displayOrder?.status !== 'Cancelled' && displayOrder?.overallStatus !== 'Cancelled' && (
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
                {(() => {
                  const modalStatus = String(order.status || order.overallStatus || '').toLowerCase().trim();
                  const hasPendingItems = Array.isArray(order.items) && order.items.length > 0 && order.items.some(it => {
                    const itStatus = String(it.status || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
                    return !itStatus || ['pending', 'placed', 'unconfirmed', 'draft'].includes(itStatus);
                  });
                  const isConfirmedOrder = modalStatus && !['pending', 'placed', 'unconfirmed', 'draft', ''].includes(modalStatus) && !hasPendingItems;
                  const isLocked = !isConfirmedOrder;
                  return (
                    <button
                      onClick={() => setIsInvoiceOpen(true)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 border ${
                        isLocked
                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-200'
                      }`}
                      title={isLocked ? "Invoice locked while order status is pending confirmation" : "View & Print GST Tax Invoice & Settlement"}
                    >
                      {isLocked ? <Lock size={13} /> : <FileText size={13} />}
                      <span>{isLocked ? 'Invoice Locked (Pending)' : 'Tax Invoice & Settlement'}</span>
                    </button>
                  );
                })()}
                {/* Statutory Invoicing: Exchange gets BOTH Credit Note (returned item) & Exchange Tax Invoice (new item); Returns/Refunds get Credit Note ONLY */}
                {(() => {
                  const retType = String(order.returnRequest?.type || order.returnRequest?.requestType || '').toLowerCase();
                  const isOrderExchange = retType === 'exchange' || String(order.status).toLowerCase().includes('exchange');
                  const retStatus = String(order.returnRequest?.status || order.overallStatus || order.status || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
                  const acceptedStatuses = [
                    'approved', 'return_approved', 'exchange_approved', 'exchange_dispatched', 'exchanged', 'completed',
                    'pickup_scheduled', 'product_received', 'product_return_received',
                    'refund_initiated', 'refund_processed', 'refund_completed', 'refunded'
                  ];
                  const isReturnAccepted = acceptedStatuses.some(s => retStatus.includes(s));
                  const isCancelled = String(order.status).toLowerCase() === 'cancelled' || Boolean(order.cancelledAt);
                  const canShowCreditNote = isOrderExchange ? isReturnAccepted : (isReturnAccepted || isCancelled);
                  const isPendingApproval = !isCancelled && (retType === 'return' || retType === 'exchange' || retStatus.includes('return') || retStatus.includes('exchange')) && !isReturnAccepted;

                  return (
                    <>
                      {canShowCreditNote && (
                        <a
                          href={`${SERVER_URL}/orders/${order.id || order._id}/credit-note`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-rose-200"
                          title="Download GST Credit Note under Section 34 of CGST Act (Original Returned Item)"
                        >
                          <FileText size={13} /> GST Credit Note
                        </a>
                      )}
                      {isPendingApproval && (
                        <span
                          className="px-3 py-1.5 bg-gray-100 text-gray-500 text-xs font-semibold rounded-lg border border-gray-200 cursor-not-allowed flex items-center gap-1 shadow-2xs"
                          title="Credit Note will be generated after Return/Exchange is Approved / Accepted"
                        >
                          <Lock size={12} className="text-gray-400" />
                          <span>Credit Note (Pending Approval)</span>
                        </span>
                      )}
                      {isOrderExchange && (
                        <a
                          href={`${SERVER_URL}/orders/${order.id || order._id}/exchange-invoice`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-indigo-200"
                          title="Download GST Replacement / Exchange Tax Invoice under Section 31 of CGST Act (New Item Sold)"
                        >
                          <FileText size={13} /> Exchange Tax Invoice
                        </a>
                      )}
                    </>
                  );
                })()}
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
              Ordered Items ({displayOrder?.items?.length || 0})
            </h4>
            <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
              {displayOrder?.items?.map((item, idx) => {
                const itemQty = Number(item.quantity || 1);
                const itemUnitPrice = Number(item.originalPrice ?? item.price ?? item.finalPrice ?? 0);
                const grossItemPrice = Math.round((itemUnitPrice * itemQty) * 100) / 100;

                const anyItemHasSpecificDiscount = (displayOrder?.items || []).some(
                  it => (it.offerDiscount !== undefined && it.offerDiscount !== null && !isNaN(Number(it.offerDiscount)) && Number(it.offerDiscount) > 0) ||
                        (it.discount !== undefined && it.discount !== null && !isNaN(Number(it.discount)) && Number(it.discount) > 0) ||
                        Boolean(it.couponCode) ||
                        (Number(it.finalPrice) > 0 && Number(it.price) > Number(it.finalPrice))
                );
                const isProductSpecificCoupon = Boolean(
                  displayOrder?.couponDetails?.applicableScope === 'specific_product' ||
                  displayOrder?.couponDetails?.applicableScope === 'specific_kit' ||
                  displayOrder?.couponDetails?.specificProductId ||
                  displayOrder?.couponDetails?.specificKitId ||
                  displayOrder?.couponDetails?.specificProductName ||
                  displayOrder?.couponDetails?.specificKitTitle ||
                  (Array.isArray(displayOrder?.couponDetails?.applicableProducts) && displayOrder.couponDetails.applicableProducts.length > 0) ||
                  (Array.isArray(displayOrder?.couponDetails?.applicableKits) && displayOrder.couponDetails.applicableKits.length > 0)
                );
                const eligibleProductIds = new Set(
                  (displayOrder?.couponDetails?.applicableProducts || [])
                    .concat(displayOrder?.couponDetails?.specificProductId ? [displayOrder.couponDetails.specificProductId] : [])
                    .concat(displayOrder?.couponDetails?.applicableKits || [])
                    .concat(displayOrder?.couponDetails?.specificKitId ? [displayOrder.couponDetails.specificKitId] : [])
                    .filter(Boolean)
                    .map(id => String(id).toLowerCase().trim())
                );
                const specProdName = String(displayOrder?.couponDetails?.specificProductName || '').toLowerCase().trim();
                const specKitTitle = String(displayOrder?.couponDetails?.specificKitTitle || '').toLowerCase().trim();
                const itemCandidateIds = [item.productId, item.id, item._id, item.customId].filter(Boolean).map(id => String(id).toLowerCase().trim());
                const isIdMatched = itemCandidateIds.some(id => eligibleProductIds.has(id));
                const itemNameLower = String(item.name || '').toLowerCase();
                const isNameMatched = Boolean(
                  (specProdName && itemNameLower.includes(specProdName)) ||
                  (specKitTitle && itemNameLower.includes(specKitTitle))
                );
                const isEligible = isProductSpecificCoupon ? (isIdMatched || isNameMatched) : true;

                const orderCouponDiscount = Number(displayOrder?.discountAmount ?? displayOrder?.discount ?? 0);
                const rawItemsSubtotal = (displayOrder?.items || []).reduce(
                  (acc, it) => acc + (Number(it.originalPrice ?? it.price ?? 0) * Number(it.quantity || 1)), 0
                );

                let itemDiscount = 0;
                if (anyItemHasSpecificDiscount) {
                  itemDiscount = Number(item.offerDiscount || item.discount || 0);
                  if (itemDiscount === 0 && Number(item.finalPrice) > 0 && Number(item.price) > Number(item.finalPrice)) {
                    itemDiscount = Math.round((Number(item.price) - Number(item.finalPrice)) * Number(item.quantity || 1) * 100) / 100;
                  }
                } else if (orderCouponDiscount > 0 && rawItemsSubtotal > 0 && isEligible) {
                  itemDiscount = Math.round((orderCouponDiscount * (grossItemPrice / rawItemsSubtotal)) * 100) / 100;
                }
                itemDiscount = Math.min(grossItemPrice, Math.max(0, itemDiscount));
                const netItemPrice = Math.max(0, Math.round((grossItemPrice - itemDiscount) * 100) / 100);
                const itemCouponCode = (itemDiscount > 0) ? (item.couponCode || item.appliedCouponCode || displayOrder?.couponCode || displayOrder?.appliedCouponCode || '') : '';

                return (
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
                        <span>Sold by: <strong className="font-bold text-teal-950">{item.storeName || item.sellerName || item.sellerDetails?.storeName || (typeof item.sellerId === 'object' ? item.sellerId.storeName : '') || displayOrder?.sellerDetails?.storeName || 'Partner Merchant'}</strong></span>
                        {(item.sellerPhone || item.sellerDetails?.phone) && (
                          <span className="text-gray-500">({item.sellerPhone || item.sellerDetails?.phone})</span>
                        )}
                      </div>
                      {itemDiscount > 0 && (
                        <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                          <span>🏷️ Coupon {itemCouponCode ? `(${itemCouponCode})` : 'Applied'}: -₹{itemDiscount.toFixed(2)} off</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    {itemDiscount > 0 ? (
                      <>
                        <div className="font-bold text-xs text-emerald-700">₹{netItemPrice.toFixed(2)}</div>
                        <div className="text-[10px] text-gray-400 line-through">₹{grossItemPrice.toFixed(2)}</div>
                        <div className="text-[9px] text-emerald-600 font-semibold">(-₹{itemDiscount.toFixed(2)} off)</div>
                      </>
                    ) : (
                      <>
                        <div className="font-bold text-xs text-gray-900">₹{grossItemPrice.toFixed(2)}</div>
                        <div className="text-[10px] text-gray-400">₹{itemUnitPrice} each</div>
                      </>
                    )}
                    {(() => {
                      const reqTargetId = String(displayOrder?.returnRequest?.itemId || displayOrder?.returnRequest?.productId || '').trim();
                      const reqTargetName = String(displayOrder?.returnRequest?.itemName || '').trim().toLowerCase();
                      const hasActiveReturnRequest = Boolean(
                        displayOrder?.returnRequest &&
                        displayOrder.returnRequest.status &&
                        !['none', 'no_request', ''].includes(String(displayOrder.returnRequest.status).toLowerCase())
                      );

                      const hasExplicitTarget = Boolean(reqTargetId || reqTargetName);
                      const isTargetMatch = Boolean(
                        (reqTargetId && (String(item._id || '') === reqTargetId || String(item.id || '') === reqTargetId || String(item.productId || '') === reqTargetId)) ||
                        (reqTargetName && String(item.name || '').trim().toLowerCase() === reqTargetName)
                      );

                      const isThisItemExchangedOrReturned = hasActiveReturnRequest && (
                        hasExplicitTarget
                          ? isTargetMatch
                          : (
                              (displayOrder?.items?.length === 1) ||
                              String(item.status || '').toLowerCase().includes('exchange') ||
                              String(item.status || '').toLowerCase().includes('return')
                            )
                      );

                      let itemStat = item.status;
                      if (!isThisItemExchangedOrReturned) {
                        if (itemStat && (itemStat.toLowerCase().includes('exchange') || itemStat.toLowerCase().includes('return') || itemStat.toLowerCase().includes('pickup'))) {
                          itemStat = 'Delivered';
                        } else if (!itemStat) {
                          itemStat = displayOrder?.status && !displayOrder.status.toLowerCase().includes('exchange') && !displayOrder.status.toLowerCase().includes('return') && !displayOrder.status.toLowerCase().includes('pickup')
                            ? displayOrder.status
                            : 'Delivered';
                        }
                      } else {
                        itemStat = itemStat || displayOrder?.returnRequest?.status || displayOrder?.status || 'Exchange Requested';
                      }

                      return (
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <span className={`inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                            itemStat === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                            itemStat === 'Shipped' || itemStat === 'Out for Delivery' ? 'bg-purple-100 text-purple-800' :
                            itemStat === 'Packed' ? 'bg-indigo-100 text-indigo-800' :
                            itemStat === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                            itemStat === 'Cancelled' ? 'bg-rose-100 text-rose-800' :
                            (itemStat.toLowerCase().includes('exchange') || itemStat.toLowerCase().includes('pickup') || itemStat.toLowerCase().includes('return')) ? 'bg-purple-100 text-purple-950 border border-purple-300' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {itemStat}
                          </span>
                          {!readOnly && (
                            <select
                              value={itemStat}
                              onChange={(e) => {
                                const newSt = e.target.value;
                                const activeOrder = displayOrder || order;
                                const ordId = activeOrder._id || activeOrder.id || activeOrder.orderId;
                                const itemIdVal = item._id || item.id || (item.productId && typeof item.productId === 'object' ? item.productId._id : item.productId) || idx;

                                // Optimistically update local modal state
                                setCurrentOrder(prev => {
                                  if (!prev || !Array.isArray(prev.items)) return prev;
                                  const updatedItems = prev.items.map((it, i) => i === idx ? { ...it, status: newSt } : it);
                                  return { ...prev, items: updatedItems };
                                });

                                if (onUpdateStatus) {
                                  onUpdateStatus(ordId, newSt, {
                                    itemId: itemIdVal,
                                    itemIndex: idx,
                                    productId: item.productId && typeof item.productId === 'object' ? item.productId._id : item.productId
                                  });
                                }
                                setStatusUpdatedToast(true);
                                setTimeout(() => setStatusUpdatedToast(false), 2000);
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
                              <option value="Exchange Requested">Exchange Requested</option>
                              <option value="Return Requested">Return Requested</option>
                              <option value="Exchange Approved">Exchange Approved</option>
                              <option value="Return Approved">Return Approved</option>
                              <option value="Exchange Pickup Scheduled">Exchange Pickup Scheduled</option>
                              <option value="Exchanged">Exchanged</option>
                              <option value="Refunded">Refunded</option>
                              <option value="Cancelled">Cancelled</option>
                              {!['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Exchange Requested', 'Return Requested', 'Exchange Approved', 'Return Approved', 'Exchange Pickup Scheduled', 'Exchanged', 'Refunded', 'Cancelled'].includes(itemStat) && (
                                <option value={itemStat}>{itemStat}</option>
                              )}
                            </select>
                          )}
                        </div>
                      );
                    })()}
                    {(() => {
                      const itMode = String(item.deliveryType || order.deliveryMode || '').toLowerCase();
                      const courierNameVal = item.thirdPartyDetails?.courierName || order.courierName;
                      const isItemSelf = itMode === 'self' || itMode === 'self_delivery' || Boolean(item.selfDeliveryDetails?.deliveryPersonName || item.selfDeliveryDetails?.deliveryPartnerToken || order.selfDeliveryDetails?.deliveryPersonName || order.selfDeliveryDetails?.deliveryPartnerToken);
                      const isItemCourier = itMode === 'third_party' || itMode === 'courier' || Boolean(courierNameVal && courierNameVal !== 'N/A' && courierNameVal !== '');

                      if (isItemSelf) {
                        return (
                          <span className="inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded mt-0.5 bg-teal-100 text-teal-800">
                            🛵 Self-Delivery
                          </span>
                        );
                      }
                      if (isItemCourier) {
                        return (
                          <span className="inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded mt-0.5 bg-blue-100 text-blue-800">
                            🚚 {courierNameVal || 'Courier'}
                          </span>
                        );
                      }
                      return (
                        <span className="inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded mt-0.5 bg-amber-100 text-amber-800">
                          ⏳ Delivery Pending
                        </span>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
              {(() => {
                const subtotalVal = Number(order.subtotal || order.items?.reduce((acc, i) => acc + (Number(i.price || 0) * Number(i.quantity || 1)), 0) || order.total || 0);
                const shipVal = Number(order.shippingFee ?? order.shippingCost ?? 0);
                const couponVal = Number(order.discountAmount ?? order.discount ?? 0);
                const codFeeVal = Number(order.codFee ?? order.codCharges ?? 0);
                const grandVal = Math.max(0, Math.round((subtotalVal + shipVal + codFeeVal - couponVal) * 100) / 100);

                let totalTaxable = 0;
                let totalTax = 0;
                const itemsRawSum = (order.items || []).reduce((acc, it) => acc + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
                const hasPerItemDiscount = (order.items || []).some(
                  it => (it.offerDiscount !== undefined && it.offerDiscount !== null && !isNaN(Number(it.offerDiscount)) && Number(it.offerDiscount) > 0) ||
                        (it.discount !== undefined && it.discount !== null && !isNaN(Number(it.discount)) && Number(it.discount) > 0) ||
                        Boolean(it.couponCode) ||
                        (Number(it.finalPrice) > 0 && Number(it.price) > Number(it.finalPrice))
                );
                const isProductSpecificCouponCalc = Boolean(
                  order.couponDetails?.applicableScope === 'specific_product' ||
                  order.couponDetails?.applicableScope === 'specific_kit' ||
                  order.couponDetails?.specificProductId ||
                  order.couponDetails?.specificKitId ||
                  order.couponDetails?.specificProductName ||
                  order.couponDetails?.specificKitTitle ||
                  (Array.isArray(order.couponDetails?.applicableProducts) && order.couponDetails.applicableProducts.length > 0) ||
                  (Array.isArray(order.couponDetails?.applicableKits) && order.couponDetails.applicableKits.length > 0)
                );
                const eligibleProductIdsCalc = new Set(
                  (order.couponDetails?.applicableProducts || [])
                    .concat(order.couponDetails?.specificProductId ? [order.couponDetails.specificProductId] : [])
                    .concat(order.couponDetails?.applicableKits || [])
                    .concat(order.couponDetails?.specificKitId ? [order.couponDetails.specificKitId] : [])
                    .filter(Boolean)
                    .map(id => String(id).toLowerCase().trim())
                );
                const specProdNameCalc = String(order.couponDetails?.specificProductName || '').toLowerCase().trim();
                const specKitTitleCalc = String(order.couponDetails?.specificKitTitle || '').toLowerCase().trim();

                (order.items || []).forEach(item => {
                  const qty = Number(item.quantity || 1);
                  const unitPrice = Number(item.price || 0);
                  const itemCandidateIds = [item.productId, item.id, item._id, item.customId].filter(Boolean).map(id => String(id).toLowerCase().trim());
                  const isIdMatched = itemCandidateIds.some(id => eligibleProductIdsCalc.has(id));
                  const itemNameLower = String(item.name || '').toLowerCase();
                  const isNameMatched = Boolean(
                    (specProdNameCalc && itemNameLower.includes(specProdNameCalc)) ||
                    (specKitTitleCalc && itemNameLower.includes(specKitTitleCalc))
                  );
                  const isEligible = isProductSpecificCouponCalc ? (isIdMatched || isNameMatched) : true;
                  let itemDiscount = 0;
                  if (hasPerItemDiscount) {
                    itemDiscount = Number(item.offerDiscount || item.discount || 0);
                    if (itemDiscount === 0 && Number(item.finalPrice) > 0 && Number(item.price) > Number(item.finalPrice)) {
                      itemDiscount = Math.round((Number(item.price) - Number(item.finalPrice)) * qty * 100) / 100;
                    }
                  } else if (couponVal > 0 && itemsRawSum > 0 && isEligible) {
                    itemDiscount = Math.round((couponVal * ((unitPrice * qty) / itemsRawSum)) * 100) / 100;
                  }
                  itemDiscount = Math.min(unitPrice * qty, Math.max(0, itemDiscount));
                  const grossPrice = Math.max(0, (unitPrice * qty) - itemDiscount);
                  const gstRate = Number(item.gstPercent ?? item.gstPercentage ?? item.gstRate ?? item.gst ?? 5);
                  if (gstRate > 0) {
                    const taxable = Math.round((grossPrice / (1 + gstRate / 100)) * 100) / 100;
                    const tax = Math.round((grossPrice - taxable) * 100) / 100;
                    totalTaxable += taxable;
                    totalTax += tax;
                  } else {
                    totalTaxable += grossPrice;
                  }
                });

                const firstSellerObj = order.items?.[0]?.sellerId;
                const sellerStateInfo = parseStateInfo(
                  firstSellerObj,
                  `${order.sellerState || ''} ${order.sellerCity || ''} ${order.sellerAddress || ''} ${order.sellerGst || ''}`
                );
                const customerStateInfo = parseStateInfo(
                  order.shippingAddress,
                  typeof order.shippingAddress === 'string'
                    ? order.shippingAddress
                    : `${order.shippingAddress?.street || ''} ${order.shippingAddress?.city || ''} ${order.shippingAddress?.state || ''} ${order.shippingAddress?.pincode || ''}`
                );

                const isSameState = !sellerStateInfo.key || !customerStateInfo.key || sellerStateInfo.key === customerStateInfo.key;
                const sellerStateStr = sellerStateInfo.name || 'Uttar Pradesh';
                const customerStateStr = customerStateInfo.name || 'Uttar Pradesh';

                // Dynamic Product GST Rate for Delivery (Composite Supply under Section 8 of CGST Act: Principal supply rate governs freight/delivery)
                // Delivery charge GST strictly matches the product's GST rate (e.g., 5% product -> 5% delivery, 0% product -> 0% delivery)
                const defaultProductGstRate = (() => {
                  const itemRates = (order.items || []).map(it => {
                    const cat = String(it.category || '').toLowerCase();
                    const isBook = cat.includes('book') || cat.includes('textbook') || String(it.name || '').toLowerCase().includes('book');
                    return Number(it.gstPercent ?? it.gstPercentage ?? it.gstRate ?? it.gst ?? (isBook ? 0 : 5));
                  }).filter(r => !isNaN(r));
                  if (itemRates.length > 0) {
                    return Math.max(...itemRates);
                  }
                  if (order.shippingGstRate !== undefined && order.shippingGstRate !== null && !isNaN(Number(order.shippingGstRate))) {
                    return Number(order.shippingGstRate);
                  }
                  return 5;
                })();

                const shippingGstRate = defaultProductGstRate;

                // Resolve exchange adjustment on the order level
                const isExchangeReq = Boolean(
                  order.returnRequest?.type === 'exchange' ||
                  order.returnRequest?.requestType === 'exchange' ||
                  String(order.overallStatus || order.status || '').toLowerCase().includes('exchange')
                );
                const exchangePriceDiff = Number(order.returnRequest?.priceDifference || 0);
                const exchangePriceAdjType = order.returnRequest?.priceAdjustmentType || (exchangePriceDiff > 0 ? 'extra_payment' : exchangePriceDiff < 0 ? 'partial_refund' : 'none');
                const exchangeAdjustmentVal = isExchangeReq
                  ? (exchangePriceAdjType === 'extra_payment' ? Math.abs(exchangePriceDiff) : (exchangePriceAdjType === 'partial_refund' ? -Math.abs(exchangePriceDiff) : 0))
                  : 0;

                const finalGrandTotal = Math.max(0, Math.round((grandVal + exchangeAdjustmentVal) * 100) / 100);

                const exchangeGstRate = defaultProductGstRate;
                const exchangeTaxable = exchangeAdjustmentVal !== 0
                  ? Math.round((exchangeAdjustmentVal / (1 + exchangeGstRate / 100)) * 100) / 100
                  : 0;
                const exchangeTax = exchangeAdjustmentVal !== 0
                  ? Math.round((exchangeAdjustmentVal - exchangeTaxable) * 100) / 100
                  : 0;

                const shipTaxable = shipVal > 0 ? (shippingGstRate > 0 ? Math.round((shipVal / (1 + shippingGstRate / 100)) * 100) / 100 : shipVal) : 0;
                const shipTax = shipVal > 0 ? Math.round((shipVal - shipTaxable) * 100) / 100 : 0;

                let combinedTaxable = Math.round((totalTaxable + shipTaxable + exchangeTaxable) * 100) / 100;
                let combinedTax = Math.round((totalTax + shipTax + exchangeTax) * 100) / 100;

                if (finalGrandTotal > 0 && Math.abs((combinedTaxable + combinedTax) - finalGrandTotal) > 0 && Math.abs((combinedTaxable + combinedTax) - finalGrandTotal) <= 0.05) {
                  combinedTaxable = Math.round((finalGrandTotal - combinedTax) * 100) / 100;
                }

                const cgst = Math.round((combinedTax / 2) * 100) / 100;
                const sgst = Math.round((combinedTax - cgst) * 100) / 100;

                return (
                  <div className="p-3.5 bg-gray-50 border-t border-gray-200 space-y-2 text-xs">
                    {/* 1. Items Subtotal */}
                    <div className="flex justify-between text-gray-700">
                      <span>Items Subtotal:</span>
                      <span className="font-mono font-bold">₹{subtotalVal.toFixed(2)}</span>
                    </div>

                    {/* 2. Delivery Charges (Added directly to Subtotal before GST calculation) */}
                    <div className="flex justify-between text-gray-700">
                      <span>Delivery Charges:</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {shipVal === 0 ? 'FREE Delivery (₹0.00)' : `+₹${shipVal.toFixed(2)}`}
                      </span>
                    </div>

                    {/* 3. Offer / Coupon */}
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

                    {/* 4. COD / Convenience Fee */}
                    {codFeeVal > 0 && (
                      <div className="flex justify-between text-gray-700">
                        <span>COD / Convenience Fee:</span>
                        <span className="font-mono font-bold text-emerald-700">+₹{codFeeVal.toFixed(2)}</span>
                      </div>
                    )}

                    {/* 5. Base Taxable Value (Excl. GST) - after adding delivery charges & exchange adjustment */}
                    <div className="flex justify-between text-gray-600 text-[11px] pt-1.5 border-t border-dashed border-gray-300">
                      <span>Base Taxable Value (Excl. GST):</span>
                      <span className="font-mono font-semibold">₹{combinedTaxable.toFixed(2)}</span>
                    </div>

                    {/* 6. GST Tax Breakdown */}
                    <div className="flex justify-between text-emerald-800 text-[11px] bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                      <div>
                        <span className="font-bold block">GST Tax Breakdown ({isSameState ? 'Intra-State Same State' : 'Inter-State Different State'}):</span>
                        {isSameState ? (
                          <span className="text-[10px]">
                            CGST ({(shippingGstRate / 2).toFixed(1).replace(/\.0$/, '')}%): ₹{cgst.toFixed(2)} • SGST ({(shippingGstRate / 2).toFixed(1).replace(/\.0$/, '')}%): ₹{sgst.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-[10px]">IGST (Integrated 100%): ₹{combinedTax.toFixed(2)} • Supply ({sellerStateStr} ➔ {customerStateStr})</span>
                        )}
                      </div>
                      <span className="font-mono font-bold self-center">₹{combinedTax.toFixed(2)}</span>
                    </div>

                    {/* 7. Exchange Price Adjustment (if applicable) */}
                    {isExchangeReq && (
                      <div className="flex justify-between text-purple-900 bg-purple-50 p-2 rounded-lg border border-purple-200 text-[11px]">
                        <div>
                          <span className="font-bold flex items-center gap-1.5">
                            <span>🔄</span> Exchange Adjustment ({order.returnRequest?.itemName || 'Item'}):
                          </span>
                          <span className="text-[10px] text-purple-700 block">
                            Replacement: {order.returnRequest?.exchangeLength ? `${order.returnRequest.exchangeLength} Meter(s)` : (order.returnRequest?.exchangeSize || order.returnRequest?.targetSize || 'Equal Value Variant')}
                          </span>
                        </div>
                        <span className="font-mono font-bold self-center">
                          {exchangePriceAdjType === 'extra_payment' && exchangePriceDiff !== 0 ? (
                            <span className="text-amber-800 font-extrabold">+₹{Math.abs(exchangePriceDiff).toFixed(2)} (Extra to Collect)</span>
                          ) : exchangePriceAdjType === 'partial_refund' && exchangePriceDiff !== 0 ? (
                            <span className="text-emerald-800 font-extrabold">-₹{Math.abs(exchangePriceDiff).toFixed(2)} (Partial Refund)</span>
                          ) : (
                            <span className="text-blue-700">₹0.00 (Equal Value Replacement)</span>
                          )}
                        </span>
                      </div>
                    )}

                    {/* 8. Total Order Amount */}
                    <div className="pt-2 border-t border-gray-300 flex items-center justify-between font-black text-gray-900">
                      <div>
                        <span className="text-xs">
                          {isExchangeReq && exchangeAdjustmentVal !== 0 ? 'Total Order Amount (After Exchange)' : 'Total Order Amount'}
                        </span>
                        <div className="text-[10px] text-gray-500 font-normal">
                          {isExchangeReq && exchangeAdjustmentVal > 0 ? (
                            <span>
                              मूल ऑनलाइन: ₹{grandVal.toFixed(2)} (Paid) • एक्सचेंज कैश: +₹{exchangeAdjustmentVal.toFixed(2)}
                            </span>
                          ) : (
                            <span>
                              {order.paymentMethod || 'Prepaid'} • {((String(order.overallStatus || order.status || '').toLowerCase().includes('delivered') || String(order.paymentStatus || '').toLowerCase() === 'paid') ? 'Paid' : (order.paymentStatus || 'Pending'))}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-display font-black text-base text-teal-900 font-mono">
                        ₹{finalGrandTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Dynamic Seller Settlement Breakdown (Rule 2 / Rules 1, 3 & 4) */}
              {(() => {
                const isCod = String(order.paymentMethod || '').toUpperCase().includes('COD') || String(order.paymentMethod || '').toUpperCase().includes('CASH');
                const rawDeliveryMode = String(order.deliveryMode || order.deliveryType || '').toLowerCase();
                const hasCourier = Boolean(order.courierName && order.courierName !== 'N/A' && order.courierName !== '');
                const hasSelfDeliveryDetails = Boolean(
                  order.selfDeliveryDetails?.deliveryPartnerToken || 
                  order.selfDeliveryDetails?.deliveryPersonName ||
                  order.deliveryOtp ||
                  (order.items || []).some(it => it.selfDeliveryDetails?.deliveryPartnerToken || it.selfDeliveryDetails?.deliveryPersonName || it.deliveryOtp)
                );
                const isExplicitSelf = rawDeliveryMode.includes('self') || 
                                       order.settlementRule === 'COD_SELF_DELIVERY' || 
                                       (order.items || []).some(it => it.settlementRule === 'COD_SELF_DELIVERY') || 
                                       Boolean((order.deliveryOtp || hasSelfDeliveryDetails) && !hasCourier);
                const isExplicitThirdParty = order.settlementRule === 'COD_THIRD_PARTY_DELIVERY' ||
                                             order.settlementRule === 'ONLINE_THIRD_PARTY_DELIVERY' ||
                                             (order.items || []).some(it => it.settlementRule === 'COD_THIRD_PARTY_DELIVERY' || it.settlementRule === 'ONLINE_THIRD_PARTY_DELIVERY') ||
                                             rawDeliveryMode.includes('third') ||
                                             rawDeliveryMode.includes('courier') ||
                                             hasCourier ||
                                             (order.items || []).some(it => String(it.deliveryType || '').toLowerCase().includes('third') || Boolean(it.thirdPartyDetails?.courierName));
                const isThirdParty = isExplicitThirdParty || !isExplicitSelf;
                const isSelf = !isThirdParty;

                let ruleNum = 1;
                let ruleTitleHi = 'नियम 1: ऑनलाइन भुगतान + सेलर डिलीवरी';
                let ruleTitleEn = 'Rule 1: Online Payment + Self Delivery';
                let ruleColor = 'bg-teal-100 text-teal-900 border-teal-300';

                if (!isCod && isThirdParty) {
                  ruleNum = 2;
                  ruleTitleHi = 'नियम 2: ऑनलाइन भुगतान + कूरियर से डिलीवरी';
                  ruleTitleEn = 'Rule 2: Online Payment + Third-Party Delivery';
                  ruleColor = 'bg-amber-100 text-amber-950 border-amber-300';
                } else if (isCod && isSelf) {
                  ruleNum = 3;
                  ruleTitleHi = 'नियम 3: कैश भुगतान + सेलर डिलीवरी';
                  ruleTitleEn = 'Rule 3: COD + Self Delivery';
                  ruleColor = 'bg-rose-100 text-rose-950 border-rose-300';
                } else if (isCod && isThirdParty) {
                  ruleNum = 4;
                  ruleTitleHi = 'नियम 4: कैश भुगतान + कूरियर डिलीवरी (रेमिटेड)';
                  ruleTitleEn = 'Rule 4: COD + Third-Party Courier';
                  ruleColor = 'bg-purple-100 text-purple-950 border-purple-300';
                }

                const isExchangeReq = Boolean(
                  order.returnRequest?.type === 'exchange' ||
                  order.returnRequest?.requestType === 'exchange' ||
                  String(order.overallStatus || order.status || '').toLowerCase().includes('exchange')
                );
                const exchangePriceDiff = Number(order.returnRequest?.priceDifference || 0);
                const exchangePriceAdjType = order.returnRequest?.priceAdjustmentType || (exchangePriceDiff > 0 ? 'extra_payment' : exchangePriceDiff < 0 ? 'partial_refund' : 'none');
                const exchangeAdjustmentVal = isExchangeReq
                  ? (exchangePriceAdjType === 'extra_payment' ? Math.abs(exchangePriceDiff) : (exchangePriceAdjType === 'partial_refund' ? -Math.abs(exchangePriceDiff) : 0))
                  : 0;

                const orderDiscountVal = Number(order.discountAmount ?? order.discount ?? 0);
                const itemSpecificDiscounts = (order.items || []).reduce((acc, it) => acc + (Number(it.offerDiscount || it.discount) || (Number(it.finalPrice) > 0 && Number(it.price) > Number(it.finalPrice) ? Math.round((Number(it.price) - Number(it.finalPrice)) * Number(it.quantity || 1) * 100) / 100 : 0)), 0);
                const effectiveOrderDiscount = itemSpecificDiscounts > 0 ? itemSpecificDiscounts : orderDiscountVal;
                const rawSubtotalAmount = Number(order.sellerSubtotal || order.subtotal || order.items?.reduce((acc, i) => acc + (Number(i.price || 0) * Number(i.quantity || 1)), 0) || order.total || 0);
                const baseGross = Math.max(0, Math.round((rawSubtotalAmount - effectiveOrderDiscount) * 100) / 100);
                const itemsGrossSale = Math.max(0, Math.round((baseGross + exchangeAdjustmentVal) * 100) / 100);

                const customerShippingPaid = Number(order.shippingFee ?? order.shippingCost ?? order.shippingAmount ?? 0);
                // In Self Delivery, delivery fee collected from customer belongs to the seller
                const selfDeliveryAmount = isSelf ? customerShippingPaid : 0;
                const grossSale = Math.max(0, Math.round((itemsGrossSale + selfDeliveryAmount) * 100) / 100);

                // Check if seller qualifies for Statutory Exemption (0% Comm, 0% GST, 0% TDS, 0% TCS for 09BLMPK2840L2ZN)
                const candidateGstList = [
                  order.sellerDetails?.gstNumber,
                  order.sellerDetails?.gstin,
                  order.sellerId?.gstNumber,
                  order.sellerId?.gstin,
                  order.sellerGstNumber,
                  ...(order.items || []).map(it => it.sellerDetails?.gstNumber || it.sellerId?.gstNumber || it.sellerGstNumber),
                  ...sellers.filter(s => {
                    const sId = String(s.id || s._id || '');
                    const ordSellerId = String(order.sellerId?._id || order.sellerId || '');
                    const store = String(order.sellerStoreName || order.storeName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                    const sStore = String(s.storeName || s.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                    return (sId && ordSellerId && sId === ordSellerId) || (store && sStore && (store === sStore || store.includes(sStore) || sStore.includes(store)));
                  }).map(s => s.gstNumber || s.gstin)
                ].filter(Boolean).map(g => String(g).trim().toUpperCase().replace(/[^A-Z0-9]/g, ''));

                const isExemptedSeller = candidateGstList.includes('09BLMPK2840L2ZN') ||
                  String(order.sellerStoreName || order.storeName || '').toLowerCase().includes('national school dress') ||
                  (order.items || []).some(it => String(it.sellerStoreName || it.storeName || '').toLowerCase().includes('national school dress'));

                // Multi-item exact commission calculation (supports different seller commission rates)
                let totalItemCommission = 0;
                (order.items || []).forEach(it => {
                  const itQty = Number(it.quantity || 1);
                  const itPrice = Number(it.finalPrice ?? it.price ?? 0);
                  const itTotal = Math.round(itPrice * itQty * 100) / 100;
                  
                  const itSellerId = String(it.sellerId?._id || it.sellerId || '');
                  const itStore = String(it.sellerStoreName || it.storeName || it.sellerName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                  const itMatchedSeller = sellers.find(s => {
                    const sId = String(s.id || s._id || '');
                    if (sId && itSellerId && sId === itSellerId) return true;
                    const cleanStore = String(s.storeName || s.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                    return itStore && cleanStore && (itStore === cleanStore || itStore.includes(cleanStore) || cleanStore.includes(itStore));
                  });
                  const itRate = isExemptedSeller ? 0 : Number(itMatchedSeller?.commissionRate ?? itMatchedSeller?.commissionPercentage ?? it.commissionRate ?? it.sellerCommissionRate ?? 10);
                  const itCommAmt = isExemptedSeller
                    ? 0
                    : ((it.commissionAmount !== undefined && it.commissionAmount !== null && !isNaN(Number(it.commissionAmount)) && Number(it.commissionAmount) > 0)
                        ? Number(it.commissionAmount)
                        : Math.round(((itTotal * itRate) / 100) * 100) / 100);
                  totalItemCommission += itCommAmt;
                });

                const portalComm = isExemptedSeller
                  ? 0
                  : (totalItemCommission > 0
                    ? Math.round(totalItemCommission * 100) / 100
                    : Math.round(((itemsGrossSale * 10) / 100) * 100) / 100);
                const effectiveCommRate = isExemptedSeller
                  ? 0
                  : (itemsGrossSale > 0
                    ? Math.round((portalComm / itemsGrossSale) * 100 * 10) / 10
                    : 10);
                
                // 2. GST on Commission (18%, 0% if exempted)
                const gstOnComm = isExemptedSeller ? 0 : Math.round(((portalComm * 18) / 100) * 100) / 100;
                // 3. TDS (0.1% Sec 194-O, strictly 0% if exempted)
                const tdsAmt = isExemptedSeller ? 0 : Math.round(((grossSale * 0.1) / 100) * 100) / 100;

                // 4. GST TCS (0.5% Sec 52, strictly 0% if exempted)
                // 0% for Rule 3 COD Self or Tax-Free (books) or Exempted Seller
                const isTaxFreeOrder = (order.items || []).every(it => {
                  const r = Number(it.gstPercent ?? it.gstPercentage ?? it.gstRate ?? it.gst ?? 5);
                  const cat = String(it.category || '').toLowerCase();
                  return r === 0 || cat.includes('book');
                });
                const tcsRate = (ruleNum === 3 || isTaxFreeOrder || isExemptedSeller) ? 0 : 0.5;
                const orderItemsTaxable = (order.items || []).reduce((sum, it) => {
                  const itPrice = Number(it.finalPrice || it.price || 0) * Number(it.quantity || 1);
                  const itGst = Number(it.gstPercent ?? it.gstPercentage ?? it.gstRate ?? it.gst ?? 5);
                  return sum + (itGst > 0 ? Math.round((itPrice / (1 + itGst / 100)) * 100) / 100 : itPrice);
                }, 0);
                const taxableForTcs = orderItemsTaxable > 0 ? orderItemsTaxable : Math.round((itemsGrossSale / 1.05) * 100) / 100;
                const tcsAmt = (ruleNum === 3 || isTaxFreeOrder || isExemptedSeller) ? 0 : Math.round(((taxableForTcs * tcsRate) / 100) * 100) / 100;

                // 5. Delivery Charges (Rule 2 & Rule 4: Client Norms)
                const orderThreshold = Number(order.freeDeliveryThreshold ?? order.minOrderFreeShipping ?? 401);
                const isAboveThreshold = (itemsGrossSale >= orderThreshold || Number(order.total || order.totalAmount || 0) >= orderThreshold || Number(order.subtotal || 0) >= orderThreshold);
                let delivBorneBy = order.deliveryChargeBorneBy;
                if (!delivBorneBy || customerShippingPaid > 0) {
                  if (isAboveThreshold) delivBorneBy = 'admin';
                  else if (customerShippingPaid > 0) delivBorneBy = 'customer';
                  else if (order.isDeliveryBorneBySeller || order.deliveryBorneBy === 'seller') delivBorneBy = 'seller';
                  else delivBorneBy = isThirdParty ? 'seller' : 'admin';
                }

                let delivFeeAmt = 0;
                let delivGstAmt = 0;
                let totalDelivDed = 0;
                let delivStatusNote = '';

                const itemGstRates = (order.items || []).map(it => {
                  const cat = String(it.category || '').toLowerCase();
                  const isBook = cat.includes('book') || cat.includes('textbook') || String(it.name || '').toLowerCase().includes('book');
                  return Number(it.gstPercent ?? it.gstPercentage ?? it.gstRate ?? it.gst ?? (isBook ? 0 : 5));
                }).filter(r => !isNaN(r));
                const orderProductGstRate = itemGstRates.length > 0 ? Math.max(...itemGstRates) : 5;

                if (isThirdParty && delivBorneBy === 'seller' && !isAboveThreshold) {
                  const rawDeliv = Math.max(0, Number(order.deliveryCharge ?? order.shippingFee ?? order.shippingCost ?? 49));
                  // Delivery charges are GST INCLUSIVE (no extra GST added on top)
                  totalDelivDed = Math.round(rawDeliv * 100) / 100;
                  delivFeeAmt = Math.round((totalDelivDed / (1 + (orderProductGstRate / 100))) * 100) / 100;
                  delivGstAmt = Math.round((totalDelivDed - delivFeeAmt) * 100) / 100;
                  delivStatusNote = `सेलर वहन (कूरियर ₹${totalDelivDed.toFixed(2)} GST सहित / Base: ₹${delivFeeAmt.toFixed(2)} + ${orderProductGstRate}% GST ₹${delivGstAmt.toFixed(2)})`;
                } else if (isSelf && customerShippingPaid > 0) {
                  delivStatusNote = `सेलर सेल्फ डिलीवरी — ₹${customerShippingPaid.toFixed(2)} डिलीवरी शुल्क सेलर के पास (₹0 कटौती)`;
                } else if (isAboveThreshold) {
                  delivStatusNote = `₹${orderThreshold}+ ऑर्डर पर एडमिन वहन करता है — सेलर से ₹0 कटौती`;
                } else if (delivBorneBy === 'customer') {
                  delivStatusNote = 'ग्राहक द्वारा वहन — सेलर से ₹0 कटौती';
                } else {
                  delivStatusNote = 'सेलर सेल्फ डिलीवरी — ₹0 कूरियर कटौती';
                }

                const totalDeductions = Math.round((portalComm + gstOnComm + tdsAmt + tcsAmt + totalDelivDed) * 100) / 100;
                
                let finalNet;
                if (ruleNum === 3) {
                  finalNet = -totalDeductions;
                } else {
                  finalNet = Math.max(0, Math.round((grossSale - totalDeductions) * 100) / 100);
                }

                return (
                  <div className="p-3.5 bg-gradient-to-br from-amber-50/80 via-orange-50/30 to-amber-50/80 rounded-xl border border-amber-300 space-y-2 text-xs">
                    {/* Header */}
                    <div className="flex items-center justify-between flex-wrap gap-1.5 pb-2 border-b border-amber-200">
                      <div>
                        <span className="font-extrabold text-amber-950 flex items-center gap-1.5 text-xs sm:text-[13px]">
                          📋 {ruleTitleHi}
                        </span>
                        <span className="text-[10px] text-amber-800 font-medium block">
                          {ruleTitleEn}
                        </span>
                      </div>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border shadow-2xs ${ruleColor}`}>
                        Rule {ruleNum} Active
                      </span>
                    </div>

                    {/* All Client Rule Points Breakdown */}
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between text-gray-800">
                        <div>
                          <span>• Gross Sale (ग्राहक से प्राप्त कुल बिक्री राशि):</span>
                          {isSelf && customerShippingPaid > 0 ? (
                            <span className="text-[10px] text-gray-500 block">
                              (आइटम: ₹{itemsGrossSale.toFixed(2)} + सेल्फ डिलीवरी शुल्क: ₹{customerShippingPaid.toFixed(2)})
                            </span>
                          ) : (isExchangeReq && exchangeAdjustmentVal !== 0) ? (
                            <span className="text-[10px] text-gray-500 block">
                              (मूल बिक्री: ₹{baseGross.toFixed(2)} {exchangeAdjustmentVal > 0 ? `+ एक्सचेंज अंतर: ₹${exchangeAdjustmentVal.toFixed(2)}` : `− एक्सचेंज अंतर: ₹${Math.abs(exchangeAdjustmentVal).toFixed(2)}`})
                            </span>
                          ) : null}
                        </div>
                        <span className="font-mono font-bold text-gray-950 self-center">₹{grossSale.toFixed(2)}</span>
                      </div>

                      {isExchangeReq && (
                        <div className="flex justify-between text-purple-900 bg-purple-100/60 p-1.5 rounded border border-purple-200">
                          <div>
                            <span className="flex items-center gap-1 font-semibold">
                              <span>🔄</span> एक्सचेंज रिप्लेसमेंट विवरण ({order.returnRequest?.itemName || 'Item'}):
                            </span>
                            <span className="text-[10px] text-purple-700 block">
                              नया साइज़/वेरिएंट: {order.returnRequest?.exchangeLength ? `${order.returnRequest.exchangeLength} Meter(s)` : (order.returnRequest?.exchangeSize || order.returnRequest?.targetSize || 'Requested Variant')}
                            </span>
                          </div>
                          <span className="font-mono font-bold self-center">
                            {exchangeAdjustmentVal > 0 ? (
                              <span className="text-amber-800 font-extrabold">+₹{exchangeAdjustmentVal.toFixed(2)} (डिलीवरी पर अतिरिक्त कैश)</span>
                            ) : exchangeAdjustmentVal < 0 ? (
                              <span className="text-emerald-800 font-extrabold">−₹{Math.abs(exchangeAdjustmentVal).toFixed(2)} (आंशिक रिफंड)</span>
                            ) : (
                              <span className="text-blue-800">समान मूल्य (₹0 Diff)</span>
                            )}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between text-gray-700">
                        <span>• Portal Commission ({isExemptedSeller ? '0% विशेष छूट GST 09BLMPK2840L2ZN' : `औसत ${effectiveCommRate}% पोर्टल कमीशन`}):</span>
                        <span className="font-mono font-semibold text-amber-900">−₹{portalComm.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between text-gray-700">
                        <span>• GST on Commission ({isExemptedSeller ? '0% विशेष छूट' : 'कमीशन पर 18% GST'}):</span>
                        <span className="font-mono font-semibold text-indigo-900">−₹{gstOnComm.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between text-gray-700">
                        <span>• TDS ({isExemptedSeller ? '0% विशेष छूट GST 09BLMPK2840L2ZN' : `आयकर Sec 194-O लागू 0.1% TDS on Gross ₹${grossSale.toFixed(2)}`}):</span>
                        <span className="font-mono font-semibold text-purple-900">−₹{tdsAmt.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between text-gray-700">
                        <span>• GST TCS ({isExemptedSeller ? '0% विशेष छूट GST 09BLMPK2840L2ZN' : `0.5% on Taxable ₹${taxableForTcs.toFixed(2)}`}):</span>
                        <span className="font-mono font-semibold text-sky-900">−₹{tcsAmt.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between text-gray-700 pt-1 border-t border-amber-200/70">
                        <div>
                          <span>• Delivery Charges (कूरियर डिलीवरी खर्च):</span>
                          <span className="text-[10px] text-amber-800 block font-medium">({delivStatusNote})</span>
                        </div>
                        <span className="font-mono font-bold self-center">
                          {isSelf && customerShippingPaid > 0 ? (
                            <span className="text-emerald-800">+₹{customerShippingPaid.toFixed(2)} (सेलर के पास)</span>
                          ) : totalDelivDed > 0 ? (
                            <span className="text-rose-800">−₹{totalDelivDed.toFixed(2)}</span>
                          ) : (
                            <span className="text-gray-700">₹0.00</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Formula & Final Settlement */}
                    <div className="pt-2 border-t border-amber-300 flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <div className="font-extrabold text-amber-950 text-xs">
                          {ruleNum === 3 ? '⚠️ पोर्टल को देय कमीशन/टैक्स (Payable to Portal)' : 'Final Seller Settlement (शुद्ध सेलर भुगतान)'}
                        </div>
                        <div className="text-[10px] text-amber-900 mt-0.5">
                          {ruleNum === 3 ? (
                            <span>सेलर के पास कुल कैश: ₹{grossSale.toFixed(2)} • <strong>सेलर की शुद्ध बचत: ₹{(grossSale - totalDeductions).toFixed(2)}</strong></span>
                          ) : (
                            <span>Gross (₹{grossSale.toFixed(2)}) − Deductions (₹{totalDeductions.toFixed(2)})</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-base font-black font-mono ${ruleNum === 3 ? 'text-rose-700' : 'text-emerald-800'}`}>
                          {ruleNum === 3 ? `−₹${Math.abs(finalNet).toFixed(2)}` : `₹${finalNet.toFixed(2)}`}
                        </div>
                        {ruleNum === 3 && (
                          <div className="text-[10px] font-bold text-emerald-800 font-mono">
                            (सेलर शुद्ध बचत: ₹{(grossSale - totalDeductions).toFixed(2)})
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Exchange Cash Handover / Bank Payout Reconciliation */}
                    {isExchangeReq && exchangeAdjustmentVal > 0 && (
                      <div className="mt-2 p-2 bg-amber-100/80 rounded-lg border border-amber-300 text-[11px] text-amber-950">
                        <div className="font-bold flex items-center justify-between pb-1 border-b border-amber-200">
                          <span className="flex items-center gap-1">
                            <span>💵</span> एक्सचेंज कैश समाधान (Cash Settlement Reconciliation):
                          </span>
                          <span className="font-mono font-bold text-xs">कुल सेलर देय: ₹{finalNet.toFixed(2)}</span>
                        </div>
                        <div className="text-[10.5px] mt-1 space-y-1 text-amber-900">
                          {isSelf ? (
                            <>
                              <div className="flex justify-between">
                                <span>• सेलर/राइडर द्वारा कलेक्ट कैश (सेलर के पास पहले से उपलब्ध):</span>
                                <span className="font-mono font-bold text-rose-800">−₹{exchangeAdjustmentVal.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between font-bold text-emerald-950 pt-1 border-t border-amber-200">
                                <span>➔ एडमिन द्वारा शुद्ध बैंक ट्रांसफर (Net Bank Payout):</span>
                                <span className="font-mono text-emerald-900 text-xs">₹{Math.max(0, Math.round((finalNet - exchangeAdjustmentVal) * 100) / 100).toFixed(2)}</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex justify-between">
                                <span>• कूरियर द्वारा कलेक्ट कैश (कूरियर रेमिटेंस):</span>
                                <span className="font-mono font-bold text-blue-800">+₹{exchangeAdjustmentVal.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between font-bold text-emerald-950 pt-1 border-t border-amber-200">
                                <span>➔ एडमिन द्वारा शुद्ध बैंक ट्रांसफर (Full Settlement):</span>
                                <span className="font-mono text-emerald-900 text-xs">₹{finalNet.toFixed(2)}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
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
            const clientAppUrl = (import.meta.env.VITE_WEBSITE_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:5173` : 'http://localhost:5173')).replace(/\/+$/, '');
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

                      {/* Exchange Delivery Note */}
                      {(order.returnRequest?.type === 'exchange' || order.returnRequest?.requestType === 'exchange' || String(order.status).toLowerCase().includes('exchange')) && (
                        <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-lg text-purple-950 text-xs space-y-1">
                          <div className="font-extrabold flex items-center gap-1.5 text-[11px] text-purple-900">
                            <span>🔄</span> 2-Way Exchange Delivery Task
                          </div>
                          <div className="text-[11px] text-purple-800">
                            The rider will see instructions to <strong>collect the original item</strong> and <strong>deliver the replacement item</strong>.
                            {order.returnRequest?.priceAdjustmentType === 'extra_payment' ? (
                              <span className="block mt-0.5 font-bold text-amber-900">
                                💰 Extra Payment: Rider must collect ₹{order.returnRequest.priceDifference} from customer.
                              </span>
                            ) : (
                              <span className="block mt-0.5 font-semibold text-emerald-800">
                                💸 Payment collection is ₹0 (Refund/Equal exchange handled separately).
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Manual WhatsApp Rider Dispatch Action & Status */}
                      {driverPhoneInput && (
                        <div className="space-y-2">
                          <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                            <div>
                              <div className="font-bold text-emerald-950 flex items-center gap-1.5 text-[11px]">
                                <MessageSquare size={13} className="text-emerald-700" />
                                <span>WhatsApp Rider Dispatch (Direct Web / App)</span>
                                <span className="bg-emerald-200 text-emerald-900 text-[8px] px-1.5 py-0.2 rounded font-mono font-bold">READY</span>
                              </div>
                              <div className="text-[10px] text-emerald-700 font-mono mt-0.5">
                                Target Rider: +91 {driverPhoneInput.replace(/\D/g, '').slice(-10)}
                              </div>
                            </div>
                          </div>
                          {!readOnly && (
                            <button
                              type="button"
                              disabled={isResendingWhatsApp}
                              onClick={handleResendRiderWhatsApp}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1 shrink-0 disabled:opacity-50"
                            >
                              <MessageSquare size={12} />
                              <span>📲 Open WhatsApp to Send to Rider</span>
                            </button>
                          )}
                        </div>
                          <div className="text-[10px] text-emerald-800 bg-white/70 p-1.5 rounded border border-emerald-200">
                            💡 <strong>WhatsApp Rider Dispatch:</strong> Click <em>"📲 Open WhatsApp to Send to Rider"</em> above anytime to dispatch live tracking & customer address to the rider via WhatsApp.
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
                      disabled={isSavingDelivery}
                      onClick={handleSaveDeliveryDetails}
                      className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                    >
                      {isSavingDelivery ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Saving & Dispatching WhatsApp...</span>
                        </>
                      ) : (
                        <>
                          <Check size={14} />
                          <span>Save Delivery Partner & Tracking Details</span>
                        </>
                      )}
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
        sellers={sellers}
        order={(() => {
          const currentBase = displayOrder || order;
          const baseMode = String(currentBase.deliveryMode || currentBase.deliveryType || '').toLowerCase();
          const hasCourierInBase = Boolean(currentBase.courierName && currentBase.courierName !== 'N/A' && currentBase.courierName !== '');
          const isBaseExplicitSelf = baseMode.includes('self') || currentBase.settlementRule === 'COD_SELF_DELIVERY' || Boolean(currentBase.deliveryOtp && !hasCourierInBase);
          
          const effectiveMode = isBaseExplicitSelf ? 'self_delivery' : deliveryModeInput;
          const isSelf = effectiveMode === 'self_delivery';
          const tokenVal = String(currentBase.selfDeliveryDetails?.deliveryPartnerToken || newTracking.trim() || `DLV-${currentBase.id}`).trim();
          const websiteOrigin = (import.meta.env.VITE_WEBSITE_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:5173` : 'http://localhost:5173')).replace(/\/+$/, '');
          const selfTrackingLink = `${websiteOrigin}/#delivery-partner?token=${encodeURIComponent(tokenVal)}`;
          
          let carrierUrl = currentBase.trackingUrl || '';
          if (!isSelf && newTracking.trim()) {
            const lowerCourier = courierInput.toLowerCase();
            carrierUrl = lowerCourier.includes('delhivery') ? `https://www.delhivery.com/track/package/${newTracking.trim()}` :
              lowerCourier.includes('bluedart') ? `https://www.bluedart.com/tracking?awb=${newTracking.trim()}` :
              lowerCourier.includes('dtdc') ? `https://www.dtdc.in/tracking/shipment-tracking.asp?awb=${newTracking.trim()}` :
              lowerCourier.includes('ekart') ? `https://ekartlogistics.com/shipmenttrack/${newTracking.trim()}` :
              `https://track.shiprocket.in/tracking/${newTracking.trim()}`;
          }

          return {
            ...currentBase,
            status: selectedStatus || currentBase.status,
            overallStatus: selectedStatus || currentBase.overallStatus || currentBase.status,
            deliveryMode: effectiveMode,
            deliveryType: effectiveMode,
            settlementRule: isSelf ? (String(currentBase.paymentMethod || '').toUpperCase().includes('COD') || String(currentBase.paymentMethod || '').toUpperCase().includes('CASH') ? 'COD_SELF_DELIVERY' : 'ONLINE_SELF_DELIVERY') : currentBase.settlementRule,
            courierName: !isSelf ? courierInput : '',
            carrier: !isSelf ? courierInput : '',
            trackingNumber: !isSelf ? newTracking.trim() : tokenVal,
            trackingUrl: isSelf ? selfTrackingLink : carrierUrl,
            selfDeliveryDetails: isSelf ? {
              ...(currentBase.selfDeliveryDetails || {}),
              deliveryPersonName: driverNameInput.trim(),
              deliveryPersonPhone: driverPhoneInput.trim(),
              vehicleNumber: vehicleNumberInput.trim(),
              deliveryPartnerToken: tokenVal,
              trackingUrl: selfTrackingLink
            } : currentBase.selfDeliveryDetails
          };
        })()}
      />
    </div>
  );
}
