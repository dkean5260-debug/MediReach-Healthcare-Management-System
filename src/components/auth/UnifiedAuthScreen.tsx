import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Mail,
  Eye,
  EyeOff,
  UserCheck,
  Stethoscope,
  Building2,
  ArrowRight,
  UserPlus,
  Phone,
  User,
  CheckCircle2,
  KeyRound,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  BadgeAlert,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { UserRole } from '../../types/index.ts';

interface Props {
  onSuccess: () => void;
  onContinueAsGuest: () => void;
}

interface RoleAuthConfig {
  role: UserRole;
  title: string;
  name: string;
  email: string;
  badge: string;
  clearanceLevel: string;
  regulatoryNotice: string;
  defaultKey: string;
  icon: any;
  themeColor: string;
}

export const UnifiedAuthScreen: React.FC<Props> = ({ onSuccess, onContinueAsGuest }) => {
  const { login, register } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Selected role for authorization gate
  const [authGateRole, setAuthGateRole] = useState<RoleAuthConfig | null>(null);
  const [authKeyInput, setAuthKeyInput] = useState('');
  const [showAuthKey, setShowAuthKey] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Standard Login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(true);

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);
  const [tempPass, setTempPass] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Role Configurations with strict authorization definitions
  const roleConfigs: Record<UserRole, RoleAuthConfig> = {
    customer: {
      role: 'customer',
      title: 'Customer & Patient Access',
      name: 'Sarah Jenkins',
      email: 'customer.sarah@example.com',
      badge: 'Verified Patient Account',
      clearanceLevel: 'Level 1: Public Patient Access',
      regulatoryNotice: 'Authorized for personal prescription submission, specialized rare medicine purchasing, and private cold-chain delivery tracking.',
      defaultKey: 'customer123',
      icon: UserCheck,
      themeColor: 'sky',
    },
    staff: {
      role: 'staff',
      title: 'Licensed Pharmacist & Dispatch Access',
      name: 'Elena Rostova, RPh',
      email: 'pharmacist.elena@medireach.com',
      badge: 'State License #PH-77492 (Board Certified)',
      clearanceLevel: 'Level 2: Restricted Healthcare Professional Clearance',
      regulatoryNotice: 'RESTRICTED ACCESS: Authorized strictly for licensed pharmacists to verify doctor prescriptions, dispense regulated cold-chain biologics, and adjust pharmaceutical inventory. All actions are logged under federal pharmacy regulations.',
      defaultKey: 'staff123',
      icon: Stethoscope,
      themeColor: 'indigo',
    },
    admin: {
      role: 'admin',
      title: 'Pharmacy Executive & System Administrator',
      name: 'Dr. Gregory House, PharmD',
      email: 'admin@medireach.com',
      badge: 'DEA / State Board Executive Administrator',
      clearanceLevel: 'Level 3: Master Executive & Regulatory Clearance',
      regulatoryNotice: 'CONFIDENTIAL SYSTEM GATE: Full executive privileges to provision staff, audit financial accounts, modify medicine prices, and inspect compliance audit logs. Unauthorized attempts are classified as security violations.',
      defaultKey: 'admin123',
      icon: Building2,
      themeColor: 'emerald',
    },
  };

  // Trigger Role Authorization Gate
  const handleOpenAuthGate = (role: UserRole) => {
    const config = roleConfigs[role];
    setAuthGateRole(config);
    setAuthKeyInput('');
    setAuthError(null);
  };

  // Execute Role Authorization verification
  const handleVerifyRoleAuthorization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authGateRole) return;
    setAuthError(null);

    if (!authKeyInput.trim()) {
      setAuthError('Please enter your authorized password or security key.');
      return;
    }

    setAuthLoading(true);
    const res = await login(authGateRole.email, authKeyInput.trim());
    setAuthLoading(false);

    if (res.success) {
      setAuthGateRole(null);
      onSuccess();
    } else {
      setAuthError(
        authGateRole.role === 'customer'
          ? 'Authorization failed: Incorrect patient account password.'
          : `RESTRICTION / AUTHORIZATION DENIED: Invalid credentials for ${authGateRole.title}. This unauthorized attempt has been recorded in the security audit log.`
      );
    }
  };

  // Standard Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Please provide your email address and password.');
      return;
    }
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      onSuccess();
    } else {
      setError(res.error || 'Invalid credentials. Please verify your email and password.');
    }
  };

  // Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!regName || !regEmail || !regPhone || !regPassword) {
      setError('All fields are required to register.');
      return;
    }
    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!termsAgreed) {
      setError('Please agree to HIPAA compliance and pharmacy terms.');
      return;
    }

    setLoading(true);
    const res = await register(regName, regEmail, regPhone, regPassword);
    setLoading(false);
    if (res.success) {
      onSuccess();
    } else {
      setError(res.error || 'Registration failed');
    }
  };

  // Forgot Password
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setForgotMsg(null);
    if (!forgotEmail) {
      setError('Please enter your registered email address.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      setLoading(false);
      if (res.ok) {
        setForgotMsg(data.message);
        if (data.tempPassword) setTempPass(data.tempPassword);
      } else {
        setError(data.error || 'No account found with this email.');
      }
    } catch {
      setLoading(false);
      setError('Failed to reach password reset service.');
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-5rem)] flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative">
        {/* Brand Header */}
        <div className="p-5 text-center bg-gradient-to-b from-sky-50 via-sky-50/40 to-white border-b border-slate-100">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-600 text-white shadow-md shadow-sky-600/25 mb-2">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Medi<span className="text-sky-600">Reach</span>
          </h2>
          <p className="text-xs font-bold text-slate-800 mt-0.5">
            Specialized Pharmaceutical &amp; Rare Medicine Care
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            One secure login for Customers, Pharmacist Staff, and Administrators
          </p>

          {/* Mode Tabs */}
          {authMode !== 'forgot' && !authGateRole && (
            <div className="mt-3 p-1 bg-slate-100 rounded-xl flex items-center gap-1 max-w-xs mx-auto">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setError(null);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  authMode === 'login'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setError(null);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  authMode === 'register'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Create Account
              </button>
            </div>
          )}
        </div>

        {/* Global Error */}
        {error && !authGateRole && (
          <div className="mx-5 mt-4 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
            {error}
          </div>
        )}

        {/* ====================================================================
            ROLE RESTRICTION & AUTHORIZATION GATE MODAL
            Appears when clicking any of the instant role accounts!
            ==================================================================== */}
        {authGateRole && (
          <div className="p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Clearance Level Banner */}
            <div
              className={`p-4 rounded-2xl border text-xs space-y-2 ${
                authGateRole.role === 'admin'
                  ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                  : authGateRole.role === 'staff'
                  ? 'bg-indigo-50/90 border-indigo-300 text-indigo-950'
                  : 'bg-sky-50/90 border-sky-300 text-sky-950'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-white/90 border shadow-2xs">
                  {authGateRole.clearanceLevel}
                </span>
                <span className="flex items-center gap-1 font-bold text-[10px] text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                  <ShieldAlert className="w-3 h-3" />
                  RESTRICTED ACCESS
                </span>
              </div>

              <div className="pt-1">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <authGateRole.icon className="w-4 h-4 text-slate-800" />
                  <span>{authGateRole.title}</span>
                </h3>
                <p className="font-bold text-slate-800 text-xs mt-0.5">{authGateRole.name}</p>
                <p className="font-mono text-[11px] text-slate-600">{authGateRole.email}</p>
                <div className="mt-1.5 font-semibold text-[10px] text-slate-700 bg-white/80 p-2 rounded-xl border">
                  Credential Verification: <span className="font-bold">{authGateRole.badge}</span>
                </div>
              </div>
            </div>

            {/* Regulatory Warning / Restriction statement */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2 leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-950">Security Restriction &amp; Audit Notice:</strong>{' '}
                {authGateRole.regulatoryNotice}
              </div>
            </div>

            {/* Authorization Failure Warning */}
            {authError && (
              <div className="p-3 text-xs text-rose-800 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-2 animate-in shake duration-150">
                <BadgeAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-bold">{authError}</span>
              </div>
            )}

            {/* Authorization Passcode Form */}
            <form onSubmit={handleVerifyRoleAuthorization} className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      {authGateRole.role === 'customer'
                        ? 'Patient Account Password'
                        : authGateRole.role === 'staff'
                        ? 'Pharmacist Security Passcode'
                        : 'Administrator Master Key'}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setAuthKeyInput(authGateRole.defaultKey)}
                    className="text-[10px] font-bold text-sky-600 hover:text-sky-700 underline flex items-center gap-0.5"
                  >
                    <span>Insert Demo Key</span>
                    <span className="font-mono bg-sky-50 px-1 py-0.2 rounded border border-sky-200">
                      {authGateRole.defaultKey}
                    </span>
                  </button>
                </div>

                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showAuthKey ? 'text' : 'password'}
                    value={authKeyInput}
                    onChange={(e) => setAuthKeyInput(e.target.value)}
                    placeholder={`Enter authorization key for ${authGateRole.name}`}
                    className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-mono"
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowAuthKey(!showAuthKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showAuthKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Testing security? Enter an incorrect password to verify that access is blocked.
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuthGateRole(null);
                    setAuthError(null);
                  }}
                  className="flex-1 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={authLoading}
                  className={`flex-2 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 ${
                    authGateRole.role === 'admin'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                      : authGateRole.role === 'staff'
                      ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                      : 'bg-sky-600 hover:bg-sky-700 shadow-sky-600/20'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{authLoading ? 'Verifying Authorization...' : 'Authorize & Sign In'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ====================================================================
            VIEW 1: REGULAR LOGIN VIEW WITH RESTRICTED DEMO ACCOUNTS
            ==================================================================== */}
        {authMode === 'login' && !authGateRole && (
          <div className="p-5 sm:p-6 space-y-4">
            {/* Role Cards with Restriction Badges */}
            <div className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  Instant Sign-In:
                </span>
                <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200/90 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-amber-600" />
                  Authorization Required
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* Customer Card */}
                <button
                  type="button"
                  onClick={() => handleOpenAuthGate('customer')}
                  className="p-3 bg-white hover:bg-sky-50/80 text-slate-800 hover:text-sky-900 rounded-2xl border border-slate-200 hover:border-sky-400 shadow-2xs transition-all flex flex-col items-center gap-1 active:scale-95 text-center group"
                >
                  <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold leading-tight">Customer</span>
                  <span className="text-[10px] text-slate-600 font-medium">Sarah J.</span>
                  <span className="text-[9px] text-sky-700 font-semibold mt-0.5 flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5 text-sky-600" /> Level 1
                  </span>
                </button>

                {/* Staff Card */}
                <button
                  type="button"
                  onClick={() => handleOpenAuthGate('staff')}
                  className="p-3 bg-white hover:bg-indigo-50/80 text-slate-800 hover:text-indigo-900 rounded-2xl border border-slate-200 hover:border-indigo-400 shadow-2xs transition-all flex flex-col items-center gap-1 active:scale-95 text-center group"
                >
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold leading-tight">Staff</span>
                  <span className="text-[10px] text-slate-600 font-medium">Elena, RPh</span>
                  <span className="text-[9px] text-indigo-700 font-bold mt-0.5 flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5 text-indigo-600" /> Restricted
                  </span>
                </button>

                {/* Admin Card */}
                <button
                  type="button"
                  onClick={() => handleOpenAuthGate('admin')}
                  className="p-3 bg-white hover:bg-emerald-50/80 text-slate-800 hover:text-emerald-900 rounded-2xl border border-slate-200 hover:border-emerald-400 shadow-2xs transition-all flex flex-col items-center gap-1 active:scale-95 text-center group"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold leading-tight">Admin</span>
                  <span className="text-[10px] text-slate-600 font-medium">Dr. House</span>
                  <span className="text-[9px] text-emerald-800 font-bold mt-0.5 flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5 text-emerald-700" /> Executive
                  </span>
                </button>
              </div>
            </div>

            <div className="relative flex items-center justify-center py-1">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider absolute">
                Or with registered email
              </span>
            </div>

            {/* Standard Credential Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('forgot');
                      setError(null);
                    }}
                    className="text-xs text-sky-600 hover:text-sky-700 font-semibold"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
                  />
                  <span>Remember my session</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/20 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100 flex flex-col gap-2">
              <p>
                New patient?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className="text-sky-600 hover:text-sky-700 font-bold"
                >
                  Create Customer Account
                </button>
              </p>
              <button
                type="button"
                onClick={onContinueAsGuest}
                className="text-xs text-slate-500 hover:text-slate-800 underline decoration-slate-300"
              >
                Browse Medicines Catalog as Guest &rarr;
              </button>
            </div>
          </div>
        )}

        {/* ====================================================================
            VIEW 2: REGISTRATION (Customer Only)
            ==================================================================== */}
        {authMode === 'register' && !authGateRole && (
          <form onSubmit={handleRegisterSubmit} className="p-5 sm:p-6 space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Full Legal Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <label className="flex items-start gap-2 pt-1 text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
              />
              <span className="leading-snug text-[11px]">
                I agree to HIPAA privacy practices and certified pharmacist prescription verification guidelines.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-xs disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Complete Customer Registration'}
            </button>

            <div className="text-center pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="text-slate-600 hover:text-slate-900 font-medium"
              >
                Already registered? <span className="text-sky-600 font-bold">Sign In</span>
              </button>
            </div>
          </form>
        )}

        {/* ====================================================================
            VIEW 3: FORGOT PASSWORD
            ==================================================================== */}
        {authMode === 'forgot' && !authGateRole && (
          <div className="p-5 sm:p-6 space-y-4 text-xs">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setError(null);
                setForgotMsg(null);
              }}
              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </button>

            {forgotMsg ? (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Reset Successful</span>
                  </div>
                  <p>{forgotMsg}</p>
                  {tempPass && (
                    <div className="p-2 bg-white rounded font-mono font-bold text-center text-slate-900 border border-emerald-300">
                      Temporary Password: {tempPass}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPassword(tempPass || '');
                    setAuthMode('login');
                  }}
                  className="w-full py-2.5 bg-sky-600 text-white font-bold rounded-xl shadow-xs"
                >
                  Proceed to Sign In with Temporary Password
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Enter Registered Account Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="e.g. customer.sarah@example.com"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-xs disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Send Password Reset'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
