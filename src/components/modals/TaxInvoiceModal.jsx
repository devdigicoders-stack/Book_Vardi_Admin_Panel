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
  const cat = String(item?.category || item?.productId?.category || '').toLowerCase();
  const name = String(item?.name || item?.productName || item?.productId?.name || '').toLowerCase();
  if (cat.includes('book') || name.includes('book') || cat.includes('textbook') || name.includes('textbook')) {
    return 0;
  }
  return 5;
}

export function numberToWords(num) {
  const n = Math.round(Number(num || 0));
  if (isNaN(n) || n === 0) return 'Zero Rupees Only';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  function inWords(val) {
    if (val === 0) return '';
    if (val < 20) return a[val] + ' ';
    if (val < 100) return b[Math.floor(val / 10)] + (val % 10 !== 0 ? ' ' + a[val % 10] : '') + ' ';
    if (val < 1000) return a[Math.floor(val / 100)] + ' Hundred ' + inWords(val % 100);
    if (val < 100000) return inWords(Math.floor(val / 1000)) + ' Thousand ' + inWords(val % 1000);
    if (val < 10000000) return inWords(Math.floor(val / 100000)) + ' Lakh ' + inWords(val % 100000);
    return inWords(Math.floor(val / 10000000)) + ' Crore ' + inWords(val % 10000000);
  }
  return (inWords(n).trim() + ' Rupees Only').replace(/\s+/g, ' ');
}

export const GST_STATE_CODES = {
  '01': 'jammu_kashmir', '02': 'himachal_pradesh', '03': 'punjab', '04': 'chandigarh',
  '05': 'uttarakhand', '06': 'haryana', '07': 'delhi', '08': 'rajasthan',
  '09': 'uttar_pradesh', '10': 'bihar', '11': 'sikkim', '12': 'arunachal_pradesh',
  '13': 'manipur', '14': 'nagaland', '15': 'mizoram', '16': 'tripura',
  '17': 'meghalaya', '18': 'assam', '19': 'west_bengal', '20': 'jharkhand',
  '21': 'odisha', '22': 'chhattisgarh', '23': 'madhya_pradesh', '24': 'gujarat',
  '27': 'maharashtra', '29': 'karnataka', '30': 'goa', '32': 'kerala',
  '33': 'tamil_nadu', '36': 'telangana', '37': 'andhra_pradesh'
};

export const PINCODE_PREFIX_MAP = [
  { regex: /^(20|21|22|23|24[0-7]|25|26[12]|27|28)/, key: 'uttar_pradesh', name: 'Uttar Pradesh' },
  { regex: /^(24[89]|26[3-9])/, key: 'uttarakhand', name: 'Uttarakhand' },
  { regex: /^11/, key: 'delhi', name: 'Delhi' },
  { regex: /^(12|13)/, key: 'haryana', name: 'Haryana' },
  { regex: /^(14|15|16)/, key: 'punjab', name: 'Punjab' },
  { regex: /^3[0-4]/, key: 'rajasthan', name: 'Rajasthan' },
  { regex: /^3[6-9]/, key: 'gujarat', name: 'Gujarat' },
  { regex: /^4[0-4]/, key: 'maharashtra', name: 'Maharashtra' },
  { regex: /^4[5-9]/, key: 'madhya_pradesh', name: 'Madhya Pradesh' },
  { regex: /^5[0-3]/, key: 'telangana', name: 'Telangana' },
  { regex: /^5[6-9]/, key: 'karnataka', name: 'Karnataka' },
  { regex: /^6[0-4]/, key: 'tamil_nadu', name: 'Tamil Nadu' },
  { regex: /^6[7-9]/, key: 'kerala', name: 'Kerala' },
  { regex: /^7[0-4]/, key: 'west_bengal', name: 'West Bengal' },
  { regex: /^8[0-5]/, key: 'bihar', name: 'Bihar' }
];

export const INDIAN_STATES = [
  {
    key: 'uttar_pradesh',
    name: 'Uttar Pradesh',
    aliases: [
      'uttar pradesh', 'uttarpradesh', 'utter pradesh', 'utterpradesh', 'uttarpardesh', 'uttar pardesh', 'uttar prdesh', 'uttarprdesh', 'u.p.', 'u.p', 'up', 'u p',
      'lucknow', 'kanpur', 'varanasi', 'mirzapur', 'behat', 'saharanpur', 'noida', 'greater noida', 'ghaziabad', 'agra', 'prayagraj', 'allahabad', 'gorakhpur', 'meerut', 'bareilly', 'aligarh', 'moradabad', 'jhansi', 'ayodhya', 'faizabad', 'azamgarh', 'muzaffarnagar', 'mathura', 'firozabad', 'bulandshahr', 'sambhal', 'amroha', 'hardoi', 'fatehpur', 'raebareli', 'sitapur', 'bahraich', 'gonda', 'basti', 'deoria', 'ballia', 'jaunpur', 'ghazipur', 'chandauli', 'bhadohi', 'sonbhadra', 'unnao', 'lakhimpur', 'pilibhit', 'shahjahanpur', 'budaun', 'rampur', 'bijnor', 'shamli', 'baghpat', 'hapur', 'kasganj', 'hathras', 'etah', 'mainpuri', 'etawah', 'auraiya', 'kannauj', 'farrukhabad', 'kanpur dehat', 'jalaun', 'hamirpur', 'mahoba', 'banda', 'chitrakoot', 'kaushambi', 'pratapgarh', 'amethi', 'sultanpur', 'barabanki', 'shravasti', 'balrampur', 'siddharthnagar', 'sant kabir nagar', 'maharajganj', 'kushinagar', 'mau', 'lalitpur'
    ]
  },
  {
    key: 'maharashtra',
    name: 'Maharashtra',
    aliases: [
      'maharashtra', 'maharastra', 'maharashtr', 'maharastr', 'maha rashtra', 'maha rastra', 'maharasthra', 'maharashtra state', 'm.h.', 'mh', 'm h',
      'mumbai', 'bombay', 'pune', 'nagpur', 'thane', 'navi mumbai', 'nashik', 'aurangabad', 'chhatrapati sambhaji nagar', 'solapur', 'kolhapur', 'amravati', 'nanded', 'jalgaon', 'akola', 'latur', 'dhule', 'ahmednagar', 'chandrapur', 'parbhani', 'panvel', 'kalyan', 'dombivli', 'vasai', 'virar', 'mira bhayandar', 'ulhasnagar', 'satara'
    ]
  },
  { key: 'delhi', name: 'Delhi', aliases: ['delhi', 'new delhi', 'nct of delhi', 'nct', 'dl', 'newdelhi', 'd.l.'] },
  { key: 'uttarakhand', name: 'Uttarakhand', aliases: ['uttarakhand', 'uttaranchal', 'dehradun', 'haridwar', 'roorkee', 'rishikesh', 'nainital', 'haldwani', 'uk', 'u.k.'] },
  { key: 'karnataka', name: 'Karnataka', aliases: ['karnataka', 'karnatka', 'karnatak', 'bangalore', 'bengaluru', 'mysore', 'mysuru', 'ka', 'k.a.', 'hubli', 'mangalore', 'mangaluru'] },
  { key: 'tamil_nadu', name: 'Tamil Nadu', aliases: ['tamil nadu', 'tamilnadu', 'tamil nad', 'chennai', 'madras', 'coimbatore', 'madurai', 'tn', 't.n.'] },
  { key: 'haryana', name: 'Haryana', aliases: ['haryana', 'hariyana', 'gurugram', 'gurgaon', 'faridabad', 'panipat', 'ambala', 'hr', 'h.r.'] },
  { key: 'rajasthan', name: 'Rajasthan', aliases: ['rajasthan', 'rajisthan', 'rajashtan', 'jaipur', 'jodhpur', 'udaipur', 'kota', 'bikaner', 'rj', 'r.j.'] },
  { key: 'west_bengal', name: 'West Bengal', aliases: ['west bengal', 'westbengal', 'paschim banga', 'kolkata', 'calcutta', 'howrah', 'siliguri', 'wb', 'w.b.'] },
  { key: 'gujarat', name: 'Gujarat', aliases: ['gujarat', 'gujrat', 'gujarath', 'ahmedabad', 'amdavad', 'surat', 'vadodara', 'baroda', 'rajkot', 'gj', 'g.j.'] },
  { key: 'punjab', name: 'Punjab', aliases: ['punjab', 'panjab', 'ludhiana', 'amritsar', 'jalandhar', 'pb', 'p.b.'] },
  { key: 'madhya_pradesh', name: 'Madhya Pradesh', aliases: ['madhya pradesh', 'madhyapradesh', 'madhya pardesh', 'bhopal', 'indore', 'gwalior', 'jabalpur', 'mp', 'm.p.'] },
  { key: 'bihar', name: 'Bihar', aliases: ['bihar', 'patna', 'gaya', 'bhagalpur', 'muzaffarpur', 'br', 'b.r.'] },
  { key: 'telangana', name: 'Telangana', aliases: ['telangana', 'telengana', 'hyderabad', 'secunderabad', 'warangal', 'tg', 'ts'] },
  { key: 'andhra_pradesh', name: 'Andhra Pradesh', aliases: ['andhra pradesh', 'andhrapradesh', 'visakhapatnam', 'vizag', 'vijayawada', 'guntur', 'ap', 'a.p.'] },
  { key: 'kerala', name: 'Kerala', aliases: ['kerala', 'keralam', 'kochi', 'cochin', 'thiruvananthapuram', 'trivandrum', 'kozhikode', 'kl', 'k.l.'] },
  { key: 'assam', name: 'Assam', aliases: ['assam', 'asom', 'guwahati', 'as'] },
  { key: 'jharkhand', name: 'Jharkhand', aliases: ['jharkhand', 'jharkand', 'ranchi', 'jamshedpur', 'dhanbad', 'jh'] },
  { key: 'odisha', name: 'Odisha', aliases: ['odisha', 'orissa', 'bhubaneswar', 'cuttack', 'od', 'or'] },
  { key: 'chhattisgarh', name: 'Chhattisgarh', aliases: ['chhattisgarh', 'chhatisgarh', 'chattisgarh', 'raipur', 'bilaspur', 'cg'] },
  { key: 'himachal_pradesh', name: 'Himachal Pradesh', aliases: ['himachal pradesh', 'himachal', 'shimla', 'dharamshala', 'hp'] },
  { key: 'jammu_kashmir', name: 'Jammu & Kashmir', aliases: ['jammu & kashmir', 'jammu and kashmir', 'jammu', 'kashmir', 'srinagar', 'jk'] },
  { key: 'goa', name: 'Goa', aliases: ['goa', 'panaji', 'panjim', 'margao', 'ga'] }
];

export function matchStateByText(inputStr) {
  if (!inputStr || typeof inputStr !== 'string') return null;
  const clean = inputStr.trim().toLowerCase();
  if (!clean) return null;

  for (const st of INDIAN_STATES) {
    for (const alias of st.aliases) {
      const regex = new RegExp(`(^|[^a-z0-9])${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`, 'i');
      if (regex.test(clean)) {
        return { key: st.key, name: st.name };
      }
    }
  }
  return null;
}

export function parseStateInfo(sourceObj, fallbackString = '') {
  // 1. FIRST PRIORITY: Explicit declared State Field (Place of Supply authoritative field)
  const explicitState = String(
    sourceObj?.state ||
    sourceObj?.province ||
    sourceObj?.stateName ||
    sourceObj?.shippingAddress?.state ||
    ''
  ).trim();

  if (explicitState) {
    const matched = matchStateByText(explicitState);
    if (matched) return matched;
  }

  // 2. SECOND PRIORITY: Explicit declared City Field
  const explicitCity = String(
    sourceObj?.city ||
    sourceObj?.district ||
    sourceObj?.cityName ||
    sourceObj?.shippingAddress?.city ||
    ''
  ).trim();

  if (explicitCity) {
    const matched = matchStateByText(explicitCity);
    if (matched) return matched;
  }

  // 3. THIRD PRIORITY: Address text scan (Combined address lines, street, landmark)
  let addressText = '';
  if (sourceObj && typeof sourceObj === 'object') {
    addressText = [
      sourceObj.state,
      sourceObj.city,
      sourceObj.addressLine,
      sourceObj.addressLine1,
      sourceObj.street,
      sourceObj.address,
      sourceObj.colony,
      sourceObj.landmark,
      fallbackString
    ].filter(Boolean).join(' ');
  } else if (typeof sourceObj === 'string') {
    addressText = `${sourceObj} ${fallbackString}`;
  } else if (fallbackString) {
    addressText = String(fallbackString);
  }

  if (addressText.trim()) {
    const matched = matchStateByText(addressText);
    if (matched) return matched;
  }

  // 4. FOURTH PRIORITY: GSTIN Prefix (2-digit state code)
  const rawGst = String(
    sourceObj?.gstNumber || sourceObj?.gstin || sourceObj?.gst || ''
  ).trim();
  if (rawGst.length >= 2 && /^\d{2}/.test(rawGst)) {
    const code = rawGst.slice(0, 2);
    if (GST_STATE_CODES[code]) {
      const found = INDIAN_STATES.find(s => s.key === GST_STATE_CODES[code]);
      if (found) return { key: found.key, name: found.name };
    }
  }

  // 5. FIFTH PRIORITY: 6-Digit Pincode (Fallback if State & City text was not provided)
  const explicitPin = String(sourceObj?.pincode || sourceObj?.pin || sourceObj?.postalCode || '').trim();
  const isolatedPinMatch = explicitPin.match(/\b([1-9]\d{5})\b/) || String(addressText || '').match(/\b([1-9]\d{5})\b/);
  const sixPin = isolatedPinMatch ? isolatedPinMatch[1] : (explicitPin.replace(/\D/g, '').length >= 6 ? explicitPin.replace(/\D/g, '').slice(0, 6) : '');
  if (sixPin) {
    for (const p of PINCODE_PREFIX_MAP) {
      if (p.regex.test(sixPin)) {
        return { key: p.key, name: p.name };
      }
    }
  }

  // 6. DEFAULT FALLBACK: Uttar Pradesh
  return { key: 'uttar_pradesh', name: 'Uttar Pradesh' };
}

export default function TaxInvoiceModal({ isOpen, onClose, order }) {
  if (!isOpen || !order) return null;

  const rawStatus = String(order.overallStatus || order.status || '').toLowerCase().trim();
  const normStatus = rawStatus.replace(/[\s-]+/g, '_');
  const isCancelled = normStatus === 'cancelled' || normStatus === 'canceled' || Boolean(order.isCancelled) || Boolean(order.cancelledAt);

  const isBulkOrder = Boolean(
    order.isBulkOrder ||
    order.isSchoolOrder ||
    Array.isArray(order.requirements) ||
    order.bulkOrderId ||
    order.schoolName ||
    String(order.id || order._id || '').startsWith('BULK-')
  );

  const isPendingUnconfirmed = !isBulkOrder && (!normStatus || ['pending', 'placed', 'unconfirmed', 'created', 'draft'].includes(normStatus));

  const isConfirmedAndOnward = [
    'assigned',
    'accepted',
    'confirmed',
    'quote_accepted',
    'buyer_accepted',
    'seller_accepted',
    'seller_accepted_counter',
    'processing',
    'production',
    'in_production',
    'packed',
    'packed_and_sealed',
    'shipped',
    'dispatched',
    'in_transit',
    'out_for_delivery',
    'delivered',
    'completed',
    'fulfilled',
    'delivered_to_customer',
    'order_delivered',
    'return_requested',
    'returned',
    'exchange_requested',
    'exchanged',
    'return_approved',
    'exchange_approved',
    'refund_requested',
    'refunded',
    'cancelled',
    'canceled'
  ].includes(normStatus) || (isBulkOrder && normStatus.length > 0) || (!isPendingUnconfirmed && normStatus.length > 0);

  const hasConfirmedItem = Array.isArray(order.items) && order.items.some(it => {
    const itStatus = String(it.status || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
    return itStatus && !['pending', 'placed', 'unconfirmed', 'draft'].includes(itStatus);
  });

  const isPaid = String(order.paymentStatus || '').toLowerCase() === 'paid' ||
    String(order.advancePaymentStatus || '').toLowerCase() === 'paid' ||
    Number(order.advancePaidAmount || 0) > 0;

  // Strict Tax Invoice Lock:
  // Tax Invoice is ONLY generated when the order status is confirmed (or processing, packed, shipped, delivered, completed, cancelled).
  // Unconfirmed / Pending orders remain strictly LOCKED, regardless of whether payment was made online (UPI/Razorpay).
  const isOrderStrictlyPending = isPendingUnconfirmed && !hasConfirmedItem;

  const confirmed = isBulkOrder
    ? (isConfirmedAndOnward || (normStatus && !isPendingUnconfirmed))
    : (isCancelled || (!isOrderStrictlyPending && (isConfirmedAndOnward || hasConfirmedItem)));

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
      ].filter(Boolean).join(', ') || order.deliveryLocation || order.location || 'Lucknow, Uttar Pradesh';

  const items = Array.isArray(order.items) && order.items.length > 0
    ? order.items
    : (Array.isArray(order.requirements) && order.requirements.length > 0
        ? order.requirements.map((req, rIdx) => ({
            id: req._id || rIdx + 1,
            name: req.itemName || req.name || 'School Demand Item',
            image: (req.sampleImages && req.sampleImages[0]) || order.image || FALLBACK_IMAGE,
            quantity: Number(req.quantity) || 1,
            price: Number(req.sellerPricePerUnit || req.sellerPrice || req.budgetPerUnit || req.unitPrice || (order.targetBudgetPerKit && req.quantity ? Math.round(Number(order.targetBudgetPerKit) / Number(req.quantity)) : 0) || 480),
            category: req.category || 'School Supply'
          }))
        : [
            {
              id: 1,
              name: order.itemName || order.product || (order.requirements && order.requirements[0]?.itemName) || 'School Supply & Uniform Item',
              image: order.image || (Array.isArray(order.images) && order.images[0]) || FALLBACK_IMAGE,
              quantity: order.quantity || order.totalQuantity || 1,
              price: order.total || order.amount || 499,
              category: 'School Uniform'
            }
          ]
    );
  const rawSubtotal = Number(order.subtotal || 0);
  const shippingCost = Number(order.shippingCost ?? order.shippingFee ?? 0);
  const discount = Number(order.discount ?? order.discountAmount ?? order.couponDiscount ?? 0);
  const pointsDiscount = Number(order.pointsDiscount || 0);
  const totalDiscounts = discount + pointsDiscount;

  const itemsSum = items.reduce((acc, it) => acc + (Number(it.originalPrice ?? it.price ?? it.finalPrice ?? 0) * Number(it.quantity || 1)), 0);
  const isItemPriceAlreadyDiscounted = rawSubtotal > 0 && totalDiscounts > 0 && Math.abs((itemsSum + totalDiscounts) - rawSubtotal) < 1;

  const subtotal = rawSubtotal > 0 ? rawSubtotal : itemsSum;
  const grandTotal = Number(order.total || order.totalAmount || Math.max(0, subtotal + shippingCost - totalDiscounts));
  const discountRatio = subtotal > 0 ? Math.min(1, totalDiscounts / subtotal) : 0;

  let totalTaxableValue = 0;
  let totalTaxAmount = 0;

  const itemBreakdowns = items.map((item) => {
    const isUnstitched = Boolean(
      item.isMeterBased ||
      item.unit === 'meter' ||
      item.unit === 'm' ||
      item.productId?.isMeterBased ||
      item.productId?.unit === 'meter' ||
      item.productId?.unit === 'm' ||
      String(item.category || '').toLowerCase().includes('unstitched') ||
      String(item.category || '').toLowerCase().includes('unstiched') ||
      String(item.subCategory || '').toLowerCase().includes('unstitched') ||
      String(item.subCategory || '').toLowerCase().includes('unstiched') ||
      String(item.name || '').toLowerCase().includes('unstitched') ||
      String(item.name || '').toLowerCase().includes('unstiched') ||
      String(item.productName || '').toLowerCase().includes('unstitched') ||
      String(item.productName || '').toLowerCase().includes('unstiched') ||
      (Number(item.quantity || 1) % 1 !== 0)
    );
    const rawQty = Number(item.quantity || 1);
    const displayQty = isUnstitched ? rawQty.toFixed(2) : (rawQty % 1 === 0 ? rawQty : rawQty.toFixed(2));
    const qty = rawQty;

    let unitPrice = Number(item.originalPrice ?? item.price ?? item.finalPrice ?? 0);
    if (isItemPriceAlreadyDiscounted && totalDiscounts > 0 && subtotal > 0) {
      const proportion = (unitPrice * qty) / itemsSum;
      const allocDiscount = totalDiscounts * proportion;
      unitPrice = qty > 0 ? Math.round(((unitPrice * qty + allocDiscount) / qty) * 100) / 100 : unitPrice;
    }

    const grossPrice = Math.round((unitPrice * qty) * 100) / 100;
    const rate = getProductGstRate(item);
    const isInclusive = item.isGstInclusive !== false && order.isGstInclusive !== false;

    const itemDiscount = item.offerDiscount !== undefined && item.offerDiscount !== null && !isNaN(Number(item.offerDiscount)) && Number(item.offerDiscount) > 0
      ? Number(item.offerDiscount)
      : (discountRatio > 0 ? Math.round(grossPrice * discountRatio * 100) / 100 : 0);
    const netItemPayable = Math.max(0, Math.round((grossPrice - itemDiscount) * 100) / 100);

    let taxableVal = netItemPayable;
    let taxAmt = 0;

    if (rate > 0) {
      if (isInclusive) {
        taxableVal = Math.round((netItemPayable / (1 + rate / 100)) * 100) / 100;
        taxAmt = Math.round((netItemPayable - taxableVal) * 100) / 100;
      } else {
        taxableVal = netItemPayable;
        taxAmt = Math.round(((netItemPayable * rate) / 100) * 100) / 100;
      }
    }

    totalTaxableValue += taxableVal;
    totalTaxAmount += taxAmt;

    return {
      ...item,
      qty: displayQty,
      rawQty,
      unitPrice,
      grossPrice,
      itemDiscount,
      netItemPayable,
      rate,
      taxableVal,
      taxAmt
    };
  });

  // Dynamic Product GST Rate for Delivery (Composite Supply under Section 8 of CGST Act: Principal supply rate governs freight/delivery)
  // Delivery charge GST strictly matches the product's GST rate (e.g., 5% product -> 5% delivery, 0% product -> 0% delivery)
  const defaultProductGstRate = (() => {
    const itemRates = itemBreakdowns.map(it => Number(it.rate)).filter(r => !isNaN(r));
    if (itemRates.length > 0) {
      return Math.max(...itemRates);
    }
    if (order.shippingGstRate !== undefined && order.shippingGstRate !== null && !isNaN(Number(order.shippingGstRate))) {
      return Number(order.shippingGstRate);
    }
    return 5;
  })();

  const shippingGstRate = defaultProductGstRate;

  // Include shipping GST into total taxable value & total tax amount for unified grand total breakdown
  let shippingTaxable = 0;
  let shippingTax = 0;
  if (shippingCost > 0) {
    if (shippingGstRate > 0) {
      shippingTaxable = Math.round((shippingCost / (1 + shippingGstRate / 100)) * 100) / 100;
      shippingTax = Math.round((shippingCost - shippingTaxable) * 100) / 100;
    } else {
      shippingTaxable = shippingCost;
      shippingTax = 0;
    }
    totalTaxableValue += shippingTaxable;
    totalTaxAmount += shippingTax;
  }

  totalTaxableValue = Math.round(totalTaxableValue * 100) / 100;
  totalTaxAmount = Math.round(totalTaxAmount * 100) / 100;
  if (Math.abs((totalTaxableValue + totalTaxAmount) - grandTotal) > 0 && Math.abs((totalTaxableValue + totalTaxAmount) - grandTotal) <= 0.05) {
    totalTaxableValue = Math.round((grandTotal - totalTaxAmount) * 100) / 100;
  }

  const taxAmount = totalTaxAmount;
  const taxableValue = totalTaxableValue;

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
      ...candObjs.map(o => o.tradeName),
      ...candObjs.map(o => o.businessName),
      ...candObjs.map(o => o.legalBusinessName),
      ...candObjs.map(o => o.name),
      ...candObjs.map(o => o.sellerName),
      firstItem.sellerStoreName,
      firstItem.storeName,
      firstItem.tradeName,
      firstItem.businessName,
      firstItem.sellerDetails?.storeName,
      firstItem.sellerDetails?.tradeName,
      firstItem.sellerDetails?.businessName,
      firstItem.sellerDetails?.legalBusinessName,
      firstItem.sellerDetails?.sellerName,
      firstItem.sellerName,
      order.sellerStoreName,
      order.storeName,
      order.sellerDetails?.storeName,
      order.sellerDetails?.tradeName,
      order.sellerDetails?.businessName,
      order.sellerDetails?.sellerName,
      order.sellerName
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

  // Dynamic Intra-State vs Inter-State detection
  const sellerStateInfo = parseStateInfo(resolvedSeller, `${resolvedSeller.city} ${resolvedSeller.state}`);
  const customerStateInfo = parseStateInfo(shippingAddr, `${formattedAddressStr} ${shippingAddr?.state || ''} ${resolvedConsumer?.cityStatePin || ''}`);
  const isIntraState = !sellerStateInfo.key || !customerStateInfo.key || (sellerStateInfo.key === customerStateInfo.key);

  // Dynamic CGST + SGST vs IGST Split on total order tax
  const cgstAmount = isIntraState ? Math.round((taxAmount / 2) * 100) / 100 : 0;
  const sgstAmount = isIntraState ? Math.round((taxAmount - cgstAmount) * 100) / 100 : 0;
  const igstAmount = !isIntraState ? taxAmount : 0;

  // Shipping tax split
  const shippingCgst = shippingTax > 0 && isIntraState ? Math.round((shippingTax / 2) * 100) / 100 : 0;
  const shippingSgst = shippingTax > 0 && isIntraState ? Math.round((shippingTax - shippingCgst) * 100) / 100 : 0;
  const shippingIgst = shippingTax > 0 && !isIntraState ? shippingTax : 0;

  const getItemSellerName = (item) => {
    if (item?.sellerId && typeof item.sellerId === 'object') {
      const name = item.sellerId.storeName || item.sellerId.name || item.sellerId.sellerName || item.sellerId.legalName;
      if (name && !isPlaceholderName(name)) return name;
    }

    const candidateItemNames = [
      item?.sellerStoreName,
      item?.storeName,
      item?.sellerDetails?.storeName,
      item?.sellerDetails?.tradeName,
      item?.sellerDetails?.businessName,
      item?.sellerDetails?.legalBusinessName,
      item?.sellerDetails?.sellerName,
      item?.tradeName,
      item?.businessName,
      item?.legalBusinessName,
      item?.sellerName,
      typeof item?.seller === 'string' ? item.seller : (item?.seller?.storeName || item?.seller?.tradeName || item?.seller?.businessName || item?.seller?.name)
    ];

    for (const c of candidateItemNames) {
      if (c && !isPlaceholderName(c)) return c;
    }

    const prodIdStr = String(item?.productId || item?.id || item?._id || '');
    const cleanItemName = String(item?.name || item?.productName || item?.itemName || '').replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();

    if (prodIdStr || cleanItemName) {
      try {
        const catalogSaved = localStorage.getItem('bv_sync_products') || localStorage.getItem('admin_products') || localStorage.getItem('bv_seller_products');
        if (catalogSaved) {
          const catalog = JSON.parse(catalogSaved);
          if (Array.isArray(catalog)) {
            const matchedProd = catalog.find(p => {
              const pId = String(p.id || p._id || p.productId || '');
              const pName = String(p.name || '').replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
              return (prodIdStr && pId === prodIdStr) || (cleanItemName && pName && (pName === cleanItemName || cleanItemName.includes(pName) || pName.includes(cleanItemName)));
            });
            if (matchedProd) {
              const pSeller = matchedProd.sellerStoreName || matchedProd.storeName || matchedProd.tradeName || matchedProd.businessName || matchedProd.legalBusinessName || matchedProd.sellerName || matchedProd.vendor || (typeof matchedProd.seller === 'string' ? matchedProd.seller : (matchedProd.seller?.storeName || matchedProd.seller?.name)) || matchedProd.sellerDetails?.storeName;
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
            const matchedSeller = sellersList.find(s => {
              const sId = String(s.id || s._id || s.sellerId || s.phone || '');
              return sId === sellerIdStr || (sellerIdStr.length >= 8 && sId.endsWith(sellerIdStr.slice(-10)));
            });
            if (matchedSeller) {
              const sName = matchedSeller.storeName || matchedSeller.tradeName || matchedSeller.businessName || matchedSeller.legalBusinessName || matchedSeller.storeDetails?.storeName || matchedSeller.name || matchedSeller.sellerName || matchedSeller.legalName || matchedSeller.ownerFullName;
              if (sName && !isPlaceholderName(sName)) return sName;
            }
          }
        }
      } catch (e) {}
    }

    const candidateOrderNames = [
      order?.sellerStoreName,
      order?.storeName,
      order?.sellerDetails?.storeName,
      order?.sellerDetails?.tradeName,
      order?.sellerDetails?.businessName,
      order?.sellerDetails?.sellerName,
      order?.sellerId && typeof order.sellerId === 'object' ? (order.sellerId.storeName || order.sellerId.name || order.sellerId.sellerName) : null,
      order?.sellerName
    ];

    for (const c of candidateOrderNames) {
      if (c && !isPlaceholderName(c)) return c;
    }

    return resolvedSeller.storeName || 'Partner Store';
  };

  // Helper to resolve dynamic seller commission rate
  const getSellerCommissionRate = () => {
    // 1. Order-level saved commission
    if (order.commissionRate !== undefined && order.commissionRate !== null && !isNaN(Number(order.commissionRate))) {
      return Number(order.commissionRate);
    }
    if (order.sellerCommissionRate !== undefined && order.sellerCommissionRate !== null && !isNaN(Number(order.sellerCommissionRate))) {
      return Number(order.sellerCommissionRate);
    }
    if (order.commissionPercentage !== undefined && order.commissionPercentage !== null && !isNaN(Number(order.commissionPercentage))) {
      return Number(order.commissionPercentage);
    }

    // 2. Item-level saved commission
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

    // 3. Embedded seller details on order
    if (order.sellerDetails?.commissionRate !== undefined && order.sellerDetails.commissionRate !== null && !isNaN(Number(order.sellerDetails.commissionRate))) {
      return Number(order.sellerDetails.commissionRate);
    }
    if (order.sellerDetails?.commissionPercentage !== undefined && order.sellerDetails.commissionPercentage !== null && !isNaN(Number(order.sellerDetails.commissionPercentage))) {
      return Number(order.sellerDetails.commissionPercentage);
    }

    // 4. Target seller search
    const targetSellerId = String(firstItem?.sellerId?._id || firstItem?.sellerId || order.sellerId?._id || order.sellerId || '');
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

    // 5. Active seller profile in local storage
    try {
      const activeSellerKeys = ['seller_user_profile', 'bv_seller_user', 'bv_seller_profile', 'bv_seller_reg_data'];
      for (const k of activeSellerKeys) {
        const raw = localStorage.getItem(k);
        if (raw) {
          const s = JSON.parse(raw);
          const rate = s.commissionRate ?? s.commissionPercentage;
          if (rate !== undefined && rate !== null && !isNaN(Number(rate))) {
            return Number(rate);
          }
        }
      }
    } catch (e) {}

    // 6. Platform Global Settings
    try {
      const savedSettings = localStorage.getItem('admin_settings') || localStorage.getItem('platform_settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        const setRate = settings?.defaultCommissionRate ?? settings?.commissionRate;
        if (setRate !== undefined && !isNaN(Number(setRate))) {
          return Number(setRate);
        }
      }
    } catch (e) {}

    return 5;
  };

  const explicitRule = order.settlementRule ||
                       order.settlement?.ruleCode ||
                       (Array.isArray(order.items) && order.items.find(it => it.settlementRule)?.settlementRule);

  const rawPayment = String(order.paymentMethod || '').toUpperCase();
  const isCod = rawPayment.includes('COD') ||
                rawPayment.includes('CASH') ||
                rawPayment.includes('DELIVERY');

  const rawMode = String(order.deliveryMode || order.deliveryType || '').toLowerCase();
  const hasRealThirdPartyCourier = Boolean(
    (order.courierName && order.courierName !== 'N/A' && order.courierName !== 'Delhivery' && order.trackingNumber) ||
    (order.thirdPartyDetails?.courierName && order.thirdPartyDetails?.trackingNumber)
  );
  const isExplicitThirdParty = rawMode.includes('third') && hasRealThirdPartyCourier;
  const isThirdParty = isExplicitThirdParty;
  const isSelf = !isThirdParty;
  // Active Status & Reversal Detection
  const orderOverallStatus = String(order.overallStatus || order.status || '').toLowerCase().trim();
  const returnStatus = String(order.returnRequest?.status || '').toLowerCase().trim();
  const isOrderCancelled = orderOverallStatus.includes('cancel') || Boolean(order.cancelledAt);
  const isOrderRefunded = orderOverallStatus.includes('refund') || returnStatus.includes('refund') || order.settlementStatus === 'refunded';
  const isSettlementReversed = isOrderCancelled || isOrderRefunded;

  // Active Rule Detection across 4 core scenarios
  const isRule4CodCourier = explicitRule === 'COD_THIRD_PARTY_DELIVERY' || (isCod && isThirdParty);
  const isRule3CodSelf = explicitRule === 'COD_SELF_DELIVERY' || (isCod && !isThirdParty);
  const isRule2OnlineCourier = explicitRule === 'ONLINE_THIRD_PARTY_DELIVERY' || (!isCod && isThirdParty);
  const isRule1OnlineSelf = explicitRule === 'ONLINE_SELF_DELIVERY' || (!isCod && !isThirdParty);

  // Portal Commission Rate: Default 10%
  const marketplaceCommissionRate = (isRule3CodSelf || isRule4CodCourier || isRule2OnlineCourier || isRule1OnlineSelf)
    ? 10
    : (order.commissionRate ?? getSellerCommissionRate() ?? 10);

  const marketplaceCommission = isSettlementReversed ? 0 : Math.round((grandTotal * (marketplaceCommissionRate / 100)) * 100) / 100;
  const gstOnCommission = isSettlementReversed ? 0 : Math.round((marketplaceCommission * 0.18) * 100) / 100;
  const tdsAmount = isSettlementReversed ? 0 : Math.round((grandTotal * 0.001) * 100) / 100;

  // Statutory Tax:
  // Rule 3 (COD Self): GST TCS is 0% when portal does not collect customer payment
  // Rule 1, 2, 4: GST TCS is 0.5% (Sec 52) of 'Base Amount' (Taxable Value without GST).
  // सबसे जरूरी कंडीशन: अगर कोई आइटम टैक्स-फ्री है (जैसे किताबें, 0% GST), तो TCS = 0!
  // अगर ऑर्डर कैंसिल या रिफंड है, तो TCS = 0 और TDS = 0 (GST Sec 34 Credit Note)
  const taxableBaseForTcs = itemBreakdowns.reduce((acc, it) => {
    return Number(it.rate || 0) > 0 ? acc + Number(it.taxableVal || 0) : acc;
  }, 0);
  const hasTaxableSupplies = taxableBaseForTcs > 0;

  const cgstTcsRate = (isSettlementReversed || isRule3CodSelf || !hasTaxableSupplies) ? 0 : (isIntraState ? 0.25 : 0);
  const sgstTcsRate = (isSettlementReversed || isRule3CodSelf || !hasTaxableSupplies) ? 0 : (isIntraState ? 0.25 : 0);
  const igstTcsRate = (isSettlementReversed || isRule3CodSelf || !hasTaxableSupplies) ? 0 : (!isIntraState ? 0.5 : 0);

  const cgstTcsAmount = (isSettlementReversed || isRule3CodSelf || !hasTaxableSupplies) ? 0 : (isIntraState ? Math.round(((taxableBaseForTcs * 0.25) / 100) * 100) / 100 : 0);
  const sgstTcsAmount = (isSettlementReversed || isRule3CodSelf || !hasTaxableSupplies) ? 0 : (isIntraState ? Math.round(((taxableBaseForTcs * 0.25) / 100) * 100) / 100 : 0);
  const igstTcsAmount = (isSettlementReversed || isRule3CodSelf || !hasTaxableSupplies) ? 0 : (!isIntraState ? Math.round(((taxableBaseForTcs * 0.5) / 100) * 100) / 100 : 0);
  const gstTcsAmount = (isSettlementReversed || isRule3CodSelf || !hasTaxableSupplies) ? 0 : Math.round((cgstTcsAmount + sgstTcsAmount + igstTcsAmount) * 100) / 100;

  // Delivery Charges + 18% GST (Rule 2 & Rule 4: Third-Party Delivery)
  // "₹400 से अधिक के ऑर्डर पर: यदि डिलीवरी का खर्च एडमिन उठाता है, तो सेलर से डिलीवरी चार्ज और उसका GST नहीं काटना है।"
  // "डिलीवरी का खर्च और उस पर GST तभी काटें, जब यह खर्च सेलर के जिम्मे हो।"
  const isAbove400 = grandTotal > 400;
  const isDeliveryExemptedForSeller = isAbove400;
  let deliveryChargeAmount = 0;
  let gstOnDeliveryAmount = 0;
  let totalDeliveryDeduction = 0;

  if (!isSettlementReversed && isThirdParty && !isDeliveryExemptedForSeller) {
    deliveryChargeAmount = Number(order.deliveryCharge ?? order.shippingAmount ?? order.shippingCost ?? 40);
    gstOnDeliveryAmount = Math.round(((deliveryChargeAmount * shippingGstRate) / 100) * 100) / 100;
    totalDeliveryDeduction = Math.round((deliveryChargeAmount + gstOnDeliveryAmount) * 100) / 100;
  }

  const statutoryDeductions = isSettlementReversed ? 0 : Math.round((marketplaceCommission + gstOnCommission + tdsAmount + gstTcsAmount) * 100) / 100;
  const totalDeductions = isSettlementReversed ? 0 : Math.round((statutoryDeductions + totalDeliveryDeduction) * 100) / 100;

  // Final Settlement:
  // If cancelled or refunded, net settlement to seller is strictly ₹0.00
  // Rule 3 (COD Self): Customer paid cash to seller directly. Portal pays ₹0.
  // Settlement is Negative (-totalDeductions) to be deposited/adjusted.
  // Rule 1, 2, 4 (Courier / Online): Portal holds the funds (courier remits cash to portal in Rule 4).
  // Settlement is Positive (Gross - totalDeductions) payable to seller.
  const sellerSettlement = isSettlementReversed
    ? 0
    : (isRule3CodSelf
      ? -totalDeductions
      : Math.max(0, Math.round((grandTotal - totalDeductions) * 100) / 100));

  const sellerPayout = sellerSettlement;

  // Logistics tracking resolution: strictly visible when product is Out for Delivery & partner decided
  const logisticsStatus = String(order.overallStatus || order.status || '').toLowerCase().replace(/_/g, ' ');
  const isOut = logisticsStatus === 'out for delivery' || logisticsStatus === 'delivered';
  const hasPartner = isSelf || isThirdParty || Boolean(order.courierName || order.selfDeliveryDetails?.deliveryPersonName);

  const hasTracking = isOut && hasPartner && Boolean(order.trackingNumber || order.selfDeliveryDetails?.deliveryPartnerToken || order.thirdPartyDetails?.trackingNumber);

  const deliveryPartnerDisplay = isThirdParty
    ? (order.courierName || order.thirdPartyDetails?.courierName || '3rd-Party Logistics Carrier')
    : (order.selfDeliveryDetails?.deliveryPersonName ? `Direct Self-Delivery (Rider: ${order.selfDeliveryDetails.deliveryPersonName})` : 'Direct Self-Delivery (Store Fleet)');

  const trackingNumberDisplay = isThirdParty
    ? (order.trackingNumber || order.thirdPartyDetails?.trackingNumber || '')
    : (order.selfDeliveryDetails?.deliveryPartnerToken || order.trackingNumber || '');

  const trackingLinkDisplay = isThirdParty
    ? (order.trackingUrl || order.thirdPartyDetails?.trackingUrl || '')
    : (order.selfDeliveryDetails?.trackingUrl || order.trackingUrl || '');

  const handleDownloadPDF = async () => {
    if (!confirmed) {
      alert('⚠️ Tax Invoice & Certificate is generated only when an order is confirmed strictly.');
      return;
    }
    try {
      setIsDownloading(true);
      const token = localStorage.getItem('bv_admin_jwt_token') || localStorage.getItem('token') || localStorage.getItem('bv_seller_jwt_token');
      const rawId = order.id || order.orderId || order._id || '';
      const orderIdentifier = String(rawId).replace(/^#/, '').trim();
      const res = await fetch(`${SERVER_URL}/orders/${orderIdentifier}/invoice`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Invoice_${orderIdentifier}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        return;
      }
      throw new Error(`Server returned status ${res.status}`);
    } catch (err) {
      console.warn('Backend PDF endpoint unavailable, opening pristine print-to-PDF view:', err);
      handlePrint();
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    if (!confirmed) {
      alert('⚠️ Tax Invoice & Certificate is generated only when an order is confirmed strictly.');
      return;
    }

    const printContent = document.getElementById('printableTaxInvoiceArea');
    if (!printContent) {
      window.print();
      return;
    }

    let iframe = document.getElementById('admin-invoice-print-iframe');
    if (iframe) {
      iframe.remove();
    }
    iframe = document.createElement('iframe');
    iframe.id = 'admin-invoice-print-iframe';
    // Position offscreen with full opacity and size so Chromium compositor fully layouts and paints it
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = '1024px';
    iframe.style.height = '1400px';
    iframe.style.border = '0';
    iframe.style.opacity = '1';
    iframe.style.zIndex = '9999';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();

    const styleSheets = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(el => {
        if (el.tagName === 'STYLE' && el.innerHTML.includes('body * { visibility: hidden')) {
          const cleaned = el.innerHTML.replace(/body\s*\*\s*\{\s*visibility:\s*hidden\s*!important;\s*\}/g, '');
          return `<style>${cleaned}</style>`;
        }
        return el.outerHTML;
      })
      .join('\n');

    const rawId = order.id || order.orderId || order._id || 'ORDER';
    const cleanId = String(rawId).replace(/^#/, '').trim();

    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice_${cleanId}</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          ${styleSheets}
          <style>
            @page {
              size: A4 portrait;
              margin: 6mm 8mm;
            }
            * {
              box-sizing: border-box !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #0f172a !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
            }
            #printableTaxInvoiceArea {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 auto !important;
              padding: 4mm 6mm !important;
              background: #ffffff !important;
              display: block !important;
              visibility: visible !important;
            }
            #printableTaxInvoiceArea, #printableTaxInvoiceArea * {
              visibility: visible !important;
              opacity: 1 !important;
            }
            table {
              width: 100% !important;
              border-collapse: collapse !important;
            }
            @media print {
              body {
                background: #ffffff !important;
              }
              #printableTaxInvoiceArea {
                padding: 0 !important;
                margin: 0 !important;
              }
            }
          </style>
        </head>
        <body class="p-2 sm:p-4 bg-white">
          <div id="printableTaxInvoiceArea">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) {
        console.error('Print iframe error:', e);
        window.print();
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
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
            <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Lock size={28} />
            </div>
            <div>
              <h4 className="font-display font-extrabold text-lg text-gray-900">Tax Invoice Generation Locked</h4>
              <p className="text-xs text-gray-600 max-w-md mx-auto mt-1 leading-relaxed">
                Official Tax Invoice will be generated automatically once the order status is confirmed.
              </p>
            </div>
            <div className="inline-flex flex-col items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold px-5 py-2.5 rounded-xl shadow-2xs">
              <div>
                Current Order Status: <span className="uppercase font-black text-amber-950">{order.overallStatus || order.status || 'Pending Confirmation'}</span>
              </div>
              <p className="text-[10px] text-amber-700/90 font-medium">
                (Payment status does not block invoice generation. Once the order is confirmed, the invoice is generated automatically.)
              </p>
            </div>
          </div>
        ) : (

        /* Invoice Sheet Body */
        <div id="printableTaxInvoiceArea" className="p-6 sm:p-8 space-y-6 overflow-y-auto print:overflow-visible print:p-0">
          
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

          {/* Itemized Table with Product-Level Seller & GST Applied Breakdown */}
          <div className="border border-gray-200 rounded-xl overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse min-w-[660px]">
              <thead>
                <tr className="bg-gray-100 text-gray-700 border-b border-gray-200 font-extrabold uppercase text-[10px]">
                  <th className="py-2.5 px-3 min-w-[140px]">Item Details</th>
                  <th className="py-2.5 px-3 min-w-[110px]">Sold By (Seller)</th>
                  <th className="py-2.5 px-2 text-center w-10">Qty</th>
                  <th className="py-2.5 px-2.5 text-right w-20">Unit Price</th>
                  <th className="py-2.5 px-2.5 text-right w-22">Taxable Val</th>
                  <th className="py-2.5 px-3 text-right min-w-[130px]">Taxes</th>
                  <th className="py-2.5 px-3 text-right w-24 pr-3.5">Total Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {itemBreakdowns.map((item, idx) => {
                  const sellerName = getItemSellerName(item);
                  const itemCgst = item.rate > 0 && isIntraState ? Math.round((item.taxAmt / 2) * 100) / 100 : 0;
                  const itemSgst = item.rate > 0 && isIntraState ? Math.round((item.taxAmt - itemCgst) * 100) / 100 : 0;
                  const itemIgst = item.rate > 0 && !isIntraState ? item.taxAmt : 0;
                  const displayTotal = item.itemDiscount > 0 ? item.netItemPayable : item.grossPrice;

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
                        {item.rate > 0 ? (
                          isIntraState ? (
                            <div className="space-y-1 text-right font-mono text-[10px]">
                              <div className="flex justify-end items-center gap-2 whitespace-nowrap">
                                <span className="text-gray-500 font-sans">SGST @{(item.rate / 2)}%:</span>
                                <span className="font-semibold text-gray-800 min-w-[48px] text-right">₹{itemSgst.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-end items-center gap-2 whitespace-nowrap">
                                <span className="text-gray-500 font-sans">CGST @{(item.rate / 2)}%:</span>
                                <span className="font-semibold text-gray-800 min-w-[48px] text-right">₹{itemCgst.toFixed(2)}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-end items-center gap-2 text-right font-mono text-[10px] whitespace-nowrap">
                              <span className="text-gray-500 font-sans">IGST @{item.rate}%:</span>
                              <span className="font-semibold text-gray-800 min-w-[48px] text-right">₹{itemIgst.toFixed(2)}</span>
                            </div>
                          )
                        ) : (
                          <div className="text-right whitespace-nowrap">
                            <span className="text-gray-500 font-semibold text-[10px] block">0% GST</span>
                            <span className="text-[9px] text-gray-400 block font-mono">₹0.00 (Exempt)</span>
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-gray-900 font-mono whitespace-nowrap pr-3.5">
                        ₹{displayTotal.toFixed(2)}
                        {item.itemDiscount > 0 && (
                          <span className="block text-[9px] text-emerald-600 font-normal font-sans">(-₹{item.itemDiscount.toFixed(2)} off)</span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {/* Dedicated Delivery Charges Line Item */}
                {shippingCost > 0 && (
                  <tr className="hover:bg-gray-50/50 bg-teal-50/15">
                    <td className="py-2.5 px-3">
                      <p className="font-bold text-gray-900">Delivery &amp; Shipping Charges</p>
                      <p className="text-[10px] text-gray-400">Logistics &amp; Freight Services (SAC 9968)</p>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-[11px] border border-gray-200 block truncate max-w-[130px]" title={resolvedSeller.storeName}>
                        {resolvedSeller.storeName}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-gray-400">NA</td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-700">₹{shippingCost.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-600">₹{shippingTaxable.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right">
                      {shippingGstRate > 0 && shippingTax > 0 ? (
                        isIntraState ? (
                          <div className="space-y-1 text-right font-mono text-[10px]">
                            <div className="flex justify-end items-center gap-2 whitespace-nowrap">
                              <span className="text-gray-500 font-sans">SGST @{(shippingGstRate / 2)}%:</span>
                              <span className="font-semibold text-gray-800 min-w-[48px] text-right">₹{shippingSgst.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-end items-center gap-2 whitespace-nowrap">
                              <span className="text-gray-500 font-sans">CGST @{(shippingGstRate / 2)}%:</span>
                              <span className="font-semibold text-gray-800 min-w-[48px] text-right">₹{shippingCgst.toFixed(2)}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-end items-center gap-2 text-right font-mono text-[10px] whitespace-nowrap">
                            <span className="text-gray-500 font-sans">IGST @{shippingGstRate}%:</span>
                            <span className="font-semibold text-gray-800 min-w-[48px] text-right">₹{shippingIgst.toFixed(2)}</span>
                          </div>
                        )
                      ) : (
                        <div className="text-right whitespace-nowrap">
                          <span className="text-gray-500 font-semibold text-[10px] block">0% GST</span>
                          <span className="text-[9px] text-gray-400 block font-mono">₹0.00 (Exempt)</span>
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-gray-900 font-mono whitespace-nowrap pr-3.5">₹{shippingCost.toFixed(2)}</td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-gray-100/95 font-bold border-t-2 border-gray-300">
                <tr>
                  <td colSpan={4} className="py-2.5 px-3 text-right font-black uppercase text-[10px] text-gray-700 tracking-wider">
                    Total / Order Payable:
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900 text-xs">
                    ₹{taxableValue.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    {taxAmount > 0 ? (
                      isIntraState ? (
                        <div className="space-y-1 text-right text-[10px]">
                          <div className="flex justify-end items-center gap-2 whitespace-nowrap">
                            <span className="text-gray-500 font-sans">SGST:</span>
                            <span className="font-bold text-brand-teal min-w-[48px] text-right">₹{sgstAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-end items-center gap-2 whitespace-nowrap">
                            <span className="text-gray-500 font-sans">CGST:</span>
                            <span className="font-bold text-brand-teal min-w-[48px] text-right">₹{cgstAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-end items-center gap-2 font-black text-brand-teal border-t border-gray-300 pt-0.5 whitespace-nowrap">
                            <span className="text-gray-400 font-normal font-sans text-[9px]">Total Tax:</span>
                            <span className="min-w-[48px] text-right">₹{taxAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1 text-right text-[10px]">
                          <div className="flex justify-end items-center gap-2 whitespace-nowrap">
                            <span className="text-gray-500 font-sans">IGST:</span>
                            <span className="font-bold text-brand-teal min-w-[48px] text-right">₹{igstAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-end items-center gap-2 font-black text-brand-teal border-t border-gray-300 pt-0.5 whitespace-nowrap">
                            <span className="text-gray-400 font-normal font-sans text-[9px]">Total Tax:</span>
                            <span className="min-w-[48px] text-right">₹{taxAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      )
                    ) : (
                      <span className="text-gray-500 text-[11px]">₹0.00</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-base font-black text-gray-900 whitespace-nowrap pr-3.5">
                    ₹{grandTotal.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Financial Settlement & Statutory Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-[10px] text-amber-950 uppercase tracking-wider flex items-center gap-1">
                  <DollarSign size={13} /> Marketplace Commission &amp; Settlement
                </h4>
                {isSettlementReversed ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 shadow-xs flex items-center gap-1">
                    GST Sec 34: Settlement &amp; Taxes Reversed (₹0.00)
                  </span>
                ) : isRule3CodSelf ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 shadow-xs flex items-center gap-1">
                    Rule 3: COD + Self Delivery (Cash)
                  </span>
                ) : isRule4CodCourier ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-300 shadow-xs flex items-center gap-1">
                    Rule 4: COD + 3rd-Party Delivery
                  </span>
                ) : isRule2OnlineCourier ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                    Rule 2: Online + 3rd-Party Delivery
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-300">
                    Rule 1: Online + Self Delivery
                  </span>
                )}
              </div>

              <div className="flex justify-between text-gray-700">
                <span>{isSettlementReversed ? 'Original Order Grand Total:' : (isRule3CodSelf ? 'Cash Collected by Seller:' : (isRule4CodCourier ? 'Cash via Courier Remittance:' : 'Order Grand Total:'))}</span>
                <span className="font-mono font-bold">₹{grandTotal.toFixed(2)}{isSettlementReversed ? ' (Reversed)' : ''}</span>
              </div>
              <div className="flex justify-between text-amber-900 font-medium">
                <span>Commission ({marketplaceCommissionRate}%):</span>
                <span className="font-mono">{isSettlementReversed ? '₹0.00 (Waived)' : `-₹${marketplaceCommission.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-indigo-900 font-medium">
                <span>GST on Commission (18%):</span>
                <span className="font-mono">{isSettlementReversed ? '₹0.00 (Waived)' : `-₹${gstOnCommission.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-purple-900 font-medium">
                <span>TDS 0.1% (Sec 194-O):</span>
                <span className="font-mono">{isSettlementReversed ? '₹0.00 (Reversed)' : `-₹${tdsAmount.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-sky-900 font-medium">
                <span>
                  GST TCS (Sec 52):
                  {isSettlementReversed ? (
                    <span className="text-[9px] text-rose-700 font-bold ml-1">₹0.00 (Sec 34 Reversal)</span>
                  ) : isRule3CodSelf ? (
                    <span className="text-[9px] text-gray-500 font-normal ml-1">0% (Exempt on COD Self)</span>
                  ) : !hasTaxableSupplies ? (
                    <span className="text-[9px] text-emerald-700 font-bold ml-1">₹0.00 (0% GST / Books Tax-Free)</span>
                  ) : isIntraState ? (
                    <span className="text-[9px] text-sky-700 font-normal ml-1">0.5% on Base ₹{taxableBaseForTcs.toFixed(2)} (0.25% CGST + 0.25% SGST)</span>
                  ) : (
                    <span className="text-[9px] text-indigo-700 font-normal ml-1">0.5% on Base ₹{taxableBaseForTcs.toFixed(2)} (IGST)</span>
                  )}
                </span>
                <span className="font-mono">{isSettlementReversed ? '₹0.00 (Reversed)' : (gstTcsAmount > 0 ? `-₹${gstTcsAmount.toFixed(2)}` : '₹0.00')}</span>
              </div>

              {/* Delivery charge deduction for Rule 2 & Rule 4 */}
              {isThirdParty && (
                <div className="flex justify-between text-rose-900 font-medium">
                  <span>Delivery Charges (Policy):</span>
                  {isSettlementReversed ? (
                    <span className="font-mono text-teal-700 font-bold">₹0.00 (Waived)</span>
                  ) : totalDeliveryDeduction > 0 ? (
                    <span className="font-mono text-rose-700">-₹{totalDeliveryDeduction.toFixed(2)} (₹{deliveryChargeAmount.toFixed(2)} + ₹{gstOnDeliveryAmount.toFixed(2)} GST {shippingGstRate}%)</span>
                  ) : (
                    <span className="font-mono text-teal-700 font-bold">FREE (Admin Absorbs &gt;₹400)</span>
                  )}
                </div>
              )}

              {isSettlementReversed ? (
                <div className="flex justify-between text-rose-700 font-black border-t border-rose-300 pt-1">
                  <div>
                    <span>Pending Seller Settlement:</span>
                    <span className="text-[9px] text-rose-600 block font-normal">Reversed under GST Section 34 Credit Note</span>
                  </div>
                  <span className="font-mono text-sm font-black text-rose-800">₹0.00 (Reversed)</span>
                </div>
              ) : isRule3CodSelf ? (
                <div className="flex justify-between text-rose-700 font-black border-t border-rose-200 pt-1">
                  <div>
                    <span>Final Settlement (Owed to Portal):</span>
                    <span className="text-[9px] text-rose-600 block font-normal">Adjusted from subsequent payouts</span>
                  </div>
                  <span className="font-mono text-xs font-extrabold">-₹{Math.abs(sellerSettlement).toFixed(2)}</span>
                </div>
              ) : (
                <div className="flex justify-between text-emerald-800 font-black border-t border-amber-300 pt-1">
                  <span>Net Payable to Seller:</span>
                  <span className="font-mono">₹{sellerSettlement.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Place of Supply & Statutory Metadata (Replaces redundant Price & Tax Breakdown card) */}
            <div className="bg-gray-50/90 p-3.5 rounded-xl border border-gray-200 space-y-2.5 text-[11px] flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-2 gap-1.5">
                  <span className="font-extrabold text-[10px] text-gray-700 uppercase tracking-wider flex items-center gap-1 shrink-0">
                    <ShieldCheck size={13} className="text-emerald-700" /> Place of Supply &amp; Tax Meta
                  </span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border w-fit shrink-0 ${
                    isIntraState 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  }`}>
                    {isIntraState ? `Intra-State (${customerStateInfo.name})` : `Inter-State (${sellerStateInfo.name} ➔ ${customerStateInfo.name})`}
                  </span>
                </div>

                <div className="space-y-1.5 text-gray-600">
                  <div className="flex justify-between items-center">
                    <span>Payment Mode:</span>
                    <strong className="text-gray-900 font-sans">{order.paymentMethod || 'Cash on Delivery (COD)'} ({order.paymentStatus || 'Pending'})</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Tax on Reverse Charge (RCM):</span>
                    <strong className="text-gray-900 font-sans">No (Exempt B2C Supply)</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>GST Supply Nature:</span>
                    <strong className="text-gray-900 font-sans">{shippingGstRate > 0 ? `Composite Supply (${shippingGstRate}% GST)` : 'Exempt Supply (0% GST)'}</strong>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-2.5 border border-gray-200 mt-2">
                  <span className="text-[10px] uppercase font-black text-gray-400 block tracking-wider">
                    Gross Order Amount in Words
                  </span>
                  <p className="font-bold text-gray-900 text-xs italic mt-0.5">
                    {numberToWords(grandTotal)}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200 text-[10px] text-gray-400 leading-relaxed italic">
                • Computer-generated official tax invoice under Section 31 of CGST Act, 2017. Does not require physical signature.
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 pt-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-500">
            <div>
              <p className="font-semibold text-gray-700">Book Vardi Customer Support & Help Desk</p>
              <p className="text-[10px] text-gray-400">Official Student & School Marketplace • support@bookvardi.com</p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Authorized Signatory</span>
              <span className="font-bold text-gray-900 text-xs block">{resolvedSeller.storeName}</span>
              <span className="text-[10px] font-mono text-gray-500 block">GSTIN: {resolvedSeller.gstNumber || 'Exempt / N/A'}</span>
            </div>
          </div>

        </div>
        )}
      </div>
    </div>
  );
}
