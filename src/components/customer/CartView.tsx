import React, { useState, useEffect } from 'react';
import {
  Trash2,
  Plus,
  Minus,
  AlertTriangle,
  ShieldCheck,
  ThermometerSnowflake,
  ShoppingBag,
  ArrowRight,
  FileUp,
} from 'lucide-react';
import { useCart } from '../../context/CartContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { ColdChainBadge, RxBadge } from '../ui/Badge.tsx';

interface Props {
  onOpenCheckout: () => void;
  onOpenRxUpload: () => void;
  onExploreCatalog: () => void;
}

export const CartView: React.FC<Props> = ({ onOpenCheckout, onOpenRxUpload, onExploreCatalog }) => {
  const { items, updateQuantity, removeFromCart, clearCart, subtotal, hasColdChain, requiresPrescriptionCount } =
    useCart();
  const { user, token } = useAuth();
  const [hasApprovedRx, setHasApprovedRx] = useState(false);
  const [checkingRx, setCheckingRx] = useState(false);

  useEffect(() => {
    if (!token || !user) return;
    async function checkRxStatus() {
      try {
        setCheckingRx(true);
        const res = await fetch('/api/customer/prescriptions', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const approved = (data.prescriptions || []).some((p: any) => p.status === 'Approved');
          setHasApprovedRx(approved);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setCheckingRx(false);
      }
    }
    checkRxStatus();
  }, [token, user]);

  const deliveryFee = subtotal >= 1000 ? 0 : subtotal > 0 ? 15.0 : 0;
  const coldChainFee = hasColdChain ? 25.0 : 0;
  const total = subtotal + deliveryFee + coldChainFee;

  const rxBlocked = requiresPrescriptionCount > 0 && !hasApprovedRx;

  if (items.length === 0) {
    return (
      <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8 max-w-md mx-auto shadow-2xs">
        <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8 stroke-1" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Your Cart is Empty</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6 max-w-xs mx-auto">
          You haven't added any rare medications or specialty clinical supplies yet.
        </p>
        <button
          onClick={onExploreCatalog}
          className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs"
        >
          Browse Medicines Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Shopping Cart</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review your rare medicines and cold-chain logistics requirements
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-rose-600 hover:text-rose-700 font-medium"
        >
          Clear All
        </button>
      </div>

      {/* Prescription Requirement Warning Banner */}
      {requiresPrescriptionCount > 0 && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
            hasApprovedRx
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : 'bg-amber-50 border-amber-200 text-amber-950'
          }`}
        >
          {hasApprovedRx ? (
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 space-y-1">
            <span className="font-bold block">
              {hasApprovedRx
                ? 'Prescription Verified & Cleared'
                : 'Prescription Verification Required for Restricted Biologics'}
            </span>
            <p className="leading-relaxed">
              {hasApprovedRx
                ? 'You have an active approved prescription on file with our specialty pharmacy. Dosing is cleared for dispensation.'
                : 'Your cart contains prescription-only (Rx) medicines. Clinical regulations require an approved doctor prescription before an order can be confirmed.'}
            </p>
            {!hasApprovedRx && (
              <div className="pt-2">
                <button
                  onClick={onOpenRxUpload}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-2xs text-[11px]"
                >
                  <FileUp className="w-3.5 h-3.5" />
                  <span>Upload Doctor Prescription Now</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs divide-y divide-slate-100">
        {items.map(({ medicine, quantity }) => (
          <div key={medicine.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                <img
                  src={medicine.imageUrl}
                  alt={medicine.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-medium">{medicine.brand}</span>
                  {medicine.requiresPrescription && <RxBadge />}
                  {medicine.coldChain && <ColdChainBadge />}
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">{medicine.name}</h3>
                <p className="text-xs text-slate-500 font-mono">{medicine.dosageForm}</p>
                <span className="text-xs font-semibold text-slate-700 mt-1 block">
                  ₱{medicine.price.toLocaleString('en-US', { minimumFractionDigits: 2 })} each
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              {/* Quantity Stepper */}
              <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                <button
                  onClick={() => updateQuantity(medicine.id, quantity - 1)}
                  className="w-8 h-8 flex items-center justify-center text-slate-600 hover:text-slate-900"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center text-xs font-bold text-slate-900 tabular-nums">
                  {quantity}
                </span>
                <button
                  onClick={() => updateQuantity(medicine.id, quantity + 1)}
                  disabled={quantity >= medicine.stock}
                  className="w-8 h-8 flex items-center justify-center text-slate-600 hover:text-slate-900 disabled:opacity-30"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Item Subtotal */}
              <span className="text-sm font-bold text-slate-900 tabular-nums w-24 text-right">
                ₱{(medicine.price * quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>

              {/* Remove */}
              <button
                onClick={() => removeFromCart(medicine.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                title="Remove item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing Summary Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Order Cost Breakdown
        </h3>
        <div className="space-y-2 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>Medicines Subtotal</span>
            <span className="font-semibold text-slate-900 tabular-nums">
              ₱{subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Standard Courier Delivery</span>
            <span className="font-semibold text-slate-900 tabular-nums">
              {deliveryFee === 0 ? (
                <span className="text-emerald-600">FREE (Orders &gt; ₱500)</span>
              ) : (
                `₱${deliveryFee.toFixed(2)}`
              )}
            </span>
          </div>

          {hasColdChain && (
            <div className="flex justify-between text-cyan-900 bg-cyan-50/50 p-2 rounded-lg">
              <span className="flex items-center gap-1.5">
                <ThermometerSnowflake className="w-3.5 h-3.5 text-cyan-600" />
                CryoSafe 2°C - 8°C Thermal Shipper & IoT Monitoring
              </span>
              <span className="font-bold tabular-nums">₱{coldChainFee.toFixed(2)}</span>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline text-sm">
            <span className="font-bold text-slate-900">Total Order Amount</span>
            <span className="text-xl font-extrabold text-slate-900 tabular-nums">
              ₱{total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="pt-3">
          <button
            onClick={onOpenCheckout}
            disabled={rxBlocked}
            className="w-full py-3 px-6 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white text-sm font-bold rounded-xl shadow-sm shadow-sky-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          {rxBlocked && (
            <p className="text-[11px] text-amber-700 text-center mt-2 font-medium">
              * Please upload an approved prescription above to unlock checkout for regulated biologics.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
