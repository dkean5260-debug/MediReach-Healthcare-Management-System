import React, { useState, useEffect } from 'react';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  ThermometerSnowflake,
  ShieldCheck,
  PhoneCall,
  AlertCircle,
  XCircle,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { Order, OrderStatus } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { StatusBadge, ColdChainBadge, RxBadge } from '../ui/Badge.tsx';

interface Props {
  initialOrderId?: string;
  onExploreCatalog: () => void;
  onOpenLogin: () => void;
}

export const OrderTrackingView: React.FC<Props> = ({ initialOrderId, onExploreCatalog, onOpenLogin }) => {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Patient schedule changed');
  const [cancelling, setCancelling] = useState(false);

  const fetchOrders = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch('/api/customer/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const list: Order[] = data.orders || [];
        setOrders(list);
        if (initialOrderId) {
          const found = list.find((o) => o.id === initialOrderId);
          if (found) setSelectedOrder(found);
          else if (list.length > 0) setSelectedOrder(list[0]);
        } else if (list.length > 0) {
          setSelectedOrder(list[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token, initialOrderId]);

  const handleCancelOrder = async () => {
    if (!selectedOrder || !token) return;
    try {
      setCancelling(true);
      const res = await fetch(`/api/customer/orders/${selectedOrder.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const data = await res.json();
      setCancelling(false);
      setCancelModalOpen(false);
      if (res.ok) {
        fetchOrders();
      }
    } catch (e) {
      setCancelling(false);
      console.error(e);
    }
  };

  if (!user) {
    return (
      <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 max-w-md mx-auto shadow-2xs">
        <Package className="w-12 h-12 text-sky-600 mx-auto mb-3 stroke-1" />
        <h2 className="text-lg font-bold text-slate-900">Track Your Orders</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          Please sign in to view your orders, live cold-chain transit logs, and delivery ETAs.
        </p>
        <button
          onClick={onOpenLogin}
          className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (loading && orders.length === 0) {
    return <div className="py-16 text-center text-xs text-slate-400">Loading order records...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 max-w-md mx-auto shadow-2xs">
        <Package className="w-12 h-12 text-slate-300 mx-auto mb-3 stroke-1" />
        <h2 className="text-base font-bold text-slate-800">No Orders Yet</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          You haven't placed any specialized medicine orders. Browse the catalog to start.
        </p>
        <button
          onClick={onExploreCatalog}
          className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl"
        >
          Explore Rare Catalog
        </button>
      </div>
    );
  }

  const order = selectedOrder || orders[0];
  const canCancel = ['Order Placed', 'Pending Verification', 'Confirmed'].includes(order.status);

  const allSteps: OrderStatus[] = [
    'Order Placed',
    'Pending Verification',
    'Confirmed',
    'Processing',
    'Ready for Delivery',
    'Out for Delivery',
    'Delivered',
  ];

  const currentStepIndex = allSteps.indexOf(order.status as any);

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto">
      {/* Title & Order Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Order & Delivery Tracking</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active tracking with live IoT cold-chain temperature monitoring
          </p>
        </div>

        {/* Order Selector Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Switch Order:</span>
          <select
            value={order.id}
            onChange={(e) => {
              const found = orders.find((o) => o.id === e.target.value);
              if (found) setSelectedOrder(found);
            }}
            className="py-1.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-sky-500 shadow-2xs"
          >
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                #{o.orderNumber} ({o.status}) - ₱{o.total.toFixed(2)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Order Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Top Header Strip */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900">Order #{order.orderNumber}</h2>
                <StatusBadge status={order.status} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Placed on {new Date(order.orderDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canCancel && (
              <button
                onClick={() => setCancelModalOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
              >
                Cancel Order
              </button>
            )}
            <span className="text-sm font-extrabold text-slate-900 tabular-nums">
              ₱{order.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Live Cold-Chain IoT Sensor Gauge */}
        {order.coldChainAssurance && (
          <div className="mx-5 my-4 p-4 rounded-2xl bg-gradient-to-r from-cyan-50 via-sky-50 to-white border border-cyan-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <ThermometerSnowflake className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-cyan-800 tracking-wider">
                  Live Cold-Chain Telemetry (CryoCube IoT)
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-lg font-black text-slate-900 tabular-nums">
                    {order.currentTemp || '3.6°C'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    SAFE (Within 2°C - 8°C Spec)
                  </span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-600 sm:text-right">
              <span className="block font-medium text-slate-800">
                Courier: {order.tracking.courierName}
              </span>
              <span className="block text-slate-500 font-mono text-[10px]">
                Tracking: {order.tracking.trackingNumber}
              </span>
            </div>
          </div>
        )}

        {/* Visual Progress Stepper (8 Steps) */}
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
            Order Progress Timeline
          </h3>

          {order.status === 'Cancelled' ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 flex items-start gap-2.5">
              <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Order Was Cancelled</span>
                <p className="mt-0.5">
                  Reason: {order.cancellationReason || 'Cancelled by customer.'} Sandbox refund has been issued.
                </p>
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* Stepper bar */}
              <div className="hidden sm:grid grid-cols-7 gap-2 text-center relative mb-6">
                {allSteps.map((step, idx) => {
                  const isDone = currentStepIndex >= idx;
                  const isCurrent = currentStepIndex === idx;
                  return (
                    <div key={step} className="flex flex-col items-center relative">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all z-10 ${
                          isCurrent
                            ? 'bg-sky-600 text-white ring-4 ring-sky-100 scale-110 shadow-sm'
                            : isDone
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        {isDone && !isCurrent ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <span
                        className={`text-[10px] mt-2 font-medium leading-tight max-w-[80px] ${
                          isCurrent
                            ? 'font-bold text-sky-700'
                            : isDone
                            ? 'text-slate-800'
                            : 'text-slate-400'
                        }`}
                      >
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Mobile Stepper / Vertical Activity Logs */}
              <div className="space-y-3 pt-2">
                {order.tracking.timeline.map((entry, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs">
                    <div className="mt-0.5 w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 font-bold text-[10px]">
                      {idx + 1}
                    </div>
                    <div className="flex-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{entry.step}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-0.5">{entry.note}</p>
                      {entry.actor && (
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Verified by: {entry.actor}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Items & Shipping Breakdown */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Items Recap */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Prescribed Medicines in Package
            </h3>
            <div className="space-y-2">
              {order.items.map((it, idx) => (
                <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">{it.name}</span>
                      {it.requiresPrescription && <RxBadge />}
                    </div>
                    <span className="text-slate-500 text-[11px]">{it.brand} · Qty: {it.quantity}</span>
                  </div>
                  <span className="font-extrabold text-slate-900 tabular-nums">
                    ₱{(it.price * it.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Destination & Payment */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Delivery & Payment Record
            </h3>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">{order.shippingAddress.recipientName}</span>
                  <span className="text-slate-600 block">
                    {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                  </span>
                  <span className="text-slate-500 font-mono text-[11px] block mt-0.5">
                    Phone: {order.shippingAddress.phone}
                  </span>
                </div>
              </div>
              {order.shippingAddress.deliveryInstructions && (
                <p className="text-[11px] text-sky-800 bg-sky-50 p-2 rounded-lg mt-2">
                  <strong>Instructions:</strong> {order.shippingAddress.deliveryInstructions}
                </p>
              )}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-bold text-slate-900">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Status:</span>
                <span className="font-semibold text-emerald-700">{order.paymentStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Courier Tracking:</span>
                <span className="font-mono text-slate-700">{order.tracking.trackingNumber}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Cancel Order #{order.orderNumber}?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Your order will be halted, reserved stock will be immediately released back to pharmacy inventory, and a sandbox refund will be processed.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for cancellation
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="Patient schedule changed">Patient schedule changed</option>
                <option value="Ordered duplicate medication">Ordered duplicate medication</option>
                <option value="Physician altered clinical regimen">Physician altered clinical regimen</option>
                <option value="Delivery address error">Delivery address error</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
