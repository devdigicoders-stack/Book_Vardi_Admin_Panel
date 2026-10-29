import React, { useState } from 'react';
import { 
  Settings, 
  Save, 
  Percent, 
  Truck, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2,
  Lock,
  Building,
  Headphones,
  Phone,
  Mail,
  Clock,
  Banknote
} from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';

export default function SettingsTab() {
  const { settings, setSettings, updatePlatformSettings, logAudit, schoolRadiusKm, updateSchoolRadius } = useAdminData();
  const [formData, setFormData] = useState({
    ...settings,
    companyName: settings?.companyName || 'BOOK VARDI',
    companyAddress: settings?.companyAddress || 'Lucknow, Uttar Pradesh - 226001',
    companyGstin: settings?.companyGstin || '09AAACB1234F1Z9',
    customerCarePhone: settings?.customerCarePhone || settings?.supportPhone || '+91 98765 43210',
    customerCareEmail: settings?.customerCareEmail || settings?.supportEmail || 'support@bookvardi.in',
    sellerSupportEmail: settings?.sellerSupportEmail || 'sellers@bookvardi.in',
    supportPhone: settings?.supportPhone || settings?.customerCarePhone || '+91 98765 43210',
    supportEmail: settings?.supportEmail || settings?.customerCareEmail || 'support@bookvardi.in',
    supportHours: settings?.supportHours || 'Mon - Sat (9:00 AM - 6:00 PM)',
    schoolRadiusKm: schoolRadiusKm || settings?.schoolRadiusKm || 25,
    shippingFee: settings?.shippingFee !== undefined ? settings.shippingFee : 49,
    minOrderFreeShipping: settings?.minOrderFreeShipping !== undefined ? settings.minOrderFreeShipping : (settings?.freeShippingThreshold !== undefined ? settings.freeShippingThreshold : 999),
    codFee: settings?.codFee !== undefined ? settings.codFee : 0
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  React.useEffect(() => {
    setFormData(prev => ({
      ...prev,
      ...settings,
      companyName: settings?.companyName || prev.companyName || 'BOOK VARDI',
      companyAddress: settings?.companyAddress || prev.companyAddress || 'Lucknow, Uttar Pradesh - 226001',
      companyGstin: settings?.companyGstin || prev.companyGstin || '09AAACB1234F1Z9',
      customerCarePhone: settings?.customerCarePhone || settings?.supportPhone || prev.customerCarePhone || '+91 98765 43210',
      customerCareEmail: settings?.customerCareEmail || settings?.supportEmail || prev.customerCareEmail || 'support@bookvardi.in',
      sellerSupportEmail: settings?.sellerSupportEmail || prev.sellerSupportEmail || 'sellers@bookvardi.in',
      supportPhone: settings?.supportPhone || settings?.customerCarePhone || prev.supportPhone || '+91 98765 43210',
      supportEmail: settings?.supportEmail || settings?.customerCareEmail || prev.supportEmail || 'support@bookvardi.in',
      supportHours: settings?.supportHours || prev.supportHours || 'Mon - Sat (9:00 AM - 6:00 PM)',
      schoolRadiusKm: schoolRadiusKm || settings?.schoolRadiusKm || 25,
      shippingFee: settings?.shippingFee !== undefined ? settings.shippingFee : (prev.shippingFee !== undefined ? prev.shippingFee : 49),
      minOrderFreeShipping: settings?.minOrderFreeShipping !== undefined ? settings.minOrderFreeShipping : (settings?.freeShippingThreshold !== undefined ? settings.freeShippingThreshold : (prev.minOrderFreeShipping || 999)),
      codFee: settings?.codFee !== undefined ? settings.codFee : (prev.codFee !== undefined ? prev.codFee : 0)
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
    logAudit('Platform Settings Updated', `Updated platform settings (Delivery Charge: ₹${formData.shippingFee !== undefined ? formData.shippingFee : 49} per product, Free Shipping Threshold: ₹${formData.minOrderFreeShipping || 999}, COD Fee: ₹${formData.codFee || 0}, Customer Care: ${formData.customerCarePhone || formData.supportPhone}, Radius: ${formData.schoolRadiusKm}km)`);
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
        
        {/* Company Legal & Invoice Details */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4 lg:col-span-2">
          <h3 className="font-display font-bold text-base text-gray-900 flex items-center gap-2">
            <Building size={17} className="text-teal-700" /> Platform Company & Tax Invoice Details
          </h3>
          <p className="text-xs text-gray-500">
            These legal company details, registered address, and GSTIN appear on all official Tax Invoices, Credit Notes, and receipts generated by the platform.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Company / Marketplace Name
              </label>
              <input
                type="text"
                value={formData.companyName || ''}
                onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="e.g. BOOK VARDI"
                className="w-full px-3.5 py-2 text-xs font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-yellow outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Registered Office Address (Invoice Header)
              </label>
              <input
                type="text"
                value={formData.companyAddress || ''}
                onChange={e => setFormData({ ...formData, companyAddress: e.target.value })}
                placeholder="e.g. Lucknow, Uttar Pradesh - 226001"
                className="w-full px-3.5 py-2 text-xs font-semibold border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-yellow outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Marketplace GSTIN Number
              </label>
              <input
                type="text"
                value={formData.companyGstin || ''}
                onChange={e => setFormData({ ...formData, companyGstin: e.target.value.toUpperCase() })}
                placeholder="e.g. 09AAACB1234F1Z9"
                className="w-full px-3.5 py-2 text-xs font-bold font-mono uppercase border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-yellow outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Customer Care & Helpdesk Support Details */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-display font-bold text-base text-gray-900 flex items-center gap-2">
                <Headphones size={18} className="text-teal-700" /> Customer Care & Support Helpline Settings
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                These customer care contacts are dynamically displayed across customer storefront, Helpdesk, Contact Us page, footer, and tax invoices.
              </p>
            </div>
            <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-200 self-start sm:self-auto flex items-center gap-1">
              <CheckCircle2 size={13} className="text-teal-600" /> Live on Storefront
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                <Phone size={13} className="text-teal-700" /> Customer Care Phone / Helpline
              </label>
              <input
                type="text"
                value={formData.customerCarePhone || formData.supportPhone || ''}
                onChange={e => setFormData({ ...formData, customerCarePhone: e.target.value, supportPhone: e.target.value })}
                placeholder="e.g. +91 98765 43210 or 1800-XXX-XXXX"
                className="w-full px-3.5 py-2 text-xs font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-yellow outline-hidden bg-white"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">Toll-free or mobile helpline for student and parent orders</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                <Mail size={13} className="text-teal-700" /> Customer Care Official Email
              </label>
              <input
                type="email"
                value={formData.customerCareEmail || formData.supportEmail || ''}
                onChange={e => setFormData({ ...formData, customerCareEmail: e.target.value, supportEmail: e.target.value })}
                placeholder="e.g. support@bookvardi.in"
                className="w-full px-3.5 py-2 text-xs font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-yellow outline-hidden bg-white"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">Direct customer support & order query inbox</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                <Mail size={13} className="text-emerald-700" /> Seller Helpdesk & Escalation Email
              </label>
              <input
                type="email"
                value={formData.sellerSupportEmail || ''}
                onChange={e => setFormData({ ...formData, sellerSupportEmail: e.target.value })}
                placeholder="e.g. sellers@bookvardi.in"
                className="w-full px-3.5 py-2 text-xs font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-yellow outline-hidden bg-white"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">Official support email displayed to merchants on the Seller Panel Helpdesk</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                <Clock size={13} className="text-teal-700" /> Support Desk Timings
              </label>
              <input
                type="text"
                value={formData.supportHours || ''}
                onChange={e => setFormData({ ...formData, supportHours: e.target.value })}
                placeholder="e.g. Mon - Sat (9:00 AM - 6:00 PM)"
                className="w-full px-3.5 py-2 text-xs font-semibold border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-yellow outline-hidden bg-white"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">Helpdesk availability hours shown to customers</span>
            </div>
          </div>
        </div>

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
                Universal Delivery Charge Per Product (₹)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={formData.shippingFee !== undefined ? formData.shippingFee : 49}
                  onChange={e => setFormData({ ...formData, shippingFee: Number(e.target.value) })}
                  className="w-28 px-3.5 py-2 text-sm font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-yellow outline-hidden"
                />
                <span className="text-xs text-gray-500">
                  Delivery charge applied for each distinct product item in the customer cart (e.g. 3 products = 3 × ₹49 = ₹147). Set 0 for platform-wide free delivery.
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
                  value={formData.minOrderFreeShipping !== undefined ? formData.minOrderFreeShipping : (formData.freeShippingThreshold || 999)}
                  onChange={e => setFormData({ ...formData, minOrderFreeShipping: Number(e.target.value), freeShippingThreshold: Number(e.target.value) })}
                  className="w-28 px-3.5 py-2 text-sm font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-yellow outline-hidden"
                />
                <span className="text-xs text-gray-500">
                  Minimum cart subtotal required for customer to unlock 100% Free Doorstep Shipping across all products
                </span>
              </div>
            </div>

            {/* Dynamic Cash on Delivery (COD) Handling Fee */}
            <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Banknote size={15} className="text-amber-800" /> Cash on Delivery (COD) Handling Fee (₹)
                </label>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-white border border-amber-300 text-amber-900 shadow-2xs">
                  {Number(formData.codFee || 0) === 0 ? "Customer Sees: ₹0 (FREE COD)" : `Customer Pays: +₹${formData.codFee}`}
                </span>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-xs">₹</span>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={formData.codFee !== undefined ? formData.codFee : 0}
                    onChange={e => setFormData({ ...formData, codFee: Math.max(0, Number(e.target.value)) })}
                    className="w-28 pl-7 pr-3 py-2 text-sm font-black border border-amber-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[0, 29, 49, 79, 99].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFormData({ ...formData, codFee: preset })}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        Number(formData.codFee) === preset
                          ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                          : 'bg-white hover:bg-amber-100 text-amber-900 border-amber-200'
                      }`}
                    >
                      {preset === 0 ? 'Free (₹0)' : `₹${preset}`}
                    </button>
                  ))}
                </div>
              </div>

              <span className="text-[11px] text-amber-900/80 block leading-tight">
                Dynamic charge added automatically to customer order total when they choose Cash on Delivery at checkout. Set to 0 for 100% Free COD.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Customer School Discovery Radius (km)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="5000"
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
