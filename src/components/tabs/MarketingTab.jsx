import React, { useState } from 'react';
import { 
  Tag, 
  Plus, 
  Megaphone, 
  Trash2, 
  Edit3,
  Clock, 
  Sparkles,
  Power,
  ArrowUpRight,
  Palette
} from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';
import CouponModal from '../modals/CouponModal';
import AnnouncementModal from '../modals/AnnouncementModal';

export default function MarketingTab() {
  const { 
    promotions, 
    addPromotion, 
    deletePromotion, 
    announcements = [], 
    addAnnouncement, 
    updateAnnouncement, 
    toggleAnnouncementStatus, 
    deleteAnnouncement, 
    logAudit, 
    isEditor 
  } = useAdminData();

  const canEdit = isEditor ? isEditor('marketing') : true;
  const [modalOpen, setModalOpen] = useState(false);
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [announcementToEdit, setAnnouncementToEdit] = useState(null);

  const handleOpenAddAnnouncement = () => {
    if (!canEdit) return;
    setAnnouncementToEdit(null);
    setAnnouncementModalOpen(true);
  };

  const handleOpenEditAnnouncement = (item) => {
    if (!canEdit) return;
    setAnnouncementToEdit(item);
    setAnnouncementModalOpen(true);
  };

  const handleSaveAnnouncement = async (payload, editId) => {
    if (editId) {
      await updateAnnouncement(editId, payload);
      logAudit('Announcement Updated', `Updated top announcement bar item "${payload.text}"`);
    } else {
      await addAnnouncement(payload);
      logAudit('Announcement Created', `Created top announcement bar item "${payload.text}"`);
    }
  };

  const handleToggleStatus = async (item) => {
    if (!canEdit) return;
    const itemId = item.id || item._id;
    const newStatus = !item.isActive;
    await toggleAnnouncementStatus(itemId, newStatus);
    logAudit('Announcement Status Toggled', `Toggled status for announcement bar item "${item.text}" to ${newStatus ? 'Enabled' : 'Disabled'}`);
  };

  const handleDeleteAnnouncement = async (item) => {
    if (!canEdit) return;
    if (!window.confirm(`Are you sure you want to delete announcement "${item.text}"?`)) return;
    const itemId = item.id || item._id;
    await deleteAnnouncement(itemId);
    logAudit('Announcement Deleted', `Deleted announcement bar item "${item.text}"`);
  };

  // Sort announcements by priority (ascending)
  const sortedAnnouncements = [...announcements].sort((a, b) => (a.priority || 1) - (b.priority || 1));

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-2xl text-gray-900 flex items-center gap-2">
            <Tag className="text-teal-700" size={24} /> Marketing, Promotions & Banners
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure student discount promo codes, flash deals, seasonal sales & storefront announcement bar ticker.
          </p>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAddAnnouncement}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Megaphone size={16} /> Add Announcement
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={16} /> Create Discount Coupon
            </button>
          </div>
        )}
      </div>

      {/* Store Announcement Ticker Manager */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Megaphone size={18} className="text-teal-700" />
            <h3 className="font-display font-bold text-base text-gray-900">
              Storefront Top Announcement Bar
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 font-bold border border-teal-100">
              {announcements.length} Messages
            </span>
          </div>
          <span className="text-[11px] text-gray-500">Live configuration database synced to Customer App header</span>
        </div>

        {/* Announcements List */}
        {sortedAnnouncements.length === 0 ? (
          <div className="p-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200 text-gray-500 text-xs">
            No top announcement messages configured yet. Click "Add Announcement" above to create your first announcement!
          </div>
        ) : (
          <div className="space-y-3">
            {sortedAnnouncements.map((item) => {
              const itemId = item.id || item._id;
              const isExpired = item.expiryDate && new Date(item.expiryDate) <= new Date();
              const isCurrentlyActive = item.isActive && !isExpired;

              return (
                <div
                  key={itemId}
                  className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    isCurrentlyActive 
                      ? 'bg-white border-teal-200/80 shadow-2xs hover:border-teal-300' 
                      : 'bg-gray-50/70 border-gray-200 opacity-75'
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Priority Tag */}
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-teal-100 text-teal-900 border border-teal-200">
                        Priority #{item.priority || 1}
                      </span>

                      {/* Badge if present */}
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-brand-yellow text-brand-teal-dark uppercase">
                          {item.badge}
                        </span>
                      )}

                      {/* Status Tag */}
                      {isExpired ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                          <Clock size={10} /> Expired
                        </span>
                      ) : item.isActive ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-200 text-gray-700">
                          Disabled
                        </span>
                      )}

                      {/* Color Preview Swatch */}
                      {(item.bgColor || item.textColor) && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 font-mono px-2 py-0.5 bg-gray-100 rounded-md">
                          <span className="w-2.5 h-2.5 rounded-full border border-gray-300 inline-block" style={{ backgroundColor: item.bgColor || '#0f766e' }} />
                          <Palette size={10} /> {item.bgColor || '#0f766e'}
                        </span>
                      )}
                    </div>

                    {/* Announcement Text */}
                    <div className="font-semibold text-xs text-gray-900 flex items-center gap-2">
                      <Sparkles size={14} className="text-brand-yellow shrink-0" />
                      <span className="truncate">{item.text}</span>
                      {item.link && (
                        <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                          <ArrowUpRight size={10} /> {item.link}
                        </span>
                      )}
                    </div>

                    {/* Expiry detail if set */}
                    {item.expiryDate && (
                      <div className="text-[10px] text-gray-500 flex items-center gap-1 font-medium">
                        <Clock size={12} className={isExpired ? 'text-rose-500' : 'text-amber-500'} />
                        <span>Expiry Date: {new Date(item.expiryDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {canEdit && (
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      {/* Active Status Switch Toggle */}
                      <button
                        onClick={() => handleToggleStatus(item)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          item.isActive 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                            : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                        }`}
                        title={item.isActive ? "Disable announcement" : "Enable announcement"}
                      >
                        <Power size={13} />
                        <span>{item.isActive ? 'Enabled' : 'Disabled'}</span>
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleOpenEditAnnouncement(item)}
                        className="p-1.5 text-gray-500 hover:text-teal-800 bg-gray-100 hover:bg-teal-50 rounded-xl border border-gray-200 transition-colors cursor-pointer"
                        title="Edit Announcement"
                      >
                        <Edit3 size={14} />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteAnnouncement(item)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 bg-gray-100 hover:bg-rose-50 rounded-xl border border-gray-200 transition-colors cursor-pointer"
                        title="Delete Announcement"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
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
                {canEdit && (
                  <button
                    onClick={() => deletePromotion(promo.id)}
                    className="p-1 text-gray-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                    title="Delete Coupon"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
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

      {/* Coupon Modal */}
      <CouponModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={addPromotion}
      />

      {/* Announcement Modal */}
      <AnnouncementModal
        isOpen={announcementModalOpen}
        onClose={() => {
          setAnnouncementModalOpen(false);
          setAnnouncementToEdit(null);
        }}
        onSave={handleSaveAnnouncement}
        announcementToEdit={announcementToEdit}
      />

    </div>
  );
}
