import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  UserCheck, 
  ShoppingBag, 
  GraduationCap,
  Calendar
} from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';

export default function UsersTab() {
  const { users, toggleUserStatus, isEditor } = useAdminData();
  const canEdit = isEditor ? isEditor('users') : true;
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.phone.includes(searchTerm) ||
                          (u.schoolLinked && u.schoolLinked.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'all' || u.role.includes(roleFilter);
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-2xl text-gray-900 flex items-center gap-2">
            <Users className="text-teal-700" size={24} /> Platform Customers & Users
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage student & parent accounts, verify institutional associations, monitor purchase history & control access.
          </p>
        </div>

        <div className="text-xs text-gray-600 bg-teal-50 px-3.5 py-1.5 rounded-xl border border-teal-100 font-semibold">
          Registered Accounts: <span className="font-extrabold text-teal-900">{users.length}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by customer name, email, phone or school..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 bg-white focus:ring-2 focus:ring-brand-yellow outline-hidden cursor-pointer"
          >
            <option value="all">All User Roles</option>
            <option value="Parent">Parents</option>
            <option value="Student">Students</option>
            <option value="Teacher">Teachers</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Affiliated School</th>
                <th className="px-4 py-3">Orders & Spend</th>
                <th className="px-4 py-3">Joined Date</th>
                <th className="px-4 py-3">Account Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/70 transition-colors">
                  
                  {/* Name & Contact */}
                  <td className="px-4 py-3">
                    <div className="font-bold text-gray-900">{user.name}</div>
                    <div className="text-[11px] text-gray-500">{user.email} • {user.phone}</div>
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-100">
                      {user.role}
                    </span>
                  </td>

                  {/* School */}
                  <td className="px-4 py-3 max-w-xs truncate font-semibold text-gray-800">
                    {user.schoolLinked || 'Unlinked / Direct'}
                  </td>

                  {/* Orders & Spend */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-bold text-gray-900 font-display">₹{user.totalSpent?.toLocaleString() || 0}</div>
                    <div className="text-[10px] text-gray-400">{user.ordersCount || 0} purchases</div>
                  </td>

                  {/* Joined Date */}
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-[11px]">
                    {user.joinedDate}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      user.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {canEdit ? (
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          user.status === 'Active' 
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' 
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {user.status === 'Active' ? 'Suspend Account' : 'Activate Account'}
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                        View-Only
                      </span>
                    )}
                  </td>

                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-gray-400 text-xs">
                    No registered customers found.
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
