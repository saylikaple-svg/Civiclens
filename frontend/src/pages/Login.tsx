import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { ShieldAlert, KeyRound, Mail, Eye, EyeOff, UserCheck, Shield, Briefcase, Eye as EyeIcon } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('admin@mospi.gov.in');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleQuickSelect = (uEmail: string, uPass: string) => {
    setEmail(uEmail);
    setPassword(uPass);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', email.trim());
      formData.append('password', password);

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        await login(data.access_token, data.role, data.name);
        navigate('/');
      } else {
        setError(data.detail || 'Incorrect email or password. Please use the quick demo accounts below or create a new account.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Cannot connect to the backend server. Please verify the backend is active.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gov-bg flex items-center justify-center p-4">
      <div className="bg-gov-card border border-gov-border rounded-2xl p-8 md:p-10 shadow-lg w-full max-w-md">
        
        {/* CivicLens Header */}
        <div className="text-center mb-6 border-b border-gov-border pb-5">
          <h1 className="text-3xl font-bold font-serif text-gov-gold tracking-tight">
            CivicLens
          </h1>
          <p className="text-[10px] font-sans font-bold text-gov-navy tracking-widest uppercase mt-1">
            Integrated Monitoring Platform
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 p-3 rounded-lg text-xs font-semibold flex items-center space-x-2 mb-6">
            <ShieldAlert size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Official Email Address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                placeholder="name@mospi.gov.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gov-bg border border-gov-border rounded-lg text-xs outline-none focus:border-gov-navy text-slate-800 dark:text-white transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <span className="text-[10px] text-slate-400">
                Default: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-amber-600">admin123</code>
              </span>
            </div>
            <div className="relative">
              <KeyRound size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-gov-bg border border-gov-border rounded-lg text-xs outline-none focus:border-gov-navy text-slate-800 dark:text-white transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gov-navy hover:bg-gov-navyalt text-white text-xs font-bold rounded-lg shadow-md hover:shadow-lg transition-all focus:outline-none flex items-center justify-center space-x-2"
          >
            <UserCheck size={16} />
            <span>{loading ? 'Authenticating Credentials...' : 'Access Platform'}</span>
          </button>
        </form>

        {/* 1-Click Quick Demo Sign-In */}
        <div className="mt-6 pt-4 border-t border-gov-border">
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5 text-center">
            ⚡ Quick 1-Click Demo Accounts:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickSelect('admin@mospi.gov.in', 'admin123')}
              className={`p-2 rounded-lg border text-left transition-all ${
                email === 'admin@mospi.gov.in'
                  ? 'border-gov-navy bg-gov-navy/10 ring-1 ring-gov-navy'
                  : 'border-gov-border bg-gov-bg hover:border-slate-400'
              }`}
            >
              <div className="flex items-center space-x-1 text-gov-gold font-bold text-[11px]">
                <Shield size={12} />
                <span>Admin</span>
              </div>
              <p className="text-[9px] text-slate-400 mt-0.5 truncate">admin@mospi</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickSelect('manager@morth.gov.in', 'manager123')}
              className={`p-2 rounded-lg border text-left transition-all ${
                email === 'manager@morth.gov.in'
                  ? 'border-gov-navy bg-gov-navy/10 ring-1 ring-gov-navy'
                  : 'border-gov-border bg-gov-bg hover:border-slate-400'
              }`}
            >
              <div className="flex items-center space-x-1 text-emerald-600 font-bold text-[11px]">
                <Briefcase size={12} />
                <span>Manager</span>
              </div>
              <p className="text-[9px] text-slate-400 mt-0.5 truncate">manager@morth</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickSelect('viewer@gov.in', 'viewer123')}
              className={`p-2 rounded-lg border text-left transition-all ${
                email === 'viewer@gov.in'
                  ? 'border-gov-navy bg-gov-navy/10 ring-1 ring-gov-navy'
                  : 'border-gov-border bg-gov-bg hover:border-slate-400'
              }`}
            >
              <div className="flex items-center space-x-1 text-sky-600 font-bold text-[11px]">
                <EyeIcon size={12} />
                <span>Citizen</span>
              </div>
              <p className="text-[9px] text-slate-400 mt-0.5 truncate">viewer@gov</p>
            </button>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gov-border text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Want to use your own credentials?{' '}
            <Link to="/register" className="text-amber-700 dark:text-amber-400 hover:underline font-bold">
              Create an Authorized Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
export default Login;
