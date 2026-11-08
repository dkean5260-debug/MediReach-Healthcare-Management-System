import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Lock,
  MapPin,
  Heart,
  MessageSquare,
  LogOut,
  ShieldCheck,
  Plus,
  Trash2,
  CheckCircle2,
  Send,
  Building,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { DeliveryAddress, SupportTicket, Medicine } from '../../types/index.ts';
import { StatusBadge } from '../ui/Badge.tsx';

interface Props {
  onOpenLogin: () => void;
  onExploreCatalog: () => void;
  onSelectMedicine: (med: Medicine) => void;
}

export const CustomerProfile: React.FC<Props> = ({ onOpenLogin, onExploreCatalog, onSelectMedicine }) => {
  const { user, token, logout, updateProfile, changePassword } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'addresses' | 'favorites' | 'support'>('profile');

  // Edit profile state
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);

  // Addresses state
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');
  const [newZip, setNewZip] = useState('');
  const [newLabel, setNewLabel] = useState('Home');
  const [showAddAddress, setShowAddAddress] = useState(false);

  // Favorites state
  const [favoriteMeds, setFavoriteMeds] = useState<Medicine[]>([]);

  // Support Tickets state
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState<'Order Inquiry' | 'Prescription Help' | 'Cold-Chain Delivery' | 'Rare Drug Sourcing' | 'Billing'>('Order Inquiry');
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [replyText, setReplyText] = useState('');
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);

  const fetchAddresses = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/customer/addresses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFavorites = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/customer/favorites', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFavoriteMeds(data.medicines || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTickets = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/customer/tickets', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const list = data.tickets || [];
        setTickets(list);
        if (list.length > 0 && !activeTicket) {
          setActiveTicket(list[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone);
      fetchAddresses();
      fetchFavorites();
      fetchTickets();
    }
  }, [user, token]);

  if (!user) {
    return (
      <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 max-w-md mx-auto shadow-2xs">
        <User className="w-12 h-12 text-sky-600 mx-auto mb-3 stroke-1" />
        <h2 className="text-lg font-bold text-slate-900">Patient Account</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          Sign in to manage your clinical profile, addresses, favorites, and pharmacist support.
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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await updateProfile(name, phone);
    if (res.success) {
      setProfileMsg('Personal information updated successfully.');
      setTimeout(() => setProfileMsg(null), 3000);
    } else {
      setProfileMsg(res.error || 'Failed to update');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await changePassword(currentPassword, newPassword);
    if (res.success) {
      setPasswordMsg('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setPasswordMsg(null), 3000);
    } else {
      setPasswordMsg(res.error || 'Failed to change password');
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
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
          recipientName: name,
          street: newStreet,
          city: newCity,
          state: newState,
          postalCode: newZip,
          phone,
          isDefault: addresses.length === 0,
        }),
      });
      if (res.ok) {
        setShowAddAddress(false);
        setNewStreet('');
        setNewCity('');
        setNewState('');
        setNewZip('');
        fetchAddresses();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/customer/addresses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchAddresses();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const res = await fetch('/api/customer/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject: newTicketSubject,
          category: newTicketCategory,
          message: newTicketMessage,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewTicketSubject('');
        setNewTicketMessage('');
        setShowNewTicketForm(false);
        fetchTickets();
        setActiveTicket(data.ticket);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReplyTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyText.trim() || !token) return;
    try {
      const res = await fetch(`/api/customer/tickets/${activeTicket.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: replyText.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveTicket(data.ticket);
        setReplyText('');
        fetchTickets();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto">
      {/* Profile Header Card */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-sky-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md shadow-sky-600/20">
            {user.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">{user.name}</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{user.phone}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="self-start sm:self-auto px-4 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/70 border border-rose-200 rounded-xl transition-colors flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none text-xs font-semibold">
        {[
          { id: 'profile', label: 'Personal Information', icon: User },
          { id: 'addresses', label: 'Delivery Addresses', icon: MapPin },
          { id: 'favorites', label: 'Saved Medicines', icon: Heart },
          { id: 'support', label: 'Pharmacy Help & Support', icon: MessageSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Personal Info & Password */}
      {activeSubTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Edit Information */}
          <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Update Personal Details
            </h3>
            {profileMsg && (
              <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900">
                {profileMsg}
              </div>
            )}
            <form onSubmit={handleUpdateProfile} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Save Profile Changes
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Change Password
            </h3>
            {passwordMsg && (
              <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900">
                {passwordMsg}
              </div>
            )}
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Update Password
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 2: Delivery Addresses */}
      {activeSubTab === 'addresses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Saved Delivery Locations
            </h3>
            <button
              onClick={() => setShowAddAddress(!showAddAddress)}
              className="px-3 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Address</span>
            </button>
          </div>

          {showAddAddress && (
            <form onSubmit={handleAddAddress} className="p-5 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900">New Address Form</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500">Label</label>
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="e.g. Home, Hospital Clinic"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500">Street</label>
                  <input
                    type="text"
                    value={newStreet}
                    onChange={(e) => setNewStreet(e.target.value)}
                    placeholder="Street & Suite"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="City"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  required
                />
                <input
                  type="text"
                  placeholder="State"
                  value={newState}
                  onChange={(e) => setNewState(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  required
                />
                <input
                  type="text"
                  placeholder="ZIP"
                  value={newZip}
                  onChange={(e) => setNewZip(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAddress(false)}
                  className="px-3 py-1.5 text-xs text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-sky-600 rounded-lg"
                >
                  Save Address
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2 relative"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs">{addr.label}</span>
                    {addr.isDefault && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-sky-100 text-sky-800 rounded font-semibold">
                        Default
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-600">
                  {addr.recipientName}
                  <br />
                  {addr.street}, {addr.city}, {addr.state} {addr.postalCode}
                </p>
                <p className="text-[11px] text-slate-400 font-mono">{addr.phone}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Saved Medicines Wishlist */}
      {activeSubTab === 'favorites' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Saved Prescriptions & Orphan Medicines
            </h3>
            <button
              onClick={onExploreCatalog}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700"
            >
              Browse Catalog
            </button>
          </div>

          {favoriteMeds.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 p-6">
              <Heart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No saved medicines yet. Tap the heart icon on any medicine to save for quick reordering.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {favoriteMeds.map((med) => (
                <div
                  key={med.id}
                  onClick={() => onSelectMedicine(med)}
                  className="p-3 bg-white rounded-2xl border border-slate-200 hover:border-sky-300 shadow-2xs transition-all flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={med.imageUrl}
                      alt={med.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 truncate">{med.name}</h4>
                      <p className="text-[11px] text-slate-500">{med.brand} · {med.dosageForm}</p>
                      <span className="text-xs font-bold text-sky-600">₱{med.price.toFixed(2)}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectMedicine(med);
                    }}
                    className="px-3 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg shrink-0"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Customer Support Desk & Chat Thread */}
      {activeSubTab === 'support' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Specialty Pharmacy Help & Support Desk
              </h3>
              <p className="text-xs text-slate-500">Direct consultation with licensed pharmacists & logistics</p>
            </div>
            <button
              onClick={() => setShowNewTicketForm(!showNewTicketForm)}
              className="px-3 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs"
            >
              + Create Support Ticket
            </button>
          </div>

          {/* New Ticket Modal / Form */}
          {showNewTicketForm && (
            <form onSubmit={handleCreateTicket} className="p-5 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900">Submit New Inquiry</h4>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">Subject</label>
                <input
                  type="text"
                  value={newTicketSubject}
                  onChange={(e) => setNewTicketSubject(e.target.value)}
                  placeholder="e.g. Inquiring regarding delivery cold-chain window"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-1">Category</label>
                  <select
                    value={newTicketCategory}
                    onChange={(e) => setNewTicketCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="Order Inquiry">Order Inquiry</option>
                    <option value="Prescription Help">Prescription Help</option>
                    <option value="Cold-Chain Delivery">Cold-Chain Delivery</option>
                    <option value="Rare Drug Sourcing">Rare Drug Sourcing</option>
                    <option value="Billing">Billing & Insurance</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">Message</label>
                <textarea
                  rows={3}
                  value={newTicketMessage}
                  onChange={(e) => setNewTicketMessage(e.target.value)}
                  placeholder="Describe your inquiry..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewTicketForm(false)}
                  className="px-3 py-1.5 text-xs text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-sky-600 rounded-lg shadow-xs"
                >
                  Send to Pharmacy Team
                </button>
              </div>
            </form>
          )}

          {/* Tickets List & Interactive Chat Pane */}
          {tickets.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 p-6">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No support tickets created yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Ticket selector list */}
              <div className="space-y-2 md:col-span-1">
                {tickets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTicket(t)}
                    className={`w-full p-3 rounded-2xl border text-left transition-all ${
                      activeTicket?.id === t.id
                        ? 'border-sky-500 bg-sky-50/60 shadow-2xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-slate-400 font-bold">{t.ticketNumber}</span>
                      <StatusBadge status={t.status} />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">{t.subject}</h4>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{t.category}</span>
                  </button>
                ))}
              </div>

              {/* Chat Thread */}
              {activeTicket && (
                <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-2xs flex flex-col h-[400px]">
                  {/* Chat header */}
                  <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{activeTicket.subject}</h4>
                      <p className="text-[10px] text-slate-500">
                        {activeTicket.category} · Priority: {activeTicket.priority}
                      </p>
                    </div>
                    <StatusBadge status={activeTicket.status} />
                  </div>

                  {/* Messages scroll */}
                  <div className="p-4 flex-1 overflow-y-auto space-y-3">
                    {activeTicket.messages.map((m) => {
                      const isMe = m.senderId === user.id;
                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[80%] p-3 rounded-2xl text-xs ${
                              isMe
                                ? 'bg-sky-600 text-white rounded-br-xs'
                                : 'bg-slate-100 text-slate-800 rounded-bl-xs'
                            }`}
                          >
                            <p className="font-bold text-[10px] opacity-80 mb-0.5">{m.senderName}</p>
                            <p className="leading-relaxed">{m.text}</p>
                          </div>
                          <span className="text-[9px] text-slate-400 mt-0.5 px-1 font-mono">
                            {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Reply bar */}
                  <form onSubmit={handleReplyTicket} className="p-3 border-t border-slate-100 flex gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your response to pharmacy support..."
                      className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                    />
                    <button
                      type="submit"
                      disabled={!replyText.trim()}
                      className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white rounded-xl shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
