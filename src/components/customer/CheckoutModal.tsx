import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Building,
  Wallet,
  Truck,
  MapPin,
  Plus,
  ShieldCheck,
  ThermometerSnowflake,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useCart } from '../../context/CartContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { DeliveryAddress, Order } from '../../types/index.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOrderPlaced: (order: Order) => void;
  onOpenLogin: () => void;
}

export const CheckoutModal: React.FC<Props> = ({ isOpen, onClose, onOrderPlaced, onOpenLogin }) => {
  const { items, subtotal, hasColdChain, clearCart } = useCart();
  const { user, token } = useAuth();
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'Credit / Debit Card' | 'Health Insurance Direct' | 'Digital Wallet' | 'Cash on Delivery'>('Health Insurance Direct');
  const [deliveryInstructions, setDeliveryInstructions] = useState('Ring bell 4B. Perishable cold-chain shipment. Direct signature hand-off.');
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New address form state
  const [newLabel, setNewLabel] = useState('Primary Residence');
  const [newRecipient, setNewRecipient] = useState(user?.name || 'Sarah Jenkins');
  const [newStreet, setNewStreet] = useState('742 Evergreen Terrace, Suite 4B');
  const [newCity, setNewCity] = useState('Springfield');
  const [newState, setNewState] = useState('IL');
  const [newZip, setNewZip] = useState('62704');
  const [newPhone, setNewPhone] = useState(user?.phone || '+1 (555) 432-8921');

  useEffect(() => {
    if (!token || !user) return;
    async function loadAddresses() {
      try {
        const res = await fetch('/api/customer/addresses', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const list: DeliveryAddress[] = data.addresses || [];
          setAddresses(list);
          const defaultAddr = list.find((a) => a.isDefault) || list[0];
          if (defaultAddr) setSelectedAddressId(defaultAddr.id);
          else setShowNewAddressForm(true);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadAddresses();
  }, [token, user]);

  if (!isOpen) return null;

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white rounded-3xl p-6 max-w-md w-full text-center space-y-4">
          <Lock className="w-10 h-10 text-sky-600 mx-auto" />
          <h2 className="text-base font-bold text-slate-900">Sign in to Checkout</h2>
          <p className="text-xs text-slate-500">
            Customer authentication is required to verify identity and dispatch cold-chain pharmaceuticals.
          </p>
          <button
            onClick={() => {
              onClose();
              onOpenLogin();
            }}
            className="w-full py-2.5 bg-sky-600 text-white text-xs font-bold rounded-xl"
          >
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  const deliveryFee = subtotal >= 1000 ? 0 : 15.0;
  const coldChainFee = hasColdChain ? 25.0 : 0;
  const total = subtotal + deliveryFee + coldChainFee;

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const res = await fetch('/api/customer/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          label: newLabel,
          recipientName: newRecipient,
          street: newStreet,
          city: newCity,
          state: newState,
          postalCode: newZip,
          phone: newPhone,
          deliveryInstructions,
          isDefault: true,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses((prev) => [data.address, ...prev]);
        setSelectedAddressId(data.address.id);
        setShowNewAddressForm(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmOrder = async () => {
    setError(null);
    if (!selectedAddressId && !showNewAddressForm) {
      setError('Please select or enter a delivery address.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/customer/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: items.map((it) => ({
            medicineId: it.medicine.id,
            quantity: it.quantity,
          })),
          shippingAddressId: selectedAddressId,
          paymentMethod,
          deliveryInstructions,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || 'Failed to complete order');
      } else {
        clearCart();
        onClose();
        onOrderPlaced(data.order);
      }
    } catch (err) {
      setLoading(false);
      setError('Connection to pharmacy dispatch server failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Secure Pharmacy Checkout</h3>
              <p className="text-xs text-slate-500">Sandbox Cold-Chain Dispensation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              {error}
            </div>
          )}

          {/* Step 1: Delivery Address */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-600" />
                <span>Delivery Address</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                className="text-xs text-sky-600 hover:text-sky-700 font-semibold"
              >
                {showNewAddressForm ? 'Select Existing' : '+ Add Address'}
              </button>
            </div>

            {showNewAddressForm ? (
              <form onSubmit={handleCreateAddress} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500">Address Label</label>
                    <input
                      type="text"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      placeholder="Home / Clinic"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500">Recipient Name</label>
                    <input
                      type="text"
                      value={newRecipient}
                      onChange={(e) => setNewRecipient(e.target.value)}
                      placeholder="Full Name"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-500">Street Address</label>
                  <input
                    type="text"
                    value={newStreet}
                    onChange={(e) => setNewStreet(e.target.value)}
                    placeholder="e.g. 742 Evergreen Terrace"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500">City</label>
                    <input
                      type="text"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500">State</label>
                    <input
                      type="text"
                      value={newState}
                      onChange={(e) => setNewState(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500">ZIP</label>
                    <input
                      type="text"
                      value={newZip}
                      onChange={(e) => setNewZip(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg"
                >
                  Save Address & Use
                </button>
              </form>
            ) : (
              <div className="space-y-2">
                {addresses.map((a) => (
                  <label
                    key={a.id}
                    className={`block p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedAddressId === a.id
                        ? 'border-sky-500 bg-sky-50/60 shadow-2xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="address"
                          checked={selectedAddressId === a.id}
                          onChange={() => setSelectedAddressId(a.id)}
                          className="w-4 h-4 text-sky-600 focus:ring-sky-500 border-slate-300"
                        />
                        <span className="font-bold text-slate-900">{a.label}</span>
                        {a.isDefault && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <span className="text-slate-500 font-mono text-[11px]">{a.phone}</span>
                    </div>
                    <p className="text-slate-600 mt-1 pl-6">
                      {a.recipientName} · {a.street}, {a.city}, {a.state} {a.postalCode}
                    </p>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Payment Method (Sandbox) */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-sky-600" />
              <span>Sandbox Payment Method</span>
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'Health Insurance Direct', label: 'Insurance Direct', icon: Building, desc: 'Specialty pre-auth clearance' },
                { id: 'Credit / Debit Card', label: 'Card Payment', icon: CreditCard, desc: 'Simulated sandbox token' },
                { id: 'Digital Wallet', label: 'Digital Wallet', icon: Wallet, desc: 'Apple/Google Pay sandbox' },
                { id: 'Cash on Delivery', label: 'Cold-Chain Delivery CoD', icon: Truck, desc: 'Direct hand-off collection' },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/60 shadow-2xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-1.5 ${isSelected ? 'text-sky-600' : 'text-slate-500'}`} />
                    <span className="text-xs font-bold text-slate-900 block">{m.label}</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{m.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Delivery Instructions */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cold-Chain Delivery Instructions
            </label>
            <input
              type="text"
              value={deliveryInstructions}
              onChange={(e) => setDeliveryInstructions(e.target.value)}
              placeholder="e.g. Ring bell 4B. Immediate refrigeration required."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          {/* Cold Chain Guarantee Check */}
          <div className="p-3 rounded-xl bg-cyan-50/60 border border-cyan-200 text-xs text-cyan-950 flex items-center gap-2">
            <ThermometerSnowflake className="w-5 h-5 text-cyan-600 shrink-0" />
            <div className="leading-relaxed">
              <strong>Active CryoSafe Guarantee:</strong> Packaged in validated phase-change thermal shippers. Guaranteed 2°C to 8°C throughout transit with Bluetooth logger.
            </div>
          </div>

          {/* Total summary */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Items Subtotal:</span>
              <span className="font-semibold text-slate-900 tabular-nums">₱{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Refrigerated Logistics:</span>
              <span className="font-semibold text-slate-900 tabular-nums">₱{(deliveryFee + coldChainFee).toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-slate-900">
              <span>Total Payable:</span>
              <span className="tabular-nums">₱{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmOrder}
            disabled={loading}
            className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-sky-600/20 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{loading ? 'Confirming Order...' : 'Confirm Order & Authorize Dispensation'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
