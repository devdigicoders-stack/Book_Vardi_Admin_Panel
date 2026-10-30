import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ADMIN_TABS } from './Sidebar';
import { useAdminData } from '../context/AdminDataContext';
import { TAB_ROUTE_MAP, getTabFromPath } from '../constants/routes';

export default function MobileNav({ activeTab, onSelectTab }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { canViewTab } = useAdminData();
  
  const currentTab = activeTab || getTabFromPath(location.pathname);
  const allTabs = ADMIN_TABS.flatMap(section => section.items).filter(t => canViewTab ? canViewTab(t.id) : true);

  const handleTabClick = (tab) => {
    if (onSelectTab) onSelectTab(tab.id);
    const targetPath = tab.path || TAB_ROUTE_MAP[tab.id] || `/${tab.id}`;
    navigate(targetPath);
  };

  return (
    <div className="lg:hidden bg-white sticky top-14 z-30 shadow-xs border-b border-gray-200">
      <div className="px-4 overflow-x-auto no-scrollbar">
        <nav className="flex space-x-1.5 py-2.5">
          {allTabs.map((tab) => {
            const isCurrent = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
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
