import React, { useState, useEffect } from 'react';
import {
  Search,
  FileUp,
  Package,
  Heart,
  PhoneCall,
  ShieldCheck,
  ThermometerSnowflake,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useCart } from '../../context/CartContext.tsx';
import { Medicine, Order } from '../../types/index.ts';
import { StatusBadge, ColdChainBadge, RxBadge } from '../ui/Badge.tsx';

interface Props {
  onNavigate: (tab: string, searchQuery?: string) => void;
  onSelectMedicine: (med: Medicine) => void;
  onOpenRxUpload: () => void;
}

export const CustomerHome: React.FC<Props> = ({ onNavigate, onSelectMedicine, onOpenRxUpload }) => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [recentOrder, setRecentOrder] = useState<Order | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const medRes = await fetch('/api/medicines');
        if (medRes.ok) {
          const data = await medRes.json();
          setMedicines(data.medicines || []);
        }

        const token = localStorage.getItem('medireach_token');
        if (token && user?.role === 'customer') {
          const orderRes = await fetch('/api/customer/orders', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (orderRes.ok) {
            const data = await orderRes.json();
            if (data.orders && data.orders.length > 0) {
              setRecentOrder(data.orders[0]);
            }
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onNavigate('catalog', searchInput.trim());
    } else {
      onNavigate('catalog');
    }
  };

  const handleQuickAdd = (med: Medicine, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = addToCart(med, 1);
    setToastMessage(res.message || 'Added to cart');
    setTimeout(() => setToastMessage(null), 2500);
  };

  const categories = [
    { name: 'Metabolic & Genetic', count: '4 Medicines', icon: '🧬' },
    { name: 'Neurology & Spinal', count: '2 Medicines', icon: '🧠' },
    { name: 'Rare Hematology', count: '3 Medicines', icon: '🩸' },
    { name: 'Pulmonary & Respiratory', count: '2 Medicines', icon: '🫁' },
    { name: 'Clinical Supplies & Infusion', count: '2 Supplies', icon: '💉' },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 p-3 bg-slate-900 text-white text-xs font-medium rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Greeting & Emergency Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-sky-50 via-white to-sky-50/50 p-4 rounded-2xl border border-sky-100 shadow-2xs">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-700">
            Specialized Rare Pharmacy
          </span>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900">
            Hello, {user ? user.name.split(' ')[0] : 'Patient'} 👋
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Prescription rare biologics with cold-chain verified provenance
          </p>
        </div>
        <a
          href="tel:+18005557273"
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-sky-700 bg-white border border-sky-200 rounded-lg hover:bg-sky-50 transition-colors shrink-0"
        >
          <PhoneCall className="w-3.5 h-3.5 text-sky-600" />
          <span>24/7 Clinical Hotline: (800) 555-RARE</span>
        </a>
      </div>

      {/* Search Input Trigger */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search orphan medicines, indications (e.g. Soliris, SMA, Gaucher)..."
          className="w-full pl-10 pr-24 py-3 bg-white text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-2xs transition-all"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-2xs transition-colors"
        >
          Search
        </button>
      </form>

      {/* Promotional & Cold-Chain Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 shadow-xs bg-slate-900 text-white">
        <img
          src="/src/assets/images/hero_banner_medical_1794104816141.jpg"
          alt="MediReach Specialized Pharmaceutical Laboratory"
          referrerPolicy="no-referrer"
          className="w-full h-48 sm:h-56 object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent p-5 flex flex-col justify-end">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-500/80 text-white">
              2°C - 8°C GUARANTEE
            </span>
            <span className="text-xs text-sky-200">Active Thermal Monitoring</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-white">
            Rare Medicines, Closer to You
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-lg line-clamp-2">
            Direct-from-manufacturer sourcing for certified orphan therapies, rapid doctor Rx verification, and white-glove refrigerated delivery.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => onNavigate('catalog')}
              className="px-4 py-2 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <span>Explore Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onOpenRxUpload}
              className="px-4 py-2 text-xs font-semibold text-white bg-sky-600/80 hover:bg-sky-600 backdrop-blur-xs rounded-lg transition-colors flex items-center gap-1.5"
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>Submit Doctor Rx</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={onOpenRxUpload}
          className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-sky-300 hover:shadow-xs transition-all text-left group"
        >
          <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center mb-2 group-hover:bg-sky-600 group-hover:text-white transition-colors">
            <FileUp className="w-5 h-5" />
          </div>
          <h3 className="text-xs font-bold text-slate-900">Upload Rx</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Doctor prescription verification</p>
        </button>

        <button
          onClick={() => onNavigate('orders')}
          className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-sky-300 hover:shadow-xs transition-all text-left group"
        >
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Package className="w-5 h-5" />
          </div>
          <h3 className="text-xs font-bold text-slate-900">Track Orders</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Live refrigerated courier GPS</p>
        </button>

        <button
          onClick={() => onNavigate('catalog')}
          className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-sky-300 hover:shadow-xs transition-all text-left group"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <ThermometerSnowflake className="w-5 h-5" />
          </div>
          <h3 className="text-xs font-bold text-slate-900">Cold Storage</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Biologic inventory in stock</p>
        </button>

        <button
          onClick={() => onNavigate('profile')}
          className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-sky-300 hover:shadow-xs transition-all text-left group"
        >
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-2 group-hover:bg-amber-600 group-hover:text-white transition-colors">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-xs font-bold text-slate-900">Support & HIPAA</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Clinical pharmacist chat</p>
        </button>
      </div>

      {/* Active Order Progress Banner (if exists) */}
      {recentOrder && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-sky-50 to-white border border-sky-200 shadow-2xs">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-900">
                Active Order: #{recentOrder.orderNumber}
              </span>
            </div>
            <StatusBadge status={recentOrder.status} />
          </div>
          <p className="text-xs text-slate-600">
            {recentOrder.tracking.timeline[recentOrder.tracking.timeline.length - 1]?.note || 'In fulfillment'}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-sky-100">
            <span className="text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              {recentOrder.tracking.estimatedDelivery}
            </span>
            <button
              onClick={() => onNavigate('orders')}
              className="font-semibold text-sky-700 hover:text-sky-800 flex items-center gap-1"
            >
              <span>Live Tracking</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Popular Categories */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900">Therapeutic Categories</h2>
          <button
            onClick={() => onNavigate('catalog')}
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-0.5"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {categories.map((c) => (
            <button
              key={c.name}
              onClick={() => onNavigate('catalog', c.name)}
              className="p-3 bg-white rounded-xl border border-slate-200 hover:border-sky-300 hover:shadow-2xs text-left transition-all group"
            >
              <div className="text-2xl mb-1.5">{c.icon}</div>
              <h3 className="text-xs font-semibold text-slate-900 truncate group-hover:text-sky-600">
                {c.name}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">{c.count}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Rare Medicines */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Featured Specialized Medicines</h2>
            <p className="text-xs text-slate-500">Verified manufacturer stock available for rapid dispatch</p>
          </div>
          <button
            onClick={() => onNavigate('catalog')}
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-0.5"
          >
            <span>Catalog</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading catalog...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {medicines.slice(0, 6).map((med) => (
              <div
                key={med.id}
                onClick={() => onSelectMedicine(med)}
                className="bg-white rounded-2xl border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all p-3.5 flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-100 mb-3">
                    <img
                      src={med.imageUrl}
                      alt={med.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {med.requiresPrescription && <RxBadge />}
                    </div>
                    {med.coldChain && (
                      <div className="absolute bottom-2 left-2">
                        <ColdChainBadge />
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-400 font-medium">
                    {med.brand} · {med.category}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5 group-hover:text-sky-600 transition-colors line-clamp-1">
                    {med.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{med.condition}</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-1">{med.dosageForm}</p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Pharmacy Price</span>
                    <span className="text-base font-extrabold text-slate-900 tabular-nums">
                      ${med.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleQuickAdd(med, e)}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-2xs active:scale-95 transition-all"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Safety & Compliance Pledge */}
      <section className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-sky-600" />
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            MediReach Pharmacy Standards
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="font-semibold text-slate-900 block mb-0.5">Licensed Verification</span>
            Every prescription is manually verified by state-licensed clinical pharmacists prior to dispensation.
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="font-semibold text-slate-900 block mb-0.5">Active Cold-Chain</span>
            CryoCube IoT insulated packaging ensures non-stop 2°C to 8°C logging from warehouse to your doorstep.
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="font-semibold text-slate-900 block mb-0.5">Zero Counterfeit Guarantee</span>
            Strict manufacturer-direct procurement with full batch track-and-trace serialization.
          </div>
        </div>
      </section>
    </div>
  );
};
