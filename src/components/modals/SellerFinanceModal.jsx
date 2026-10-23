import React, { useState, useMemo , useEffect  } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Store, 
  Landmark, 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Search, 
  ShieldCheck, 
  Building, 
  Eye, 
  EyeOff, 
  Banknote, 
  QrCode, 
  ArrowUpRight, 
  ArrowDownLeft, 
  AlertCircle, 
  Percent, 
  Tag, 
  Package, 
  User, 
  MapPin, 
  Phone, 
  Mail,
  Receipt
} from 'lucide-react';
import { downloadSellerFinancialStatementPdfApi, fetchAdminOrdersApi } from '../../utils/api';
import { useAdminData } from '../../context/AdminDataContext';

export default function SellerFinanceModal({ 
  isOpen, 
  onClose, 
  seller, 
  orders: propOrders = [], 
  onReleasePayout, 
  onOpenInvoice,
  isEditor = true 
}) {
  if (!isOpen || !seller) return null;

  const adminCtx = useAdminData ? useAdminData() : {};
  const [internalOrders, setInternalOrders] = useState([]);

  // Fetch orders from API if neither propOrders nor admin context orders are ready
  useEffect(() => {
    if ((!propOrders || propOrders.length === 0) && (!adminCtx?.orders || adminCtx.orders.length === 0)) {
      fetchAdminOrdersApi().then(data => {
        if (Array.isArray(data)) setInternalOrders(data);
      }).catch(() => {});
    }
  }, [propOrders, adminCtx?.orders]);

  const effectiveOrders = (propOrders && propOrders.length > 0)
    ? propOrders
    : ((adminCtx?.orders && adminCtx.orders.length > 0) ? adminCtx.orders : internalOrders);

  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'upi' | 'cod' | 'delivered' | 'cancelled'
  const [activeRuleTab, setActiveRuleTab] = useState('rule2'); // 'rule1' | 'rule2' | 'rule3' | 'rule4' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [isMasked, setIsMasked] = useState(true);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [disburseSuccess, setDisburseSuccess] = useState('');

  const sellerId = String(seller._id || seller.id || seller.sellerId || '').trim();
  const storeName = seller.storeName || seller.rawApplication?.storeName || seller.businessName || seller.name || 'Vendor Store';
  const sellerStoreName = storeName.toLowerCase().trim();
  const ownerName = seller.ownerDetails?.ownerFullName || seller.ownerName || seller.name || 'Vendor Owner';
  const legalName = seller.legalBusinessName || seller.businessName || storeName;
  const gstin = seller.gstNumber || seller.gstin || 'GST Exempt / N/A';
  const pan = seller.documents?.panNumber || seller.ownerDetails?.ownerPan || seller.pan || 'N/A';
  const phone = seller.phone || seller.ownerPhone || 'N/A';
  const email = seller.email || 'N/A';
  const city = seller.city || 'N/A';
  const state = seller.state || 'N/A';
  const address = seller.address || `${city}, ${state}`;

  const bank = seller.bankDetails || {};
  const bankName = bank.bankName || bank.bank || 'HDFC Bank';
  const acctNum = bank.accountNumber || bank.account || '•••• •••• 0000';
  const ifsc = bank.ifscCode || bank.ifsc || 'HDFC0001';
  const acctHolder = bank.accountHolderName || bank.holderName || ownerName;
  const acctType = bank.accountType || 'Current / Savings Account';
  const branch = bank.branchName || bank.branch || `${city} Main Branch`;

  const commissionRate = Number(seller.commissionRate ?? seller.commissionPercentage ?? 10);

  // Filter orders and extract items belonging strictly to this seller
  const sellerOrders = useMemo(() => {
    const list = [];
    effectiveOrders.forEach(order => {
      const itemsList = Array.isArray(order.items) ? order.items : [];
      const ordStore = String(order.storeName || order.sellerStoreName || '').toLowerCase().trim();
      const ordSellerId = String(order.sellerId?._id || order.sellerId || '').trim();

      const matchingItems = itemsList.filter(item => {
        const itemSellerId = String(item.sellerId?._id || item.sellerId || '').trim();
        const itemStore = String(item.storeName || item.sellerStoreName || '').toLowerCase().trim();
        
        const idMatches = Boolean(sellerId && (itemSellerId === sellerId || ordSellerId === sellerId));
        const storeMatches = Boolean(sellerStoreName && (itemStore === sellerStoreName || ordStore === sellerStoreName));
        return idMatches || storeMatches;
      });

      // If matching items found, or the top order matches
      const isOrderMatch = matchingItems.length > 0 || (sellerId && ordSellerId === sellerId) || (sellerStoreName && ordStore === sellerStoreName);

      if (isOrderMatch) {
        const relevantItems = matchingItems.length > 0 ? matchingItems : itemsList;
        const computedSubtotal = relevantItems.reduce((sum, it) => {
          const price = Number(it.finalPrice || it.price || 0);
          const qty = Number(it.quantity || 1);
          return sum + (Number(it.total) || (price * qty));
        }, 0);

        const isCod = String(order.paymentMethod || '').toUpperCase().includes('COD');
        const paymentLabel = isCod ? 'COD (Cash on Delivery)' : 'UPI / Online (Prepaid)';

        // Product GST breakdown (5% statutory rate standard for uniform/educational kits)
        const computedGst = relevantItems.reduce((acc, it) => {
          const lineVal = (Number(it.finalPrice || it.price || 0) * Number(it.quantity || 1));
          const explicitGst = it.gstPercent ?? it.gstPercentage ?? it.gstRate ?? it.gst ?? 5;
          const rate = !isNaN(Number(explicitGst)) ? Number(explicitGst) : 5;
          const taxableVal = lineVal / (1 + rate / 100);
          return acc + (lineVal - taxableVal);
        }, 0);

        const effectiveTotal = computedSubtotal > 0 ? computedSubtotal : Number(order.totalAmount || order.total || 0);
        const ordRate = Number(commissionRate ?? order.commissionRate ?? 10);

        // Determine delivery mode and Rule 2 applicability
        const rawDeliveryMode = String(order.deliveryMode || order.deliveryType || '').toLowerCase();
        const hasCourier = Boolean(order.courierName && order.courierName !== 'N/A' && order.courierName !== '');
        const isThirdParty = order.isThirdParty === true || 
                             rawDeliveryMode.includes('third') || 
                             rawDeliveryMode.includes('courier') || 
                             (hasCourier && !rawDeliveryMode.includes('self')) ||
                             relevantItems.some(it => String(it.deliveryType || '').toLowerCase().includes('third') || Boolean(it.thirdPartyDetails?.courierName));

        const ordTotalVal = Number(order.totalAmount || order.total || effectiveTotal);
        const orderThreshold = Number(order.freeDeliveryThreshold ?? order.minOrderFreeShipping ?? 401);
        const isAbove400 = ordTotalVal >= orderThreshold;

        const customerShippingFee = Number(order.shippingFee ?? order.shippingCost ?? order.shippingAmount ?? 0);
        let deliveryChargeBorneBy = order.deliveryChargeBorneBy;
        if (!deliveryChargeBorneBy || customerShippingFee > 0) {
          if (isAbove400) {
            deliveryChargeBorneBy = 'admin';
          } else if (customerShippingFee > 0) {
            deliveryChargeBorneBy = 'customer';
          } else if (order.isDeliveryBorneBySeller || order.deliveryBorneBy === 'seller') {
            deliveryChargeBorneBy = 'seller';
          } else {
            deliveryChargeBorneBy = isThirdParty ? 'seller' : 'admin';
          }
        }

        // Check active settlement scenario
        const isRule3 = isCod && !isThirdParty;
        const isRule4 = isCod && isThirdParty;

        // Check if items already have calculated settlement from backend matching current commission
        const itemCommRateMismatched = Boolean(commissionRate && relevantItems.some(it => it.commissionRate !== undefined && it.commissionRate !== null && Number(it.commissionRate) !== commissionRate));
        const hasItemSettlement = !itemCommRateMismatched && relevantItems.some(it => it.commissionAmount !== undefined || it.netSettlementAmount !== undefined);
        let portalCommission = 0;
        let gstOnCommission = 0;
        let tdsAmount = 0;
        let gstTcsAmount = 0;
        let deliveryChargeAmount = 0;
        let gstOnDeliveryAmount = 0;
        let totalDeliveryDeduction = 0;
        let totalDeductions = 0;
        let finalSellerSettlement = 0;

        if (hasItemSettlement) {
          relevantItems.forEach(it => {
            const itComm = Number(it.commissionAmount || 0);
            const itGst = Number(it.gstOnCommissionAmount || (itComm * 0.18) || 0);
            const itTds = Number(it.tdsAmount || 0);
            const itTcs = Number(it.gstTcsAmount || 0);
            const itDeliv = Number(it.deliveryChargeAmount || 0);
            const itDelivGst = Number(it.gstOnDeliveryAmount || 0);
            const itDelivTotal = Number(it.totalDeliveryDeduction || (itDeliv + itDelivGst) || 0);
            const itDed = Number(it.totalDeductions || (itComm + itGst + itTds + itTcs + itDelivTotal) || 0);
            const itGross = Number(it.total) || Math.round(((Number(it.finalPrice || it.price || 0)) * (Number(it.quantity) || 1)) * 100) / 100;
            let itNet = Number(it.netSettlementAmount !== undefined ? it.netSettlementAmount : (isRule3 ? -itDed : (itGross - itDed)));
            // Safety: if order is Rule 4 Courier or Rule 1/2 Online (not Rule 3 COD Self), settlement can never be negative
            if (!isRule3 && itNet < 0) {
              itNet = Math.max(0, Math.round((itGross - itDed) * 100) / 100);
            } else if (isRule3 && itNet > 0) {
              itNet = Math.round(-itDed * 100) / 100;
            }

            portalCommission += itComm;
            gstOnCommission += itGst;
            tdsAmount += itTds;
            gstTcsAmount += itTcs;
            deliveryChargeAmount += itDeliv;
            gstOnDeliveryAmount += itDelivGst;
            totalDeliveryDeduction += itDelivTotal;
            totalDeductions += itDed;
            finalSellerSettlement += itNet;
          });
        } else {
          // Dynamic calculation according to Rule 1, Rule 2, Rule 3 & Rule 4
          portalCommission = Math.round(effectiveTotal * (ordRate / 100) * 100) / 100;
          gstOnCommission = Math.round(portalCommission * 0.18 * 100) / 100;
          tdsAmount = Math.round(effectiveTotal * 0.001 * 100) / 100;
          
          // Rule 3: 0% GST TCS when portal does not collect customer cash
          gstTcsAmount = isRule3 ? 0 : Math.round(effectiveTotal * 0.005 * 100) / 100;

          // Rule 2 & Rule 4: Delivery Charges (only if 3rd party, seller-borne, and order < threshold)
          if (isThirdParty && deliveryChargeBorneBy === 'seller' && !isAbove400) {
            const rawDeliveryFee = Math.max(0, Number(order.deliveryCharge ?? order.shippingAmount ?? order.shippingFee ?? order.shippingCost ?? 49));
            // Delivery charges are GST INCLUSIVE
            totalDeliveryDeduction = Math.round(rawDeliveryFee * 100) / 100;
            const itemRates = relevantItems.map(it => {
              const cat = String(it.category || '').toLowerCase();
              const isBook = cat.includes('book') || cat.includes('textbook') || String(it.name || '').toLowerCase().includes('book');
              return Number(it.gstPercent ?? it.gstPercentage ?? it.gstRate ?? it.gst ?? (isBook ? 0 : 5));
            }).filter(r => !isNaN(r));
            const ordProdGstRate = itemRates.length > 0 ? Math.max(...itemRates) : 5;
            deliveryChargeAmount = Math.round((totalDeliveryDeduction / (1 + (ordProdGstRate / 100))) * 100) / 100;
            gstOnDeliveryAmount = Math.round((totalDeliveryDeduction - deliveryChargeAmount) * 100) / 100;
          }

          totalDeductions = Math.round((portalCommission + gstOnCommission + tdsAmount + gstTcsAmount + totalDeliveryDeduction) * 100) / 100;

          // Rule 3: Customer pays seller directly. Seller owes portal deductions (-totalDeductions).
          // Rule 1, 2 & 4: Portal collected cash (online or via courier remittance) and pays seller (effectiveTotal - totalDeductions).
          finalSellerSettlement = isRule3
            ? Math.round(-totalDeductions * 100) / 100
            : Math.max(0, Math.round((effectiveTotal - totalDeductions) * 100) / 100);
        }

        const platformCutAmount = portalCommission;
        const netSellerShare = finalSellerSettlement;

        const statusRaw = String(order.overallStatus || order.status || 'Pending').trim().toLowerCase();
        const retReqStatus = String(order.returnRequest?.status || '').toLowerCase().trim();
        const isCancelled = statusRaw.includes('cancel');
        const isDelivered = statusRaw.includes('delivered');
        const isExchanged = statusRaw === 'exchanged' || retReqStatus === 'exchanged';
        const isRefunded = ['refunded', 'refund_completed', 'refund_processed'].includes(statusRaw) || 
                           ['refunded', 'refund_completed', 'refund_processed'].includes(retReqStatus);

        // Calculate maturity & settlement due date
        let isMatured = false;
        let daysRemaining = null;
        let settlementDueDate = null;
        let returnWindowDays = 0;
        let holdingDays = 0;

        if (isRefunded) {
          isMatured = false;
          daysRemaining = null;
          settlementDueDate = null;
        } else if (isExchanged) {
          const exchangeDateRaw = order.exchangedAt || order.returnRequest?.exchangedAt || order.updatedAt || order.createdAt;
          const exchangeDate = exchangeDateRaw ? new Date(exchangeDateRaw) : new Date();
          // Strictly 1 day after exchange date
          settlementDueDate = order.settlementDueDate ? new Date(order.settlementDueDate) : new Date(exchangeDate.getTime() + 1 * 24 * 60 * 60 * 1000);
          holdingDays = 1;
          returnWindowDays = 0;
          isMatured = Boolean(order.isSettlementMatured || (Date.now() >= settlementDueDate.getTime()));
          daysRemaining = Math.max(0, Math.ceil((settlementDueDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
        } else if (isDelivered) {
          const isNonReturnable = order.isReturnable === false || String(order.returnPolicy || '').toLowerCase().includes('non_returnable');
          const isNonExchangeable = order.isExchangeable === false || String(order.returnPolicy || '').toLowerCase().includes('non_exchangeable');
          returnWindowDays = (isNonReturnable && isNonExchangeable) ? 0 : Number(relevantItems[0]?.returnWindowDays || order.returnWindowDays || 7);
          holdingDays = returnWindowDays + 1; // Return window + 1 buffer day
          const deliveredDate = order.deliveredAt ? new Date(order.deliveredAt) : (order.updatedAt ? new Date(order.updatedAt) : new Date(order.createdAt || Date.now()));
          settlementDueDate = order.settlementDueDate ? new Date(order.settlementDueDate) : new Date(deliveredDate.getTime() + holdingDays * 24 * 60 * 60 * 1000);
          isMatured = Boolean(order.isSettlementMatured || (Date.now() >= settlementDueDate.getTime()));
          daysRemaining = Math.max(0, Math.ceil((settlementDueDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
        }

        list.push({
          ...order,
          orderId: order.orderId || order.id || String(order._id || ''),
          sellerItems: relevantItems,
          relevantItems,
          itemsCount: relevantItems.length,
          sellerSubtotal: effectiveTotal,
          effectiveTotal,
          commissionRate: ordRate,
          platformCutAmount,
          portalCommission: Math.round(portalCommission * 100) / 100,
          gstOnCommission: Math.round(gstOnCommission * 100) / 100,
          tdsAmount: Math.round(tdsAmount * 100) / 100,
          gstTcsAmount: Math.round(gstTcsAmount * 100) / 100,
          deliveryChargeAmount: Math.round(deliveryChargeAmount * 100) / 100,
          gstOnDeliveryAmount: Math.round(gstOnDeliveryAmount * 100) / 100,
          totalDeliveryDeduction: Math.round(totalDeliveryDeduction * 100) / 100,
          deliveryChargeBorneBy,
          isThirdParty,
          isAbove400,
          isRule3,
          isRule4,
          settlementRule: isRule3 ? 'COD_SELF_DELIVERY' : (isRule4 ? 'COD_THIRD_PARTY_DELIVERY' : (isThirdParty ? 'ONLINE_THIRD_PARTY_DELIVERY' : 'ONLINE_SELF_DELIVERY')),
          ruleNumber: isRule3 ? 3 : (isRule4 ? 4 : (isThirdParty ? 2 : 1)),
          totalDeductions: Math.round(totalDeductions * 100) / 100,
          finalSellerSettlement: Math.round(finalSellerSettlement * 100) / 100,
          netSellerShare,
          computedGst: Math.round(computedGst * 100) / 100,
          isCod,
          paymentLabel,
          isCancelled,
          isDelivered: Boolean(isDelivered || isExchanged),
          isExchanged,
          isRefunded,
          creditNoteNumber: order.creditNoteNumber || (isRefunded ? (`CN-${order.orderId || order.id || String(order._id).slice(-8).toUpperCase()}`) : null),
          returnWindowDays,
          holdingDays,
          settlementDueDate,
          isMatured,
          daysRemaining,
          dateStr: order.createdAt 
            ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) 
            : (order.date || 'Recent'),
          customerDisplay: order.customerName || order.customer?.name || order.shippingAddress?.name || 'Verified Consumer'
        });
      }
    });

    return list;
  }, [effectiveOrders, sellerId, sellerStoreName, commissionRate]);

  // Aggregate Real Financial Metrics
  const metrics = useMemo(() => {
    let grossSales = 0;
    let portalCommission = 0;
    let gstOnCommission = 0;
    let tdsAmount = 0;
    let gstTcsAmount = 0;
    let totalDeductions = 0;
    let totalDeliveryDeduction = 0;
    let netEarnings = 0;
    let totalGst = 0;
    let codVolume = 0;
    let codCount = 0;
    let upiVolume = 0;
    let upiCount = 0;
    let cancelledVolume = 0;
    let cancelledCount = 0;
    let deliveredCount = 0;

    sellerOrders.forEach(o => {
      if (o.isCancelled) {
        cancelledVolume += o.effectiveTotal;
        cancelledCount += 1;
      } else {
        grossSales += o.effectiveTotal;
        portalCommission += o.portalCommission;
        gstOnCommission += o.gstOnCommission;
        tdsAmount += o.tdsAmount;
        gstTcsAmount += o.gstTcsAmount;
        totalDeliveryDeduction += (o.totalDeliveryDeduction || 0);
        totalDeductions += o.totalDeductions;
        netEarnings += o.finalSellerSettlement;
        totalGst += o.computedGst;

        if (o.isDelivered) deliveredCount += 1;

        if (o.isCod) {
          codVolume += o.effectiveTotal;
          codCount += 1;
        } else {
          upiVolume += o.effectiveTotal;
          upiCount += 1;
        }
      }
    });

    const payableBalance = Number(seller.walletBalance ?? seller.payoutBalance ?? 0);
    const settledVolume = Number(seller.totalWithdrawn ?? 0);

    return {
      totalOrders: sellerOrders.length,
      grossSales: Math.round(grossSales * 100) / 100,
      portalCommission: Math.round(portalCommission * 100) / 100,
      gstOnCommission: Math.round(gstOnCommission * 100) / 100,
      tdsAmount: Math.round(tdsAmount * 100) / 100,
      gstTcsAmount: Math.round(gstTcsAmount * 100) / 100,
      deliveryDeduction: Math.round(totalDeliveryDeduction * 100) / 100,
      totalDeliveryDeduction: Math.round(totalDeliveryDeduction * 100) / 100,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      platformCut: Math.round(portalCommission * 100) / 100,
      netEarnings: Math.round(netEarnings * 100) / 100,
      finalSettlement: Math.round(netEarnings * 100) / 100,
      finalSellerSettlement: Math.round(netEarnings * 100) / 100,
      totalGst: Math.round(totalGst * 100) / 100,
      codVolume: Math.round(codVolume * 100) / 100,
      codCount,
      upiVolume: Math.round(upiVolume * 100) / 100,
      upiCount,
      cancelledVolume: Math.round(cancelledVolume * 100) / 100,
      cancelledCount,
      deliveredCount,
      payableBalance,
      settledVolume
    };
  }, [sellerOrders, seller.walletBalance, seller.payoutBalance, seller.totalWithdrawn]);

  // Aggregate Specific Metrics for Rule 1, 2, 3, 4
  const ruleMetrics = useMemo(() => {
    const rules = {
      rule1: { gross: 0, comm: 0, gstComm: 0, tds: 0, tcs: 0, deliv: 0, ded: 0, net: 0, count: 0 },
      rule2: { gross: 0, comm: 0, gstComm: 0, tds: 0, tcs: 0, deliv: 0, ded: 0, net: 0, count: 0 },
      rule3: { gross: 0, comm: 0, gstComm: 0, tds: 0, tcs: 0, deliv: 0, ded: 0, net: 0, count: 0 },
      rule4: { gross: 0, comm: 0, gstComm: 0, tds: 0, tcs: 0, deliv: 0, ded: 0, net: 0, count: 0 },
    };

    sellerOrders.forEach(o => {
      if (o.isCancelled) return;
      const key = o.ruleNumber === 1 ? 'rule1' : (o.ruleNumber === 2 ? 'rule2' : (o.ruleNumber === 3 ? 'rule3' : 'rule4'));
      rules[key].gross += o.effectiveTotal;
      rules[key].comm += o.portalCommission;
      rules[key].gstComm += o.gstOnCommission;
      rules[key].tds += o.tdsAmount;
      rules[key].tcs += o.gstTcsAmount;
      rules[key].deliv += (o.totalDeliveryDeduction || 0);
      rules[key].ded += o.totalDeductions;
      rules[key].net += o.finalSellerSettlement;
      rules[key].count += 1;
    });

    Object.keys(rules).forEach(k => {
      rules[k].gross = Math.round(rules[k].gross * 100) / 100;
      rules[k].comm = Math.round(rules[k].comm * 100) / 100;
      rules[k].gstComm = Math.round(rules[k].gstComm * 100) / 100;
      rules[k].tds = Math.round(rules[k].tds * 100) / 100;
      rules[k].tcs = Math.round(rules[k].tcs * 100) / 100;
      rules[k].deliv = Math.round(rules[k].deliv * 100) / 100;
      rules[k].ded = Math.round(rules[k].ded * 100) / 100;
      rules[k].net = Math.round(rules[k].net * 100) / 100;
    });

    return rules;
  }, [sellerOrders]);

  // Filtered Orders for the ledger view
  const filteredOrders = useMemo(() => {
    return sellerOrders.filter(o => {
      // Tab filter
      if (activeFilter === 'upi' && o.isCod) return false;
      if (activeFilter === 'cod' && !o.isCod) return false;
      if (activeFilter === 'delivered' && !o.isDelivered) return false;
      if (activeFilter === 'cancelled' && !o.isCancelled) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = String(o.orderId).toLowerCase().includes(q);
        const matchCust = String(o.customerDisplay).toLowerCase().includes(q);
        const matchItem = o.relevantItems?.some(it => String(it.name).toLowerCase().includes(q));
        if (!matchId && !matchCust && !matchItem) return false;
      }

      return true;
    });
  }, [sellerOrders, activeFilter, searchQuery]);

  const handleDisburseCurrentPayout = () => {
    if (!isEditor) return;
    if (metrics.payableBalance <= 0) return;
    if (window.confirm(`Disburse pending settlement payout of ₹${metrics.payableBalance.toLocaleString()} to ${bankName} (A/c: ${acctNum}) for ${storeName}?`)) {
      if (onReleasePayout) {
        onReleasePayout(sellerId, metrics.payableBalance);
      }
      setDisburseSuccess(`Payout of ₹${metrics.payableBalance.toLocaleString()} successfully queued for electronic bank transfer.`);
      setTimeout(() => setDisburseSuccess(''), 5000);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setIsDownloadingPdf(true);
      await downloadSellerFinancialStatementPdfApi(sellerId, storeName);
    } catch (err) {
      console.error('Backend financial statement PDF download error:', err);
      alert(`Could not download financial statement PDF: ${err.message || 'Please try again later'}`);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[94vh] print:max-h-none print:shadow-none print:border-none print:rounded-none animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Control Bar */}
        <div className="bg-gray-950 text-white px-5 py-3.5 flex items-center justify-between shrink-0 print:hidden border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-extrabold shadow-sm">
              <CreditCard size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-sm text-white leading-tight">
                  Merchant Financial Statement & Order Settlement
                </h3>
                <span className="bg-teal-900/80 text-teal-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-teal-700/60">
                  {sellerId}
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                {storeName} • {city}, {state} • Commission: <strong className="text-teal-400">{commissionRate}%</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloadingPdf}
              className="px-3.5 py-1.5 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Download Official Financial Statement PDF"
            >
              <Download size={14} className={isDownloadingPdf ? 'animate-bounce' : ''} />
              <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Print Statement / Save as PDF"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Print Statement</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Statement Body */}
        <div className="p-6 sm:p-7 space-y-6 overflow-y-auto print:overflow-visible print:p-0">

          {disburseSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 print:hidden animate-in fade-in duration-100">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{disburseSuccess}</span>
            </div>
          )}

          {/* Statement Letterhead (Visible in Print & Screen) */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-gray-900 pb-5 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-brand-teal text-white font-black text-xs px-2.5 py-0.5 rounded tracking-wider uppercase">BookVardi</span>
                <span className="text-xs font-extrabold text-emerald-700 flex items-center gap-1">
                  <ShieldCheck size={14} /> Official Merchant Settlement
                </span>
              </div>
              <h1 className="font-display font-extrabold text-xl text-gray-900 tracking-tight">
                BOOK VARDI PRIVATE LIMITED
              </h1>
              <p className="text-[11px] text-gray-500">
                Corporate Finance & Merchant Settlement Division | GSTIN: 09AAACB1234F1Z9
              </p>
              <p className="text-[10px] text-gray-400">
                Registered Office: Sector 4, Gomti Nagar, Lucknow, Uttar Pradesh - 226010
              </p>
            </div>

            <div className="sm:text-right border-l-2 sm:border-l-0 border-brand-teal pl-3 sm:pl-0 space-y-0.5">
              <h2 className="font-display font-black text-base text-gray-900 uppercase tracking-wider">
                FINANCIAL STATEMENT
              </h2>
              <p className="text-xs font-bold text-gray-700">Ref: <strong className="font-mono text-teal-800">STMT-{String(sellerId).slice(-6).toUpperCase()}</strong></p>
              <p className="text-[11px] text-gray-500">Statement Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              <div className="inline-block mt-1 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded text-[10px] font-bold text-teal-900">
                Platform Cut: {commissionRate}% | Disbursals via NEFT/IMPS
              </div>
            </div>
          </div>

          {/* Seller Profile & Linked Bank Account Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Merchant Identity Block */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black text-teal-900 flex items-center gap-1.5">
                  <Store size={13} className="text-teal-700" /> Merchant Identity & Tax Credentials
                </span>
                <span className="text-[10px] font-bold bg-white text-gray-700 px-2 py-0.5 rounded border border-gray-200">
                  {seller.status || 'Verified Vendor'}
                </span>
              </div>
              <p className="font-extrabold text-sm text-gray-900">{storeName}</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-gray-600 pt-0.5">
                <div><span className="text-gray-400">Legal Entity:</span> <strong className="text-gray-800">{legalName}</strong></div>
                <div><span className="text-gray-400">Proprietor:</span> <strong className="text-gray-800">{ownerName}</strong></div>
                <div><span className="text-gray-400">GSTIN:</span> <strong className="font-mono text-gray-800">{gstin}</strong></div>
                <div><span className="text-gray-400">PAN:</span> <strong className="font-mono text-gray-800">{pan}</strong></div>
                <div><span className="text-gray-400">Mobile:</span> <strong className="text-gray-800">{phone}</strong></div>
                <div><span className="text-gray-400">Email:</span> <strong className="text-gray-800">{email}</strong></div>
              </div>
              <p className="text-[10px] text-gray-500 pt-1 border-t border-gray-200/60 truncate">
                Address: {address}
              </p>
            </div>

            {/* Bank Settlement Channel Block */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black text-sky-900 flex items-center gap-1.5">
                  <Landmark size={13} className="text-sky-700" /> Linked Settlement Bank Account
                </span>
                <button
                  type="button"
                  onClick={() => setIsMasked(!isMasked)}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 hover:text-gray-800 cursor-pointer print:hidden"
                >
                  {isMasked ? <Eye size={12} /> : <EyeOff size={12} />}
                  <span>{isMasked ? 'Show Acct' : 'Mask Acct'}</span>
                </button>
              </div>
              <p className="font-extrabold text-sm text-gray-900">{bankName}</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-gray-600 pt-0.5">
                <div><span className="text-gray-400">Account Holder:</span> <strong className="text-gray-800">{acctHolder}</strong></div>
                <div><span className="text-gray-400">Account Type:</span> <strong className="text-gray-800">{acctType}</strong></div>
                <div className="col-span-2">
                  <span className="text-gray-400">Account Number: </span>
                  <strong className="font-mono text-gray-900 text-xs">
                    {isMasked && acctNum.length > 4 ? `•••• •••• ${acctNum.slice(-4)}` : acctNum}
                  </strong>
                </div>
                <div><span className="text-gray-400">IFSC Code:</span> <strong className="font-mono text-gray-800">{ifsc}</strong></div>
                <div><span className="text-gray-400">Branch:</span> <strong className="text-gray-800">{branch}</strong></div>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-gray-200/60 text-[10px]">
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 size={12} /> Automated Penny Drop Verified
                </span>
                <span className="text-gray-400">IMPS / NEFT Auto-Credit</span>
              </div>
            </div>
          </div>

          {/* High-Level Financial KPI Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* 1. Gross Sales (GMV) */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
              <div className="flex items-center justify-between text-emerald-800 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Gross Sales (GMV)</span>
                <TrendingUp size={15} />
              </div>
              <div className="font-display font-extrabold text-xl text-emerald-950">
                ₹{(metrics.grossSales || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                {metrics.totalOrders || 0} total orders processed
              </div>
            </div>

            {/* 2. Total Statutory & Platform Deductions */}
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl">
              <div className="flex items-center justify-between text-amber-800 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Total Deductions</span>
                <Percent size={15} />
              </div>
              <div className="font-display font-extrabold text-xl text-amber-950">
                ₹{(metrics.totalDeductions || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                Comm {commissionRate}% + GST 18% + Tax
              </div>
            </div>

            {/* 3. Final Seller Settlement */}
            <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl">
              <div className="flex items-center justify-between text-teal-800 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Final Settlement</span>
                <DollarSign size={15} />
              </div>
              <div className="font-display font-extrabold text-xl text-teal-950">
                ₹{(metrics.finalSettlement ?? metrics.finalSellerSettlement ?? 0).toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-teal-700 font-semibold mt-0.5">
                Net credited to seller
              </div>
            </div>

            {/* 4. Current Payable Balance */}
            <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-gray-500 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Payable Balance</span>
                  <Landmark size={15} className="text-teal-700" />
                </div>
                <div className="font-display font-extrabold text-xl text-gray-900">
                  ₹{(metrics.payableBalance || 0).toLocaleString('en-IN')}
                </div>
              </div>
              
              <div className="mt-2 flex items-center justify-between gap-1">
                <span className="text-[10px] text-gray-400">
                  Settled: ₹{(metrics.settledVolume || 0).toLocaleString('en-IN')}
                </span>
                {metrics.payableBalance > 0 && isEditor && (
                  <button
                    onClick={handleDisburseCurrentPayout}
                    className="px-2 py-0.5 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-extrabold text-[10px] rounded-lg transition-colors cursor-pointer print:hidden"
                  >
                    Disburse
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Visual Waterfall & Settlement Rules (Rule 1: Self Delivery, Rule 2: Third-Party Delivery, Rule 3: COD + Self Delivery) */}
          <div className="p-4 bg-gradient-to-r from-gray-50 via-teal-50/30 to-amber-50/30 rounded-2xl border border-gray-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200/80 pb-2">
              <h4 className="font-display font-bold text-xs text-gray-900 flex items-center gap-1.5 uppercase tracking-wider">
                <Receipt size={14} className="text-teal-800" /> Book Vardi — सेलर सेटलमेंट के 4 नियम (Rules 1, 2, 3 & 4)
              </h4>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveRuleTab('rule1')}
                  className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                    activeRuleTab === 'rule1' ? 'bg-teal-700 text-white border-teal-800 shadow-xs' : 'bg-teal-100 text-teal-800 border-teal-200 hover:bg-teal-200'
                  }`}
                >
                  Rule 1: Self (Online)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRuleTab('rule2')}
                  className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                    activeRuleTab === 'rule2' ? 'bg-amber-600 text-white border-amber-700 shadow-xs ring-2 ring-amber-300' : 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200'
                  }`}
                >
                  Rule 2: Courier (Online)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRuleTab('rule3')}
                  className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                    activeRuleTab === 'rule3' ? 'bg-rose-600 text-white border-rose-700 shadow-xs' : 'bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200'
                  }`}
                >
                  Rule 3: COD Self (Cash)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRuleTab('rule4')}
                  className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                    activeRuleTab === 'rule4' ? 'bg-purple-600 text-white border-purple-700 shadow-xs' : 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200'
                  }`}
                >
                  Rule 4: COD Courier (Remitted)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRuleTab('all')}
                  className={`text-[10px] font-extrabold px-2 py-1 rounded-full border transition-all cursor-pointer ${
                    activeRuleTab === 'all' ? 'bg-gray-800 text-white border-gray-900 shadow-xs' : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  सभी 4 नियम देखें
                </button>
              </div>
            </div>

            {/* 5 Deduction Waterfall Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
              <div className="p-2.5 bg-white rounded-xl border border-gray-200 space-y-0.5">
                <div className="text-[10px] font-extrabold text-amber-800 uppercase">Portal Comm ({commissionRate}%)</div>
                <div className="font-extrabold text-sm text-gray-900">₹{(metrics.portalCommission || 0).toLocaleString('en-IN')}</div>
                <p className="text-[9px] text-gray-500 font-medium">{commissionRate}% Platform fee</p>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-gray-200 space-y-0.5">
                <div className="text-[10px] font-extrabold text-indigo-800 uppercase">GST on Comm (18%)</div>
                <div className="font-extrabold text-sm text-gray-900">₹{(metrics.gstOnCommission || 0).toLocaleString('en-IN')}</div>
                <p className="text-[9px] text-gray-500 font-medium">18% GST on Commission</p>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-gray-200 space-y-0.5">
                <div className="text-[10px] font-extrabold text-purple-800 uppercase">TDS (0.1%)</div>
                <div className="font-extrabold text-sm text-gray-900">₹{(metrics.tdsAmount || 0).toLocaleString('en-IN')}</div>
                <p className="text-[9px] text-gray-500 font-medium">Sec 194-O deduction</p>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-gray-200 space-y-0.5">
                <div className="text-[10px] font-extrabold text-sky-800 uppercase">GST TCS (0.5% / 0%)</div>
                <div className="font-extrabold text-sm text-gray-900">₹{(metrics.gstTcsAmount || 0).toLocaleString('en-IN')}</div>
                <p className="text-[9px] text-gray-500 font-medium">0.5% Online | 0% COD Rule 3</p>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-gray-200 space-y-0.5 col-span-2 sm:col-span-1">
                <div className="text-[10px] font-extrabold text-rose-800 uppercase">Deliv. Ded. (Rule 2)</div>
                <div className="font-extrabold text-sm text-rose-700">₹{(metrics.deliveryDeduction || 0).toLocaleString('en-IN')}</div>
                <p className="text-[9px] text-gray-500 font-medium">Courier + 18% GST (≥₹301 Admin free)</p>
              </div>
            </div>

            {/* Rule Explanatory Detailed View (Client Specifications) */}
            {activeRuleTab === 'rule2' && (
              <div className="p-3.5 bg-amber-50/90 rounded-xl border border-amber-300 text-xs space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between border-b border-amber-200/90 pb-2 flex-wrap gap-2">
                  <div>
                    <h5 className="font-extrabold text-amber-950 text-xs sm:text-sm flex items-center gap-1.5">
                      ⚡ 2. Online Payment + Third-Party Delivery (ऑनलाइन भुगतान + कूरियर से डिलीवरी)
                    </h5>
                    <p className="text-[10px] text-amber-800 mt-0.5 font-medium">
                      क्लाइंट आधिकारिक नियम विनिर्देश (Official Client Rule 2 Specifications)
                    </p>
                  </div>
                  <span className="text-[10px] bg-amber-200 text-amber-950 font-black px-2.5 py-0.5 rounded-full border border-amber-400">
                    Rule 2 Active ({ruleMetrics.rule2.count} Orders)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-[11px] text-gray-800">
                  <div className="flex items-start gap-1.5">
                    <span className="text-amber-800 font-bold">•</span>
                    <span><strong>Gross Sale:</strong> ग्राहक से प्राप्त कुल बिक्री राशि (Total Gross Sales Value)।</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-amber-800 font-bold">•</span>
                    <span><strong>Portal Commission:</strong> {commissionRate}% (या निर्धारित दर) — पोर्टल का कमीशन।</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-amber-800 font-bold">•</span>
                    <span><strong>GST on Commission:</strong> 18% — कमीशन पर 18% GST।</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-amber-800 font-bold">•</span>
                    <span><strong>TDS:</strong> 0.1% — आयकर कानून (Sec 194-O) के अनुसार लागू TDS की कटौती।</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-amber-800 font-bold">•</span>
                    <span><strong>GST TCS:</strong> 0.5% (0.25% CGST + 0.25% SGST / 0.5% IGST) — जहाँ GST कानून के अनुसार लागू हो (किताबों पर 0%)।</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-amber-800 font-bold">•</span>
                    <span><strong>Delivery Charges (कूरियर डिलीवरी खर्च - GST सहित):</strong> डिलीवरी का खर्च (GST सहित) तभी काटें, जब यह खर्च सेलर के जिम्मे हो।</span>
                  </div>
                  <div className="flex items-start gap-1.5 md:col-span-2 bg-amber-100/80 p-2.5 rounded-lg border border-amber-300 text-amber-950 font-medium">
                    <span className="font-extrabold text-amber-900 shrink-0">✨ ₹301 या अधिक के ऑर्डर पर:</span>
                    <span>यदि डिलीवरी का खर्च एडमिन उठाता है, तो सेलर से डिलीवरी चार्ज और उसका GST नहीं काटना है (सेलर से ₹0 डिलीवरी कटौती)।</span>
                  </div>
                  <div className="flex items-start gap-1.5 md:col-span-2">
                    <span className="text-amber-800 font-bold">•</span>
                    <span><strong>Final Seller Settlement:</strong> सभी लागू कटौतियों के बाद बची शुद्ध राशि सेलर के बैंक खाते में दी जाएगी।</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-300/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-amber-950">Rule 2 Formula:</span>
                    <span className="bg-white text-emerald-900 font-mono font-bold px-2 py-0.5 rounded border border-emerald-300 text-[11px]">
                      Gross Sale (₹{ruleMetrics.rule2.gross.toLocaleString('en-IN')})
                    </span>
                    <span>−</span>
                    <span className="bg-white text-amber-950 font-mono font-bold px-2 py-0.5 rounded border border-amber-300 text-[11px]">
                      Total Deductions (₹{ruleMetrics.rule2.ded.toLocaleString('en-IN')})
                    </span>
                    <span>=</span>
                    <span className="bg-teal-100 text-teal-950 font-mono font-extrabold px-2.5 py-0.5 rounded border border-teal-400 text-[11px]">
                      Final Settlement (₹{ruleMetrics.rule2.net.toLocaleString('en-IN')})
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-900 italic font-medium">
                    *Book Vardi Multi-Vendor Rule 2 Engine
                  </span>
                </div>
              </div>
            )}

            {activeRuleTab === 'rule1' && (
              <div className="p-3.5 bg-teal-50/90 rounded-xl border border-teal-300 text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-teal-200 pb-1.5">
                  <h5 className="font-extrabold text-teal-950 text-xs sm:text-sm">
                    1. Online Payment + Self Delivery (ऑनलाइन भुगतान + सेलर डिलीवरी)
                  </h5>
                  <span className="text-[10px] bg-teal-200 text-teal-950 font-black px-2 py-0.5 rounded-full">
                    Rule 1 ({ruleMetrics.rule1.count} Orders)
                  </span>
                </div>
                <div className="text-[11px] text-gray-800 space-y-1">
                  <p>• <strong>Gross Sale:</strong> ग्राहक से प्राप्त कुल बिक्री राशि।</p>
                  <p>• <strong>Portal Commission ({commissionRate}%) + 18% GST + TDS (0.1%) + GST TCS (0.5%):</strong> लागू पोर्टल कटौती।</p>
                  <p>• <strong>Delivery Deduction:</strong> ₹0 (सेलर स्वयं डिलीवरी करता है, कोई कूरियर कटौती नहीं)।</p>
                  <p>• <strong>Final Settlement:</strong> Gross − Deductions = सेलर को देय राशि।</p>
                </div>
              </div>
            )}

            {activeRuleTab === 'rule3' && (
              <div className="p-3.5 bg-rose-50/90 rounded-xl border border-rose-300 text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-rose-200 pb-1.5">
                  <h5 className="font-extrabold text-rose-950 text-xs sm:text-sm">
                    3. COD + Self Delivery (कैश ऑन डिलीवरी + सेलर डिलीवरी)
                  </h5>
                  <span className="text-[10px] bg-rose-200 text-rose-950 font-black px-2 py-0.5 rounded-full">
                    Rule 3 ({ruleMetrics.rule3.count} Orders)
                  </span>
                </div>
                <div className="text-[11px] text-gray-800 space-y-1">
                  <p>• <strong>Cash Collection:</strong> ग्राहक पूरा पैसा सीधे सेलर को कैश में देता है। पोर्टल को ₹0 प्राप्त होता है।</p>
                  <p>• <strong>TCS (0%):</strong> पोर्टल पैसे एकत्रित नहीं करता, इसलिए Rule 3 में 0% TCS लागू होता है।</p>
                  <p>• <strong>Portal Deductions Owed:</strong> {commissionRate}% Comm + 18% GST + 0.1% TDS सेलर पर पोर्टल का बकाया बनता है।</p>
                  <p>• <strong>Final Settlement:</strong> माइनस (−Total Deductions) के रूप में दिखेगा जो आगामी भुगतानों से समायोजित होगा।</p>
                </div>
              </div>
            )}

            {activeRuleTab === 'rule4' && (
              <div className="p-3.5 bg-purple-50/90 rounded-xl border border-purple-300 text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-purple-200 pb-1.5">
                  <h5 className="font-extrabold text-purple-950 text-xs sm:text-sm">
                    4. COD + Third-Party Delivery (कैश ऑन डिलीवरी + कूरियर से डिलीवरी)
                  </h5>
                  <span className="text-[10px] bg-purple-200 text-purple-950 font-black px-2 py-0.5 rounded-full">
                    Rule 4 ({ruleMetrics.rule4.count} Orders)
                  </span>
                </div>
                <div className="text-[11px] text-gray-800 space-y-1">
                  <p>• <strong>Courier Remittance:</strong> कूरियर ग्राहक से कैश कलेक्ट कर पोर्टल को रेमिट करता है।</p>
                  <p>• <strong>Deductions:</strong> {commissionRate}% Comm + 18% GST + 0.1% TDS + 0.5% TCS।</p>
                  <p>• <strong>₹301+ पर डिलीवरी फ्री:</strong> ₹301 या अधिक ऑर्डर पर डिलीवरी खर्च ₹0, बची शुद्ध राशि सेलर को दी जाएगी।</p>
                </div>
              </div>
            )}

            {activeRuleTab === 'all' && (
              <div className="p-2.5 bg-white/90 rounded-xl border border-gray-200 text-[11px] space-y-1.5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-[10px]">
                  <div className="flex items-start gap-1 text-gray-700">
                    <span className="font-bold text-teal-800 shrink-0">Rule 1 (Online Self):</span>
                    <span>Gross − [{commissionRate}% Comm + 18% GST + 0.1% TDS + 0.5% TCS] = Net. (डिलीवरी ₹0)</span>
                  </div>
                  <div className="flex items-start gap-1 text-gray-700">
                    <span className="font-bold text-amber-800 shrink-0">Rule 2 (Online Courier):</span>
                    <span>{commissionRate}% Comm + 18% GST + 0.1% TDS + 0.5% TCS। डिलीवरी खर्च+GST तभी जब सेलर वहन करे। <strong>₹301+ एडमिन फ्री (₹0)</strong>।</span>
                  </div>
                  <div className="flex items-start gap-1 text-gray-700">
                    <span className="font-bold text-rose-800 shrink-0">Rule 3 (COD Self):</span>
                    <span>कैश सेलर को प्राप्त। पोर्टल {commissionRate}% Comm + 18% GST + 0.1% TDS लेगा। <strong>सेटलमेंट माइनस (-)</strong> दिखेगा।</span>
                  </div>
                  <div className="flex items-start gap-1 text-gray-700">
                    <span className="font-bold text-purple-800 shrink-0">Rule 4 (COD Courier):</span>
                    <span>कूरियर कैश पोर्टल को भेजेगा। {commissionRate}% Comm + 18% GST + 0.1% TDS + 0.5% TCS। <strong>₹301+ डिलीवरी ₹0</strong>।</span>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-gray-900">Total Formula:</span>
                    <span className="bg-emerald-50 text-emerald-900 font-mono font-bold px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                      Gross (₹{(metrics.grossSales || 0).toLocaleString('en-IN')})
                    </span>
                    <span>−</span>
                    <span className="bg-amber-50 text-amber-900 font-mono font-bold px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                      Total Deductions (₹{(metrics.totalDeductions || 0).toLocaleString('en-IN')})
                    </span>
                    <span>=</span>
                    <span className="bg-teal-50 text-teal-900 font-mono font-extrabold px-2 py-0.5 rounded border border-teal-200 text-[11px]">
                      Final Settlement (₹{(metrics.finalSettlement ?? metrics.finalSellerSettlement ?? 0).toLocaleString('en-IN')})
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Orders & Deductions Ledger Table */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            {/* Ledger Filter Toolbar */}
            <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 print:hidden">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeFilter === 'all' 
                      ? 'bg-teal-800 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All Orders ({sellerOrders.length})
                </button>
                <button
                  onClick={() => setActiveFilter('upi')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                    activeFilter === 'upi' 
                      ? 'bg-emerald-700 text-white' 
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  <QrCode size={12} /> UPI Prepaid ({metrics.upiCount})
                </button>
                <button
                  onClick={() => setActiveFilter('cod')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                    activeFilter === 'cod' 
                      ? 'bg-amber-700 text-white' 
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  <Banknote size={12} /> Cash on Delivery ({metrics.codCount})
                </button>
                <button
                  onClick={() => setActiveFilter('delivered')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeFilter === 'delivered' 
                      ? 'bg-blue-700 text-white' 
                      : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                  }`}
                >
                  Delivered ({metrics.deliveredCount})
                </button>
                {metrics.cancelledCount > 0 && (
                  <button
                    onClick={() => setActiveFilter('cancelled')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      activeFilter === 'cancelled' 
                        ? 'bg-rose-700 text-white' 
                        : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                    }`}
                  >
                    Cancelled ({metrics.cancelledCount})
                  </button>
                )}
              </div>

              {/* Search box */}
              <div className="relative w-full md:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search order, customer, item..."
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-50 focus:bg-white rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-teal-700"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-50 text-gray-700 uppercase font-extrabold text-[10px] tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-3.5">Order ID & Date</th>
                    <th className="py-3 px-3">Customer & Location</th>
                    <th className="py-3 px-3">Products & Qty</th>
                    <th className="py-3 px-3">Payment Mode</th>
                    <th className="py-3 px-3 text-right">Gross Sale</th>
                    <th className="py-3 px-3 text-right">Comm ({commissionRate}%)</th>
                    <th className="py-3 px-3 text-right">GST (18%)</th>
                    <th className="py-3 px-3 text-right">Tax (0.6%)</th>
                    <th className="py-3 px-3 text-right">Deliv. Ded.</th>
                    <th className="py-3 px-3.5 text-right">Settlement</th>
                    <th className="py-3 px-3 text-center">Fulfillment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="11" className="py-12 text-center text-gray-400">
                        No orders matching the selected filter or search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((o, idx) => (
                      <tr key={o.orderId || idx} className="hover:bg-gray-50/70 transition-colors">
                        {/* Order ID & Date */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-extrabold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                              {o.orderId}
                            </span>
                            {onOpenInvoice && (
                              <button
                                onClick={() => onOpenInvoice(o)}
                                className="text-teal-700 hover:text-teal-900 p-0.5 rounded hover:bg-teal-50 cursor-pointer print:hidden"
                                title="View Tax Invoice"
                              >
                                <FileText size={13} />
                              </button>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5">{o.dateStr}</div>
                        </td>

                        {/* Customer & Location */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-gray-900 truncate max-w-[130px]" title={o.customerDisplay}>
                            {o.customerDisplay}
                          </div>
                          <div className="text-[10px] text-gray-400 truncate max-w-[130px]">
                            {o.shippingAddress?.city || o.city || 'Standard Delivery'}
                          </div>
                        </td>

                        {/* Products & Qty */}
                        <td className="py-3 px-3">
                          <div className="text-[11px] text-gray-800 font-medium truncate max-w-[160px]" title={o.relevantItems?.map(it => it.name).join(', ')}>
                            {o.relevantItems && o.relevantItems[0]?.name ? o.relevantItems[0].name : 'Product Item'}
                            {o.relevantItems && o.relevantItems.length > 1 && (
                              <span className="text-gray-400 text-[10px]"> +{o.relevantItems.length - 1} more</span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            Qty: {o.relevantItems?.reduce((s, it) => s + Number(it.quantity || 1), 0)} unit(s)
                          </div>
                        </td>

                        {/* Payment Mode */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {o.isCod ? (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              o.isRule4 ? 'bg-purple-100 text-purple-900 border border-purple-200' : 'bg-amber-100 text-amber-900 border border-amber-200'
                            }`}>
                              <Banknote size={11} /> {o.isRule4 ? 'COD (Courier)' : 'COD (Cash)'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-200">
                              <QrCode size={11} /> UPI / Online
                            </span>
                          )}
                          <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                            {String(o.paymentStatus || (o.isCod ? 'Pending' : 'Paid')).toUpperCase()}
                          </div>
                        </td>

                        {/* Gross Sale */}
                        <td className="py-3 px-3 text-right whitespace-nowrap font-mono font-bold text-gray-900">
                          ₹{(o.effectiveTotal || 0).toLocaleString('en-IN')}
                        </td>

                        {/* Portal Commission (10%) */}
                        <td className="py-3 px-3 text-right whitespace-nowrap font-mono font-semibold text-amber-700">
                          -₹{(o.portalCommission || 0).toFixed(2)}
                        </td>

                        {/* GST on Commission (18%) */}
                        <td className="py-3 px-3 text-right whitespace-nowrap font-mono text-indigo-700">
                          -₹{(o.gstOnCommission || 0).toFixed(2)}
                        </td>

                        {/* Statutory Tax (0.1% TDS + 0.5% TCS = 0.6% or 0.1% for Rule 3 COD) */}
                        <td className="py-3 px-3 text-right whitespace-nowrap font-mono text-purple-700">
                          <div>
                            <span>-₹{(Number(o.tdsAmount || 0) + Number(o.gstTcsAmount || 0)).toFixed(2)}</span>
                            {Number(o.gstTcsAmount || 0) === 0 && o.isCod ? (
                              <div className="text-[9px] text-gray-400">TDS 0.1% (TCS 0%)</div>
                            ) : null}
                          </div>
                        </td>

                        {/* Delivery Deduction (Rule 2) */}
                        <td className="py-3 px-3 text-right whitespace-nowrap font-mono">
                          {Number(o.totalDeliveryDeduction || 0) > 0 ? (
                            <div>
                              <span className="font-semibold text-rose-700">-₹{(o.totalDeliveryDeduction || 0).toFixed(2)}</span>
                              <div className="text-[9px] text-gray-400">₹{o.deliveryChargeAmount || 0} + ₹{o.gstOnDeliveryAmount || 0} GST</div>
                            </div>
                          ) : o.isThirdParty && o.isAbove400 ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-50 text-teal-800 border border-teal-200" title={`Order >= ₹${o.freeDeliveryThreshold || 401}: Free delivery borne by Admin`}>
                              ₹0 (Admin ≥₹{o.freeDeliveryThreshold || 401})
                            </span>
                          ) : o.isThirdParty && o.deliveryChargeBorneBy === 'customer' ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-50 text-sky-800 border border-sky-200" title="Delivery fee paid by customer">
                              ₹0 (Cust. Paid)
                            </span>
                          ) : (
                            <span className="text-gray-400 text-[10px]">₹0.00</span>
                          )}
                        </td>

                        {/* Final Net Settlement */}
                        <td className="py-3 px-3.5 text-right whitespace-nowrap font-mono font-extrabold">
                          {Number(o.finalSellerSettlement ?? o.netSellerShare ?? 0) < 0 ? (
                            <div>
                              <span className="text-rose-700 font-extrabold">
                                -₹{Math.abs(Number(o.finalSellerSettlement ?? o.netSellerShare ?? 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <div className="text-[9px] text-rose-600 font-sans font-bold">Payable to Portal (COD)</div>
                            </div>
                          ) : (
                            <div>
                              <span className="text-emerald-700">
                                ₹{Number(o.finalSellerSettlement ?? o.netSellerShare ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              {o.isDelivered && (
                                <div className={`text-[9px] font-sans font-bold mt-0.5 ${o.isRefunded ? 'text-rose-600' : (o.isMatured ? 'text-emerald-700' : 'text-amber-800')}`}>
                                  {o.isRefunded 
                                    ? '❌ Reversed (Credit Note)' 
                                    : (o.isMatured 
                                        ? (o.isExchanged ? '✅ Matured (Exchanged)' : '✅ Matured & Payable') 
                                        : (o.isExchanged ? `⏳ Exchange Buffer (${o.daysRemaining || 1}d left)` : `⏳ Held in window (${o.daysRemaining}d left)`))}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Fulfillment Status */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            o.isRefunded ? 'bg-rose-100 text-rose-800' :
                            o.isExchanged ? 'bg-purple-100 text-purple-900 border border-purple-200' :
                            o.isDelivered ? 'bg-emerald-100 text-emerald-800' :
                            o.isCancelled ? 'bg-rose-100 text-rose-800' :
                            'bg-teal-50 text-teal-800'
                          }`}>
                            {o.isRefunded ? 'Refunded' : (o.isExchanged ? 'Exchanged' : (o.overallStatus || o.status || 'Processing'))}
                          </span>
                          {o.isDelivered && o.settlementDueDate && !o.isRefunded && (
                            <div className="text-[9px] text-gray-500 font-mono mt-0.5" title={o.isExchanged ? 'Unlocks 1 day after exchange completion' : `Unlocks after Return Window (${o.returnWindowDays}d) + 1 buffer day`}>
                              Due: {new Date(o.settlementDueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                            </div>
                          )}
                          {o.isRefunded && (
                            <div className="text-[9px] text-rose-700 font-mono font-bold mt-0.5" title="Section 34 Statutory Credit Note Auto-Recognized">
                              {o.creditNoteNumber || 'Auto CN'}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Summary Bar */}
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <span className="text-gray-500 text-[11px]">
                Showing {filteredOrders.length} of {sellerOrders.length} total orders for this vendor
              </span>
              <div className="flex items-center gap-4 text-xs font-mono flex-wrap">
                <div>
                  <span className="text-gray-400">Total GMV: </span>
                  <strong className="text-gray-900 font-bold">₹{(metrics.grossSales || 0).toLocaleString('en-IN')}</strong>
                </div>
                {Number(metrics.deliveryDeduction || 0) > 0 && (
                  <div>
                    <span className="text-gray-400">Deliv. Ded: </span>
                    <strong className="text-rose-700 font-bold">-₹{(metrics.deliveryDeduction || 0).toLocaleString('en-IN')}</strong>
                  </div>
                )}
                <div>
                  <span className="text-gray-400">Total Deductions: </span>
                  <strong className="text-amber-800 font-bold">-₹{(metrics.totalDeductions || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <span className="text-gray-400">Net Settlement: </span>
                  <strong className="text-emerald-800 font-extrabold">₹{(metrics.finalSettlement ?? metrics.finalSellerSettlement ?? 0).toLocaleString('en-IN')}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Statutory Footer & Certification Block */}
          <div className="border-t border-gray-300 pt-4 text-[10px] text-gray-500 space-y-2">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="space-y-1 max-w-xl">
                <p className="font-bold text-gray-700">Certification & Statutory Declaration:</p>
                <p>
                  1. This statement is electronically generated under the BookVardi Merchant Agreement and verified by internal platform audit logs.
                </p>
                <p>
                  2. Cash on Delivery (COD) proceeds are collected via logistics partner escrow and cleared following doorstep delivery confirmation.
                </p>
                <p>
                  3. Net settlement disbursements are credited directly to the merchant's verified bank account ({bankName} A/c: {acctNum}).
                </p>
              </div>

              <div className="text-right sm:shrink-0 space-y-1">
                <p className="font-bold text-teal-900 text-xs">Authorized Signatory</p>
                <p className="text-gray-800 font-semibold">BookVardi Merchant Accounts Bureau</p>
                <p className="text-gray-400">Digitally Signed & Validated</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
