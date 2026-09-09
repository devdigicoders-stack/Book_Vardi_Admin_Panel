import React, { useState } from 'react';
import { 
  Tag, 
  Plus, 
  Megaphone, 
  Trash2, 
  Percent, 
  Calendar, 
  Users, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';
import CouponModal from '../modals/CouponModal';

export default function MarketingTab() {
  const { promotions, addPromotion, deletePromotion, logAudit } = useAdminData();
  const [modalOpen, setModalOpen] = useState(false);

  const [announcements, setAnnouncements] = useState([
    { id: 1, text: 'Free Shipping on Orders Over ₹499', active: true },
    { id: 2, text: '10% OFF Your First Order | Use Code: SCHOOL10', active: true },
    { id: 3, text: '30-Day Hassle-Free Returns on Uniforms', active: true }
  ]);

  const [newAnnouncement, setNewAnnouncement] = useState('');

  const handleAddAnnouncement = (e) => {
    e.preventDefault();
    if (!newAnnouncement.trim()) return;
    setAnnouncements(prev => [...prev, { id: Date.now(), text: newAnnouncement.trim(), active: true }]);
    logAudit('Announcement Added', `Added banner: "${newAnnouncement}"`);
    setNewAnnouncement('');
  };

  const handleRemoveAnnouncement = (id) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    logAudit('Announcement Removed', `Removed banner #${id}`);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-2xl text-gray-900 flex items-center gap-2">
            <Tag className="text-teal-700" size={24} /> Marketing, Promotions & Banners
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure student discount promo codes, flash deals, seasonal sales & homepage announcements.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus size={16} /> Create Discount Coupon
        </button>
      </div>

      {/* Promotions & Coupons Grid */}
      <div>
        <h3 className="font-display font-bold text-base text-gray-900 mb-3 flex items-center gap-2">
          <span>Active Promo Coupons</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 font-bold border border-teal-100">
            {promotions.length} Campaigns
          </span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {promotions.map((promo) => (
            <div
              key={promo.id}
              className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs space-y-3 relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-black bg-brand-yellow/30 text-teal-950 border border-brand-yellow">
                  {promo.code}
                </span>
                <button
                  onClick={() => deletePromotion(promo.id)}
                  className="p-1 text-gray-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                  title="Delete Coupon"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div>
                <h4 className="font-bold text-xs text-gray-900 line-clamp-1">{promo.title}</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {promo.discountType === 'percentage' ? `${promo.discountValue}% OFF` : `Flat ₹${promo.discountValue} OFF`} 
                  {promo.maxDiscount ? ` (Up to ₹${promo.maxDiscount})` : ''}
                </p>
              </div>

              <div className="pt-2 border-t border-gray-100 text-[10px] text-gray-500 space-y-1">
                <div>Min Cart Value: <span className="font-bold text-gray-800">₹{promo.minOrderValue}</span></div>
                <div>Usage Count: <span className="font-bold text-teal-800">{promo.usageCount || 0} redeemed</span></div>
                {promo.validUntil && <div>Valid Till: <span className="font-semibold text-gray-700">{promo.validUntil}</span></div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Store Announcement Ticker Manager */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone size={18} className="text-teal-700" />
            <h3 className="font-display font-bold text-base text-gray-900">
              Storefront Top Announcement Bar
            </h3>
          </div>
          <span className="text-[11px] text-gray-500">Visible on Customer App header</span>
        </div>

        {/* Live List */}
        <div className="space-y-2">
          {announcements.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-teal-50/50 border border-teal-100 flex items-center justify-between gap-3 text-xs"
            >
              <span className="font-semibold text-teal-950 flex items-center gap-2">
                <Sparkles size={14} className="text-brand-yellow shrink-0" />
                <span>{item.text}</span>
              </span>
              <button
                onClick={() => handleRemoveAnnouncement(item.id)}
                className="p-1 text-gray-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Add Announcement Form */}
        <form onSubmit={handleAddAnnouncement} className="flex gap-2 pt-2 border-t border-gray-100">
          <input
            type="text"
            required
            value={newAnnouncement}
            onChange={e => setNewAnnouncement(e.target.value)}
            placeholder="Add new announcement bar message (e.g. Free exam kit bundle on orders ₹999+)..."
            className="flex-1 px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-yellow outline-hidden"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Add Message
          </button>
        </form>
      </div>

      {/* Coupon Modal */}
      <CouponModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={addPromotion}
      />

    </div>
  );
}
