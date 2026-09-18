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

  // Dynamic Metrics derived from live database
  const totalOrderGMV = orders.reduce((sum, o) => sum + Number(o.totalAmount || o.total || 0), 0);
  const aov = orders.length > 0 ? Math.round(totalOrderGMV / orders.length) : 0;

  // Monthly Sales Aggregation from live orders
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonthIdx = new Date().getMonth();
  const recentMonths = [];
  for (let i = 5; i >= 0; i--) {
    const idx = (currentMonthIdx - i + 12) % 12;
    recentMonths.push(monthNames[idx]);
  }

  const monthSalesMap = {};
  recentMonths.forEach(m => {
    monthSalesMap[m] = { month: m, gmv: 0, orders: 0 };
  });

  orders.forEach(o => {
    if (o.createdAt) {
      const m = monthNames[new Date(o.createdAt).getMonth()];
      if (monthSalesMap[m]) {
        monthSalesMap[m].gmv += Number(o.totalAmount || o.total || 0);
        monthSalesMap[m].orders += 1;
      }
    }
  });

  const monthlySales = recentMonths.map(m => monthSalesMap[m]);
  const maxGMV = Math.max(...monthlySales.map(m => m.gmv), 1000);

  // Dynamic Vertical Breakdown from products
  const categoryCounts = {};
  products.forEach(p => {
    const rawCat = p.category || 'General Store';
    const cat = rawCat.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const totalProds = Math.max(products.length, 1);
  const colorPalette = ['bg-teal-700', 'bg-brand-yellow', 'bg-brand-pink', 'bg-brand-blue', 'bg-purple-600', 'bg-emerald-600'];
  
  const categoryBreakdown = Object.keys(categoryCounts).length > 0
    ? Object.entries(categoryCounts).slice(0, 4).map(([name, count], i) => ({
        name,
        share: Math.round((count / totalProds) * 100),
        gmv: `${count} Catalog Items`,
        color: colorPalette[i % colorPalette.length]
      }))
    : [{ name: 'Catalog Products', share: 100, gmv: `${products.length} Items`, color: 'bg-teal-700' }];

  const deliveredCount = orders.filter(o => o.status === 'Delivered' || o.overallStatus === 'delivered' || o.status === 'completed').length;
  const fulfillmentSLA = orders.length > 0 ? Math.round((deliveredCount / orders.length) * 100) : 100;
  const activeSellersCount = sellers.filter(s => s.status === 'Verified' || s.status === 'approved').length;

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
          <div className="font-display font-extrabold text-2xl text-gray-900 mt-1">₹{aov.toLocaleString()}</div>
          <div className="text-[10px] font-semibold text-emerald-600 mt-1">{orders.length} total orders analyzed</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs">
          <div className="text-[11px] font-bold text-gray-400 uppercase">Verified Merchant Pool</div>
          <div className="font-display font-extrabold text-2xl text-teal-800 mt-1">{activeSellersCount}</div>
          <div className="text-[10px] font-semibold text-emerald-600 mt-1">Out of {sellers.length} registered vendors</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs">
          <div className="text-[11px] font-bold text-gray-400 uppercase">Partner Institutions</div>
          <div className="font-display font-extrabold text-2xl text-purple-800 mt-1">{schools.length}</div>
          <div className="text-[10px] font-semibold text-purple-600 mt-1">Schools & Academies onboarded</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs">
          <div className="text-[11px] font-bold text-gray-400 uppercase">Order Fulfillment SLA</div>
          <div className="font-display font-extrabold text-2xl text-emerald-700 mt-1">{fulfillmentSLA}%</div>
          <div className="text-[10px] font-semibold text-emerald-600 mt-1">{deliveredCount} fulfilled successfully</div>
        </div>
      </div>

      {/* Monthly Sales Trend Chart */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-base text-gray-900">Gross Monthly Platform GMV (Live)</h3>
            <p className="text-xs text-gray-500">Includes institutional seasonal peaks and retail storefront demand</p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Total GMV: ₹{totalOrderGMV.toLocaleString()}
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
