import React, { useState } from 'react';
import { 
  Settings, 
  Save, 
  Percent, 
  Truck, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2,
  Lock
} from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';

export default function SettingsTab() {
  const { settings, setSettings, updatePlatformSettings, logAudit, schoolRadiusKm, updateSchoolRadius } = useAdminData();
  const [formData, setFormData] = useState({
    ...settings,
    schoolRadiusKm: schoolRadiusKm || settings.schoolRadiusKm || 25,
    minOrderFreeShipping: settings?.minOrderFreeShipping !== undefined ? settings.minOrderFreeShipping : (settings?.freeShippingThreshold !== undefined ? settings.freeShippingThreshold : 99)
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  React.useEffect(() => {
    setFormData(prev => ({
      ...prev,
      ...settings,
      schoolRadiusKm: schoolRadiusKm || settings?.schoolRadiusKm || 25,
      minOrderFreeShipping: settings?.minOrderFreeShipping !== undefined ? settings.minOrderFreeShipping : (settings?.freeShippingThreshold !== undefined ? settings.freeShippingThreshold : (prev.minOrderFreeShipping || 99))
    }));
  }, [settings, schoolRadiusKm]);

  const handleSave = (e) => {
    e.preventDefault();
    if (updatePlatformSettings) {
      updatePlatformSettings(formData);
    } else if (setSettings) {
      setSettings(formData);
    }
    if (formData.schoolRadiusKm) {
      updateSchoolRadius(Number(formData.schoolRadiusKm));
    }
    logAudit('Platform Settings Updated', `Updated platform settings (Free Shipping Threshold: ₹${formData.minOrderFreeShipping || 99}, Radius: ${formData.schoolRadiusKm}km)`);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-2xl text-gray-900 flex items-center gap-2">
            <Settings className="text-teal-700" size={24} /> Marketplace Global Configuration
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure baseline platform commissions, payment gateways, GST rate tiers, and role-based permissions.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Save size={15} /> Save Platform Settings
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>Platform configuration saved and synchronized with customer & merchant portals.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Marketplace Commission & Fees */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4">
          <h3 className="font-display font-bold text-base text-gray-900 flex items-center gap-2">
            <Percent size={17} className="text-teal-700" /> Commission & Take Rates
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Default Vendor Commission Rate (%)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.commissionRate}
                  onChange={e => setFormData({ ...formData, commissionRate: Number(e.target.value) })}
                  className="w-24 px-3.5 py-2 text-sm font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-yellow outline-hidden"
                />
                <span className="text-xs text-gray-500">
                  Applied automatically to all new merchant signups
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Free Shipping Order Threshold (₹)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="10000"
                  value={formData.minOrderFreeShipping !== undefined ? formData.minOrderFreeShipping : (formData.freeShippingThreshold || 99)}
                  onChange={e => setFormData({ ...formData, minOrderFreeShipping: Number(e.target.value), freeShippingThreshold: Number(e.target.value) })}
                  className="w-28 px-3.5 py-2 text-sm font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-yellow outline-hidden"
                />
                <span className="text-xs text-gray-500">
                  Minimum cart subtotal required for customer to unlock 100% Free Doorstep Shipping
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Customer School Discovery Radius (km)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={formData.schoolRadiusKm}
                  onChange={e => setFormData({ ...formData, schoolRadiusKm: Number(e.target.value) })}
                  className="w-24 px-3.5 py-2 text-sm font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-yellow outline-hidden"
                />
                <span className="text-xs text-gray-500">
                  Defines the maximum distance (in km) to filter schools shown to user in user store based on GPS/city
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Gateways */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4">
          <h3 className="font-display font-bold text-base text-gray-900 flex items-center gap-2">
            <CreditCard size={17} className="text-teal-700" /> Payment Methods & Checkouts
          </h3>

          <div className="space-y-2.5">
            {[
              { id: 'upi', label: 'UPI & QR Code (PhonePe / GPay / Paytm)', desc: 'Instant bank transfer with 0% MDR' },
              { id: 'cards', label: 'Credit & Debit Cards (Visa / Mastercard / RuPay)', desc: 'Secured with 3D Secure 2.0 OTP' },
              { id: 'netBanking', label: 'NetBanking (50+ Indian Banks)', desc: 'Direct corporate & retail banking' },
              { id: 'cod', label: 'Cash on Delivery (COD)', desc: 'Eligible for verified student & parent pins' }
            ].map(gateway => (
              <label
                key={gateway.id}
                className="flex items-start gap-3 p-3 bg-gray-50/70 rounded-xl border border-gray-200/70 cursor-pointer hover:bg-gray-100/60 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={formData.paymentGateways?.[gateway.id] ?? true}
                  onChange={e => setFormData({
                    ...formData,
                    paymentGateways: {
                      ...formData.paymentGateways,
                      [gateway.id]: e.target.checked
                    }
                  })}
                  className="mt-0.5 w-4 h-4 text-teal-800 rounded-md focus:ring-brand-yellow"
                />
                <div>
                  <div className="font-bold text-xs text-gray-900">{gateway.label}</div>
                  <div className="text-[11px] text-gray-500">{gateway.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* GST & Tax Rates */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4">
          <h3 className="font-display font-bold text-base text-gray-900 flex items-center gap-2">
            <ShieldCheck size={17} className="text-teal-700" /> GST Tax Compliance (HSN)
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-[10px] uppercase font-bold text-gray-400">School Uniforms</span>
              <div className="font-bold text-gray-900 mt-1">5% GST (HSN 6204)</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-[10px] uppercase font-bold text-gray-400">NCERT Textbooks</span>
              <div className="font-bold text-gray-900 mt-1">0% GST (Exempt)</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-[10px] uppercase font-bold text-gray-400">School Shoes</span>
              <div className="font-bold text-gray-900 mt-1">12% GST (HSN 6403)</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-[10px] uppercase font-bold text-gray-400">Stationery & Bags</span>
              <div className="font-bold text-gray-900 mt-1">18% GST (HSN 4202)</div>
            </div>
          </div>
        </div>

        {/* Role-Based Access Control (RBAC) */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4">
          <h3 className="font-display font-bold text-base text-gray-900 flex items-center gap-2">
            <Lock size={17} className="text-teal-700" /> Admin Role Permissions Matrix
          </h3>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-xl bg-teal-50/60 border border-teal-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-teal-950">Super Admin</span>
                <p className="text-[10px] text-teal-700">Full unconditional access to finances, users, approvals & settings</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-800 text-white">Full</span>
            </div>

            <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-gray-900">Operations Manager</span>
                <p className="text-[10px] text-gray-500">Catalog approvals, tracking updates, inventory & seller onboarding</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 text-gray-700">Operations</span>
            </div>

            <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-gray-900">Finance Admin</span>
                <p className="text-[10px] text-gray-500">Discharge vendor bank settlements, commission ledger & invoices</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 text-gray-700">Finance</span>
            </div>

            <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-gray-900">Support Lead</span>
                <p className="text-[10px] text-gray-500">Customer helpdesk tickets, moderation of reviews & issue resolution</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 text-gray-700">Support</span>
            </div>
          </div>
        </div>

      </form>

    </div>
  );
}
