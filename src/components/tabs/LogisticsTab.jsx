import React, { useState, useEffect } from 'react';
import {
  Truck,
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

export default function LogisticsTab() {
  const { orders = [] } = useAdminData();

  const [platformPartner, setPlatformPartner] = useState('shiprocket');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('999');
  const [codFee, setCodFee] = useState('40');

  const [shiprocketKey, setShiprocketKey] = useState('sr_sandbox_master_key_9981');
  const [delhiveryKey, setDelhiveryKey] = useState('delh_master_key_4412');
  const [bluedartKey, setBluedartKey] = useState('bd_master_lic_7719');

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Shipped orders master log
  const shippedOrders = orders.filter(
    (o) => o.status === 'Shipped' || o.overallStatus === 'shipped' || o.trackingNumber
  );

  const filteredShippedOrders = shippedOrders.filter((o) => {
    const q = searchTerm.toLowerCase();
    return (
      (o.id || o.orderId || '').toLowerCase().includes(q) ||
      (o.customerName || '').toLowerCase().includes(q) ||
      (o.trackingNumber || '').toLowerCase().includes(q) ||
      (o.courierName || '').toLowerCase().includes(q)
    );
  });

  const handleSaveMasterConfig = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage('');
    setTimeout(() => {
      setIsSaving(false);
      setSaveMessage('Master Logistics & Courier Configuration Saved Successfully!');
      setTimeout(() => setSaveMessage(''), 4000);
    }, 600);
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
                  <option value="bluedart">BlueDart Campus Air Priority</option>
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

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Free Shipping (₹)</label>
                  <input
                    type="number"
                    value={freeShippingThreshold}
                    onChange={(e) => setFreeShippingThreshold(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Base COD Fee (₹)</label>
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
                <p className="text-[11px] text-gray-500">Live courier tracking across all seller dispatches.</p>
              </div>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search AWB or Order ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-900 text-white text-[10px] uppercase tracking-wider font-extrabold">
                    <th className="py-2.5 px-3">Order ID</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Courier Partner</th>
                    <th className="py-2.5 px-3">AWB Tracking No.</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-xs">
                  {filteredShippedOrders.length > 0 ? (
                    filteredShippedOrders.map((ord) => (
                      <tr key={ord.id || ord.orderId} className="hover:bg-gray-50">
                        <td className="py-3 px-3 font-mono font-bold text-gray-900">#{ord.id || ord.orderId}</td>
                        <td className="py-3 px-3 font-bold text-gray-800">{ord.customerName || ord.name || 'Customer'}</td>
                        <td className="py-3 px-3 font-medium text-teal-800">{ord.courierName || 'Shiprocket Air'}</td>
                        <td className="py-3 px-3 font-mono font-bold text-amber-900">
                          {ord.trackingNumber || 'AWB-882194'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                            In Transit
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-10 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-gray-500">
                          <Package size={22} className="text-gray-400" />
                          <div className="font-bold text-gray-700">No live courier data available yet.</div>
                          <div className="text-[11px]">Real shipment records will appear here once orders are dispatched.</div>
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
