import React, { useState, useEffect } from 'react';
import { X, Megaphone, Calendar, Clock, Sparkles, Tag, ArrowUpRight, Palette } from 'lucide-react';

export default function AnnouncementModal({ isOpen, onClose, onSave, announcementToEdit = null }) {
  if (!isOpen) return null;

  const [text, setText] = useState('');
  const [badge, setBadge] = useState('');
  const [link, setLink] = useState('');
  const [priority, setPriority] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [expiryDate, setExpiryDate] = useState('');
  const [bgColor, setBgColor] = useState('#0f766e');
  const [textColor, setTextColor] = useState('#ffffff');

  useEffect(() => {
    if (announcementToEdit) {
      setText(announcementToEdit.text || '');
      setBadge(announcementToEdit.badge || '');
      setLink(announcementToEdit.link || '');
      setPriority(announcementToEdit.priority !== undefined ? announcementToEdit.priority : 1);
      setIsActive(announcementToEdit.isActive !== undefined ? announcementToEdit.isActive : true);
      setBgColor(announcementToEdit.bgColor || '#0f766e');
      setTextColor(announcementToEdit.textColor || '#ffffff');
      if (announcementToEdit.expiryDate) {
        // Format to YYYY-MM-THH:mm for datetime-local input
        const dateObj = new Date(announcementToEdit.expiryDate);
        if (!isNaN(dateObj.getTime())) {
          const iso = dateObj.toISOString();
          setExpiryDate(iso.substring(0, 16));
        } else {
          setExpiryDate('');
        }
      } else {
        setExpiryDate('');
      }
    } else {
      setText('');
      setBadge('');
      setLink('');
      setPriority(1);
      setIsActive(true);
      setExpiryDate('');
      setBgColor('#0f766e');
      setTextColor('#ffffff');
    }
  }, [announcementToEdit, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) {
      alert('Please enter an announcement text message.');
      return;
    }

    const payload = {
      text: text.trim(),
      badge: badge.trim(),
      link: link.trim(),
      priority: Number(priority) || 1,
      isActive,
      expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
      bgColor,
      textColor
    };

    onSave(payload, announcementToEdit?.id || announcementToEdit?._id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold">
              <Megaphone size={20} />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-base">
                {announcementToEdit ? 'Edit Announcement Bar Item' : 'Add Top Announcement Bar Item'}
              </h3>
              <p className="text-[11px] text-teal-200 mt-0.5">
                Configure text, priority sequence, expiry schedule & colors
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-teal-800 cursor-pointer transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Live Preview */}
        <div className="p-4 bg-gray-100 border-b border-gray-200 space-y-1">
          <span className="text-[10px] uppercase font-bold text-gray-400 block">Live Header Bar Preview:</span>
          <div
            style={{ backgroundColor: bgColor, color: textColor }}
            className="px-4 py-2 rounded-xl text-xs font-medium flex items-center justify-between gap-2 shadow-xs"
          >
            <div className="flex items-center gap-2 truncate">
              {badge && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-brand-yellow text-brand-teal-dark uppercase shrink-0">
                  {badge}
                </span>
              )}
              <span className="truncate">{text || 'Your announcement message will appear here...'}</span>
            </div>
            {link && <ArrowUpRight size={14} className="shrink-0 opacity-80" />}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Text Message */}
          <div>
            <label className="block text-gray-700 font-bold mb-1">
              Announcement Message <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="e.g. Free Shipping on Orders Over ₹499 | Limited Time Offer"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 outline-hidden focus:ring-2 focus:ring-brand-yellow font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Tag / Badge */}
            <div>
              <label className="block text-gray-700 font-bold mb-1">
                Badge / Tag <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={badge}
                onChange={e => setBadge(e.target.value)}
                placeholder="e.g. 10% OFF, FREE SHIPPING"
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 outline-hidden focus:ring-2 focus:ring-brand-yellow font-medium"
              />
            </div>

            {/* Display Priority */}
            <div>
              <label className="block text-gray-700 font-bold mb-1">
                Display Priority <span className="text-gray-400 font-normal">(1 = Highest)</span>
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 outline-hidden focus:ring-2 focus:ring-brand-yellow font-bold text-center"
              />
            </div>
          </div>

          {/* Click Link */}
          <div>
            <label className="block text-gray-700 font-bold mb-1">
              Click-through URL / Category Link <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={link}
              onChange={e => setLink(e.target.value)}
              placeholder="e.g. /offers or /categories/uniforms"
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 outline-hidden focus:ring-2 focus:ring-brand-yellow font-mono text-[11px]"
            />
          </div>

          {/* Expiry Schedule Date & Time */}
          <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-amber-950 font-bold flex items-center gap-1.5">
                <Clock size={14} className="text-amber-600" /> Auto-Disable Expiry Schedule
              </label>
              {expiryDate && (
                <button
                  type="button"
                  onClick={() => setExpiryDate('')}
                  className="text-[10px] text-amber-800 underline font-bold hover:text-amber-950"
                >
                  Clear Expiry
                </button>
              )}
            </div>
            <input
              type="datetime-local"
              value={expiryDate}
              onChange={e => setExpiryDate(e.target.value)}
              className="w-full px-3 py-2 bg-white rounded-xl border border-amber-300 text-xs font-semibold outline-hidden focus:ring-2 focus:ring-amber-500"
            />
            <p className="text-[10px] text-amber-900/80">
              When the expiry date passes, this announcement bar item will automatically deactivate without needing manual removal.
            </p>
          </div>

          {/* Color Customization */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-gray-700 font-bold mb-1 flex items-center gap-1">
                <Palette size={13} /> Background Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={e => setBgColor(e.target.value)}
                  className="w-9 h-9 rounded-xl border border-gray-300 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={e => setBgColor(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-gray-300 font-mono text-[11px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-1 flex items-center gap-1">
                <Palette size={13} /> Text Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={textColor}
                  onChange={e => setTextColor(e.target.value)}
                  className="w-9 h-9 rounded-xl border border-gray-300 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={textColor}
                  onChange={e => setTextColor(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-gray-300 font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Status Toggle Switch */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-200">
            <div>
              <span className="font-bold text-gray-900 block">Announcement Active Status</span>
              <span className="text-[11px] text-gray-500">Enable or disable display on customer website header</span>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                isActive ? 'bg-emerald-600' : 'bg-gray-300'
              }`}
            >
              <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                isActive ? 'right-1' : 'left-1'
              }`} />
            </button>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-extrabold transition-all shadow-xs cursor-pointer"
            >
              {announcementToEdit ? 'Save Changes' : 'Create Announcement'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
