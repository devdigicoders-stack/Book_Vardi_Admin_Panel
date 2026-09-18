import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Eye, 
  Truck, 
  CheckCircle, 
  RotateCcw, 
  Ban, 
  Building2,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';
import OrderDetailModal from '../modals/OrderDetailModal';

export default function OrdersTab() {
  const { 
    orders, 
    schoolOrders, 
    updateOrderStatus, 
    cancelOrder, 
    refundOrder, 
    updateOrderTracking,
    isEditor 
  } = useAdminData();

  const canEdit = isEditor ? isEditor('orders') : true;

  const [orderType, setOrderType] = useState('retail'); // retail, school
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Filter regular orders
  const filteredRetailOrders = orders.filter(o => {
    const matchesSearch = o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (o.trackingNumber && o.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter school bulk orders
  const filteredSchoolOrders = schoolOrders.filter(s => {
    const matchesSearch = s.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenDetail = (order) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Heading */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-2xl text-gray-900 flex items-center gap-2">
            <ShoppingBag className="text-teal-700" size={24} /> Marketplace Orders Management
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Full oversight of customer retail checkouts, institutional school bulk POs, shipment tracking & refunds.
          </p>
        </div>

        {/* Order Type Toggle */}
        <div className="bg-gray-200/80 p-1 rounded-xl flex items-center gap-1">
          <button
            onClick={() => setOrderType('retail')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              orderType === 'retail' ? 'bg-white text-teal-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Retail Orders ({orders.length})
          </button>
          <button
            onClick={() => setOrderType('school')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              orderType === 'school' ? 'bg-white text-teal-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            School Bulk Orders ({schoolOrders.length})
          </button>
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
            placeholder={orderType === 'retail' ? "Search order ID, customer or tracking..." : "Search school name or contact..."}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 bg-white focus:ring-2 focus:ring-brand-yellow outline-hidden cursor-pointer"
          >
            <option value="all">All Order Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders View */}
      {orderType === 'retail' ? (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Customer & School</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Tracking Number</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredRetailOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/70 transition-colors">
                    
                    {/* Order ID & Date */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-bold text-gray-900 font-mono">{order.id}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{order.date}</div>
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-900">{order.customerName}</div>
                      <div className="text-[10px] text-teal-700 font-medium truncate max-w-xs">{order.school}</div>
                    </td>

                    {/* Items */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-bold text-gray-800">{order.itemsCount || order.items?.length || 1} item(s)</span>
                    </td>

                    {/* Total & Payment */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-extrabold text-teal-950 font-display">₹{order.total}</div>
                      <div className="text-[10px] text-gray-500 font-semibold">{order.paymentMethod}</div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                        order.status === 'Cancelled' ? 'bg-rose-100 text-rose-800' :
                        order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>

                    {/* Tracking */}
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px] text-gray-600">
                      {order.trackingNumber || 'Unassigned'}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenDetail(order)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Eye size={13} /> View & Manage
                      </button>
                    </td>

                  </tr>
                ))}

                {filteredRetailOrders.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-4 py-12 text-center text-gray-400 text-xs">
                      No retail orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* School Bulk Orders View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSchoolOrders.map((sch) => (
            <div key={sch.id} className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">{sch.schoolName}</h4>
                    <div className="text-[11px] text-gray-500">{sch.contactPerson} • {sch.contactPhone}</div>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 text-purple-800">
                  {sch.status}
                </span>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-700">
                <div className="font-semibold text-gray-900 mb-1">Requirement Summary:</div>
                {sch.requirementSummary}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 text-center">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <div className="text-[10px] text-gray-400 font-bold uppercase">Volume</div>
                  <div className="font-bold text-xs text-gray-800 mt-0.5">{sch.quantity} Units</div>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                  <div className="text-[10px] text-gray-400 font-bold uppercase">Quoted Val</div>
                  <div className="font-bold text-xs text-emerald-700 mt-0.5">₹{sch.quoteAmount?.toLocaleString()}</div>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                  <div className="text-[10px] text-gray-400 font-bold uppercase">Target Date</div>
                  <div className="font-bold text-xs text-gray-800 mt-0.5">{sch.deadline}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        order={selectedOrder}
        onUpdateStatus={updateOrderStatus}
        onUpdateTracking={updateOrderTracking}
        onCancelOrder={cancelOrder}
        onRefundOrder={refundOrder}
        readOnly={!canEdit}
      />

    </div>
  );
}
