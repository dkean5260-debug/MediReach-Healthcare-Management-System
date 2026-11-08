import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Phone,
  User,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface Props {
  onSuccess: () => void;
  onContinueAsGuest: () => void;
}

export const UnifiedAuthScreen: React.FC<Props> = ({ onSuccess, onContinueAsGuest }) => {
  const { login, register } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');

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
        <div className="p-6 text-center bg-gradient-to-b from-sky-50 via-sky-50/40 to-white border-b border-slate-100">
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
          {authMode !== 'forgot' && (
            <div className="mt-4 p-1 bg-slate-100 rounded-xl flex items-center gap-1 max-w-xs mx-auto">
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
        {error && (
          <div className="mx-6 mt-4 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
            {error}
          </div>
        )}

        {/* ====================================================================
            VIEW 1: LOGIN VIEW
            ==================================================================== */}
        {authMode === 'login' && (
          <div className="p-6 space-y-4">
            <form onSubmit={handleLoginSubmit} className="space-y-4">
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

            <div className="pt-3 text-center text-xs text-slate-500 border-t border-slate-100 flex flex-col gap-2">
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
        {authMode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="p-6 space-y-3.5 text-xs">
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
        {authMode === 'forgot' && (
          <div className="p-6 space-y-4 text-xs">
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
