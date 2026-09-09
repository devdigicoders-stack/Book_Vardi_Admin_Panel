import React, { useState } from 'react';
import { 
  MessageSquareWarning, 
  Star, 
  CheckCircle, 
  EyeOff, 
  Trash2, 
  AlertTriangle,
  Search,
  Filter
} from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';

export default function ReviewsTab() {
  const { reviews, approveReview, hideReview, deleteReview } = useAdminData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, flagged, approved

  const filteredReviews = reviews.filter(r => {
    const matchesSearch = r.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.comment.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterType === 'flagged') return matchesSearch && (r.reported || r.status === 'Flagged for Moderation');
    if (filterType === 'approved') return matchesSearch && r.status === 'Approved';
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-2xl text-gray-900 flex items-center gap-2">
            <MessageSquareWarning className="text-teal-700" size={24} /> Content Moderation & Reviews
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Audit customer product ratings, investigate counterfeit or defect complaints, and protect brand integrity.
          </p>
        </div>

        <div className="text-xs text-gray-600 bg-amber-50 px-3.5 py-1.5 rounded-xl border border-amber-200 font-semibold text-amber-900">
          Flagged Complaints: <span className="font-extrabold">{reviews.filter(r => r.reported).length}</span>
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
            placeholder="Search reviews by customer, product or text..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'all' ? 'bg-teal-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Reviews ({reviews.length})
          </button>
          <button
            onClick={() => setFilterType('flagged')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'flagged' ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Reported / Flagged ({reviews.filter(r => r.reported || r.status === 'Flagged for Moderation').length})
          </button>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3.5">
        {filteredReviews.map((review) => (
          <div
            key={review.id}
            className={`bg-white rounded-2xl p-5 border shadow-xs transition-all ${
              review.reported ? 'border-rose-300 bg-rose-50/20' : 'border-gray-200/80'
            }`}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-sm">
                  {review.customerName?.charAt(0) || 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-gray-900">{review.customerName}</span>
                    <span className="text-[10px] text-gray-400">• {review.date}</span>
                    {review.reported && (
                      <span className="px-2 py-0.2 rounded-md text-[9px] font-extrabold bg-rose-100 text-rose-800 flex items-center gap-1">
                        <AlertTriangle size={10} /> Reported: {review.reportReason || 'Complaint'}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-semibold text-teal-900 mt-0.5">
                    Product: {review.productName}
                  </div>
                </div>
              </div>

              {/* Star Rating Badge */}
              <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      className={i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-amber-900 ml-1">{review.rating}.0</span>
              </div>
            </div>

            {/* Comment Body */}
            <p className="text-xs text-gray-700 leading-relaxed bg-gray-50/70 p-3 rounded-xl border border-gray-100">
              "{review.comment}"
            </p>

            {/* Moderation Actions */}
            <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                review.status === 'Approved' ? 'text-emerald-700' :
                review.status === 'Hidden' ? 'text-gray-400' : 'text-rose-600'
              }`}>
                Status: {review.status}
              </span>

              <div className="flex items-center gap-2">
                {review.status !== 'Approved' && (
                  <button
                    onClick={() => approveReview(review.id)}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <CheckCircle size={13} /> Approve & Publish
                  </button>
                )}

                {review.status !== 'Hidden' && (
                  <button
                    onClick={() => hideReview(review.id)}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <EyeOff size={13} /> Hide from Store
                  </button>
                )}

                <button
                  onClick={() => deleteReview(review.id)}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Trash2 size={13} /> Delete Review
                </button>
              </div>
            </div>

          </div>
        ))}

        {filteredReviews.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400 text-xs">
            No customer reviews found matching your search.
          </div>
        )}
      </div>

    </div>
  );
}
