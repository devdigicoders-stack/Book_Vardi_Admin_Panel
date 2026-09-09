import React, { useState } from 'react';
import { X, HelpCircle, Send, CheckCircle2 } from 'lucide-react';

export default function TicketModal({ isOpen, onClose, ticket, onReply, onUpdateStatus }) {
  const [replyText, setReplyText] = useState('');

  if (!isOpen || !ticket) return null;

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onReply(ticket.id, replyText.trim());
    setReplyText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200">
        
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
              <HelpCircle size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base text-gray-900">Ticket #{ticket.id}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  ticket.priority === 'High' ? 'bg-red-100 text-red-800' :
                  ticket.priority === 'Medium' ? 'bg-amber-100 text-amber-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {ticket.priority}
                </span>
              </div>
              <p className="text-xs text-gray-500">{ticket.customerName} ({ticket.email})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Subject & Details */}
          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
            <div className="text-xs font-bold text-gray-800">{ticket.subject}</div>
            {ticket.orderId && (
              <div className="text-[11px] text-teal-700 font-semibold">Associated Order: {ticket.orderId}</div>
            )}
            <div className="text-xs text-gray-600 pt-1 leading-relaxed">{ticket.lastMessage}</div>
          </div>

          {/* Status Changer */}
          <div className="flex items-center justify-between gap-3 p-3 bg-teal-50/60 rounded-xl border border-teal-100">
            <span className="text-xs font-bold text-teal-950">Ticket Lifecycle Status:</span>
            <select
              value={ticket.status}
              onChange={e => onUpdateStatus(ticket.id, e.target.value)}
              className="bg-white border border-teal-200 text-xs font-bold rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-brand-yellow outline-hidden cursor-pointer"
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Reply Form */}
          <form onSubmit={handleSendReply} className="space-y-3">
            <label className="block text-xs font-bold text-gray-700">Official Admin Response</label>
            <textarea
              rows="3"
              required
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Type your response to the customer/seller..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Send size={13} /> Send Official Reply
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
