import React, { useState } from 'react';
import { 
  Box, 
  Search, 
  AlertTriangle, 
  Download, 
  Plus, 
  CheckCircle2, 
  RefreshCw,
  Store
} from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';
import { exportToExcel } from '../../utils/excelExporter';

export default function InventoryTab() {
  const { products, inventory = [], inventoryMetrics = {}, quickRestock, updateInventoryStock, logAudit } = useAdminData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, low, out
  const [restockingId, setRestockingId] = useState(null);
  const [editingStockId, setEditingStockId] = useState(null);
  const [customStockValue, setCustomStockValue] = useState('');

  // Use inventory list if available, fallback to products
  const displayItems = (inventory && inventory.length > 0) ? inventory : products;

  const filteredItems = displayItems.filter(p => {
    const stock = p.stockQuantity ?? p.stock ?? 50;
    const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (p.sellerName && p.sellerName.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filterType === 'low') return matchesSearch && stock > 0 && stock <= 10;
    if (filterType === 'out') return matchesSearch && stock === 0;
    return matchesSearch;
  });

  const lowStockCount = inventoryMetrics?.lowStockCount !== undefined
    ? inventoryMetrics.lowStockCount
    : displayItems.filter(p => (p.stockQuantity ?? p.stock ?? 50) > 0 && (p.stockQuantity ?? p.stock ?? 50) <= 10).length;

  const outOfStockCount = inventoryMetrics?.outOfStockCount !== undefined
    ? inventoryMetrics.outOfStockCount
    : displayItems.filter(p => (p.stockQuantity ?? p.stock ?? 50) === 0).length;

  const handleQuickRestock = async (prodId, addQty = 50) => {
    setRestockingId(prodId);
    try {
      if (quickRestock) {
        await quickRestock(prodId, addQty);
      }
    } finally {
      setRestockingId(null);
    }
  };

  const handleStartEditStock = (item) => {
    setEditingStockId(item.id || item._id);
    setCustomStockValue(String(item.stockQuantity ?? item.stock ?? 0));
  };

  const handleSaveStock = async (prodId) => {
    const val = parseInt(customStockValue, 10);
    if (!isNaN(val) && val >= 0) {
      if (updateInventoryStock) {
        await updateInventoryStock(prodId, val);
      }
    }
    setEditingStockId(null);
  };

  const exportExcelReport = () => {
    const data = products.map(p => ({
      'Product ID': p.id,
      'SKU': p.sku || `SKU-${p.id}`,
      'Product Name': p.name,
      'Category': p.category,
      'Seller': p.sellerName || 'Direct',
      'Price (INR)': p.price,
      'MRP (INR)': p.originalPrice || p.price,
      'Stock Level': p.stockQuantity ?? 50,
      'Stock Status': (p.stockQuantity ?? 50) === 0 ? 'Out of Stock' : (p.stockQuantity ?? 50) <= 10 ? 'Low Stock Alert' : 'Healthy'
    }));

    exportToExcel(data, `BookVardi_Inventory_Report_${new Date().toISOString().slice(0, 10)}`, 'Marketplace_Inventory');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-2xl text-gray-900 flex items-center gap-2">
            <Box className="text-teal-700" size={24} /> Stock & Inventory Health
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Monitor real-time warehouse counts across all vendors, reorder thresholds, and export inventory spreadsheets.
          </p>
        </div>

        <button
          onClick={exportExcelReport}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Download size={15} /> Export Inventory (Excel)
        </button>
      </div>

      {/* Stock Health Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          onClick={() => setFilterType('all')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filterType === 'all' ? 'border-teal-700 bg-teal-50/80 shadow-xs' : 'border-gray-200 bg-white hover:bg-gray-50'
          }`}
        >
          <span className="text-[11px] font-bold text-gray-500">Total Tracked SKUs</span>
          <div className="font-display font-extrabold text-2xl text-gray-900 mt-1">{(inventoryMetrics?.totalProducts !== undefined && inventoryMetrics?.totalProducts > 0) ? inventoryMetrics.totalProducts : displayItems.length} Items</div>
        </div>

        <div 
          onClick={() => setFilterType('low')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filterType === 'low' ? 'border-amber-500 bg-amber-50/80 shadow-xs' : 'border-gray-200 bg-white hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800">Low Stock Reorders</span>
            <AlertTriangle size={16} className="text-amber-600" />
          </div>
          <div className="font-display font-extrabold text-2xl text-amber-900 mt-1">{lowStockCount} SKUs</div>
        </div>

        <div 
          onClick={() => setFilterType('out')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filterType === 'out' ? 'border-rose-500 bg-rose-50/80 shadow-xs' : 'border-gray-200 bg-white hover:bg-gray-50'
          }`}
        >
          <span className="text-[11px] font-bold text-rose-800">Out of Stock</span>
          <div className="font-display font-extrabold text-2xl text-rose-900 mt-1">{outOfStockCount} SKUs</div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs flex items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search inventory by title, SKU, or seller..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">Product SKU & Title</th>
                <th className="px-4 py-3">Vendor / Merchant</th>
                <th className="px-4 py-3">Unit Price</th>
                <th className="px-4 py-3">Stock Units</th>
                <th className="px-4 py-3">Stock Health</th>
                <th className="px-4 py-3 text-right">Quick Restock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredItems.map((item) => {
                const stock = item.stockQuantity ?? 50;
                return (
                  <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                    
                    {/* Title & SKU */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                        />
                        <div>
                          <div className="font-bold text-gray-900 truncate max-w-xs">{item.name}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{item.sku || `SKU-${item.id}`}</div>
                        </div>
                      </div>
                    </td>

                    {/* Merchant */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-gray-800 flex items-center gap-1">
                        <Store size={12} className="text-teal-700" />
                        <span>{item.sellerName || 'Direct Marketplace'}</span>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3 whitespace-nowrap font-bold text-gray-900">
                      ₹{item.price}
                    </td>

                    {/* Stock Units */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {editingStockId === (item.id || item._id) ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={customStockValue}
                            onChange={(e) => setCustomStockValue(e.target.value)}
                            className="w-16 px-2 py-0.5 border border-teal-500 rounded text-xs font-bold text-gray-900 outline-hidden"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveStock(item.id || item._id);
                              if (e.key === 'Escape') setEditingStockId(null);
                            }}
                          />
                          <button
                            onClick={() => handleSaveStock(item.id || item._id)}
                            className="p-1 bg-teal-700 text-white rounded hover:bg-teal-800 cursor-pointer"
                            title="Save"
                          >
                            <CheckCircle2 size={13} />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => handleStartEditStock(item)}
                          className="cursor-pointer group flex items-center gap-1.5"
                          title="Click to adjust stock"
                        >
                          <span className="font-extrabold text-sm text-gray-900 group-hover:text-teal-700">{stock}</span>
                          <span className="text-[11px] text-gray-400">in warehouse</span>
                          <span className="text-[10px] text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity font-semibold underline">Edit</span>
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {stock === 0 ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800">
                          Out of Stock
                        </span>
                      ) : stock <= 10 ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                          Low Stock ({stock})
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                          Adequate
                        </span>
                      )}
                    </td>

                    {/* Quick Restock Action */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          disabled={restockingId === (item.id || item._id)}
                          onClick={() => handleQuickRestock(item.id || item._id, 25)}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          +25
                        </button>
                        <button
                          disabled={restockingId === (item.id || item._id)}
                          onClick={() => handleQuickRestock(item.id || item._id, 50)}
                          className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 disabled:opacity-50 text-teal-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          +50
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center text-gray-400 text-xs">
                    No items found matching the inventory criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
