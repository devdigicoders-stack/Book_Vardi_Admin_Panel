import React from 'react';
import { ADMIN_TABS } from './Sidebar';
import { useAdminData } from '../context/AdminDataContext';

export default function MobileNav({ activeTab, onSelectTab }) {
  const { canViewTab } = useAdminData();
  const allTabs = ADMIN_TABS.flatMap(section => section.items).filter(t => canViewTab ? canViewTab(t.id) : true);

  return (
    <div className="lg:hidden bg-white sticky top-14 z-30 shadow-xs border-b border-gray-200">
      <div className="px-4 overflow-x-auto no-scrollbar">
        <nav className="flex space-x-1.5 py-2.5">
          {allTabs.map((tab) => {
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  isCurrent
                    ? 'bg-teal-800 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
