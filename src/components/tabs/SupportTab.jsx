import React, { useState } from 'react';
import { 
  HelpCircle, 
  Search, 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Plus, 
  ChevronRight,
  Send,
  Trash2
} from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';
import TicketModal from '../modals/TicketModal';

export default function SupportTab() {
  const { supportTickets, updateTicketStatus, replyTicket, logAudit } = useAdminData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Platform FAQs
  const [faqs, setFaqs] = useState([
    { id: 1, question: 'How do I identify my child’s specific school uniform size?', answer: 'Refer to our interactive School Size Guide on the product page with chest and length measurements in inches.' },
    { id: 2, question: 'What is the return window for defective books or wrong shoe sizes?', answer: 'We provide a 30-day hassle-free return and doorstep pickup for all school uniform and footwear orders.' },
    { id: 3, question: 'Are NCERT textbooks the latest 2026 revised print edition?', answer: 'Yes, 100% of books shipped through Book Vardi are authentic, verified latest board revisions.' }
  ]);

  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

  const filteredTickets = supportTickets.filter(t => {
    const matchesSearch = t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenTicket = (ticket) => {
    setSelectedTicket(ticket);
    setModalOpen(true);
  };

  const handleAddFaq = (e) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    setFaqs(prev => [...prev, { id: Date.now(), question: newQuestion.trim(), answer: newAnswer.trim() }]);
    logAudit('FAQ Added', `Published customer FAQ: "${newQuestion}"`);
    setNewQuestion('');
    setNewAnswer('');
  };

  const handleDeleteFaq = (id) => {
    setFaqs(prev => prev.filter(f => f.id !== id));
    logAudit('FAQ Removed', `Deleted FAQ #${id}`);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-2xl text-gray-900 flex items-center gap-2">
            <HelpCircle className="text-teal-700" size={24} /> Support Helpdesk & FAQ Manager
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Resolve student, parent & school inquiries, expedite size exchanges, and maintain the knowledgebase.
          </p>
        </div>

        <div className="text-xs text-gray-600 bg-teal-50 px-3.5 py-1.5 rounded-xl border border-teal-100 font-semibold">
          Open Inquiries: <span className="font-extrabold text-teal-900">
            {supportTickets.filter(t => t.status === 'Open').length}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search ticket by ID, subject, customer..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 bg-white focus:ring-2 focus:ring-brand-yellow outline-hidden cursor-pointer"
          >
            <option value="all">All Ticket Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-display font-bold text-sm text-gray-900">Active Customer Tickets</h3>
          <span className="text-xs text-gray-400">{filteredTickets.length} Total</span>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => handleOpenTicket(ticket)}
              className="p-4 hover:bg-gray-50/80 transition-colors cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-gray-900">{ticket.subject}</span>
                    <span className={`px-2 py-0.2 rounded-md text-[9px] font-extrabold uppercase ${
                      ticket.priority === 'High' ? 'bg-rose-100 text-rose-800' :
                      ticket.priority === 'Medium' ? 'bg-amber-100 text-amber-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    {ticket.customerName} ({ticket.email}) • Category: {ticket.category} • {ticket.created}
                  </div>
                  <div className="text-xs text-gray-600 line-clamp-1 mt-1 font-medium">
                    {ticket.lastMessage}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  ticket.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                  ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {ticket.status}
                </span>
                <ChevronRight size={15} className="text-gray-400" />
              </div>
            </div>
          ))}

          {filteredTickets.length === 0 && (
            <div className="py-12 text-center text-gray-400 text-xs">
              No support tickets found.
            </div>
          )}
        </div>
      </div>

      {/* Customer Knowledgebase / FAQ Manager */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4">
        <h3 className="font-display font-bold text-base text-gray-900">
          Knowledgebase & Parent FAQs
        </h3>

        {/* Existing FAQs */}
        <div className="space-y-2.5">
          {faqs.map(faq => (
            <div key={faq.id} className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex items-start justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="font-bold text-gray-900">{faq.question}</div>
                <div className="text-gray-600 leading-relaxed">{faq.answer}</div>
              </div>
              <button
                onClick={() => handleDeleteFaq(faq.id)}
                className="p-1 text-gray-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Add FAQ Form */}
        <form onSubmit={handleAddFaq} className="space-y-3 pt-3 border-t border-gray-100">
          <div className="font-bold text-xs text-gray-700">Add New FAQ to Storefront</div>
          <input
            type="text"
            required
            value={newQuestion}
            onChange={e => setNewQuestion(e.target.value)}
            placeholder="Frequently Asked Question (e.g. Do you provide school bulk embroidery?)..."
            className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-yellow outline-hidden"
          />
          <textarea
            rows="2"
            required
            value={newAnswer}
            onChange={e => setNewAnswer(e.target.value)}
            placeholder="Official Answer..."
            className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-yellow outline-hidden resize-none"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Publish FAQ
          </button>
        </form>
      </div>

      {/* Ticket Modal */}
      <TicketModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        ticket={selectedTicket}
        onReply={replyTicket}
        onUpdateStatus={updateTicketStatus}
      />

    </div>
  );
}
