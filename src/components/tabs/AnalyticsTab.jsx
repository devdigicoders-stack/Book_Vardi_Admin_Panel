import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Users, 
  ShoppingBag, 
  GraduationCap,
  Percent,
  ArrowUpRight
} from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';

export default function AnalyticsTab() {
  const { sellers, orders, schools, products } = useAdminData();

  const monthlySales = [
    { month: 'Apr', gmv: 320000, orders: 410 },
    { month: 'May', gmv: 540000, orders: 690 },
    { month: 'Jun', gmv: 890000, orders: 1120 }, // Back to school peak
    { month: 'Jul', gmv: 780000, orders: 980 },
    { month: 'Aug', gmv: 620000, orders: 740 },
    { month: 'Sep (MTD)', gmv: 420000, orders: 510 }
  ];

  const maxGMV = Math.max(...monthlySales.map(m => m.gmv));

  const categoryBreakdown = [
    { name: 'School Uniforms & Dress Sets', share: 48, gmv: '₹17.2L', color: 'bg-teal-700' },
    { name: 'NCERT & Syllabus Textbooks', share: 26, gmv: '₹9.4L', color: 'bg-brand-yellow' },
    { name: 'Sports Shoes & PT Tracksuits', share: 14, gmv: '₹5.0L', color: 'bg-brand-pink' },
    { name: 'Stationery, Bags & Drawing Kits', share: 12, gmv: '₹4.3L', color: 'bg-brand-blue' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="font-display font-extrabold text-2xl text-gray-900 flex items-center gap-2">
          <BarChart3 className="text-teal-700" size={24} /> Marketplace Analytics & BI
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Comprehensive performance breakdown of gross sales, customer retention, channel contribution & category drivers.
        </p>
      </div>

      {/* Top Stat Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs">
          <div className="text-[11px] font-bold text-gray-400 uppercase">Average Order Value (AOV)</div>
          <div className="font-display font-extrabold text-2xl text-gray-900 mt-1">₹892</div>
          <div className="text-[10px] font-semibold text-emerald-600 mt-1">+8.5% year-over-year</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs">
          <div className="text-[11px] font-bold text-gray-400 uppercase">Repeat Customer Rate</div>
          <div className="font-display font-extrabold text-2xl text-teal-800 mt-1">42.8%</div>
          <div className="text-[10px] font-semibold text-emerald-600 mt-1">High parent loyalty</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs">
          <div className="text-[11px] font-bold text-gray-400 uppercase">Return & Exchange Rate</div>
          <div className="font-display font-extrabold text-2xl text-rose-800 mt-1">1.8%</div>
          <div className="text-[10px] font-semibold text-emerald-600 mt-1">Well below 5% industry avg</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs">
          <div className="text-[11px] font-bold text-gray-400 uppercase">Order Fulfillment SLA</div>
          <div className="font-display font-extrabold text-2xl text-emerald-700 mt-1">98.4%</div>
          <div className="text-[10px] font-semibold text-emerald-600 mt-1">Dispatched within 24h</div>
        </div>
      </div>

      {/* Monthly Sales Trend Chart */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-base text-gray-900">Gross Monthly Platform GMV (2026)</h3>
            <p className="text-xs text-gray-500">Includes institutional seasonal peaks and retail storefront demand</p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Peak Season: June Back-to-School
          </span>
        </div>

        {/* Visual Bar Chart */}
        <div className="pt-6 pb-2 grid grid-cols-6 gap-3 items-end h-56 border-b border-gray-100">
          {monthlySales.map((item, index) => {
            const heightPercent = Math.round((item.gmv / maxGMV) * 100);
            return (
              <div key={index} className="flex flex-col items-center h-full justify-end group">
                <span className="text-[10px] font-bold text-gray-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  ₹{(item.gmv / 100000).toFixed(1)}L
                </span>
                <div
                  style={{ height: `${heightPercent}%` }}
                  className="w-full max-w-[48px] bg-teal-800 hover:bg-teal-700 rounded-t-xl transition-all duration-300 shadow-xs cursor-pointer group-hover:bg-brand-yellow"
                />
                <span className="text-[11px] font-bold text-gray-600 mt-2">{item.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Share & Vendor Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Contribution */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4">
          <h3 className="font-display font-bold text-base text-gray-900">Sales Breakdown by Product Vertical</h3>
          
          <div className="space-y-3.5">
            {categoryBreakdown.map((cat, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-800">{cat.name}</span>
                  <span className="font-semibold text-gray-600">{cat.gmv} ({cat.share}%)</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${cat.share}%` }} 
                    className={`h-full rounded-full ${cat.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Vendors */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4">
          <h3 className="font-display font-bold text-base text-gray-900">Top Verified Merchant Leaderboard</h3>

          <div className="divide-y divide-gray-100">
            {sellers.slice(0, 4).map((s, idx) => (
              <div key={s.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-teal-50 text-teal-800 font-extrabold text-[11px] flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <div>
                    <div className="font-bold text-gray-900">{s.storeName}</div>
                    <div className="text-[10px] text-gray-500">{s.city} • Rating {s.rating}★</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display font-bold text-teal-950">₹{s.totalSales?.toLocaleString() || 0}</div>
                  <div className="text-[10px] text-gray-400 font-medium">{s.totalProducts || 20} Products Listed</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
