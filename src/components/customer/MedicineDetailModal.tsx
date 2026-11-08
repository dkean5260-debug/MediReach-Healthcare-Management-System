import React, { useState, useEffect } from 'react';
import {
  X,
  Heart,
  Plus,
  Minus,
  ShoppingCart,
  ShieldCheck,
  ThermometerSnowflake,
  FileText,
  AlertCircle,
  Building,
  Stethoscope,
} from 'lucide-react';
import { Medicine } from '../../types/index.ts';
import { useCart } from '../../context/CartContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { ColdChainBadge, RxBadge } from '../ui/Badge.tsx';

interface Props {
  medicine: Medicine | null;
  onClose: () => void;
  onOpenRxUpload: () => void;
  onOpenDoctorPrescribe?: (med: Medicine) => void;
}

export const MedicineDetailModal: React.FC<Props> = ({
  medicine,
  onClose,
  onOpenRxUpload,
  onOpenDoctorPrescribe,
}) => {
  const { addToCart } = useCart();
  const { user, token } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [isFavorited, setIsFavorited] = useState(false);
  const [addedNotice, setAddedNotice] = useState(false);

  useEffect(() => {
    if (!medicine || !token) return;
    const currentId = medicine.id;
    async function checkFav() {
      try {
        const res = await fetch('/api/customer/favorites', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setIsFavorited((data.favorites || []).includes(currentId));
        }
      } catch (e) {
        // quiet
      }
    }
    checkFav();
  }, [medicine, token]);

  if (!medicine) return null;

  const handleToggleFavorite = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/customer/favorites/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ medicineId: medicine.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsFavorited(data.isFavorited);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdd = () => {
    addToCart(medicine, quantity);
    setAddedNotice(true);
    setTimeout(() => {
      setAddedNotice(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header bar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">{medicine.brand}</span>
            <span className="text-slate-300">·</span>
            <span className="text-xs font-medium text-sky-700">{medicine.category}</span>
          </div>
          <div className="flex items-center gap-2">
            {user?.role === 'customer' && (
              <button
                onClick={handleToggleFavorite}
                className={`p-2 rounded-xl border transition-colors ${
                  isFavorited
                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                    : 'bg-white border-slate-200 text-slate-400 hover:text-rose-500'
                }`}
                title="Save to Favorites"
              >
                <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Image Preview */}
            <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
              <img
                src={medicine.imageUrl}
                alt={medicine.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                {medicine.requiresPrescription && <RxBadge />}
                {medicine.coldChain && <ColdChainBadge />}
              </div>
            </div>

            {/* Title & Core Price */}
            <div className="space-y-3">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Generic: {medicine.genericName}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">{medicine.name}</h2>
                <p className="text-xs text-sky-700 font-medium mt-0.5">{medicine.condition}</p>
                <p className="text-xs text-slate-500 font-mono mt-1">Dosage: {medicine.dosageForm}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-400 block font-medium">Verified Pharmacy Price</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
                    ${medicine.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-slate-500">per unit</span>
                </div>
              </div>

              {/* Stock Status */}
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-slate-500 font-medium">Availability:</span>
                {medicine.stock > medicine.minStockAlert ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> In Cold Storage ({medicine.stock} units)
                  </span>
                ) : medicine.stock > 0 ? (
                  <span className="text-amber-700 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span> Low Stock ({medicine.stock} remaining)
                  </span>
                ) : (
                  <span className="text-rose-700 font-semibold">Out of Stock</span>
                )}
              </div>

              {/* Regulatory ID */}
              <div className="flex items-center justify-between text-xs py-1 border-t border-slate-100">
                <span className="text-slate-500 font-medium">Orphan Designation:</span>
                <span className="font-mono text-slate-800 text-[11px] font-semibold">{medicine.regulatoryApprovalNo}</span>
              </div>
            </div>
          </div>

          {/* Clinical Indications & Product Information */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-sky-600" />
                <span>Therapeutic Indications</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {medicine.indications}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                <span>Verified Label Dosage & Administration</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {medicine.labelDosageInstructions}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <ThermometerSnowflake className="w-3.5 h-3.5 text-sky-600" />
                <span>Storage & Temperature Handling</span>
              </h3>
              <div className="p-3 rounded-xl bg-sky-50/50 border border-sky-100 text-xs text-sky-950 flex items-center justify-between">
                <span>{medicine.storageTemp}</span>
                <span className="font-semibold text-sky-700">IoT Monitored Shipper</span>
              </div>
            </div>

            {/* Legal Healthcare Disclaimer Requirement */}
            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Pharmaceutical Notice:</strong> MediReach provides fulfillment of verified doctor prescriptions. This information is derived from official product labeling and does not replace personalized medical advice, diagnosis, or clinical evaluation by your attending physician.
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-medium">Quantity:</span>
            <div className="flex items-center border border-slate-200 rounded-xl bg-white shadow-2xs">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-800 disabled:opacity-30"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-10 text-center text-xs font-bold text-slate-900 tabular-nums">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => Math.min(medicine.stock, q + 1))}
                disabled={quantity >= medicine.stock}
                className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-800 disabled:opacity-30"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="text-xs font-extrabold text-slate-900 tabular-nums">
              Subtotal: ${(medicine.price * quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {medicine.requiresPrescription && (
              <>
                {onOpenDoctorPrescribe && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenDoctorPrescribe(medicine);
                    }}
                    className="px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors flex items-center gap-1"
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>Doctor E-Prescribe</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    onClose();
                    onOpenRxUpload();
                  }}
                  className="px-3 py-2 text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 rounded-xl hover:bg-sky-100 transition-colors"
                >
                  Upload Rx
                </button>
              </>
            )}
            <button
              onClick={handleAdd}
              disabled={medicine.stock <= 0 || addedNotice}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-sm shadow-sky-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{addedNotice ? 'Added to Cart ✓' : 'Add to Cart'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
