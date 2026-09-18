import React, { useState, useEffect } from 'react';
import { X, GraduationCap, CheckCircle2 } from 'lucide-react';

export default function SchoolModal({ isOpen, onClose, onSave, school = null }) {
  const [formData, setFormData] = useState({
    name: '',
    board: 'CBSE',
    city: '',
    lat: 28.6139,
    lng: 77.2090,
    classes: 'Nursery to 12th',
    studentCount: '2500',
    contactPerson: '',
    email: '',
    phone: '',
    commissionShare: '5%',
    exclusiveKit: true
  });

  useEffect(() => {
    if (school) {
      setFormData({
        name: school.name || '',
        board: school.board || 'CBSE',
        city: school.city || '',
        district: school.district || '',
        subdistrict: school.subdistrict || '',
        lat: school.lat ?? 28.6139,
        lng: school.lng ?? 77.2090,
        classes: Array.isArray(school.classes) ? school.classes.join(', ') : (school.classes || 'Nursery, LKG, UKG, Class 1, Class 2, Class 3, Class 4, Class 5, Class 6, Class 7, Class 8, Class 9, Class 10, Class 11, Class 12'),
        studentCount: school.studentCount || '2500',
        contactPerson: school.contactPerson || '',
        email: school.email || '',
        phone: school.phone || '',
        commissionShare: school.commissionShare || '5%',
        exclusiveKit: school.exclusiveKit !== false
      });
    } else {
      setFormData({
        name: '',
        board: 'CBSE',
        city: '',
        district: '',
        subdistrict: '',
        lat: 28.6139,
        lng: 77.2090,
        classes: 'Nursery, LKG, UKG, Class 1, Class 2, Class 3, Class 4, Class 5, Class 6, Class 7, Class 8, Class 9, Class 10, Class 11, Class 12',
        studentCount: '2500',
        contactPerson: '',
        email: '',
        phone: '',
        commissionShare: '5%',
        exclusiveKit: true
      });
    }
  }, [school, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const classesArray = typeof formData.classes === 'string'
      ? formData.classes.split(',').map(c => c.trim()).filter(Boolean)
      : formData.classes;

    onSave({
      ...formData,
      classes: classesArray
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-gray-200">
        
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
              <GraduationCap size={18} />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-gray-900">
                {school ? 'Edit School Partnership' : 'Add Partner School'}
              </h3>
              <p className="text-xs text-gray-500">Institutional onboarding & kits</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">School Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Modern School, Barakhamba"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Education Board</label>
              <select
                value={formData.board}
                onChange={e => setFormData({ ...formData, board: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow outline-hidden"
              >
                <option value="CBSE">CBSE</option>
                <option value="ICSE">ICSE</option>
                <option value="State Board">State Board</option>
                <option value="IB / Cambridge">IB / Cambridge</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">City / State *</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. New Delhi"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200/80">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">
                Latitude (GPS)
              </label>
              <input
                type="number"
                step="any"
                value={formData.lat}
                onChange={e => setFormData({ ...formData, lat: parseFloat(e.target.value) || 0 })}
                placeholder="28.6139"
                className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs bg-white focus:ring-2 focus:ring-brand-yellow outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">
                Longitude (GPS)
              </label>
              <input
                type="number"
                step="any"
                value={formData.lng}
                onChange={e => setFormData({ ...formData, lng: parseFloat(e.target.value) || 0 })}
                placeholder="77.2090"
                className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs bg-white focus:ring-2 focus:ring-brand-yellow outline-hidden"
              />
            </div>
            <div className="col-span-2 text-[10px] text-gray-500">
              Used by user portal to filter schools within the admin discovery radius.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Classes Covered</label>
              <input
                type="text"
                value={formData.classes}
                onChange={e => setFormData({ ...formData, classes: e.target.value })}
                placeholder="Nursery to 12th"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Student Strength</label>
              <input
                type="number"
                value={formData.studentCount}
                onChange={e => setFormData({ ...formData, studentCount: e.target.value })}
                placeholder="2500"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Contact Coordinator</label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="Principal / Admin Head"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">School Commission Share</label>
              <input
                type="text"
                value={formData.commissionShare}
                onChange={e => setFormData({ ...formData, commissionShare: e.target.value })}
                placeholder="5%"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Official Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="admin@school.edu.in"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Official Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 11 2600 0000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow outline-hidden"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.exclusiveKit}
                onChange={e => setFormData({ ...formData, exclusiveKit: e.target.checked })}
                className="w-4 h-4 text-teal-800 rounded-md focus:ring-brand-yellow"
              />
              <span className="text-xs font-semibold text-gray-700">
                Offer Verified Exclusive School Kits (Uniform + Books combo)
              </span>
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.2 text-xs font-bold bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 size={15} />
              <span>{school ? 'Update School' : 'Onboard School'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
