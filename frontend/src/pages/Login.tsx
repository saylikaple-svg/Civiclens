import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { ShieldAlert, KeyRound, Mail, Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
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
        setError(data.detail || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Cannot connect to the backend server. Please verify it is running.');
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

        <form onSubmit={handleSubmit} className="space-y-5">
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
              <a href="#forgot" className="text-[10px] text-amber-600 dark:text-amber-400 font-bold hover:underline">
                Forgot Password?
              </a>
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
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="remember_me"
              type="checkbox"
              className="w-3.5 h-3.5 text-gov-navy border-gov-border rounded focus:ring-gov-navy bg-gov-bg"
            />
            <label htmlFor="remember_me" className="ml-2 text-xs text-slate-500 dark:text-slate-400 font-medium select-none">
              Remember my credentials on this device
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gov-navy hover:bg-gov-navyalt text-white text-xs font-bold rounded-lg shadow-md hover:shadow-lg transition-all focus:outline-none flex items-center justify-center space-x-2"
          >
            {loading ? 'Authenticating Credentials...' : 'Access Platform'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gov-border text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Not registered yet?{' '}
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
