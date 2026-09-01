import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../context/AuthContext';
import { ShieldCheck, ShieldAlert, User, Mail, Lock } from 'lucide-react';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('VIEWER');
  const [deptId, setDeptId] = useState<number | ''>('');
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  // Fetch departments for registration dropdown
  useEffect(() => {
    setDepartments([
      { id: 1, name: 'Roads & Highways (MoRTH)' },
      { id: 2, name: 'Railways (MoR)' },
      { id: 3, name: 'Housing & Urban Affairs (MoHUA)' },
      { id: 4, name: 'Renewable Energy (MNRE)' },
      { id: 5, name: 'Power & Grid (MoP)' },
      { id: 6, name: 'Telecommunications (DoT)' }
    ]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          role,
          department_id: deptId || null,
          status: 'Active',
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(data.detail || 'Registration failed. Please contact the administrator.');
      }
    } catch (err) {
      console.error('Register error:', err);
      setError('Cannot connect to the backend server. Please verify it is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gov-bg flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gov-card border border-gov-border rounded-2xl p-8 md:p-10 shadow-lg w-full max-w-lg my-8">

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
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 p-3 rounded-lg text-xs font-semibold flex items-center space-x-2 mb-4">
            <ShieldAlert size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 p-3 rounded-lg text-xs font-semibold flex items-center space-x-2 mb-4">
            <ShieldCheck size={16} className="flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Sri Rajeev Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gov-bg border border-gov-border rounded-lg text-xs outline-none focus:border-gov-navy text-slate-800 dark:text-white transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Official Email Address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                placeholder="rajeev.kumar@gov.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gov-bg border border-gov-border rounded-lg text-xs outline-none focus:border-gov-navy text-slate-800 dark:text-white transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Create Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gov-bg border border-gov-border rounded-lg text-xs outline-none focus:border-gov-navy text-slate-800 dark:text-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gov-bg border border-gov-border rounded-lg text-xs outline-none focus:border-gov-navy text-slate-800 dark:text-white transition-colors"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gov-navy hover:bg-gov-navyalt text-white text-xs font-bold rounded-lg shadow-md hover:shadow-lg transition-all focus:outline-none flex items-center justify-center space-x-2"
          >
            {loading ? 'Submitting Registry Details...' : 'Request Account Access'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gov-border text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Already have an authorized account?{' '}
            <Link to="/login" className="text-amber-700 dark:text-amber-400 hover:underline font-bold">
              Sign In Instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
export default Register;
