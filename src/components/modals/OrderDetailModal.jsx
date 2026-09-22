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
  FileText
} from 'lucide-react';
import TaxInvoiceModal from './TaxInvoiceModal';

export default function OrderDetailModal({ 
  isOpen, 
  onClose, 
  order, 
  onUpdateStatus, 
  onUpdateTracking, 
  onCancelOrder, 
  onRefundOrder,
  readOnly = false 
}) {
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [newTracking, setNewTracking] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Pending');
  const [refundReason, setRefundReason] = useState('');
  const [showRefundPrompt, setShowRefundPrompt] = useState(false);

  useEffect(() => {
    if (order) {
      setNewTracking(order.trackingNumber || '');
      setSelectedStatus(order.status || 'Pending');
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

  const handleSaveTracking = () => {
    if (newTracking.trim()) {
      onUpdateTracking(order.id, newTracking.trim());
    }
  };

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    onUpdateStatus(order.id, status);
  };

  const handleProcessRefund = () => {
    onRefundOrder(order.id, order.total);
    setShowRefundPrompt(false);
    onClose();
  };

  const handleCancel = () => {
    if (window.confirm(`Are you sure you want to cancel Order ${order.id}?`)) {
      onCancelOrder(order.id, 'Cancelled by Admin');
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
                  order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
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

          {/* Quick Actions Bar / View-Only Status */}
          {readOnly ? (
            <div className="bg-amber-50/70 rounded-xl p-3 border border-amber-200/70 flex items-center justify-between gap-3 text-xs">
              <span className="font-bold text-amber-900">Current Order Status: <span className="font-black text-amber-950">{order.status}</span></span>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">View-Only</span>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-600">Update Status:</span>
                <select
                  value={selectedStatus}
                  onChange={e => handleStatusChange(e.target.value)}
                  className="bg-white border border-gray-300 text-xs font-bold rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-brand-yellow outline-hidden cursor-pointer"
                >
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
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
                        Qty: {item.quantity}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xs text-gray-900">₹{item.price * item.quantity}</div>
                    <div className="text-[10px] text-gray-400">₹{item.price} each</div>
                  </div>
                </div>
              ))}
              <div className="p-3 bg-gray-50 flex items-center justify-between">
                <span className="text-xs font-extrabold text-gray-700">Total Order Amount</span>
                <span className="font-display font-extrabold text-base text-teal-900">₹{order.total}</span>
              </div>
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

            {/* Shipping & Tracking */}
            <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/60 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                <MapPin size={14} className="text-teal-700" /> Shipping Destination
              </div>
              <div className="text-xs text-gray-700 leading-relaxed">{formattedShippingAddress}</div>
              
              <div className="pt-2 border-t border-gray-200">
                <label className="block text-[10px] font-bold text-gray-500 mb-1">
                  Logistics Tracking ID:
                </label>
                {readOnly ? (
                  <div className="text-xs font-mono font-bold text-gray-800 bg-white px-2.5 py-1.5 rounded-lg border border-gray-200">
                    {order.trackingNumber || 'Not assigned yet'}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTracking}
                      onChange={e => setNewTracking(e.target.value)}
                      placeholder="e.g. DELHIVERY-7782910"
                      className="flex-1 px-2.5 py-1 text-xs bg-white border border-gray-300 rounded-lg outline-hidden"
                    />
                    <button
                      onClick={handleSaveTracking}
                      className="px-3 py-1 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

      <TaxInvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        order={order}
      />
    </div>
  );
}
