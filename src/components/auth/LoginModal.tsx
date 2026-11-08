import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, UserCheck, Stethoscope, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { UserRole } from '../../types/index.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegister: () => void;
  onOpenForgot: () => void;
  onSuccess?: () => void;
}

export const LoginModal: React.FC<Props> = ({ isOpen, onClose, onOpenRegister, onOpenForgot, onSuccess }) => {
  const { login, quickDemoLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      onClose();
      if (onSuccess) onSuccess();
    } else {
      setError(res.error || 'Authentication failed');
    }
  };

  const handleDemo = async (role: UserRole) => {
    setError(null);
    setLoading(true);
    await quickDemoLogin(role);
    setLoading(false);
    onClose();
    if (onSuccess) onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 text-center border-b border-slate-100 bg-gradient-to-b from-sky-50/50 to-white">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-sky-600 text-white shadow-md shadow-sky-600/20 mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Welcome Back</h2>
          <p className="text-xs text-slate-500 mt-1">
            Access your MediReach pharmaceutical account
          </p>
        </div>

        {/* Demo Fast Login Pills */}
        <div className="px-6 pt-4 pb-2 bg-slate-50/80 border-b border-slate-100">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Instant Demo Account Sign-In:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemo('customer')}
              className="px-2.5 py-1.5 text-xs font-medium text-sky-800 bg-sky-100/70 hover:bg-sky-200/70 rounded-lg flex flex-col items-center gap-1 transition-colors border border-sky-200/60"
            >
              <UserCheck className="w-3.5 h-3.5 text-sky-600" />
              <span>Customer</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemo('staff')}
              className="px-2.5 py-1.5 text-xs font-medium text-indigo-800 bg-indigo-100/70 hover:bg-indigo-200/70 rounded-lg flex flex-col items-center gap-1 transition-colors border border-indigo-200/60"
            >
              <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
              <span>Staff Pharmacist</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemo('admin')}
              className="px-2.5 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-100/70 hover:bg-emerald-200/70 rounded-lg flex flex-col items-center gap-1 transition-colors border border-emerald-200/60"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Administrator</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {error}
            </div>
          )}

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
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white transition-all"
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
                onClick={onOpenForgot}
                className="text-xs text-sky-600 hover:text-sky-700 font-medium"
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
                className="w-full pl-9 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white transition-all"
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

          <div className="flex items-center justify-between text-xs text-slate-600">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
              />
              <span>Remember me</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-lg shadow-sm shadow-sky-600/20 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Account'}
          </button>

          <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onOpenRegister}
              className="text-sky-600 hover:text-sky-700 font-semibold"
            >
              Create Customer Account
            </button>
          </div>
        </form>

        <div className="px-6 py-3 bg-slate-50 text-right">
          <button
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
