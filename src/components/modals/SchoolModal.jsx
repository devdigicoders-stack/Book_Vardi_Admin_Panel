import useModalBackTrap from '../../hooks/useModalBackTrap';
import React, { useState, useEffect } from 'react';
import { X, GraduationCap, CheckCircle2, MapPin, LocateFixed, Search, AlertTriangle, RefreshCw } from 'lucide-react';
import { resolveCityCoordinates, fetchOnlineCoordinates } from '../../utils/geoCoordinates';

export default function SchoolModal({ isOpen, onClose, onSave, school = null }) {
  useModalBackTrap(isOpen, onClose);
  const [formData, setFormData] = useState({
    name: '',
    board: 'CBSE',
    city: '',
    lat: '',
    lng: '',
    classes: 'Nursery to 12th',
    studentCount: '2500',
    contactPerson: '',
    email: '',
    phone: '',
    commissionShare: '0%',
    exclusiveKit: true
  });

  const [geoStatus, setGeoStatus] = useState(null); // { type: 'success' | 'warning' | 'info' | 'error', message: string }
  const [isLocating, setIsLocating] = useState(false);
  const [hasManuallyEditedGps, setHasManuallyEditedGps] = useState(false);

  useEffect(() => {
    if (school) {
      const initialLat = school.lat !== undefined && school.lat !== null ? school.lat : '';
      const initialLng = school.lng !== undefined && school.lng !== null ? school.lng : '';
      
      setFormData({
        name: school.name || '',
        board: school.board || 'CBSE',
        city: school.city || '',
        district: school.district || '',
        subdistrict: school.subdistrict || '',
        lat: initialLat,
        lng: initialLng,
        classes: Array.isArray(school.classes) 
          ? school.classes.join(', ') 
          : (school.classes || 'Nursery, LKG, UKG, Class 1, Class 2, Class 3, Class 4, Class 5, Class 6, Class 7, Class 8, Class 9, Class 10, Class 11, Class 12'),
        studentCount: school.studentCount || '2500',
        contactPerson: school.contactPerson || '',
        email: school.email || '',
        phone: school.phone || '',
        commissionShare: (school.commissionShare !== undefined && school.commissionShare !== null && school.commissionShare !== '')
          ? String(school.commissionShare)
          : '0%',
        exclusiveKit: school.exclusiveKit !== false,
        status: school.status || 'Partner Active'
      });
      setHasManuallyEditedGps(false);
      setGeoStatus(null);
    } else {
      setFormData({
        name: '',
        board: 'CBSE',
        city: '',
        district: '',
        subdistrict: '',
        lat: '',
        lng: '',
        classes: 'Nursery, LKG, UKG, Class 1, Class 2, Class 3, Class 4, Class 5, Class 6, Class 7, Class 8, Class 9, Class 10, Class 11, Class 12',
        studentCount: '2500',
        contactPerson: '',
        email: '',
        phone: '',
        commissionShare: '0%',
        exclusiveKit: true,
        status: 'Partner Active'
      });
      setHasManuallyEditedGps(false);
      setGeoStatus(null);
    }
  }, [school, isOpen]);

  if (!isOpen) return null;

  // Auto-resolve coordinates when city is typed
  const handleCityChange = (e) => {
    const val = e.target.value;
    setFormData(prev => {
      const updated = { ...prev, city: val };
      
      // If user hasn't explicitly customized GPS numbers, auto-match known Indian city
      if (!hasManuallyEditedGps && val.trim().length >= 3) {
        const matched = resolveCityCoordinates(val);
        if (matched) {
          updated.lat = matched.lat;
          updated.lng = matched.lng;
          setGeoStatus({
            type: 'success',
            message: `📍 GPS auto-set for ${matched.name || val}: ${matched.lat}, ${matched.lng}`
          });
        }
      }
      return updated;
    });
  };

  // Explicit GPS auto-detection from City or School Name
  const handleAutoGeocode = async (overrideCity = null) => {
    const targetCity = (overrideCity || formData.city || '').trim();
    const targetName = (formData.name || '').trim();

    if (!targetCity && !targetName) {
      setGeoStatus({
        type: 'warning',
        message: 'Please enter a City or School name first to detect GPS.'
      });
      return;
    }

    setIsLocating(true);
    setGeoStatus({ type: 'info', message: 'Detecting GPS coordinates...' });

    // 1. First check offline dictionary for instant response
    const offlineMatch = resolveCityCoordinates(targetCity) || resolveCityCoordinates(targetName);
    if (offlineMatch) {
      setFormData(prev => ({
        ...prev,
        lat: offlineMatch.lat,
        lng: offlineMatch.lng
      }));
      setHasManuallyEditedGps(false);
      setIsLocating(false);
      setGeoStatus({
        type: 'success',
        message: `✓ Instant GPS set for ${offlineMatch.name || targetCity}: ${offlineMatch.lat}, ${offlineMatch.lng}`
      });
      return;
    }

    // 2. Query online geocoding if not in offline dictionary
    const query = targetName && targetCity ? `${targetName}, ${targetCity}` : (targetCity || targetName);
    const onlineResult = await fetchOnlineCoordinates(query);

    setIsLocating(false);
    if (onlineResult && onlineResult.lat && onlineResult.lng) {
      setFormData(prev => ({
        ...prev,
        lat: onlineResult.lat,
        lng: onlineResult.lng
      }));
      setHasManuallyEditedGps(false);
      setGeoStatus({
        type: 'success',
        message: `✓ Online GPS detected: ${onlineResult.lat}, ${onlineResult.lng}`
      });
    } else {
      setGeoStatus({
        type: 'error',
        message: `Could not locate "${query}". Please enter Latitude & Longitude manually.`
      });
    }
  };

  // Use current browser device location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus({ type: 'warning', message: 'Geolocation is not supported by your browser.' });
      return;
    }

    setIsLocating(true);
    setGeoStatus({ type: 'info', message: 'Fetching device GPS coordinates...' });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = parseFloat(pos.coords.latitude.toFixed(4));
        const lng = parseFloat(pos.coords.longitude.toFixed(4));
        setFormData(prev => ({ ...prev, lat, lng }));
        setHasManuallyEditedGps(false);
        setGeoStatus({
          type: 'success',
          message: `🎯 Current device location set: ${lat}, ${lng}`
        });
      },
      (err) => {
        setIsLocating(false);
        setGeoStatus({
          type: 'error',
          message: `Location permission denied or unavailable: ${err.message}`
        });
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Detect if an existing school has Delhi default coordinates while being in a different city
  const numLat = parseFloat(formData.lat);
  const numLng = parseFloat(formData.lng);
  const isDelhiDefaultCoords = (Math.abs(numLat - 28.6139) < 0.001 && Math.abs(numLng - 77.2090) < 0.001);
  const isCityNotDelhi = formData.city && !formData.city.toLowerCase().includes('delhi');
  const needsGpsCorrection = isDelhiDefaultCoords && isCityNotDelhi;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    // Fallback coordinate resolution if empty before saving
    let finalLat = parseFloat(formData.lat);
    let finalLng = parseFloat(formData.lng);

    if (isNaN(finalLat) || isNaN(finalLng) || !finalLat || !finalLng) {
      const cityCoords = resolveCityCoordinates(formData.city) || resolveCityCoordinates(formData.name);
      if (cityCoords) {
        finalLat = cityCoords.lat;
        finalLng = cityCoords.lng;
      } else {
        // Fallback default
        finalLat = 28.6139;
        finalLng = 77.2090;
      }
    }

    const classesArray = typeof formData.classes === 'string'
      ? formData.classes.split(',').map(c => c.trim()).filter(Boolean)
      : formData.classes;

    onSave({
      ...formData,
      lat: finalLat,
      lng: finalLng,
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
              placeholder="e.g. GHE English Academy, Saharanpur"
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
                onChange={handleCityChange}
                placeholder="e.g. Saharanpur or Lucknow"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow outline-hidden"
              />
            </div>
          </div>

          {/* GPS Coordinates Section with Auto-Detection & Fix */}
          <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5">
                <MapPin size={13} className="text-teal-700" /> GPS Location Coordinates
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAutoGeocode()}
                  disabled={isLocating}
                  className="px-2 py-1 text-[10px] font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-md border border-teal-200 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                  title="Detect GPS coordinates based on city and school name"
                >
                  <Search size={11} />
                  <span>{isLocating ? 'Locating...' : 'Auto-Detect'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isLocating}
                  className="px-2 py-1 text-[10px] font-bold text-gray-700 bg-white hover:bg-gray-100 rounded-md border border-gray-200 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                  title="Use my device's current location GPS"
                >
                  <LocateFixed size={11} />
                  <span>My GPS</span>
                </button>
              </div>
            </div>

            {/* Warning if Default Delhi Coordinates were saved for a different city */}
            {needsGpsCorrection && (
              <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2">
                <div className="flex items-start gap-1.5">
                  <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[11px]">Delhi GPS (28.6139, 77.2090) detected for {formData.city}</p>
                    <p className="text-[10px] text-amber-700">Radius filtering will hide this school from users in {formData.city}.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleAutoGeocode(formData.city)}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[10px] rounded shadow-xs shrink-0 cursor-pointer"
                >
                  Fix for {formData.city}
                </button>
              </div>
            )}

            {/* Geocode feedback status message */}
            {geoStatus && (
              <div className={`p-2 rounded-lg text-[11px] font-medium flex items-center gap-1.5 ${
                geoStatus.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : geoStatus.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}>
                {geoStatus.type === 'success' ? <CheckCircle2 size={13} className="shrink-0" /> : <RefreshCw size={12} className="shrink-0" />}
                <span>{geoStatus.message}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">
                  Latitude (GPS)
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.lat}
                  onChange={e => {
                    setFormData({ ...formData, lat: e.target.value });
                    setHasManuallyEditedGps(true);
                  }}
                  placeholder="e.g. 29.9640"
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs bg-white font-mono focus:ring-2 focus:ring-brand-yellow outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">
                  Longitude (GPS)
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.lng}
                  onChange={e => {
                    setFormData({ ...formData, lng: e.target.value });
                    setHasManuallyEditedGps(true);
                  }}
                  placeholder="e.g. 77.5460"
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs bg-white font-mono focus:ring-2 focus:ring-brand-yellow outline-hidden"
                />
              </div>
            </div>

            <div className="text-[10px] text-gray-500 leading-relaxed">
              Coordinates are matched against the user's location to display nearby schools within the active discovery radius.
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
                placeholder="0%"
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

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Partnership & Approval Status</label>
            <select
              value={formData.status || 'Partner Active'}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow outline-hidden"
            >
              <option value="Partner Active">Partner Active (Approved & Verified)</option>
              <option value="pending">Pending Review (Awaiting Admin Approval)</option>
              <option value="inactive">Inactive</option>
            </select>
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
