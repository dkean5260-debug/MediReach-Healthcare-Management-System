import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Package,
  FileCheck2,
  Boxes,
  Truck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  Search,
  Plus,
  Minus,
  ShieldAlert,
  ThermometerSnowflake,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Order, Prescription, Medicine, OrderStatus } from '../../types/index.ts';
import { StatusBadge, ColdChainBadge, RxBadge } from '../ui/Badge.tsx';

interface Props {
  initialTab?: string;
}

export const StaffPortal: React.FC<Props> = ({ initialTab = 'overview' }) => {
  const { user, token } = useAuth();
  const [currentTab, setCurrentTab] = useState<'overview' | 'orders' | 'prescriptions' | 'inventory' | 'reports'>(
    initialTab as any || 'overview'
  );

  // Overview stats
  const [overview, setOverview] = useState({
    totalOrdersToday: 0,
    pendingOrders: 0,
    pendingPrescriptions: 0,
    availableMedicines: 0,
    lowStockMedicines: 0,
    completedDeliveries: 0,
  });

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusUpdateNote, setStatusUpdateNote] = useState('');
  const [newOrderStatus, setNewOrderStatus] = useState<OrderStatus>('Processing');
  const [courierNameInput, setCourierNameInput] = useState('');
  const [trackingNumberInput, setTrackingNumberInput] = useState('');
  const [currentTempInput, setCurrentTempInput] = useState('3.4°C');
  const [updatingOrder, setUpdatingOrder] = useState(false);

  // Prescriptions
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [rxFilter, setRxFilter] = useState('All');
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [rxDecisionNotes, setRxDecisionNotes] = useState('');
  const [rxRejectionReason, setRxRejectionReason] = useState('');
  const [verifyingRx, setVerifyingRx] = useState(false);

  // Inventory
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [adjustMed, setAdjustMed] = useState<Medicine | null>(null);
  const [adjustQty, setAdjustQty] = useState(5);
  const [adjustReason, setAdjustReason] = useState('Direct manufacturer cold-chain batch intake');
  const [adjustType, setAdjustType] = useState<'batch_intake' | 'manual_add' | 'manual_reduction'>('batch_intake');
  const [adjusting, setAdjusting] = useState(false);

  // Reports
  const [reportsData, setReportsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const fetchOverview = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/staff/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setOverview(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOrders = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/staff/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPrescriptions = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/staff/prescriptions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPrescriptions(data.prescriptions || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchInventory = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/staff/inventory', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMedicines(data.medicines || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchReports = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/staff/reports', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setReportsData(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchOverview();
    fetchOrders();
    fetchPrescriptions();
    fetchInventory();
    fetchReports();
  }, [token]);

  // Order status update
  const handleUpdateOrderStatus = async () => {
    if (!selectedOrder || !token) return;
    try {
      setUpdatingOrder(true);
      const res = await fetch(`/api/staff/orders/${selectedOrder.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newOrderStatus,
          note: statusUpdateNote || `Status updated to ${newOrderStatus} by ${user?.name}`,
          courierName: courierNameInput || undefined,
          trackingNumber: trackingNumberInput || undefined,
          currentTemp: currentTempInput || undefined,
        }),
      });
      const data = await res.json();
      setUpdatingOrder(false);
      if (res.ok) {
        showToast(`Order #${selectedOrder.orderNumber} updated to ${newOrderStatus}`);
        setSelectedOrder(null);
        fetchOrders();
        fetchOverview();
      }
    } catch (e) {
      setUpdatingOrder(false);
      console.error(e);
    }
  };

  // Prescription verification
  const handleVerifyPrescription = async (status: 'Approved' | 'Rejected') => {
    if (!selectedRx || !token) return;
    try {
      setVerifyingRx(true);
      const res = await fetch(`/api/staff/prescriptions/${selectedRx.id}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          notes: rxDecisionNotes || 'Verified against Board of Pharmacy Registry',
          rejectionReason: status === 'Rejected' ? rxRejectionReason || 'Invalid medical license registration' : undefined,
        }),
      });
      const data = await res.json();
      setVerifyingRx(false);
      if (res.ok) {
        showToast(`Prescription from ${selectedRx.doctorName} marked as ${status}`);
        setSelectedRx(null);
        fetchPrescriptions();
        fetchOverview();
      }
    } catch (e) {
      setVerifyingRx(false);
      console.error(e);
    }
  };

  // Inventory Stock Adjustment
  const handleAdjustStock = async () => {
    if (!adjustMed || !token) return;
    try {
      setAdjusting(true);
      const res = await fetch('/api/staff/inventory/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          medicineId: adjustMed.id,
          changeType: adjustType,
          quantity: adjustQty,
          reason: adjustReason,
        }),
      });
      setAdjusting(false);
      if (res.ok) {
        showToast(`Stock updated for ${adjustMed.name}`);
        setAdjustMed(null);
        fetchInventory();
        fetchOverview();
      }
    } catch (e) {
      setAdjusting(false);
      console.error(e);
    }
  };

  const filteredOrders =
    orderStatusFilter === 'All'
      ? orders
      : orders.filter((o) => o.status === orderStatusFilter);

  const filteredRxs =
    rxFilter === 'All'
      ? prescriptions
      : prescriptions.filter((p) => p.status === rxFilter);

  return (
    <div className="space-y-6 pb-24 max-w-7xl mx-auto">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 p-3 bg-slate-900 text-white text-xs font-medium rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Staff Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 bg-gradient-to-r from-indigo-900 via-slate-900 to-sky-950 text-white rounded-3xl shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/80 border border-indigo-400/30 flex items-center justify-center shadow-inner">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                Staff Pharmacy Workbench
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                RPh Licensed
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold mt-0.5">{user?.name}</h1>
            <p className="text-xs text-slate-300">
              Cold-Chain Fulfillment & Doctor Rx Verification Terminal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono text-slate-300 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
          <ThermometerSnowflake className="w-4 h-4 text-cyan-300" />
          <span>Cold Room 1: 3.2°C (OK)</span>
        </div>
      </div>

      {/* Staff Tabs Navigation */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none text-xs font-semibold">
        {[
          { id: 'overview', label: 'Workbench Overview', icon: TrendingUp },
          { id: 'orders', label: `Orders (${orders.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled').length})`, icon: Package },
          { id: 'prescriptions', label: `Prescriptions (${prescriptions.filter((p) => p.status === 'Pending Review').length})`, icon: FileCheck2 },
          { id: 'inventory', label: 'Cold Storage Inventory', icon: Boxes },
          { id: 'reports', label: 'Daily Reports', icon: TrendingUp },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview KPIs */}
      {currentTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Today's Orders", val: overview.totalOrdersToday, color: 'text-sky-700 bg-sky-50' },
              { label: 'Pending Orders', val: overview.pendingOrders, color: 'text-amber-700 bg-amber-50' },
              { label: 'Pending Doctor Rx', val: overview.pendingPrescriptions, color: 'text-indigo-700 bg-indigo-50' },
              { label: 'Available Medicines', val: overview.availableMedicines, color: 'text-emerald-700 bg-emerald-50' },
              { label: 'Low Stock Alerts', val: overview.lowStockMedicines, color: 'text-rose-700 bg-rose-50' },
              { label: 'Completed Deliveries', val: overview.completedDeliveries, color: 'text-slate-700 bg-slate-100' },
            ].map((kpi, idx) => (
              <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 block truncate">{kpi.label}</span>
                <span className={`text-2xl font-black block tabular-nums ${kpi.color.split(' ')[0]}`}>
                  {kpi.val}
                </span>
              </div>
            ))}
          </div>

          {/* Quick Action Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Urgent Orders Needing Staff Action */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-sky-600" />
                  <span>Orders Awaiting Fulfillment</span>
                </h3>
                <button
                  onClick={() => setCurrentTab('orders')}
                  className="text-xs text-sky-600 hover:text-sky-700 font-semibold"
                >
                  View All &rarr;
                </button>
              </div>

              <div className="space-y-2">
                {orders
                  .filter((o) => ['Order Placed', 'Pending Verification', 'Confirmed', 'Processing'].includes(o.status))
                  .slice(0, 4)
                  .map((ord) => (
                    <div
                      key={ord.id}
                      onClick={() => {
                        setSelectedOrder(ord);
                        setCurrentTab('orders');
                      }}
                      className="p-3 rounded-2xl border border-slate-200 hover:border-sky-300 hover:bg-slate-50 transition-all flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">#{ord.orderNumber}</span>
                          <StatusBadge status={ord.status} />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {ord.customerName} · {ord.items.length} items · ${ord.total.toFixed(2)}
                        </p>
                      </div>
                      <button className="px-2.5 py-1 text-xs font-semibold text-sky-700 bg-sky-50 rounded-lg">
                        Process
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            {/* Prescriptions Needing Verification */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-indigo-600" />
                  <span>Prescriptions Pending Verification</span>
                </h3>
                <button
                  onClick={() => setCurrentTab('prescriptions')}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  Verification Queue &rarr;
                </button>
              </div>

              <div className="space-y-2">
                {prescriptions
                  .filter((p) => p.status === 'Pending Review' || p.status === 'Under Verification')
                  .slice(0, 4)
                  .map((rx) => (
                    <div
                      key={rx.id}
                      onClick={() => {
                        setSelectedRx(rx);
                        setCurrentTab('prescriptions');
                      }}
                      className="p-3 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 transition-all flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">{rx.doctorName}</span>
                          <StatusBadge status={rx.status} />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Patient: {rx.customerName} · License: {rx.licenseRegNo}
                        </p>
                      </div>
                      <button className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 rounded-lg">
                        Review Doc
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Order Management */}
      {currentTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Customer Orders Fulfillment
            </h3>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {['All', 'Order Placed', 'Confirmed', 'Processing', 'Ready for Delivery', 'Out for Delivery', 'Delivered', 'Cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => setOrderStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    orderStatusFilter === st
                      ? 'bg-sky-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Order ID</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Medicines</th>
                    <th className="p-3.5">Total</th>
                    <th className="p-3.5">Cold Chain</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">#{ord.orderNumber}</td>
                      <td className="p-3.5">
                        <span className="font-semibold block text-slate-900">{ord.customerName}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{ord.customerPhone}</span>
                      </td>
                      <td className="p-3.5 max-w-[200px]">
                        <span className="truncate block font-medium">
                          {ord.items.map((it) => `${it.name} (x${it.quantity})`).join(', ')}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold tabular-nums">${ord.total.toFixed(2)}</td>
                      <td className="p-3.5">
                        {ord.coldChainAssurance ? (
                          <ColdChainBadge temp={ord.currentTemp} />
                        ) : (
                          <span className="text-slate-400 text-[11px]">Room Temp</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <StatusBadge status={ord.status} />
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => {
                            setSelectedOrder(ord);
                            setNewOrderStatus(ord.status);
                            setCourierNameInput(ord.tracking.courierName);
                            setTrackingNumberInput(ord.tracking.trackingNumber);
                            setCurrentTempInput(ord.currentTemp || '3.4°C');
                          }}
                          className="px-3 py-1 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors"
                        >
                          Update Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Order Status Update Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Update Order #{selectedOrder.orderNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  Customer: {selectedOrder.customerName} · {selectedOrder.customerPhone}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Advance Status To:</label>
                <select
                  value={newOrderStatus}
                  onChange={(e) => setNewOrderStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  <option value="Confirmed">Confirmed</option>
                  <option value="Processing">Processing (Packaging in cleanroom)</option>
                  <option value="Ready for Delivery">Ready for Delivery (Inspected by RPh)</option>
                  <option value="Out for Delivery">Out for Delivery (Refrigerated vehicle en route)</option>
                  <option value="Delivered">Delivered (Direct signature completed)</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pharmacist / Dispatch Notes (Visible to Customer):
                </label>
                <textarea
                  rows={2}
                  value={statusUpdateNote}
                  onChange={(e) => setStatusUpdateNote(e.target.value)}
                  placeholder="e.g. Package sealed in CryoCube refrigerated container. Batch inspected by Elena Rostova, RPh."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Courier Carrier</label>
                  <input
                    type="text"
                    value={courierNameInput}
                    onChange={(e) => setCourierNameInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tracking Number</label>
                  <input
                    type="text"
                    value={trackingNumberInput}
                    onChange={(e) => setTrackingNumberInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              {selectedOrder.coldChainAssurance && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Current Temperature Reading (°C)
                  </label>
                  <input
                    type="text"
                    value={currentTempInput}
                    onChange={(e) => setCurrentTempInput(e.target.value)}
                    placeholder="e.g. 3.4°C"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-cyan-800 font-bold"
                  />
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/60">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateOrderStatus}
                disabled={updatingOrder}
                className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs disabled:opacity-50"
              >
                {updatingOrder ? 'Updating...' : 'Save & Notify Customer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Prescription Verification Workbench */}
      {currentTab === 'prescriptions' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Clinical Prescription Verification Workbench
              </h3>
              <p className="text-xs text-slate-500">
                Inspect doctor licenses, clinic hospital credentials, and authorize orphan drug dispensation
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              {['All', 'Pending Review', 'Approved', 'Rejected'].map((flt) => (
                <button
                  key={flt}
                  onClick={() => setRxFilter(flt)}
                  className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    rxFilter === flt
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {flt}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRxs.map((rx) => (
              <div
                key={rx.id}
                className="p-4 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] text-slate-400 font-bold">#{rx.id}</span>
                    <StatusBadge status={rx.status} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{rx.doctorName}</h4>
                  <p className="text-xs text-slate-600">{rx.clinicHospital}</p>
                  <p className="text-[11px] text-indigo-700 font-mono font-semibold mt-1">
                    License/NPI: {rx.licenseRegNo}
                  </p>

                  <div className="mt-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Patient:</span>
                      <span className="font-bold text-slate-800">{rx.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Issue Date:</span>
                      <span className="font-mono text-slate-700">{rx.issueDate}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 truncate max-w-[140px]">
                    {rx.documentName}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedRx(rx);
                      setRxDecisionNotes(rx.notes || 'Verified against Board of Pharmacy Registry.');
                      setRxRejectionReason('');
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Review & Verify</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prescription Review & Verification Modal */}
      {selectedRx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Verify Prescription: {selectedRx.doctorName}
                </h3>
                <p className="text-xs text-slate-500">
                  License: {selectedRx.licenseRegNo} · Patient: {selectedRx.customerName}
                </p>
              </div>
              <button
                onClick={() => setSelectedRx(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Document Image Zoom */}
              <div className="p-3 bg-slate-900/5 rounded-2xl border border-slate-200 flex items-center justify-center max-h-[300px] overflow-hidden">
                <img
                  src={selectedRx.documentUrl}
                  alt="Doctor Prescription Document"
                  className="max-h-[280px] object-contain rounded-lg shadow-sm"
                />
              </div>

              {/* License Check Box */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Doctor Medical Board Verification: <strong>{selectedRx.licenseRegNo}</strong> validated against State Medical Registry.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pharmacist Clinical Verification Notes:
                </label>
                <input
                  type="text"
                  value={rxDecisionNotes}
                  onChange={(e) => setRxDecisionNotes(e.target.value)}
                  placeholder="e.g. Validated for Soliris 300mg IV infusion protocol for 12 months."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Rejection Justification (Only if rejecting):
                </label>
                <input
                  type="text"
                  value={rxRejectionReason}
                  onChange={(e) => setRxRejectionReason(e.target.value)}
                  placeholder="e.g. Incomplete doctor signature or expired issue date."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-rose-700"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/60">
              <button
                onClick={() => handleVerifyPrescription('Rejected')}
                disabled={verifyingRx}
                className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl"
              >
                Reject Prescription
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedRx(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleVerifyPrescription('Approved')}
                  disabled={verifyingRx}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                >
                  Approve & Authorize Dispensation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Cold Storage Inventory Management */}
      {currentTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Cold-Chain Pharmacy Inventory Levels
              </h3>
              <p className="text-xs text-slate-500">Live storage counts with instant stock adjustment & audit</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Medicine</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Price</th>
                    <th className="p-3.5">Storage Temp</th>
                    <th className="p-3.5">Stock Available</th>
                    <th className="p-3.5">Min Alert</th>
                    <th className="p-3.5 text-right">Adjustment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {medicines.map((med) => {
                    const isLow = med.stock <= med.minStockAlert;
                    return (
                      <tr key={med.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3.5">
                          <span className="font-bold text-slate-900 block">{med.name}</span>
                          <span className="text-[11px] text-slate-400">{med.brand} · {med.dosageForm}</span>
                        </td>
                        <td className="p-3.5">{med.category}</td>
                        <td className="p-3.5 font-bold tabular-nums">${med.price.toFixed(2)}</td>
                        <td className="p-3.5">
                          {med.coldChain ? <ColdChainBadge /> : <span className="text-slate-500">Room Temp</span>}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`font-black tabular-nums text-sm ${
                              isLow ? 'text-rose-600' : 'text-slate-900'
                            }`}
                          >
                            {med.stock} units
                          </span>
                          {isLow && (
                            <span className="text-[10px] text-rose-600 block font-semibold">
                              LOW STOCK
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-400 font-mono">{med.minStockAlert}</td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => {
                              setAdjustMed(med);
                              setAdjustQty(5);
                              setAdjustType('batch_intake');
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                          >
                            Adjust Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {adjustMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Adjust Stock: {adjustMed.name}
            </h3>
            <p className="text-xs text-slate-500">
              Current stock: <strong>{adjustMed.stock} units</strong>
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Adjustment Type</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="batch_intake">Batch Intake (+ Manufacturer Delivery)</option>
                  <option value="manual_add">Manual Addition (+ Count Reconciliation)</option>
                  <option value="manual_reduction">Manual Reduction (- Damaged/Expired/Recall)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason / Batch Code</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Batch #BGN-2026-99 intake inspection verified"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setAdjustMed(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjustStock}
                disabled={adjusting}
                className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs"
              >
                {adjusting ? 'Saving...' : 'Apply Adjustment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Reports */}
      {currentTab === 'reports' && reportsData && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Daily Operational Pharmacy Reports ({reportsData.todayStr})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-xs text-slate-500 font-semibold block">Today's Total Sales</span>
              <span className="text-2xl font-black text-slate-900 tabular-nums">
                ${reportsData.todaySales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <p className="text-xs text-slate-500">
                {reportsData.todayOrdersCount} orders placed today across rare therapeutic categories.
              </p>
            </div>

            <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-xs text-slate-500 font-semibold block">Order Status Distribution</span>
              <div className="space-y-1 text-xs">
                {Object.keys(reportsData.statusBreakdown || {}).map((st) => (
                  <div key={st} className="flex justify-between py-0.5 border-b border-slate-50">
                    <span className="text-slate-600">{st}:</span>
                    <span className="font-bold text-slate-900">{reportsData.statusBreakdown[st]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
