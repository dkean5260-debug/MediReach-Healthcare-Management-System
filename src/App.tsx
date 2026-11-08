import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { CartProvider, useCart } from './context/CartContext.tsx';
import { Header } from './components/layout/Header.tsx';
import { BottomNavigation } from './components/layout/BottomNavigation.tsx';
import { CustomerHome } from './components/customer/CustomerHome.tsx';
import { MedicineCatalog } from './components/customer/MedicineCatalog.tsx';
import { MedicineDetailModal } from './components/customer/MedicineDetailModal.tsx';
import { PrescriptionManager } from './components/customer/PrescriptionManager.tsx';
import { CartView } from './components/customer/CartView.tsx';
import { CheckoutModal } from './components/customer/CheckoutModal.tsx';
import { OrderTrackingView } from './components/customer/OrderTrackingView.tsx';
import { CustomerProfile } from './components/customer/CustomerProfile.tsx';
import { StaffPortal } from './components/staff/StaffPortal.tsx';
import { AdminPortal } from './components/admin/AdminPortal.tsx';
import { UnifiedAuthScreen } from './components/auth/UnifiedAuthScreen.tsx';
import { NotificationDrawer } from './components/notifications/NotificationDrawer.tsx';
import { Medicine, Order } from './types/index.ts';
import { ShieldAlert, Smartphone, Monitor } from 'lucide-react';

function MediReachMain() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(false);
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | undefined>(undefined);
  const [guestBrowsing, setGuestBrowsing] = useState<boolean>(false);

  // Modals
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);

  // If user is not logged in and not guest browsing, or if activeTab is 'login', show the one login process
  const isLoginPage = activeTab === 'login' || (!user && !guestBrowsing);

  // Role-based automatic tab redirection on login
  useEffect(() => {
    if (user?.role === 'admin' && (activeTab === 'home' || activeTab === 'catalog' || activeTab === 'login')) {
      setActiveTab('admin_dashboard');
    } else if (user?.role === 'staff' && (activeTab === 'home' || activeTab === 'catalog' || activeTab === 'login')) {
      setActiveTab('staff_dashboard');
    } else if (user?.role === 'customer' && activeTab === 'login') {
      setActiveTab('home');
    }
  }, [user?.role]);

  // Handle order success
  const handleOrderPlaced = (order: Order) => {
    setActiveOrderId(order.id);
    setActiveTab('orders');
  };

  const handleOpenRxUpload = () => {
    if (!user) {
      setActiveTab('login');
    } else {
      setActiveTab('prescriptions');
    }
  };

  // RBAC validation check for tabs
  const isStaffTab = activeTab.startsWith('staff_');
  const isAdminTab = activeTab.startsWith('admin_');

  const accessDenied =
    (isAdminTab && user?.role !== 'admin') ||
    (isStaffTab && user?.role !== 'staff' && user?.role !== 'admin');

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Top Header Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab !== 'login') setGuestBrowsing(true);
          setActiveTab(tab);
        }}
        isMobileFrame={isMobileFrame}
        setIsMobileFrame={setIsMobileFrame}
        onOpenLogin={() => setActiveTab('login')}
        onOpenNotifications={() => setNotificationsOpen(true)}
        onOpenCart={() => setActiveTab('cart')}
      />

      {/* Main Container: Mobile Frame vs Wide Canvas */}
      <main className="flex-1 flex flex-col items-center justify-start w-full">
        <div
          className={`w-full transition-all duration-300 ${
            isMobileFrame
              ? 'max-w-[430px] my-4 bg-slate-50 border border-slate-300 rounded-[40px] shadow-2xl overflow-hidden relative min-h-[850px] pb-16 ring-8 ring-slate-800/10'
              : 'max-w-7xl px-4 sm:px-6 lg:px-8 py-6'
          }`}
        >
          {/* Mobile frame simulated status bar */}
          {isMobileFrame && (
            <div className="pt-2 px-6 pb-2 flex items-center justify-between text-[11px] font-semibold text-slate-700 bg-white border-b border-slate-100 select-none">
              <span>9:41</span>
              <div className="w-20 h-4 bg-slate-900 rounded-full mx-auto" />
              <div className="flex items-center gap-1.5 font-mono text-[10px]">
                <span>5G</span>
                <span>100%</span>
              </div>
            </div>
          )}

          {/* Content Body */}
          <div className={isMobileFrame ? 'p-4' : 'pt-2'}>
            {isLoginPage ? (
              <UnifiedAuthScreen
                onSuccess={() => {
                  setGuestBrowsing(false);
                  if (user?.role === 'admin') setActiveTab('admin_dashboard');
                  else if (user?.role === 'staff') setActiveTab('staff_dashboard');
                  else setActiveTab('home');
                }}
                onContinueAsGuest={() => {
                  setGuestBrowsing(true);
                  setActiveTab('catalog');
                }}
              />
            ) : accessDenied ? (
              <div className="py-20 text-center bg-white rounded-3xl border border-rose-200 p-8 max-w-md mx-auto shadow-sm">
                <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto mb-3" />
                <h2 className="text-base font-bold text-slate-900">Access Restricted (RBAC)</h2>
                <p className="text-xs text-slate-600 mt-1 mb-6">
                  You do not have authorized privileges to view this portal. Please authenticate with appropriate staff or administrator credentials.
                </p>
                <button
                  onClick={() => setActiveTab('home')}
                  className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
                >
                  Return to Patient Home
                </button>
              </div>
            ) : (
              <>
                {/* Customer Views */}
                {activeTab === 'home' && (
                  <CustomerHome
                    onNavigate={(tab, query) => {
                      if (query) setCatalogSearch(query);
                      setActiveTab(tab);
                    }}
                    onSelectMedicine={(med) => setSelectedMedicine(med)}
                    onOpenRxUpload={handleOpenRxUpload}
                  />
                )}

                {activeTab === 'catalog' && (
                  <MedicineCatalog
                    initialSearch={catalogSearch}
                    onSelectMedicine={(med) => setSelectedMedicine(med)}
                  />
                )}

                {activeTab === 'prescriptions' && (
                  <PrescriptionManager onOpenLogin={() => setActiveTab('login')} />
                )}

                {activeTab === 'cart' && (
                  <CartView
                    onOpenCheckout={() => setCheckoutModalOpen(true)}
                    onOpenRxUpload={handleOpenRxUpload}
                    onExploreCatalog={() => setActiveTab('catalog')}
                  />
                )}

                {activeTab === 'orders' && (
                  <OrderTrackingView
                    initialOrderId={activeOrderId}
                    onExploreCatalog={() => setActiveTab('catalog')}
                    onOpenLogin={() => setActiveTab('login')}
                  />
                )}

                {activeTab === 'profile' && (
                  <CustomerProfile
                    onOpenLogin={() => setActiveTab('login')}
                    onExploreCatalog={() => setActiveTab('catalog')}
                    onSelectMedicine={(med) => setSelectedMedicine(med)}
                  />
                )}

                {/* Staff Views */}
                {activeTab === 'staff_dashboard' && <StaffPortal initialTab="overview" />}
                {activeTab === 'staff_orders' && <StaffPortal initialTab="orders" />}
                {activeTab === 'staff_rx' && <StaffPortal initialTab="prescriptions" />}
                {activeTab === 'staff_inventory' && <StaffPortal initialTab="inventory" />}

                {/* Admin Views */}
                {activeTab === 'admin_dashboard' && <AdminPortal initialTab="overview" />}
                {activeTab === 'admin_prescribing' && <AdminPortal initialTab="prescribing_studio" />}
                {activeTab === 'admin_users' && <AdminPortal initialTab="users" />}
                {activeTab === 'admin_medicines' && <AdminPortal initialTab="medicines" />}
                {activeTab === 'admin_reports' && <AdminPortal initialTab="financial" />}
              </>
            )}
          </div>

          {/* Mobile frame home indicator bar */}
          {isMobileFrame && (
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-300 rounded-full" />
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation for Customer Screens (hidden during login) */}
      {!isLoginPage && (!user || user.role === 'customer') && !isStaffTab && !isAdminTab && (
        <div className={isMobileFrame ? 'max-w-[430px] mx-auto' : ''}>
          <BottomNavigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>
      )}

      {/* Global Modals (Only drawers and popovers) */}
      <NotificationDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onNavigate={(tab) => setActiveTab(tab)}
      />

      <MedicineDetailModal
        medicine={selectedMedicine}
        onClose={() => setSelectedMedicine(null)}
        onOpenRxUpload={handleOpenRxUpload}
      />

      <CheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        onOrderPlaced={handleOrderPlaced}
        onOpenLogin={() => setActiveTab('login')}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <MediReachMain />
      </CartProvider>
    </AuthProvider>
  );
}
