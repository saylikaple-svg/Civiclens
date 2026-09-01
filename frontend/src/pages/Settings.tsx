import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { User, ShieldCheck, Mail, Building, Edit3, Save, X, KeyRound, Check, AlertCircle } from 'lucide-react';

interface Department {
  id: number;
  name: string;
}

export const Settings: React.FC = () => {
  const { user, token, updateUserProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [deptId, setDeptId] = useState<number | ''>('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Populate form with current user values
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setDeptId(user.department_id || '');
    }

    setDepartments([
      { id: 1, name: 'Roads & Highways (MoRTH)' },
      { id: 2, name: 'Railways (MoR)' },
      { id: 3, name: 'Housing & Urban Affairs (MoHUA)' },
      { id: 4, name: 'Renewable Energy (MNRE)' },
      { id: 5, name: 'Power & Grid (MoP)' },
      { id: 6, name: 'Telecommunications (DoT)' }
    ]);
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password && password !== confirmPassword) {
      setError('New passwords do not match. Please verify.');
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        name,
        email,
        department_id: deptId ? Number(deptId) : 0
      };
      if (password.trim()) {
        payload.password = password.trim();
      }

      const res = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const updatedUserData = await res.json();
        updateUserProfile(updatedUserData);
        setSuccess('Profile details successfully updated!');
        setPassword('');
        setConfirmPassword('');
        setIsEditing(false);
        setTimeout(() => setSuccess(''), 4000);
      } else {
        const errData = await res.json();
        setError(errData.detail || 'Failed to update profile.');
      }
    } catch (err) {
      console.error(err);
      setError('Cannot connect to backend service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Page Header */}
      <div className="border-b border-gov-border pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gov-navy leading-none">
            System Settings & Profile
          </h1>
          <p className="text-xs text-gov-muted mt-1.5 font-sans">
            Review and modify your authorized officer profile credentials and sector linkages
          </p>
        </div>

        {!isEditing && (
          <button
            onClick={() => {
              setIsEditing(true);
              setError('');
              setSuccess('');
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all"
          >
            <Edit3 size={14} />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
          <Check size={16} className="flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-gov-card border border-gov-border rounded-xl p-6 shadow-sm space-y-5 font-sans">
        <div className="flex items-center justify-between border-b border-gov-border pb-3">
          <h3 className="font-serif font-bold text-gov-navy text-sm flex items-center gap-2">
            <User size={15} className="text-gov-gold" />
            <span>Authorized Profile Information</span>
          </h3>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded uppercase">
            Active Clearance
          </span>
        </div>

        {user ? (
          !isEditing ? (
            /* Read-Only Profile View */
            <div className="space-y-4 text-xs">
              <div className="flex items-center space-x-3.5">
                <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/50 border-2 border-gov-navy flex items-center justify-center text-gov-navy font-bold text-lg shadow-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white text-base">{user.name}</h4>
                  <span className="text-[10px] text-gov-gold font-bold uppercase tracking-wider">
                    Security Role: {user.role.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="border-t border-gov-border pt-4 space-y-2.5 text-slate-600 dark:text-slate-300 font-medium">
                <div className="flex items-center space-x-2.5">
                  <Mail size={14} className="text-slate-400" />
                  <span>Official Email: <b className="text-slate-800 dark:text-white">{user.email}</b></span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <Building size={14} className="text-slate-400" />
                  <span>
                    Department Link:{' '}
                    <b className="text-slate-800 dark:text-white">
                      {user.department?.name || 'General Access (All Sectors)'}
                    </b>
                  </span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span>
                    Status:{' '}
                    <b className="text-emerald-600 dark:text-emerald-400">
                      {user.status || 'Active Account'}
                    </b>
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-gov-border">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 border border-gov-border hover:border-gov-navy text-slate-700 dark:text-slate-200 font-bold rounded-lg text-xs flex items-center gap-1.5 bg-gov-bg"
                >
                  <Edit3 size={13} />
                  <span>Modify Profile Details</span>
                </button>
              </div>
            </div>
          ) : (
            /* Interactive Edit Profile Form */
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 uppercase text-[9px]">
                  Full Official Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gov-border px-3 py-2 rounded-lg bg-gov-bg text-slate-800 dark:text-white outline-none focus:border-gov-navy"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 uppercase text-[9px]">
                  Official Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gov-border px-3 py-2 rounded-lg bg-gov-bg text-slate-800 dark:text-white outline-none focus:border-gov-navy"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 uppercase text-[9px]">
                  Department / Sector Link
                </label>
                <select
                  value={deptId}
                  onChange={(e) => setDeptId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full border border-gov-border px-3 py-2 rounded-lg bg-gov-bg text-slate-800 dark:text-white outline-none focus:border-gov-navy"
                >
                  <option value="">General Access (All Sectors)</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-t border-gov-border pt-3 space-y-3">
                <div className="flex items-center gap-1.5 text-gov-gold font-bold">
                  <KeyRound size={14} />
                  <span>Update Password (Leave blank to keep unchanged)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 text-[9px] uppercase">
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border border-gov-border px-3 py-2 rounded-lg bg-gov-bg text-slate-800 dark:text-white outline-none focus:border-gov-navy"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 text-[9px] uppercase">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full border border-gov-border px-3 py-2 rounded-lg bg-gov-bg text-slate-800 dark:text-white outline-none focus:border-gov-navy"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-gov-border">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setError('');
                  }}
                  className="px-3.5 py-2 border border-gov-border text-slate-600 dark:text-slate-300 hover:bg-gov-bg font-bold rounded-lg text-xs flex items-center gap-1"
                >
                  <X size={13} />
                  <span>Cancel</span>
                </button>

                <button
                  type="submit"
                  disabled={loading || !name.trim() || !email.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-sm flex items-center gap-1.5"
                >
                  <Save size={13} />
                  <span>{loading ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          )
        ) : (
          <p className="text-xs text-slate-500 font-medium">No user context loaded.</p>
        )}
      </div>
    </div>
  );
};
export default Settings;
