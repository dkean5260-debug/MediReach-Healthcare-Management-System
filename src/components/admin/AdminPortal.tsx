import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Pill,
  BarChart3,
  ShieldAlert,
  Settings,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Download,
  AlertTriangle,
  FileText,
  DollarSign,
  PackageCheck,
  Edit,
  Trash2,
  Stethoscope,
  FileSignature,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { User, Medicine, AuditLog, SystemSettings } from '../../types/index.ts';
import { StatusBadge, ColdChainBadge, RxBadge } from '../ui/Badge.tsx';
import { DoctorPrescribingStudio } from './DoctorPrescribingStudio.tsx';

interface Props {
  initialTab?: string;
}

export const AdminPortal: React.FC<Props> = ({ initialTab = 'overview' }) => {
  const { user, token } = useAuth();
  const [currentTab, setCurrentTab] = useState<'overview' | 'prescribing_studio' | 'users' | 'medicines' | 'financial' | 'audit' | 'settings'>(
    (initialTab as any) || 'overview'
  );

  // Executive overview stats
  const [overview, setOverview] = useState<any>({
    totalCustomers: 0,
    totalStaff: 0,
    totalMedicines: 0,
    totalOrders: 0,
    totalSales: 0,
    pendingOrders: 0,
    pendingPrescriptions: 0,
    lowStockAlerts: 0,
  });

  // Users management
  const [users, setUsers] = useState<User[]>([]);
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [showCreateStaffModal, setShowCreateStaffModal] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffPassword, setStaffPassword] = useState('StaffPass123!');
  const [staffPermissions, setStaffPermissions] = useState<string[]>([
    'verify_prescriptions',
    'update_orders',
    'manage_inventory',
  ]);
  const [creatingStaff, setCreatingStaff] = useState(false);

  // Medicines management
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [editingMed, setEditingMed] = useState<Medicine | null>(null);

  // New medicine form
  const [medName, setMedName] = useState('');
  const [medBrand, setMedBrand] = useState('');
  const [medGeneric, setMedGeneric] = useState('');
  const [medCategory, setMedCategory] = useState('Metabolic & Genetic');
  const [medCondition, setMedCondition] = useState('');
  const [medStrength, setMedStrength] = useState('100 mg');
  const [medDosageForm, setMedDosageForm] = useState('Vial for Injection');
  const [medPrice, setMedPrice] = useState('2500');
  const [medStock, setMedStock] = useState('10');
  const [medMinStock, setMedMinStock] = useState('5');
  const [medRequiresRx, setMedRequiresRx] = useState(true);
  const [medColdChain, setMedColdChain] = useState(true);
  const [medIndications, setMedIndications] = useState('Indicated for specialized rare disorder.');
  const [medSaving, setMedSaving] = useState(false);

  // Financial reports
  const [financialData, setFinancialData] = useState<any>(null);

  // Audit logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditEntityFilter, setAuditEntityFilter] = useState('All');
  const [auditSearch, setAuditSearch] = useState('');

  // Settings
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [settingsSaving, setSettingsSaving] = useState(false);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const fetchOverview = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setOverview(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMedicines = async () => {
    try {
      const res = await fetch('/api/medicines');
      if (res.ok) {
        const data = await res.json();
        setMedicines(data.medicines || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFinancial = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/financial-reports', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setFinancialData(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAuditLogs = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/audit-logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.auditLogs || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSettings = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchOverview();
    fetchUsers();
    fetchMedicines();
    fetchFinancial();
    fetchAuditLogs();
    fetchSettings();
  }, [token]);

  // Create staff account
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      setCreatingStaff(true);
      const res = await fetch('/api/admin/users/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: staffName,
          email: staffEmail,
          phone: staffPhone,
          password: staffPassword,
          permissions: staffPermissions,
        }),
      });
      const data = await res.json();
      setCreatingStaff(false);
      if (res.ok) {
        showToast(`Staff account for ${staffName} provisioned successfully`);
        setShowCreateStaffModal(false);
        setStaffName('');
        setStaffEmail('');
        setStaffPhone('');
        fetchUsers();
        fetchOverview();
      } else {
        alert(data.error || 'Failed to create staff account');
      }
    } catch (e) {
      setCreatingStaff(false);
      console.error(e);
    }
  };

  // Toggle user active / suspended
  const handleToggleUserStatus = async (targetUser: User) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}/status`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`User ${targetUser.email} is now ${data.user.isActive ? 'Active' : 'Suspended'}`);
        fetchUsers();
      } else {
        alert(data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Create or edit medicine
  const handleSaveMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      setMedSaving(true);
      const payload = {
        name: medName,
        brand: medBrand,
        genericName: medGeneric || medName,
        category: medCategory,
        condition: medCondition,
        strength: medStrength,
        dosageForm: medDosageForm,
        price: parseFloat(medPrice),
        stock: parseInt(medStock, 10),
        minStockAlert: parseInt(medMinStock, 10),
        requiresPrescription: medRequiresRx,
        coldChain: medColdChain,
        indications: medIndications,
      };

      const url = editingMed ? `/api/admin/medicines/${editingMed.id}` : '/api/admin/medicines';
      const method = editingMed ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      setMedSaving(false);
      if (res.ok) {
        showToast(`Medicine ${medName} ${editingMed ? 'updated' : 'listed'} successfully`);
        setShowAddMedModal(false);
        setEditingMed(null);
        fetchMedicines();
        fetchOverview();
      }
    } catch (e) {
      setMedSaving(false);
      console.error(e);
    }
  };

  const handleArchiveMedicine = async (med: Medicine) => {
    if (!confirm(`Are you sure you want to archive "${med.name}" from public listing?`)) return;
    try {
      const res = await fetch(`/api/admin/medicines/${med.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast(`Archived ${med.name}`);
        fetchMedicines();
        fetchOverview();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings || !token) return;
    try {
      setSettingsSaving(true);
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      setSettingsSaving(false);
      if (res.ok) showToast('System settings updated successfully');
    } catch (e) {
      setSettingsSaving(false);
      console.error(e);
    }
  };

  // Export financial CSV
  const handleExportCSV = () => {
    if (!financialData) return;
    const rows = [
      ['Date', 'Revenue (₱)'],
      ...(financialData.dailyTrend || []).map((t: any) => [t.date, t.amount.toFixed(2)]),
      ['', ''],
      ['Medicine', 'Brand', 'Units Sold', 'Total Sales (₱)'],
      ...(financialData.topSellingMedicines || []).map((m: any) => [m.name, m.brand, m.unitsSold, m.totalSales.toFixed(2)]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `medireach_financial_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredUsers =
    userRoleFilter === 'All' ? users : users.filter((u) => u.role === userRoleFilter);

  const filteredLogs = auditLogs.filter((l) => {
    if (auditEntityFilter !== 'All' && l.entity !== auditEntityFilter) return false;
    if (auditSearch) {
      const q = auditSearch.toLowerCase();
      return (
        l.action.toLowerCase().includes(q) ||
        l.userName.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-24 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 p-3 bg-slate-900 text-white text-xs font-medium rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Admin Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white rounded-3xl shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/80 border border-emerald-400/30 flex items-center justify-center shadow-inner">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                Administrator Executive Suite
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                Super Admin Access
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold mt-0.5">{user?.name}</h1>
            <p className="text-xs text-slate-300">
              System RBAC, Master Catalog, Cold-Chain Financials & Audit Trails
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setCurrentTab('prescribing_studio')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
          >
            <Stethoscope className="w-4 h-4 text-white" />
            <span>Doctor E-VERIFIED PRESCRIBER Pad</span>
          </button>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-200 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Total Sales: ₱{overview.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none text-xs font-semibold">
        {[
          { id: 'overview', label: 'Executive KPIs', icon: BarChart3 },
          { id: 'prescribing_studio', label: 'Doctor Prescribing Studio', icon: Stethoscope },
          { id: 'users', label: `Users & Staff RBAC (${users.length})`, icon: Users },
          { id: 'medicines', label: `Medicine Catalog (${medicines.length})`, icon: Pill },
          { id: 'financial', label: 'Financial & Sales Reports', icon: DollarSign },
          { id: 'audit', label: `Audit Security Logs (${auditLogs.length})`, icon: ShieldAlert },
          { id: 'settings', label: 'System Settings', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Executive Overview */}
      {currentTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3.5">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 block">Total Revenue</span>
              <span className="text-2xl font-black text-slate-900 tabular-nums">
                ₱{overview.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-emerald-700 block font-semibold">+18.4% this quarter</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 block">Total Orders</span>
              <span className="text-2xl font-black text-slate-900 tabular-nums">{overview.totalOrders}</span>
              <span className="text-[10px] text-sky-700 block font-semibold">{overview.pendingOrders} pending dispatch</span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 block">Active Accounts</span>
              <span className="text-2xl font-black text-slate-900 tabular-nums">
                {overview.totalCustomers + overview.totalStaff}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {overview.totalCustomers} Patients · {overview.totalStaff} Staff
              </span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 block">Low Stock Alerts</span>
              <span className="text-2xl font-black text-rose-600 tabular-nums">{overview.lowStockAlerts}</span>
              <span className="text-[10px] text-rose-600 block font-semibold">Immediate reorder required</span>
            </div>
          </div>

          {/* Doctor E-Verified Prescriber Studio Access Card (Admin Only) */}
          <div className="p-5 bg-gradient-to-r from-blue-900 via-sky-950 to-slate-900 text-white rounded-3xl border border-sky-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>ADMIN ONLY · CLINICAL PRESCRIBING WORKSTATION</span>
              </div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-sky-400" />
                Doctor E-VERIFIED PRESCRIBER Pad & Prescribing Studio
              </h3>
              <p className="text-xs text-sky-200/80 max-w-xl leading-relaxed">
                Issue officially signed, verifiable electronic prescriptions directly into patient accounts for immediate checkout clearance. Includes customizable dosage, clinical indications, digital watermark seals, and printable Rx slips.
              </p>
            </div>
            <button
              onClick={() => setCurrentTab('prescribing_studio')}
              className="px-4 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 self-start sm:self-auto shrink-0 active:scale-95"
            >
              <FileSignature className="w-4 h-4" />
              <span>Open Prescribing Studio</span>
            </button>
          </div>

          {/* Quick Actions Stream */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Recent System Security Events
                </h3>
                <button
                  onClick={() => setCurrentTab('audit')}
                  className="text-xs text-sky-600 font-semibold"
                >
                  Full Trail &rarr;
                </button>
              </div>
              <div className="space-y-2">
                {auditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900">{log.action}</span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">{log.details}</p>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      User: {log.userName} ({log.userRole})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Administrator Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => {
                    setCurrentTab('users');
                    setShowCreateStaffModal(true);
                  }}
                  className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left"
                >
                  <Users className="w-5 h-5 text-indigo-600 mb-1" />
                  <span className="font-bold block text-slate-900">Provision Staff</span>
                  <span className="text-[11px] text-slate-500">Authorize employee account</span>
                </button>

                <button
                  onClick={() => {
                    setEditingMed(null);
                    setMedName('');
                    setMedBrand('');
                    setMedGeneric('');
                    setMedCondition('');
                    setShowAddMedModal(true);
                    setCurrentTab('medicines');
                  }}
                  className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left"
                >
                  <Pill className="w-5 h-5 text-emerald-600 mb-1" />
                  <span className="font-bold block text-slate-900">Add Medicine</span>
                  <span className="text-[11px] text-slate-500">List new orphan therapy</span>
                </button>

                <button
                  onClick={() => setCurrentTab('financial')}
                  className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left"
                >
                  <DollarSign className="w-5 h-5 text-sky-600 mb-1" />
                  <span className="font-bold block text-slate-900">Sales Reports</span>
                  <span className="text-[11px] text-slate-500">Export financial CSV</span>
                </button>

                <button
                  onClick={() => setCurrentTab('settings')}
                  className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left"
                >
                  <Settings className="w-5 h-5 text-slate-600 mb-1" />
                  <span className="font-bold block text-slate-900">System Settings</span>
                  <span className="text-[11px] text-slate-500">Fees & pharmacy license</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Doctor E-Verified Prescribing Studio (Strictly Admin Only) */}
      {currentTab === 'prescribing_studio' && (
        <DoctorPrescribingStudio
          medicines={medicines}
          token={token}
          onRefreshAll={fetchOverview}
          showToast={showToast}
        />
      )}

      {/* Tab 2: Users & Staff Management */}
      {currentTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                User Accounts & Role-Based Access Control (RBAC)
              </h3>
              <p className="text-xs text-slate-500">
                Authorized staff provisioning, permission sets, and account suspension
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex gap-1 text-xs">
                {['All', 'customer', 'staff', 'admin'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setUserRoleFilter(r)}
                    className={`px-3 py-1 rounded-lg capitalize font-medium ${
                      userRoleFilter === r
                        ? 'bg-slate-900 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowCreateStaffModal(true)}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Staff Account</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Phone</th>
                    <th className="p-3.5">Permissions / Assigned Access</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3.5">
                        <span className="font-bold text-slate-900 block">{u.name}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{u.email}</span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            u.role === 'admin'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : u.role === 'staff'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-sky-50 text-sky-700 border border-sky-200'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600 font-mono text-[11px]">{u.phone}</td>
                      <td className="p-3.5 max-w-[200px]">
                        {u.permissions ? (
                          <span className="text-[11px] text-slate-600 truncate block">
                            {u.permissions.join(', ')}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Patient Standard</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {u.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {u.id !== user?.id && (
                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                              u.isActive
                                ? 'text-rose-600 hover:bg-rose-50 border border-rose-200'
                                : 'text-emerald-600 hover:bg-emerald-50 border border-emerald-200'
                            }`}
                          >
                            {u.isActive ? 'Suspend' : 'Reactivate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create Staff Account Modal */}
      {showCreateStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-slate-900">Provision Authorized Staff Account</h3>
            <p className="text-xs text-slate-500">
              Only administrators can create staff accounts. Select authorized module permissions below.
            </p>

            <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Employee Full Name & Title</label>
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Dr. Arthur Wright, PharmD"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Staff Work Email</label>
                <input
                  type="email"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="arthur.wright@medireach.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Phone</label>
                  <input
                    type="tel"
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Temporary Password</label>
                  <input
                    type="text"
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">Authorized Permissions</label>
                <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {[
                    { id: 'verify_prescriptions', label: 'Verify Doctor Prescriptions' },
                    { id: 'update_orders', label: 'Process & Update Customer Orders' },
                    { id: 'manage_inventory', label: 'Adjust Cold Storage Inventory' },
                    { id: 'dispatch_deliveries', label: 'Assign Couriers & Live Temperatures' },
                  ].map((perm) => (
                    <label key={perm.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={staffPermissions.includes(perm.id)}
                        onChange={(e) => {
                          if (e.target.checked) setStaffPermissions([...staffPermissions, perm.id]);
                          else setStaffPermissions(staffPermissions.filter((p) => p !== perm.id));
                        }}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateStaffModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingStaff}
                  className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  {creatingStaff ? 'Provisioning...' : 'Provision Staff Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 3: Medicines Management (CRUD) */}
      {currentTab === 'medicines' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Specialized Orphan Medicines Catalog
              </h3>
              <p className="text-xs text-slate-500">Full catalog CRUD, price updates, and cold-chain compliance</p>
            </div>
            <button
              onClick={() => {
                setEditingMed(null);
                setMedName('');
                setMedBrand('');
                setMedGeneric('');
                setMedCondition('');
                setMedPrice('2500');
                setMedStock('10');
                setShowAddMedModal(true);
              }}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Medicine</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Medicine</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Price</th>
                    <th className="p-3.5">Stock</th>
                    <th className="p-3.5">Requires Rx</th>
                    <th className="p-3.5">Cold Chain</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {medicines.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3.5">
                        <span className="font-bold text-slate-900 block">{m.name}</span>
                        <span className="text-[11px] text-slate-400">{m.brand} · {m.dosageForm}</span>
                      </td>
                      <td className="p-3.5">{m.category}</td>
                      <td className="p-3.5 font-bold tabular-nums">₱{m.price.toFixed(2)}</td>
                      <td className="p-3.5 font-bold tabular-nums">{m.stock} units</td>
                      <td className="p-3.5">{m.requiresPrescription ? <RxBadge /> : <span className="text-slate-400">OTC</span>}</td>
                      <td className="p-3.5">{m.coldChain ? <ColdChainBadge /> : <span className="text-slate-400">Ambient</span>}</td>
                      <td className="p-3.5 text-right space-x-1">
                        <button
                          onClick={() => {
                            setEditingMed(m);
                            setMedName(m.name);
                            setMedBrand(m.brand);
                            setMedGeneric(m.genericName);
                            setMedCategory(m.category);
                            setMedCondition(m.condition);
                            setMedPrice(m.price.toString());
                            setMedStock(m.stock.toString());
                            setMedMinStock(m.minStockAlert.toString());
                            setMedRequiresRx(m.requiresPrescription);
                            setMedColdChain(m.coldChain);
                            setMedIndications(m.indications);
                            setShowAddMedModal(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-sky-600 rounded-lg"
                          title="Edit Medicine"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleArchiveMedicine(m)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                          title="Archive Listing"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add / Edit Medicine Modal */}
      {showAddMedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-slate-900">
              {editingMed ? `Edit Medicine: ${editingMed.name}` : 'Add New Specialized Medicine'}
            </h3>

            <form onSubmit={handleSaveMedicine} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Commercial Name</label>
                  <input
                    type="text"
                    value={medName}
                    onChange={(e) => setMedName(e.target.value)}
                    placeholder="e.g. Soliris"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Manufacturer / Brand</label>
                  <input
                    type="text"
                    value={medBrand}
                    onChange={(e) => setMedBrand(e.target.value)}
                    placeholder="e.g. Alexion Pharmaceuticals"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Generic Name</label>
                  <input
                    type="text"
                    value={medGeneric}
                    onChange={(e) => setMedGeneric(e.target.value)}
                    placeholder="e.g. Eculizumab"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={medCategory}
                    onChange={(e) => setMedCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="Metabolic & Genetic">Metabolic & Genetic</option>
                    <option value="Neurology & Spinal">Neurology & Spinal</option>
                    <option value="Rare Hematology">Rare Hematology</option>
                    <option value="Pulmonary & Respiratory">Pulmonary & Respiratory</option>
                    <option value="Endocrinology & Growth">Endocrinology & Growth</option>
                    <option value="Clinical Supplies & Infusion">Clinical Supplies & Infusion</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Indication / Condition</label>
                <input
                  type="text"
                  value={medCondition}
                  onChange={(e) => setMedCondition(e.target.value)}
                  placeholder="e.g. Paroxysmal Nocturnal Hemoglobinuria (PNH)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Price (₱ PHP)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={medPrice}
                    onChange={(e) => setMedPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Initial Stock</label>
                  <input
                    type="number"
                    value={medStock}
                    onChange={(e) => setMedStock(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Min Stock Alert</label>
                  <input
                    type="number"
                    value={medMinStock}
                    onChange={(e) => setMedMinStock(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4 p-3 bg-slate-50 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={medRequiresRx}
                    onChange={(e) => setMedRequiresRx(e.target.checked)}
                    className="rounded text-sky-600"
                  />
                  <span>Requires Doctor Prescription (Rx Only)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={medColdChain}
                    onChange={(e) => setMedColdChain(e.target.checked)}
                    className="rounded text-cyan-600"
                  />
                  <span>Cold-Chain Perishable (2°C - 8°C)</span>
                </label>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Clinical Indications</label>
                <textarea
                  rows={2}
                  value={medIndications}
                  onChange={(e) => setMedIndications(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMedModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={medSaving}
                  className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                >
                  {medSaving ? 'Saving...' : 'Save Medicine Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 4: Financial Reports */}
      {currentTab === 'financial' && financialData && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Financial Performance & Cold-Chain Logistics Summary
              </h3>
              <p className="text-xs text-slate-500">Validated sales data and payment channel distributions</p>
            </div>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export CSV Report</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-xs text-slate-500 block">Total Pharmacy Revenue</span>
              <span className="text-3xl font-black text-slate-900 tabular-nums">
                ₱{financialData.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">From {financialData.orderCount} completed & active orders</p>
            </div>

            <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-xs text-slate-500 block">Prescription-Only Biologics</span>
              <span className="text-3xl font-black text-indigo-700 tabular-nums">
                ₱{financialData.totalPrescriptionSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <p className="text-[11px] text-indigo-500 mt-1">Verified against doctor licenses</p>
            </div>

            <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-xs text-slate-500 block">CryoSafe Cold-Chain Orders</span>
              <span className="text-3xl font-black text-cyan-700 tabular-nums">
                ₱{financialData.totalColdChainSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <p className="text-[11px] text-cyan-500 mt-1">100% within 2°C to 8°C compliance</p>
            </div>
          </div>

          {/* Top Selling Products */}
          <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Top Dispensed Orphan Medicines
            </h4>
            <div className="space-y-2">
              {financialData.topSellingMedicines.map((m: any, idx: number) => (
                <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{m.name}</span>
                    <span className="text-[11px] text-slate-500">{m.brand} · {m.unitsSold} units dispensed</span>
                  </div>
                  <span className="text-sm font-extrabold text-slate-900 tabular-nums">
                    ₱{m.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Audit Security Logs */}
      {currentTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                System Security & Regulatory Audit Logs
              </h3>
              <p className="text-xs text-slate-500">Immutable records of authentication, prescription review, and inventory actions</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter logs..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl"
                />
              </div>

              <select
                value={auditEntityFilter}
                onChange={(e) => setAuditEntityFilter(e.target.value)}
                className="py-1.5 px-3 text-xs bg-white border border-slate-200 rounded-xl"
              >
                <option value="All">All Entities</option>
                <option value="auth">Auth & Security</option>
                <option value="prescription">Prescriptions</option>
                <option value="order">Orders</option>
                <option value="inventory">Inventory</option>
                <option value="user">User RBAC</option>
                <option value="medicine">Medicine Catalog</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px] font-sans">
                  <tr>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Actor</th>
                    <th className="p-3.5">Action</th>
                    <th className="p-3.5">Entity</th>
                    <th className="p-3.5">Details</th>
                    <th className="p-3.5">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60">
                      <td className="p-3.5 text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 font-sans">
                        {log.userName}
                        <span className="text-[10px] text-slate-400 block font-mono">({log.userRole})</span>
                      </td>
                      <td className="p-3.5 font-bold text-indigo-700">{log.action}</td>
                      <td className="p-3.5 text-slate-600">{log.entity}</td>
                      <td className="p-3.5 font-sans max-w-[280px] text-slate-700 truncate" title={log.details}>
                        {log.details}
                      </td>
                      <td className="p-3.5 text-slate-400">{log.ipAddress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: System Settings */}
      {currentTab === 'settings' && settings && (
        <form onSubmit={handleSaveSettings} className="p-6 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-4 text-xs max-w-2xl">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Pharmacy Configuration & Logistics Settings
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Pharmacy Facility Name</label>
              <input
                type="text"
                value={settings.pharmacyName}
                onChange={(e) => setSettings({ ...settings, pharmacyName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">State Pharmacy License No.</label>
              <input
                type="text"
                value={settings.licenseNumber}
                onChange={(e) => setSettings({ ...settings, licenseNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">24/7 Clinical Emergency Hotline</label>
              <input
                type="text"
                value={settings.emergencyHotline}
                onChange={(e) => setSettings({ ...settings, emergencyHotline: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Operating Hours</label>
              <input
                type="text"
                value={settings.operatingHours}
                onChange={(e) => setSettings({ ...settings, operatingHours: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Standard Delivery Fee (₱)</label>
              <input
                type="number"
                step="0.01"
                value={settings.defaultDeliveryFee}
                onChange={(e) => setSettings({ ...settings, defaultDeliveryFee: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Cold-Chain Shipper Fee (₱)</label>
              <input
                type="number"
                step="0.01"
                value={settings.coldChainFee}
                onChange={(e) => setSettings({ ...settings, coldChainFee: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Free Shipping Min (₱)</label>
              <input
                type="number"
                step="0.01"
                value={settings.freeShippingThreshold}
                onChange={(e) => setSettings({ ...settings, freeShippingThreshold: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={settingsSaving}
              className="px-6 py-2.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
            >
              {settingsSaving ? 'Saving...' : 'Save System Settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
