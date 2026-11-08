import React from 'react';
import { Home, Search, FileUp, Package, User } from 'lucide-react';
import { useCart } from '../../context/CartContext.tsx';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  orderCount?: number;
}

export const BottomNavigation: React.FC<Props> = ({ activeTab, setActiveTab, orderCount }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'catalog', label: 'Search', icon: Search },
    { id: 'prescriptions', label: 'Upload Rx', icon: FileUp },
    { id: 'orders', label: 'Orders', icon: Package, badge: orderCount },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-5 h-16 items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] transition-colors relative ${
                isActive ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.2]' : 'stroke-[1.8]'}`} />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-sky-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span className={`text-[10px] font-medium tracking-tight mt-1 ${isActive ? 'font-bold text-sky-600' : ''}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 bg-sky-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
