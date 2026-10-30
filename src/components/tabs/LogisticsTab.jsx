import React, { useState, useEffect } from 'react';
import {
  Truck,
  Bike,
  ShieldCheck,
  Key,
  Save,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Calculator,
  Loader2,
  RefreshCw,
  Search,
  Package,
  MapPin,
  Clock
} from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';

// Helper to reliably identify Store Self-Delivery vs Third-Party Courier
const isSelfDeliveryOrder = (ord) => {
  if (!ord) return false;
  if (
    ord.deliveryMode === 'self_delivery' ||
    ord.deliveryMode === 'self' ||
    ord.deliveryType === 'self' ||
    ord.deliveryType === 'self_delivery' ||
    ord.dispatchMode === 'self_delivery' ||
    ord.shippingMethod === 'self_delivery'
  ) return true;
  if (ord.isSelfDelivery === true) return true;
  if (
    ord.selfDeliveryDetails?.deliveryPartnerToken ||
    ord.selfDeliveryDetails?.deliveryPersonName ||
    ord.selfDeliveryDetails?.token ||
    (ord.selfDeliveryDetails && Object.keys(ord.selfDeliveryDetails).length > 0)
  ) return true;
  const trk = String(ord.trackingNumber || ord.trackingId || '').trim().toUpperCase();
  if (trk.startsWith('DLV-') || trk.includes('DLV-')) return true;
  if (Array.isArray(ord.items) && ord.items.some(it => 
    it?.deliveryType === 'self_delivery' ||
    it?.deliveryType === 'self' ||
    it?.selfDeliveryDetails?.deliveryPartnerToken ||
    String(it?.trackingNumber || '').toUpperCase().startsWith('DLV-')
  )) {
    return true;
  }
  const courier = String(ord.courierName || ord.carrier || '').toLowerCase().trim();
  if (courier.includes('self') || courier.includes('direct') || courier.includes('rider') || courier.includes('store fleet')) return true;
  return false;
};

export default function LogisticsTab() {
  const { orders = [], settings = {}, updatePlatformSettings } = useAdminData();

  const [platformPartner, setPlatformPartner] = useState('shiprocket');
  const [shippingFee, setShippingFee] = useState(String(settings.shippingFee ?? 49));
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(String(settings.minOrderFreeShipping || settings.freeShippingThreshold || '999'));
  const [codFee, setCodFee] = useState(String(settings.codFee ?? 0));

  useEffect(() => {
    if (settings) {
      if (settings.shippingFee !== undefined) setShippingFee(String(settings.shippingFee));
      if (settings.minOrderFreeShipping !== undefined || settings.freeShippingThreshold !== undefined) {
        setFreeShippingThreshold(String(settings.minOrderFreeShipping || settings.freeShippingThreshold || '999'));
      }
      if (settings.codFee !== undefined) {
        setCodFee(String(settings.codFee));
      }
    }
  }, [settings]);

  const [shiprocketKey, setShiprocketKey] = useState('sr_sandbox_master_key_9981');
  const [delhiveryKey, setDelhiveryKey] = useState('delh_master_key_4412');
  const [bluedartKey, setBluedartKey] = useState('bd_master_lic_7719');

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState('all'); // 'all' | 'courier' | 'self_delivery'

  // Master dispatched orders log (includes Shipped, Out for Delivery, Delivered, or any with AWB / Rider Token)
  const shippedOrders = orders.filter((o) => {
    const st = String(o.status || o.overallStatus || '').toLowerCase();
    return st === 'shipped' || st === 'out for delivery' || st === 'delivered' || Boolean(o.trackingNumber) || Boolean(o.selfDeliveryDetails?.deliveryPartnerToken);
  });

  const courierCount = shippedOrders.filter(o => !isSelfDeliveryOrder(o)).length;
  const selfDeliveryCount = shippedOrders.filter(o => isSelfDeliveryOrder(o)).length;

  const filteredShippedOrders = shippedOrders.filter((o) => {
    const isSelf = isSelfDeliveryOrder(o);
    if (deliveryTypeFilter === 'courier' && isSelf) return false;
    if (deliveryTypeFilter === 'self_delivery' && !isSelf) return false;

    const q = searchTerm.toLowerCase();
    const riderName = o.selfDeliveryDetails?.deliveryPersonName || '';
    const courier = o.courierName || '';
    const custName = o.customerName || o.customer?.name || o.name || '';
    const ordId = o.id || o.orderId || '';
    const trk = o.trackingNumber || o.selfDeliveryDetails?.deliveryPartnerToken || '';

    return (
      ordId.toLowerCase().includes(q) ||
      custName.toLowerCase().includes(q) ||
      trk.toLowerCase().includes(q) ||
      courier.toLowerCase().includes(q) ||
      riderName.toLowerCase().includes(q)
    );
  });

  const handleSaveMasterConfig = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage('');
    if (updatePlatformSettings) {
      updatePlatformSettings({
        shippingFee: Number(shippingFee),
        minOrderFreeShipping: Number(freeShippingThreshold),
        freeShippingThreshold: Number(freeShippingThreshold),
        codFee: Number(codFee)
      });
    }
    setTimeout(() => {
      setIsSaving(false);
      setSaveMessage('Master Logistics & Courier Configuration Saved Successfully!');
      setTimeout(() => setSaveMessage(''), 4000);
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gray-950 text-white p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-gray-950 flex items-center justify-center font-bold">
              <Truck size={18} />
            </div>
            <h2 className="font-display font-extrabold text-xl text-white">
              Marketplace Master Logistics & Delivery Partner Control
            </h2>
          </div>
          <p className="text-xs text-gray-400">
            Configure global courier aggregators (Shiprocket / Delhivery / BlueDart), master API keys, and track live shipments.
          </p>
        </div>

        <span className="text-xs font-extrabold uppercase px-3 py-1.5 rounded-full bg-amber-400 text-gray-950 shadow-xs">
          Multi-Carrier Active
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Global Logistics Credentials & Partner Settings */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-4 text-xs">
            <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
              <Key size={16} className="text-amber-600" /> Platform Master API Credentials
            </h3>

            <form onSubmit={handleSaveMasterConfig} className="space-y-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Default Primary Aggregator</label>
                <select
                  value={platformPartner}
                  onChange={(e) => setPlatformPartner(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-amber-500"
                >
                  <option value="shiprocket">Shiprocket Multi-Carrier Aggregator</option>
                  <option value="delhivery">Delhivery Direct Express</option>
                  <option value="bluedart">BlueDart Air Priority</option>
                  <option value="local_express">BookVardi Local Express</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Shiprocket Master API Key</label>
                <input
                  type="password"
                  value={shiprocketKey}
                  onChange={(e) => setShiprocketKey(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Delhivery Client Master Token</label>
                <input
                  type="password"
                  value={delhiveryKey}
                  onChange={(e) => setDelhiveryKey(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">BlueDart License Key</label>
                <input
                  type="password"
                  value={bluedartKey}
                  onChange={(e) => setBluedartKey(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Per Product (₹)</label>
                  <input
                    type="number"
                    value={shippingFee}
                    onChange={(e) => setShippingFee(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-900"
                    title="Universal delivery charge per distinct product applied below the free shipping threshold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Free Ship (₹)</label>
                  <input
                    type="number"
                    value={freeShippingThreshold}
                    onChange={(e) => setFreeShippingThreshold(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">COD Fee (₹)</label>
                  <input
                    type="number"
                    value={codFee}
                    onChange={(e) => setCodFee(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-900"
                  />
                </div>
              </div>

              {saveMessage && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-[11px] font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={15} /> {saveMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-gray-950 font-extrabold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                <span>Save Master Logistics Settings</span>
              </button>
            </form>
          </div>
        </div>

        {/* Master Active Shipments Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                  <Package size={16} className="text-amber-600" /> Master Active Shipments & AWB Audit Log
                </h3>
                <p className="text-[11px] text-gray-500">Live courier & store self-delivery tracking across all seller dispatches.</p>
              </div>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search AWB, Token, Rider or Order ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 w-full sm:w-64"
                />
              </div>
            </div>

            {/* Filter Pills for Courier vs Store Self-Delivery */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeliveryTypeFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                  deliveryTypeFilter === 'all'
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                All Dispatches ({shippedOrders.length})
              </button>
              <button
                type="button"
                onClick={() => setDeliveryTypeFilter('courier')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                  deliveryTypeFilter === 'courier'
                    ? 'bg-sky-700 text-white shadow-xs'
                    : 'bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200'
                }`}
              >
                <Truck size={13} />
                <span>🚚 Courier Partner ({courierCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setDeliveryTypeFilter('self_delivery')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                  deliveryTypeFilter === 'self_delivery'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                <Bike size={13} />
                <span>🛵 Store Self-Delivery ({selfDeliveryCount})</span>
              </button>
            </div>

            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-900 text-white text-[10px] uppercase tracking-wider font-extrabold">
                    <th className="py-2.5 px-3">Order ID</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Delivery Partner / Channel</th>
                    <th className="py-2.5 px-3">AWB / Rider Token</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-xs">
                  {filteredShippedOrders.length > 0 ? (
                    filteredShippedOrders.map((ord) => {
                      const isSelf = isSelfDeliveryOrder(ord);
                      const riderName = ord.selfDeliveryDetails?.deliveryPersonName || '';
                      const riderPhone = ord.selfDeliveryDetails?.deliveryPersonPhone || '';
                      const tokenVal = ord.trackingNumber || ord.selfDeliveryDetails?.deliveryPartnerToken || (isSelf ? `DLV-${ord.id || ord.orderId}` : '');
                      const statusStr = ord.status || ord.overallStatus || 'Shipped';
                      const statusLower = String(statusStr).toLowerCase();

                      return (
                        <tr key={ord.id || ord.orderId} className="hover:bg-gray-50">
                          <td className="py-3 px-3 font-mono font-bold text-gray-900">
                            #{ord.id || ord.orderId}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-gray-800">{ord.customerName || ord.customer?.name || ord.name || 'Customer'}</div>
                            {ord.customer?.phone && (
                              <div className="text-[10px] text-gray-500 font-mono">{ord.customer.phone}</div>
                            )}
                          </td>
                          <td className="py-3 px-3 font-medium">
                            {isSelf ? (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px]">
                                  <Bike size={12} className="text-emerald-600" />
                                  <span>Store Self-Delivery</span>
                                </span>
                                {riderName && (
                                  <div className="text-[10px] text-gray-600 mt-1">
                                    Rider: <span className="font-semibold text-gray-800">{riderName}</span>
                                    {riderPhone && ` (${riderPhone})`}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-sky-50 text-sky-800 border border-sky-200 font-bold text-[11px]">
                                  <Truck size={12} className="text-sky-600" />
                                  <span>{ord.courierName || 'Courier Partner'}</span>
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {isSelf ? (
                              <div>
                                <span className="font-mono font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-xs">
                                  {tokenVal}
                                </span>
                                <span className="block text-[10px] text-emerald-700 font-medium mt-0.5">Direct Rider Token</span>
                              </div>
                            ) : ord.trackingNumber ? (
                              <div>
                                <span className="font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-xs">
                                  {ord.trackingNumber}
                                </span>
                                <span className="block text-[10px] text-gray-500 mt-0.5">Courier AWB</span>
                              </div>
                            ) : (
                              <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px]">
                                Not Assigned
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`inline-block text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                              statusLower === 'delivered'
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                                : statusLower.includes('out')
                                ? 'bg-amber-100 text-amber-900 border-amber-200'
                                : 'bg-purple-100 text-purple-900 border-purple-200'
                            }`}>
                              {statusStr}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-10 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-gray-500">
                          <Package size={22} className="text-gray-400" />
                          <div className="font-bold text-gray-700">No matching dispatch data found.</div>
                          <div className="text-[11px]">Orders will appear here once dispatched via Courier or Store Self-Delivery.</div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
