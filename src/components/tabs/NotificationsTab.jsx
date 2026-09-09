import React, { useState } from 'react';
import { 
  Bell, 
  Send, 
  Mail, 
  Smartphone, 
  Megaphone, 
  CheckCheck, 
  Trash2,
  CheckCircle2,
  Users
} from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';

export default function NotificationsTab() {
  const { 
    notifications, 
    broadcastNotification, 
    markNotificationRead, 
    clearAllNotifications 
  } = useAdminData();

  const [channel, setChannel] = useState('Push'); // Push, Email, SMS
  const [audience, setAudience] = useState('all'); // all, sellers, schools
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sentAlert, setSentAlert] = useState('');

  const handleBroadcast = (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    broadcastNotification({
      title: title.trim(),
      message: message.trim(),
      type: channel.toLowerCase()
    });

    setSentAlert(`Dispatched ${channel} broadcast to ${audience === 'all' ? 'All Platform Users' : audience === 'sellers' ? 'All Merchants' : 'All Partner Schools'}`);
    setTitle('');
    setMessage('');
    setTimeout(() => setSentAlert(''), 5000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-2xl text-gray-900 flex items-center gap-2">
            <Bell className="text-teal-700" size={24} /> Communications & Notification Hub
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Broadcast official platform alerts, order tracking SMS, emergency school notices & merchant updates.
          </p>
        </div>

        <button
          onClick={clearAllNotifications}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
        >
          <CheckCheck size={14} /> Mark All as Read
        </button>
      </div>

      {sentAlert && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{sentAlert}</span>
        </div>
      )}

      {/* Grid: Broadcast Composer & History Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Broadcast Composer */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4">
          <h3 className="font-display font-bold text-base text-gray-900 flex items-center gap-2">
            <Send size={16} className="text-teal-700" /> Send Broadcast Announcement
          </h3>

          <form onSubmit={handleBroadcast} className="space-y-4">
            {/* Delivery Channel */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Communication Medium</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Push', icon: <Megaphone size={13} /> },
                  { id: 'Email', icon: <Mail size={13} /> },
                  { id: 'SMS', icon: <Smartphone size={13} /> }
                ].map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setChannel(c.id)}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      channel === c.id 
                        ? 'bg-teal-800 text-white shadow-xs' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {c.icon} <span>{c.id}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Audience */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Target Audience</label>
              <select
                value={audience}
                onChange={e => setAudience(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold focus:ring-2 focus:ring-brand-yellow outline-hidden bg-white"
              >
                <option value="all">Everyone (All Students, Parents & Sellers)</option>
                <option value="sellers">Verified Merchants Only</option>
                <option value="schools">Partner School Coordinators</option>
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Announcement Subject *</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Back-to-School Stock Clearance Announced"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Message Body *</label>
              <textarea
                rows="4"
                required
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Type the message content that will appear on devices or inboxes..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Send size={14} /> Send Broadcast Now
            </button>
          </form>
        </div>

        {/* Right: Notification History Feed */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-gray-900">
              Platform Alerts & Activity Feed
            </h3>
            <span className="text-xs text-gray-400">
              {notifications.filter(n => n.unread).length} Unread
            </span>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto no-scrollbar">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markNotificationRead(notif.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  notif.unread 
                    ? 'bg-teal-50/50 border-teal-200' 
                    : 'bg-white border-gray-100 hover:bg-gray-50'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-gray-900">{notif.title}</span>
                    {notif.unread && (
                      <span className="w-2 h-2 rounded-full bg-brand-yellow"></span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 leading-snug">{notif.message}</p>
                  <div className="text-[10px] text-gray-400 font-semibold">{notif.date}</div>
                </div>

                <span className="text-[10px] font-mono uppercase font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md shrink-0">
                  {notif.type}
                </span>
              </div>
            ))}

            {notifications.length === 0 && (
              <div className="py-12 text-center text-gray-400 text-xs">
                No notification alerts currently logged.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
