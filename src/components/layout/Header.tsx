import React, { useState, useEffect } from 'react';
import {
  ShieldPlus,
  ShoppingCart,
  Bell,
  User as UserIcon,
  Smartphone,
  Monitor,
  LogOut,
  Stethoscope,
  Building2,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useCart } from '../../context/CartContext.tsx';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileFrame: boolean;
  setIsMobileFrame: (val: boolean) => void;
  onOpenLogin: () => void;
  onOpenNotifications: () => void;
  onOpenCart: () => void;
}

export const Header: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  isMobileFrame,
  setIsMobileFrame,
  onOpenLogin,
  onOpenNotifications,
  onOpenCart,
}) => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const [unreadCount, setUnreadCount] = useState(2);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  // Poll notifications count periodically
  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const token = localStorage.getItem('medireach_token');
        if (!token) return;
        const res = await fetch('/api/customer/notifications', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const unread = (data.notifications || []).filter((n: any) => !n.isRead).length;
          setUnreadCount(unread);
        }
      } catch (e) {
        // quiet
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark (single element) */}
        <button
          onClick={() => {
            if (user?.role === 'admin') setActiveTab('admin_dashboard');
            else if (user?.role === 'staff') setActiveTab('staff_dashboard');
            else setActiveTab('home');
          }}
          className="flex items-center gap-2.5 text-left text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
        >
          <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
            <ShieldPlus className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-slate-900">Medi</span>
            <span className="font-bold text-sky-600">Reach</span>
            <span className="hidden sm:inline text-xs font-normal text-slate-500 ml-2">
              Rare Medicines
            </span>
          </div>
        </button>

        {/* Zone 2: Navigation Links (single line, no wrapping) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          {(!user || user.role === 'customer') && (
            <>
              <button
                onClick={() => setActiveTab('home')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-sky-600 ${
                  activeTab === 'home' ? 'text-sky-600 font-semibold' : ''
                }`}
              >
                Home
              </button>
              <button
                onClick={() => setActiveTab('catalog')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-sky-600 ${
                  activeTab === 'catalog' ? 'text-sky-600 font-semibold' : ''
                }`}
              >
                Medicines Catalog
              </button>
              <button
                onClick={() => setActiveTab('prescriptions')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-sky-600 ${
                  activeTab === 'prescriptions' ? 'text-sky-600 font-semibold' : ''
                }`}
              >
                Upload Rx
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-sky-600 ${
                  activeTab === 'orders' ? 'text-sky-600 font-semibold' : ''
                }`}
              >
                Track Orders
              </button>
            </>
          )}

          {user?.role === 'staff' && (
            <>
              <button
                onClick={() => setActiveTab('staff_dashboard')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-sky-600 ${
                  activeTab === 'staff_dashboard' ? 'text-sky-600 font-semibold' : ''
                }`}
              >
                Staff Workbench
              </button>
              <button
                onClick={() => setActiveTab('staff_orders')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-sky-600 ${
                  activeTab === 'staff_orders' ? 'text-sky-600 font-semibold' : ''
                }`}
              >
                Order Processing
              </button>
              <button
                onClick={() => setActiveTab('staff_rx')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-sky-600 ${
                  activeTab === 'staff_rx' ? 'text-sky-600 font-semibold' : ''
                }`}
              >
                Rx Verification
              </button>
              <button
                onClick={() => setActiveTab('staff_inventory')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-sky-600 ${
                  activeTab === 'staff_inventory' ? 'text-sky-600 font-semibold' : ''
                }`}
              >
                Cold Storage Stock
              </button>
            </>
          )}

          {user?.role === 'admin' && (
            <>
              <button
                onClick={() => setActiveTab('admin_dashboard')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-sky-600 ${
                  activeTab === 'admin_dashboard' ? 'text-sky-600 font-semibold' : ''
                }`}
              >
                Executive Dashboard
              </button>
              <button
                onClick={() => setActiveTab('admin_users')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-sky-600 ${
                  activeTab === 'admin_users' ? 'text-sky-600 font-semibold' : ''
                }`}
              >
                User & Staff RBAC
              </button>
              <button
                onClick={() => setActiveTab('admin_medicines')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-sky-600 ${
                  activeTab === 'admin_medicines' ? 'text-sky-600 font-semibold' : ''
                }`}
              >
                Medicine Listings
              </button>
              <button
                onClick={() => setActiveTab('admin_reports')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-sky-600 ${
                  activeTab === 'admin_reports' ? 'text-sky-600 font-semibold' : ''
                }`}
              >
                Financial Reports
              </button>
            </>
          )}
        </nav>

        {/* Zone 3: Actions & Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Mobile frame vs desktop view switch */}
          <button
            onClick={() => setIsMobileFrame(!isMobileFrame)}
            title={isMobileFrame ? 'Expand to Desktop Wide View' : 'Switch to Smartphone Mobile Frame'}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            {isMobileFrame ? (
              <>
                <Monitor className="w-3.5 h-3.5" />
                <span>Full Wide</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-sky-600" />
                <span>Mobile Frame</span>
              </>
            )}
          </button>

          {/* Cart Icon (Customers & Guest) */}
          {(!user || user.role === 'customer') && (
            <button
              onClick={onOpenCart}
              className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-sky-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>
          )}

          {/* Notifications Icon (when logged in) */}
          {user && (
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          {/* User Profile / Login Button */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-medium transition-all"
              >
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center text-white text-[11px] font-bold ${
                    user.role === 'admin'
                      ? 'bg-emerald-600'
                      : user.role === 'staff'
                      ? 'bg-indigo-600'
                      : 'bg-sky-600'
                  }`}
                >
                  {user.name.charAt(0)}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="font-semibold text-slate-900 leading-tight max-w-[120px] truncate">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                    {user.role}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Role & Switcher Menu */}
              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3.5 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{user.name}</p>
                    <p className="text-[11px] text-slate-500">{user.email}</p>
                    <span
                      className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                        user.role === 'admin'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : user.role === 'staff'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-sky-50 text-sky-700 border border-sky-200'
                      }`}
                    >
                      Role: {user.role}
                    </span>
                  </div>

                  <div className="py-1">
                    {user.role === 'customer' && (
                      <button
                        onClick={() => {
                          setShowRoleMenu(false);
                          setActiveTab('profile');
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>My Customer Account</span>
                      </button>
                    )}
                    {user.role === 'staff' && (
                      <button
                        onClick={() => {
                          setShowRoleMenu(false);
                          setActiveTab('staff_dashboard');
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                        <span>Staff Dashboard</span>
                      </button>
                    )}
                    {user.role === 'admin' && (
                      <button
                        onClick={() => {
                          setShowRoleMenu(false);
                          setActiveTab('admin_dashboard');
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Admin Dashboard</span>
                      </button>
                    )}
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        logout();
                        setActiveTab('login');
                        setShowRoleMenu(false);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs active:scale-[0.98] transition-all whitespace-nowrap shrink-0"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
