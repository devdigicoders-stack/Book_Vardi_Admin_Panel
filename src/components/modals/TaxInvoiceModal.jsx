import React from 'react';
import { Printer, Download, X, Building2, MapPin, Phone, Mail, FileText, ShieldCheck, DollarSign } from 'lucide-react';

export default function TaxInvoiceModal({ isOpen, onClose, order, adminUser }) {
  if (!isOpen || !order) return null;

  const invoiceNo = `INV-ADMIN-${order.id || order._id || '2026-0001'}`;
  const invoiceDate = order.date || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const paymentMethod = order.paymentMethod || 'UPI / Online Payment';
  const paymentStatus = order.paymentStatus || 'Paid';

  const shippingAddr = typeof order.shippingAddress === 'object' && order.shippingAddress !== null
    ? order.shippingAddress
    : {
        name: order.customerName || 'Customer',
        phone: order.customerPhone || '',
        addressLine: typeof order.shippingAddress === 'string' ? order.shippingAddress : 'Delivery Address',
        city: 'Lucknow',
        state: 'Uttar Pradesh',
        pincode: '226001'
      };

  const formattedAddressStr = typeof order.shippingAddress === 'string'
    ? order.shippingAddress
    : [
        shippingAddr.addressLine || shippingAddr.street,
        shippingAddr.colony || shippingAddr.landmark,
        shippingAddr.city,
        shippingAddr.state,
        shippingAddr.pincode ? `- ${shippingAddr.pincode}` : ''
      ].filter(Boolean).join(', ');

  const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [
    {
      id: 1,
      name: order.itemName || 'School Supply & Uniform Item',
      quantity: order.quantity || 1,
      price: order.total || 499,
      category: 'Uniforms & Books',
      hsnCode: '6204'
    }
  ];

  const subtotal = order.subtotal || items.reduce((acc, i) => acc + (Number(i.price || 0) * Number(i.quantity || 1)), 0);
  const taxAmount = Math.round(subtotal * 0.05);
  const grandTotal = order.total || (subtotal + taxAmount);

  // Marketplace financial splits
  const marketplaceCommissionRate = 0.08; // 8% commission
  const marketplaceCommission = Math.round(grandTotal * marketplaceCommissionRate);
  const sellerPayout = grandTotal - marketplaceCommission;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="bg-gray-950 text-white px-6 py-4 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-gray-950 flex items-center justify-center font-bold">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-sm sm:text-base text-white">
                Admin Marketplace Tax Invoice & Seller Settlement Statement
              </h3>
              <p className="text-[11px] text-amber-300">Order #{order.id} • Master Audit Invoice</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-gray-950 font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <Printer size={15} />
              <span>Print Invoice / Settlement</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Body */}
        <div className="p-6 sm:p-10 overflow-y-auto space-y-6 text-gray-800 text-xs font-sans print:overflow-visible print:p-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-amber-500/40 pb-6 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-gray-900 text-amber-400 flex items-center justify-center font-black text-sm">
                  BV
                </div>
                <span className="font-display font-black text-xl text-gray-900 tracking-tight">
                  Book <span className="text-amber-600">Vardi</span> Admin Portal
                </span>
              </div>
              <p className="text-[11px] text-gray-600 font-bold">Book Vardi Marketplace Operations & Settlement</p>
              <p className="text-[11px] text-gray-500">Corporate HQ: Commercial Market, Near Civil Hospital, Lucknow, UP - 226001</p>
              <p className="text-[11px] text-gray-500">Marketplace GSTIN: <strong className="font-mono text-gray-800">09AAACB1234F1Z9</strong></p>
            </div>

            <div className="text-right bg-amber-50/70 p-4 rounded-2xl border border-amber-200 min-w-[230px]">
              <span className="inline-block bg-gray-900 text-amber-400 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md mb-2">
                ADMIN MASTER INVOICE
              </span>
              <p className="text-xs font-bold text-gray-900">Invoice No: <span className="font-mono">{invoiceNo}</span></p>
              <p className="text-xs text-gray-600">Date: <span className="font-medium">{invoiceDate}</span></p>
              <p className="text-xs text-gray-600">Order ID: <span className="font-mono font-bold text-gray-900">#{order.id}</span></p>
            </div>
          </div>

          {/* Customer & Seller Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <div>
              <h4 className="font-extrabold text-xs text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-1">
                <MapPin size={13} /> Buyer Information
              </h4>
              <p className="font-bold text-sm text-gray-900">{shippingAddr.name || order.customerName}</p>
              <p className="text-gray-700 mt-1 leading-relaxed">{formattedAddressStr}</p>
              <p className="text-gray-600 mt-1">Contact: <strong className="text-gray-900">{shippingAddr.phone || order.customerPhone}</strong></p>
            </div>

            <div>
              <h4 className="font-extrabold text-xs text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Building2 size={13} /> Seller & Settlement Info
              </h4>
              <p className="font-bold text-sm text-gray-900">{order.sellerName || 'Partner Merchant'}</p>
              <p className="text-gray-700">GSTIN: <strong className="font-mono text-gray-900">{order.sellerGstin || '09AAACB9876K1Z2'}</strong></p>
              <p className="text-gray-700">Payment Status: <strong className="text-emerald-700">{paymentStatus}</strong> ({paymentMethod})</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-900 text-white text-[11px] uppercase tracking-wider font-extrabold">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Item & Category</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Price</th>
                  <th className="py-3 px-4 text-right">Tax (5%)</th>
                  <th className="py-3 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-xs">
                {items.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="py-3 px-4 font-bold text-gray-500">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-gray-900">{item.name}</td>
                    <td className="py-3 px-4 text-center font-bold text-gray-900">{item.quantity || 1}</td>
                    <td className="py-3 px-4 text-right font-mono">₹{Number(item.price || 0).toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-mono text-gray-600">₹{(Number(item.price || 0) * 0.05).toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900 font-mono">₹{(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Settlement Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 space-y-2 text-xs">
              <h4 className="font-extrabold text-xs text-amber-950 uppercase tracking-wider flex items-center gap-1">
                <DollarSign size={14} /> Marketplace Commission & Tax Split
              </h4>
              <div className="flex justify-between text-gray-700">
                <span>Order Grand Total:</span>
                <span className="font-mono font-bold">₹{grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-amber-900 font-bold">
                <span>Marketplace Fee (8%):</span>
                <span className="font-mono">₹{marketplaceCommission.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-800 font-black border-t border-amber-300 pt-1.5">
                <span>Net Payable to Seller:</span>
                <span className="font-mono">₹{sellerPayout.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span className="font-mono">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>GST Tax Collected (5%):</span>
                <span className="font-mono">₹{taxAmount.toFixed(2)}</span>
              </div>
              <div className="border-t-2 border-gray-300 pt-2 flex justify-between items-center text-sm font-black text-gray-900">
                <span>Gross Order Value:</span>
                <span className="font-mono text-base text-gray-900">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
