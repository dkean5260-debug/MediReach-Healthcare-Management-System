import React, { useState, useEffect } from 'react';
import { Search, Filter, SlidersHorizontal, ThermometerSnowflake, CheckCircle2 } from 'lucide-react';
import { Medicine } from '../../types/index.ts';
import { useCart } from '../../context/CartContext.tsx';
import { StatusBadge, ColdChainBadge, RxBadge } from '../ui/Badge.tsx';

interface Props {
  initialSearch?: string;
  onSelectMedicine: (med: Medicine) => void;
}

export const MedicineCatalog: React.FC<Props> = ({ initialSearch = '', onSelectMedicine }) => {
  const { addToCart } = useCart();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [requiresRxFilter, setRequiresRxFilter] = useState('all'); // 'all' | 'true' | 'false'
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('popularity');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadMeta() {
      try {
        const [catRes, brandRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/brands'),
        ]);
        if (catRes.ok) {
          const data = await catRes.json();
          setCategories(data.categories || []);
        }
        if (brandRes.ok) {
          const data = await brandRes.json();
          setBrands(data.brands || []);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadMeta();
  }, []);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedCategory !== 'All') params.set('category', selectedCategory);
      if (selectedBrand !== 'All') params.set('brand', selectedBrand);
      if (inStockOnly) params.set('inStock', 'true');
      if (requiresRxFilter !== 'all') params.set('requiresPrescription', requiresRxFilter);
      if (sortBy) params.set('sortBy', sortBy);

      const res = await fetch(`/api/medicines?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMedicines(data.medicines || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, [search, selectedCategory, selectedBrand, requiresRxFilter, inStockOnly, sortBy]);

  const handleAddToCart = (med: Medicine, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = addToCart(med, 1);
    setToastMessage(res.message || 'Added to cart');
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <div className="space-y-5 pb-20">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 p-3 bg-slate-900 text-white text-xs font-medium rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Rare Medicines Catalog</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Browse certified orphan drugs, specialty biologics, and clinical infusion kits
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by medicine name, brand, condition, or indication..."
          className="w-full pl-10 pr-4 py-2.5 bg-white text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-2xs"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
          >
            Clear
          </button>
        )}
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('All')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            selectedCategory === 'All'
              ? 'bg-sky-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-sky-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Filter & Sort Controls Row */}
      <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Brand Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Brand:</span>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
            >
              <option value="All">All Brands</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Rx Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Type:</span>
            <select
              value={requiresRxFilter}
              onChange={(e) => setRequiresRxFilter(e.target.value)}
              className="py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
            >
              <option value="all">All Types</option>
              <option value="true">Prescription Only (Rx)</option>
              <option value="false">Non-Rx Supplies (OTC)</option>
            </select>
          </div>

          {/* In Stock Toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
            />
            <span>In Stock Only</span>
          </label>
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-slate-500 font-medium">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
          >
            <option value="popularity">Most Popular</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name">Alphabetical (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Grid of Medicines */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading catalog items...</div>
      ) : medicines.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-6">
          <Search className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
          <h3 className="text-sm font-semibold text-slate-800">No medicines found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or filter selections. If you require a rare unlisted therapy, contact our 24/7 clinical sourcing team.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {medicines.map((med) => (
            <div
              key={med.id}
              onClick={() => onSelectMedicine(med)}
              className="bg-white rounded-2xl border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all p-4 flex flex-col justify-between cursor-pointer group"
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
                  {med.stock <= med.minStockAlert && med.stock > 0 && (
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white">
                      Low Stock ({med.stock} left)
                    </span>
                  )}
                  {med.stock === 0 && (
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">
                      Out of Stock
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 font-medium truncate">
                  {med.brand} · {med.category}
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5 group-hover:text-sky-600 transition-colors line-clamp-1">
                  {med.name}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 line-clamp-1 font-medium">{med.condition}</p>
                <p className="text-[11px] text-slate-400 font-mono mt-1">{med.dosageForm}</p>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {med.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Unit Price</span>
                  <span className="text-base font-extrabold text-slate-900 tabular-nums">
                    ${med.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectMedicine(med)}
                    className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Details
                  </button>
                  <button
                    onClick={(e) => handleAddToCart(med, e)}
                    disabled={med.stock <= 0}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 rounded-lg shadow-2xs active:scale-95 transition-all"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
