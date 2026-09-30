import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  ShieldCheck, 
  FileText, 
  CheckCircle2,
  Lock,
  Building,
  Store,
  DollarSign,
  Truck,
  ExternalLink,
  User
} from 'lucide-react';
import { SERVER_URL } from '../../utils/api';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=150&auto=format&fit=crop&q=80';

export function getProductGstRate(item) {
  const explicitGst = item?.gstPercent ?? item?.gstPercentage ?? item?.gstRate ?? item?.gst ?? item?.taxRate ?? item?.productId?.gstPercent ?? item?.productId?.gstRate ?? item?.productId?.gst ?? item?.productId?.gstPercentage ?? item?.productId?.taxRate;
  if (explicitGst !== undefined && explicitGst !== null && String(explicitGst).trim() !== '' && !isNaN(Number(explicitGst))) {
    return Number(explicitGst);
  }
  return 5;
}

export default function TaxInvoiceModal({ isOpen, onClose, order }) {
  if (!isOpen || !order) return null;

  const orderStatus = String(order.status || order.overallStatus || '').toLowerCase();
  const confirmed = orderStatus === 'confirmed' || orderStatus === 'shipped' || orderStatus === 'out for delivery' || orderStatus === 'out_for_delivery' || orderStatus === 'delivered' || orderStatus === 'processing' || order.paymentStatus === 'paid' || order.paymentStatus === 'Paid';

  const shippingAddr = typeof order.shippingAddress === 'object' && order.shippingAddress !== null
    ? order.shippingAddress
    : (typeof order.rawShippingAddress === 'object' && order.rawShippingAddress !== null ? order.rawShippingAddress : {});

  const formattedAddressStr = typeof order.shippingAddress === 'string' && !order.shippingAddress.toLowerCase().includes('customer')
    ? order.shippingAddress
    : [
        shippingAddr.street || shippingAddr.addressLine || shippingAddr.address,
        shippingAddr.city,
        shippingAddr.state,
        shippingAddr.pincode ? `- ${shippingAddr.pincode}` : ''
      ].filter(Boolean).join(', ');

  const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [
    {
      id: 1,
      name: order.itemName || order.product || 'School Supply & Uniform Item',
      image: order.image || (Array.isArray(order.images) && order.images[0]) || FALLBACK_IMAGE,
      quantity: order.quantity || 1,
      price: order.total || order.amount || 499,
      category: 'School Uniform'
    }
  ];

  let totalTaxableValue = 0;
  let totalTaxAmount = 0;

  const itemBreakdowns = items.map((item) => {
    const qty = Number(item.quantity || 1);
    const unitPrice = Number(item.price || 0);
    const grossPrice = unitPrice * qty;
    const rate = getProductGstRate(item);
    const isInclusive = item.isGstInclusive !== false && order.isGstInclusive !== false;

    let taxableVal = grossPrice;
    let taxAmt = 0;

    if (rate > 0) {
      if (isInclusive) {
        taxableVal = Math.round((grossPrice / (1 + rate / 100)) * 100) / 100;
        taxAmt = Math.round((grossPrice - taxableVal) * 100) / 100;
      } else {
        taxableVal = grossPrice;
        taxAmt = Math.round(((grossPrice * rate) / 100) * 100) / 100;
      }
    }

    totalTaxableValue += taxableVal;
    totalTaxAmount += taxAmt;

    return {
      ...item,
      qty,
      unitPrice,
      grossPrice,
      rate,
      taxableVal,
      taxAmt
    };
  });

  const subtotal = order.subtotal || items.reduce((acc, i) => acc + (Number(i.price || 0) * Number(i.quantity || 1)), 0);
  const taxAmount = Math.round(totalTaxAmount * 100) / 100;
  const shippingCost = Number(order.shippingCost ?? order.shippingFee ?? 0);
  const discount = Number(order.discount ?? order.discountAmount ?? 0);
  const grandTotal = Number(order.total || order.totalAmount || (subtotal + shippingCost - discount));

  const [isDownloading, setIsDownloading] = useState(false);

  const isPlaceholderName = (name) => {
    if (!name || typeof name !== 'string') return true;
    const lower = name.trim().toLowerCase();
    return (
      lower === '' ||
      lower === 'bookvardimerchant' ||
      lower === 'bookvardi merchant' ||
      lower === 'book vardi partner merchant' ||
      lower === 'book vardi partner store' ||
      lower === 'bookvardi verified seller' ||
      lower === 'bookvardi verified seller hub' ||
      lower === 'partner merchant' ||
      lower === 'unknown seller' ||
      lower === 'new merchant' ||
      lower === 'merchant store' ||
      lower === 'direct marketplace' ||
      lower === 'seller' ||
      lower === 'merchant' ||
      lower === 'n/a'
    );
  };

  const isGenericCust = (name) => {
    if (!name || typeof name !== 'string') return true;
    const lower = name.trim().toLowerCase();
    return (
      lower === '' ||
      lower === 'student' ||
      lower === 'student customer' ||
      lower === 'customer' ||
      lower === 'valued customer' ||
      lower === 'verified customer' ||
      lower === 'user' ||
      lower === 'n/a'
    );
  };

  const resolveSeller = () => {
    const firstItem = items[0] || {};
    const itemSellerObj = (firstItem.sellerId && typeof firstItem.sellerId === 'object') ? firstItem.sellerId : null;
    const itemSellerDetails = firstItem.sellerDetails || null;
    const orderSellerDetails = (order.sellerDetails && typeof order.sellerDetails === 'object') ? order.sellerDetails : null;
    const orderSellerObj = (order.sellerId && typeof order.sellerId === 'object') ? order.sellerId : null;

    const candObjs = [itemSellerDetails, itemSellerObj, orderSellerDetails, orderSellerObj].filter(Boolean);

    let matchedStoredSeller = null;
    const rawSellerId = String(firstItem.sellerId?._id || firstItem.sellerId || order.sellerId?._id || order.sellerId || '');
    if (rawSellerId && rawSellerId !== '[object Object]') {
      try {
        const savedSellers = localStorage.getItem('admin_sellers') || localStorage.getItem('bv_sync_sellers') || localStorage.getItem('bv_registered_users');
        if (savedSellers) {
          const sList = JSON.parse(savedSellers);
          if (Array.isArray(sList)) {
            matchedStoredSeller = sList.find(s => String(s.id || s._id || s.sellerId || '') === rawSellerId);
          }
        }
      } catch (e) {}
    }

    if (!matchedStoredSeller) {
      const prodIdStr = String(firstItem.productId || firstItem.id || firstItem._id || '');
      if (prodIdStr) {
        try {
          const catalogSaved = localStorage.getItem('admin_products') || localStorage.getItem('bv_sync_products') || localStorage.getItem('bv_seller_products');
          if (catalogSaved) {
            const catalog = JSON.parse(catalogSaved);
            if (Array.isArray(catalog)) {
              const matchedProd = catalog.find(p => String(p.id || p._id || p.productId) === prodIdStr);
              if (matchedProd) {
                const pSellerId = String(matchedProd.sellerId || '');
                if (pSellerId) {
                  const savedSellers = localStorage.getItem('admin_sellers') || localStorage.getItem('bv_sync_sellers');
                  if (savedSellers) {
                    const sList = JSON.parse(savedSellers);
                    if (Array.isArray(sList)) {
                      matchedStoredSeller = sList.find(s => String(s.id || s._id || s.sellerId || '') === pSellerId);
                    }
                  }
                }
                if (!matchedStoredSeller && (matchedProd.sellerStoreName || matchedProd.storeName)) {
                  matchedStoredSeller = {
                    storeName: matchedProd.sellerStoreName || matchedProd.storeName,
                    sellerName: matchedProd.sellerName || matchedProd.sellerStoreName || matchedProd.storeName
                  };
                }
              }
            }
          }
        } catch (e) {}
      }
    }

    if (matchedStoredSeller) {
      candObjs.push(matchedStoredSeller);
    }

    const storeCandidates = [
      ...candObjs.map(o => o.storeName),
      ...candObjs.map(o => o.businessName),
      ...candObjs.map(o => o.name),
      ...candObjs.map(o => o.sellerName),
      firstItem.sellerStoreName,
      firstItem.storeName,
      firstItem.sellerName,
      order.sellerStoreName,
      order.sellerName,
      order.storeName
    ];

    let storeName = '';
    for (const sc of storeCandidates) {
      if (sc && !isPlaceholderName(sc)) {
        storeName = sc;
        break;
      }
    }
    if (!storeName) {
      storeName = 'Book Vardi Partner Store';
    }

    const ownerName = candObjs.map(o => o.ownerName || o.ownerFullName || o.contactPerson || o.name).find(Boolean) || '';
    const phone = candObjs.map(o => o.phone || o.mobile || o.contactPhone).find(Boolean) || firstItem.sellerPhone || order.sellerPhone || '+91 94500 00000';
    const email = candObjs.map(o => o.email).find(Boolean) || firstItem.sellerEmail || order.sellerEmail || 'sellersupport@bookvardi.com';
    const address = candObjs.map(o => o.address || o.addressLine || o.addressLine1 || o.street).find(Boolean) || firstItem.sellerAddress || order.sellerAddress || 'Book Vardi Fulfillment Center, Sector 4';
    const city = candObjs.map(o => o.city).find(Boolean) || firstItem.sellerCity || order.sellerCity || 'Lucknow';
    const state = candObjs.map(o => o.state).find(Boolean) || firstItem.sellerState || order.sellerState || 'Uttar Pradesh';
    const pincode = candObjs.map(o => o.pincode || o.pin).find(Boolean) || firstItem.sellerPincode || '226001';
    const gstNumber = candObjs.map(o => o.gstNumber || o.gstin || o.gst).find(Boolean) || order.gstNumber || '09AAACB1234F1Z9';

    return {
      storeName,
      ownerName,
      phone,
      email,
      address,
      city,
      state,
      pincode,
      gstNumber
    };
  };

  const resolvedSeller = resolveSeller();

  const resolveConsumer = () => {
    const rawAddr = (typeof order.rawShippingAddress === 'object' && order.rawShippingAddress !== null)
      ? order.rawShippingAddress
      : (typeof order.shippingAddress === 'object' && order.shippingAddress !== null ? order.shippingAddress : {});

    // Try matching user from localStorage admin_users or bv_registered_users if order has userId or phone
    let matchedUser = null;
    const orderUserId = String(order.userId?._id || order.userId || order.user?._id || order.user || '');
    const orderPhone = String(rawAddr.phone || rawAddr.mobile || order.customerPhone || order.customer?.phone || order.phone || '').replace(/\D/g, '');

    try {
      const savedUsers = localStorage.getItem('admin_users') || localStorage.getItem('bv_registered_users');
      if (savedUsers) {
        const uList = JSON.parse(savedUsers);
        if (Array.isArray(uList)) {
          matchedUser = uList.find(u => {
            const uId = String(u.id || u._id || '');
            const uPhone = String(u.phone || '').replace(/\D/g, '');
            return (orderUserId && uId === orderUserId) || (orderPhone && uPhone && (orderPhone.endsWith(uPhone) || uPhone.endsWith(orderPhone)));
          });
        }
      }
    } catch (e) {}

    const phoneCandidates = [
      rawAddr.phone,
      rawAddr.mobile,
      rawAddr.contactPhone,
      matchedUser?.phone,
      typeof order.customerPhone === 'string' ? order.customerPhone : null,
      order.customer?.phone,
      order.userPhone,
      order.user?.phone,
      order.userId?.phone,
      order.phone
    ].filter(Boolean);
    const phone = phoneCandidates[0] || '';

    const emailCandidates = [
      rawAddr.email,
      matchedUser?.email,
      typeof order.customerEmail === 'string' ? order.customerEmail : null,
      order.customer?.email,
      order.userEmail,
      order.user?.email,
      order.userId?.email,
      order.email
    ].filter(Boolean);
    const email = emailCandidates[0] || '';

    const nameCandidates = [
      rawAddr.name,
      rawAddr.fullName,
      rawAddr.recipientName,
      rawAddr.contactPerson,
      matchedUser?.name,
      typeof order.customerName === 'string' ? order.customerName : null,
      order.customer?.name,
      order.userName,
      order.user?.name,
      order.userId?.name
    ].filter(nc => nc && !isGenericCust(nc));

    let name = nameCandidates[0] || '';
    if (!name) {
      if (matchedUser && !isGenericCust(matchedUser.name)) {
        name = matchedUser.name;
      } else if (order.school) {
        name = `Student / Consumer (${order.school})`;
      } else {
        name = phone ? `Verified Buyer (${phone.slice(-4)})` : 'Verified Retail Consumer';
      }
    }

    let street = '';
    let cityStatePin = '';

    if (rawAddr.addressLine || rawAddr.street || rawAddr.address || rawAddr.addressLine1) {
      street = [
        rawAddr.houseNumber || rawAddr.flat || rawAddr.flatNo,
        rawAddr.addressLine || rawAddr.street || rawAddr.address || rawAddr.addressLine1,
        rawAddr.colony || rawAddr.landmark || rawAddr.area
      ].filter(Boolean).join(', ');
      cityStatePin = [
        rawAddr.city,
        rawAddr.state
      ].filter(Boolean).join(', ') + (rawAddr.pincode ? ` - ${rawAddr.pincode}` : '');
    } else if (typeof order.shippingAddress === 'string' && order.shippingAddress.trim() && !order.shippingAddress.toLowerCase().includes('customer address') && !order.shippingAddress.toLowerCase().includes('customer delivery address')) {
      street = order.shippingAddress.trim();
    } else if (typeof order.address === 'string' && order.address.trim() && !order.address.toLowerCase().includes('customer address') && !order.address.toLowerCase().includes('customer delivery address')) {
      street = order.address.trim();
    } else if (matchedUser?.addresses && matchedUser.addresses.length > 0) {
      const uAddr = matchedUser.addresses.find(a => a.isDefault) || matchedUser.addresses[0];
      street = [uAddr.addressLine || uAddr.street, uAddr.landmark].filter(Boolean).join(', ');
      cityStatePin = [uAddr.city, uAddr.state].filter(Boolean).join(', ') + (uAddr.pincode ? ` - ${uAddr.pincode}` : '');
    } else {
      street = rawAddr.city ? `${rawAddr.city}, ${rawAddr.state || 'India'}` : 'Delivery Location on File';
    }

    return {
      name,
      phone,
      email,
      street,
      cityStatePin
    };
  };

  const resolvedConsumer = resolveConsumer();

  const getItemSellerName = (item) => {
    if (item?.sellerId && typeof item.sellerId === 'object') {
      const name = item.sellerId.storeName || item.sellerId.name || item.sellerId.sellerName || item.sellerId.legalName;
      if (name && !isPlaceholderName(name)) return name;
    }

    const candidateItemNames = [
      item?.sellerStoreName,
      item?.storeName,
      item?.sellerName,
      item?.legalBusinessName,
      typeof item?.seller === 'string' ? item.seller : (item?.seller?.storeName || item?.seller?.name)
    ];

    for (const c of candidateItemNames) {
      if (c && !isPlaceholderName(c)) return c;
    }

    const prodIdStr = String(item?.productId || item?.id || item?._id || '');
    if (prodIdStr) {
      try {
        const catalogSaved = localStorage.getItem('bv_sync_products') || localStorage.getItem('admin_products') || localStorage.getItem('bv_seller_products');
        if (catalogSaved) {
          const catalog = JSON.parse(catalogSaved);
          if (Array.isArray(catalog)) {
            const matchedProd = catalog.find(p => String(p.id || p._id || p.productId) === prodIdStr);
            if (matchedProd) {
              const pSeller = matchedProd.sellerStoreName || matchedProd.storeName || matchedProd.sellerName || matchedProd.legalBusinessName || (typeof matchedProd.seller === 'string' ? matchedProd.seller : matchedProd.seller?.storeName);
              if (pSeller && !isPlaceholderName(pSeller)) return pSeller;
            }
          }
        }
      } catch (e) {}
    }

    const sellerIdStr = String(item?.sellerId || '');
    if (sellerIdStr && sellerIdStr !== '[object Object]') {
      try {
        const sellersSaved = localStorage.getItem('bv_sync_sellers') || localStorage.getItem('admin_sellers') || localStorage.getItem('bv_registered_users');
        if (sellersSaved) {
          const sellersList = JSON.parse(sellersSaved);
          if (Array.isArray(sellersList)) {
            const matchedSeller = sellersList.find(s => String(s.id || s._id || s.sellerId || s.phone || '') === sellerIdStr);
            if (matchedSeller) {
              const sName = matchedSeller.storeName || matchedSeller.sellerName || matchedSeller.storeDetails?.storeName || matchedSeller.name || matchedSeller.legalName || matchedSeller.ownerFullName;
              if (sName && !isPlaceholderName(sName)) return sName;
            }
          }
        }
      } catch (e) {}
    }

    const candidateOrderNames = [
      order?.sellerStoreName,
      order?.sellerName,
      order?.storeName,
      order?.sellerId && typeof order.sellerId === 'object' ? (order.sellerId.storeName || order.sellerId.name || order.sellerId.sellerName) : null
    ];

    for (const c of candidateOrderNames) {
      if (c && !isPlaceholderName(c)) return c;
    }

    return resolvedSeller.storeName || 'BookVardi Verified Seller';
  };

  // Helper to resolve dynamic seller commission rate
  const getSellerCommissionRate = () => {
    if (order.commissionRate !== undefined && order.commissionRate !== null && !isNaN(Number(order.commissionRate))) {
      return Number(order.commissionRate);
    }
    if (order.sellerCommissionRate !== undefined && order.sellerCommissionRate !== null && !isNaN(Number(order.sellerCommissionRate))) {
      return Number(order.sellerCommissionRate);
    }

    const firstItem = items[0];
    if (firstItem?.commissionRate !== undefined && firstItem.commissionRate !== null && !isNaN(Number(firstItem.commissionRate))) {
      return Number(firstItem.commissionRate);
    }
    if (firstItem?.sellerCommissionRate !== undefined && firstItem.sellerCommissionRate !== null && !isNaN(Number(firstItem.sellerCommissionRate))) {
      return Number(firstItem.sellerCommissionRate);
    }
    if (firstItem?.commissionPercentage !== undefined && firstItem.commissionPercentage !== null && !isNaN(Number(firstItem.commissionPercentage))) {
      return Number(firstItem.commissionPercentage);
    }

    const targetSellerId = String(firstItem?.sellerId || order.sellerId || '');
    const targetSellerName = String(getItemSellerName(firstItem) || '').toLowerCase();

    try {
      const savedSellers = localStorage.getItem('admin_sellers') || localStorage.getItem('bv_sync_sellers') || localStorage.getItem('bv_registered_users');
      if (savedSellers) {
        const sellersList = JSON.parse(savedSellers);
        if (Array.isArray(sellersList)) {
          const matched = sellersList.find(s => {
            const sId = String(s.id || s._id || s.sellerId || '');
            const sName = String(s.storeName || s.sellerName || s.name || s.storeDetails?.storeName || '').toLowerCase();
            return (targetSellerId && sId === targetSellerId) || (targetSellerName && sName && (sName === targetSellerName || targetSellerName.includes(sName)));
          });

          if (matched) {
            const rate = matched.commissionRate ?? matched.commissionPercentage ?? matched.commission;
            if (rate !== undefined && rate !== null && !isNaN(Number(rate))) {
              return Number(rate);
            }
          }
        }
      }
    } catch (e) {}

    try {
      const savedSettings = localStorage.getItem('admin_settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (settings?.commissionRate !== undefined && !isNaN(Number(settings.commissionRate))) {
          return Number(settings.commissionRate);
        }
      }
    } catch (e) {}

    return 5;
  };

  const marketplaceCommissionRate = getSellerCommissionRate();
  const marketplaceCommission = Math.round((grandTotal * (marketplaceCommissionRate / 100)) * 100) / 100;
  const sellerPayout = Math.round((grandTotal - marketplaceCommission) * 100) / 100;

  // Logistics tracking resolution: strictly visible when product is Out for Delivery & partner decided
  const normStatus = String(order.overallStatus || order.status || '').toLowerCase().replace(/_/g, ' ');
  const isOut = normStatus === 'out for delivery' || normStatus === 'delivered';
  const isSelf = String(order.deliveryMode || order.deliveryType || '').toLowerCase().includes('self') || Boolean(order.selfDeliveryDetails?.deliveryPartnerToken || order.selfDeliveryDetails?.deliveryPersonName);
  const isThirdParty = String(order.deliveryMode || order.deliveryType || '').toLowerCase().includes('third') || Boolean(order.courierName || order.thirdPartyDetails?.courierName);
  const hasPartner = isSelf || isThirdParty || Boolean(order.courierName || order.selfDeliveryDetails?.deliveryPersonName);

  const hasTracking = isOut && hasPartner && Boolean(order.trackingNumber || order.selfDeliveryDetails?.deliveryPartnerToken || order.thirdPartyDetails?.trackingNumber);

  const deliveryPartnerDisplay = isSelf 
    ? (order.selfDeliveryDetails?.deliveryPersonName ? `Direct Self-Delivery (Rider: ${order.selfDeliveryDetails.deliveryPersonName})` : 'Direct Self-Delivery (Store Fleet)')
    : (order.courierName || order.thirdPartyDetails?.courierName || '3rd-Party Logistics Carrier');

  const trackingNumberDisplay = order.trackingNumber || (isSelf ? order.selfDeliveryDetails?.deliveryPartnerToken : order.thirdPartyDetails?.trackingNumber) || '';

  const trackingLinkDisplay = order.trackingUrl || order.selfDeliveryDetails?.trackingUrl || order.thirdPartyDetails?.trackingUrl || '';

  const handleDownloadPDF = async () => {
    if (!confirmed) {
      alert('⚠️ Tax Invoice & Certificate is generated only when an order is confirmed strictly.');
      return;
    }
    try {
      setIsDownloading(true);
      const token = localStorage.getItem('bv_admin_jwt_token');
      const orderIdentifier = order.id || order.orderId || order._id;
      const res = await fetch(`${SERVER_URL}/orders/${orderIdentifier}/invoice`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) {
        throw new Error(`Server responded with status ${res.status}`);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice_${orderIdentifier}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Invoice download error:', err);
      alert('Could not download server PDF. Switching to browser print view instead.');
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    if (!confirmed) {
      alert('⚠️ Tax Invoice & Certificate is generated only when an order is confirmed strictly.');
      return;
    }
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Top Control Bar */}
        <div className="bg-gray-950 text-white px-5 py-3 flex items-center justify-between shrink-0 print:hidden border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-gray-950 flex items-center justify-center font-bold">
              <FileText size={16} />
            </div>
            <div>
              <h3 className="font-display font-bold text-xs sm:text-sm text-white leading-tight">
                Admin Master Tax Invoice & Order Certificate
              </h3>
              <p className="text-[10px] text-gray-400">Order ID: #{order.id || order._id}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {confirmed && (
              <>
                <button
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-gray-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                  title="Download Official GST Tax Invoice PDF"
                >
                  <Download size={13} className={isDownloading ? 'animate-bounce' : ''} />
                  {isDownloading ? 'Downloading...' : 'Download PDF'}
                </button>
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-brand-teal hover:bg-teal-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer size={13} /> Print Invoice
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Strict Verification Banner */}
        {!confirmed ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto">
              <Lock size={28} />
            </div>
            <div>
              <h4 className="font-display font-extrabold text-lg text-gray-900">Certificate Generation Locked</h4>
              <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
                Official Tax Invoice and Order Certificate are strictly generated only after order confirmation or payment settlement.
              </p>
            </div>
            <div className="inline-block bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold px-4 py-2 rounded-xl">
              Current Order Status: <span className="uppercase font-black text-amber-950">{order.status || 'Pending Verification'}</span>
            </div>
          </div>
        ) : (

        /* Invoice Sheet Body */
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto print:overflow-visible print:p-0">
          
          {/* Company & Certificate Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-gray-900 pb-5 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-brand-teal text-white font-black text-xs px-2 py-0.5 rounded tracking-wider uppercase">Book Vardi</span>
                <span className="text-xs font-extrabold text-emerald-700 flex items-center gap-1">
                  <ShieldCheck size={14} /> Official Verified Invoice
                </span>
              </div>
              <h1 className="font-display font-extrabold text-xl text-gray-900 tracking-tight">
                BOOK VARDI PRIVATE LIMITED
              </h1>
              <p className="text-[11px] text-gray-500">Lucknow, Uttar Pradesh - 226001 | GSTIN: 09AAACB1234F1Z9</p>
            </div>

            <div className="sm:text-right border-l-2 sm:border-l-0 sm:border-r-0 border-brand-teal pl-3 sm:pl-0">
              <h2 className="font-display font-black text-lg text-gray-900 uppercase tracking-wider">
                TAX INVOICE
              </h2>
              <p className="text-xs font-bold text-gray-700">Invoice No: <strong className="font-mono text-brand-teal">INV-{order.id}</strong></p>
              <p className="text-[11px] text-gray-500">Invoice Date: {order.date || new Date().toLocaleDateString('en-GB')}</p>
            </div>
          </div>

          {/* 3-Column Info: Sold By (Seller), Billed & Shipped To (Customer), Order & Tax Meta */}
          <div className="grid grid-cols-1 md:grid-cols-3 print:grid-cols-3 gap-4 text-xs bg-gray-50 p-4 rounded-xl border border-gray-200">
            {/* 1. Sold By (Verified Seller) */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-black text-amber-800 flex items-center gap-1">
                <Store size={12} className="text-amber-700" /> Sold By (Verified Seller)
              </span>
              <p className="font-extrabold text-gray-900 text-sm">{resolvedSeller.storeName}</p>
              {resolvedSeller.ownerName && resolvedSeller.ownerName !== resolvedSeller.storeName && (
                <p className="text-gray-600 text-[11px]">Prop: {resolvedSeller.ownerName}</p>
              )}
              {resolvedSeller.address && (
                <p className="text-gray-600 text-[11px] leading-relaxed">{resolvedSeller.address}</p>
              )}
              {(resolvedSeller.city || resolvedSeller.state || resolvedSeller.pincode) && (
                <p className="text-gray-600 text-[11px]">
                  {[resolvedSeller.city, resolvedSeller.state].filter(Boolean).join(', ')}
                  {resolvedSeller.pincode ? ` - ${resolvedSeller.pincode}` : ''}
                </p>
              )}
              {resolvedSeller.phone && (
                <p className="text-gray-500 text-[11px]">Phone: <span className="font-medium text-gray-700">{resolvedSeller.phone}</span></p>
              )}
              {resolvedSeller.email && (
                <p className="text-gray-500 text-[11px]">Email: <span className="font-medium text-gray-700">{resolvedSeller.email}</span></p>
              )}
              {resolvedSeller.gstNumber && (
                <p className="text-[10px] font-mono text-gray-500 mt-1">
                  GSTIN: <span className="font-bold text-gray-800">{resolvedSeller.gstNumber}</span>
                </p>
              )}
            </div>

            {/* 2. Billed & Shipped To (Customer) */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-black text-teal-800 flex items-center gap-1">
                <User size={12} className="text-teal-700" /> Billed & Shipped To (Customer)
              </span>
              <p className="font-extrabold text-gray-900 text-sm">{resolvedConsumer.name}</p>
              {resolvedConsumer.street && (
                <p className="text-gray-600 text-[11px] leading-relaxed">{resolvedConsumer.street}</p>
              )}
              {resolvedConsumer.cityStatePin && (
                <p className="text-gray-600 text-[11px]">{resolvedConsumer.cityStatePin}</p>
              )}
              {resolvedConsumer.phone && (
                <p className="text-gray-500 text-[11px]">Phone: <span className="font-medium text-gray-700">{resolvedConsumer.phone}</span></p>
              )}
              {resolvedConsumer.email && (
                <p className="text-gray-500 text-[11px]">Email: <span className="font-medium text-gray-700">{resolvedConsumer.email}</span></p>
              )}
            </div>

            {/* 3. Order & Tax Meta */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-black text-gray-500 flex items-center gap-1">
                <FileText size={12} className="text-gray-500" /> Order & Tax Meta
              </span>
              <p className="text-gray-700">Order ID: <strong className="font-mono text-gray-900">#{order.id}</strong></p>
              <p className="text-gray-700">Invoice No: <strong className="font-mono text-brand-teal">INV-{order.id}</strong></p>
              <p className="text-gray-700">Invoice Date: <strong className="text-gray-900">{order.date || new Date().toLocaleDateString('en-GB')}</strong></p>
              <p className="text-gray-700">Payment: <strong className="text-gray-900">{order.paymentMethod || 'Online UPI'}</strong> ({order.paymentStatus || 'Paid'})</p>
              <p className="text-gray-700">School / Entity: <strong className="text-gray-900">{order.school || 'General Retail'}</strong></p>
            </div>
          </div>

          {/* Dispatch & Live Delivery Tracking Details */}
          {hasTracking ? (
            <div className="p-3.5 bg-teal-50/80 rounded-xl border border-teal-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-black text-teal-800 flex items-center gap-1.5">
                  <Truck size={14} className="text-teal-700" /> Dispatch & Delivery Tracking Details
                </span>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-gray-700">
                  <div>
                    Delivery Mode: <strong className="text-gray-900">{deliveryPartnerDisplay}</strong>
                  </div>
                  <div>
                    Tracking ID / AWB: <strong className="font-mono text-teal-950 font-bold bg-white px-2 py-0.5 rounded border border-teal-200">{trackingNumberDisplay || 'Not Assigned'}</strong>
                  </div>
                </div>
                {trackingLinkDisplay && (
                  <div className="text-[10px] text-gray-500 font-mono break-all pt-0.5">
                    Live Tracking URL: <a href={trackingLinkDisplay} target="_blank" rel="noreferrer" className="text-teal-700 hover:underline">{trackingLinkDisplay}</a>
                  </div>
                )}
              </div>
              {trackingLinkDisplay && (
                <a
                  href={trackingLinkDisplay}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 print:hidden"
                >
                  <span>Track Shipment</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          ) : (
            <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-[11px] text-gray-500 flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <Truck size={13} className="text-gray-400" />
                Logistics Tracking ID: <strong className="text-amber-800 font-mono font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Not Assigned</strong>
              </span>
              <span className="text-[10px] text-gray-400 italic">Official Tracking ID is dynamically generated when delivery partner is assigned</span>
            </div>
          )}

          {/* Itemized Table with Product-Level Seller & GST Applied Breakdown */}
          <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700 border-b border-gray-200 font-extrabold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Item Details</th>
                  <th className="py-2.5 px-3">Sold By (Seller)</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Taxable Val</th>
                  <th className="py-2.5 px-3 text-right">GST Rate</th>
                  <th className="py-2.5 px-3 text-right">Total Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {itemBreakdowns.map((item, idx) => {
                  const sellerName = getItemSellerName(item);
                  return (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-gray-900">{item.name}</p>
                        <p className="text-[10px] text-gray-400">{item.category || 'School Supply'}</p>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-[11px] border border-gray-200 block truncate max-w-[130px]" title={sellerName}>
                          {sellerName}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold">{item.qty}</td>
                      <td className="py-2.5 px-3 text-right font-mono">₹{item.unitPrice.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-gray-600">₹{item.taxableVal.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="font-extrabold text-brand-teal block">{item.rate}% GST</span>
                        <span className="text-[9px] text-gray-500 font-medium">(₹{item.taxAmt.toFixed(2)})</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-gray-900 font-mono">₹{item.grossPrice.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Financial Settlement & Tax Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200 space-y-1.5 text-[11px]">
              <h4 className="font-extrabold text-[10px] text-amber-950 uppercase tracking-wider flex items-center gap-1">
                <DollarSign size={13} /> Marketplace Commission & Tax Split
              </h4>
              <div className="flex justify-between text-gray-700">
                <span>Order Grand Total:</span>
                <span className="font-mono font-bold">₹{grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-amber-900 font-bold">
                <span>Marketplace Fee ({marketplaceCommissionRate}%):</span>
                <span className="font-mono">₹{marketplaceCommission.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-800 font-black border-t border-amber-300 pt-1">
                <span>Net Payable to Seller:</span>
                <span className="font-mono">₹{sellerPayout.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-1.5 text-[11px]">
              <div className="flex justify-between text-gray-600">
                <span>Taxable Value (Base Price):</span>
                <span className="font-mono">₹{(grandTotal - taxAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>GST Tax (Included):</span>
                <span className="font-mono font-bold text-brand-teal">₹{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Charges:</span>
                <span className="font-mono text-emerald-700 font-semibold">
                  {Number(order.shippingFee || order.shippingCost || 0) === 0 ? 'Not Applied (FREE)' : `₹${Number(order.shippingFee || order.shippingCost).toFixed(2)}`}
                </span>
              </div>
              {Number(order.discount || order.discountAmount || 0) > 0 ? (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Offer / Coupon Applied:</span>
                  <span className="font-mono">-₹{Number(order.discount || order.discountAmount).toFixed(2)}</span>
                </div>
              ) : (
                <div className="flex justify-between text-gray-400">
                  <span>Offer / Coupon:</span>
                  <span className="font-mono">Not Applied (₹0.00)</span>
                </div>
              )}
              <div className="border-t-2 border-gray-300 pt-1.5 flex justify-between items-center text-xs font-black text-gray-900">
                <span>Gross Order Payable Total:</span>
                <span className="font-mono text-sm text-gray-900">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

        </div>
        )}
      </div>
    </div>
  );
}
