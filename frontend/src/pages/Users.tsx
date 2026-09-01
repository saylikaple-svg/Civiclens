import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { Users as UsersIcon, Plus, ShieldCheck, ShieldAlert, Ban } from 'lucide-react';

interface Department {
  id: number;
  name: string;
}

interface UserItem {
  id: number;
  name: string;
  email: string;
  role: string;
  department_id: number | null;
  department: Department | null;
  status: string;
  last_login: string | null;
}

export const Users: React.FC = () => {
  const { token, user } = useAuth();
  
  const [users, setUsers] = useState<UserItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Add User Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('VIEWER');
  const [deptId, setDeptId] = useState<number | ''>('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsersAndDepts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setUsers(data);

      setDepartments([
        { id: 1, name: 'Roads & Highways (MoRTH)' },
        { id: 2, name: 'Railways (MoR)' },
        { id: 3, name: 'Housing & Urban Affairs (MoHUA)' },
        { id: 4, name: 'Renewable Energy (MNRE)' },
        { id: 5, name: 'Power & Grid (MoP)' },
        { id: 6, name: 'Telecommunications (DoT)' }
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchUsersAndDepts();
  }, [token]);

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          department_id: deptId ? Number(deptId) : null
        })
      });

      if (res.ok) {
        setSuccess('Official credentials successfully registered!');
        setTimeout(() => {
          setIsModalOpen(false);
          setSuccess('');
          setName('');
          setEmail('');
          setPassword('');
          setRole('VIEWER');
          setDeptId('');
          fetchUsersAndDepts();
        }, 1200);
      } else {
        const errorData = await res.json();
        setError(errorData.detail || 'Failed to register profile.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failure.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisableUser = async (userId: number) => {
    if (!confirm('Revoke access credentials for this staff member?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'Inactive' })
      });
      if (res.ok) {
        setUsers(users.map((u) => (u.id === userId ? { ...u, status: 'Inactive' } : u)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gov-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gov-navy leading-none">
            User Governance & Role Permissions
          </h1>
          <p className="text-xs text-gov-muted mt-1.5 font-sans">
            Audit stakeholder permissions, register official department credentials, and modify access rules
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 px-3 py-2 bg-gov-navy text-white hover:bg-gov-navyalt text-xs font-bold rounded-lg shadow-sm"
        >
          <Plus size={14} />
          <span>Register Staff Profile</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-gov-navy border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500 font-sans">Retrieving platform user registry...</p>
        </div>
      ) : (
        <div className="border border-gov-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gov-border bg-gov-card text-xs text-left">
              <thead className="bg-gov-bg font-sans text-[10px] text-gov-muted font-bold tracking-wider uppercase border-b border-gov-border">
                <tr>
                  <th className="px-5 py-4">Stakeholder</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Department link</th>
                  <th className="px-5 py-4">Security Role</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Last Login</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gov-border font-medium text-slate-700 dark:text-slate-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gov-bg/50">
                    <td className="px-5 py-4 font-bold text-gov-navy">{u.name}</td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400 font-sans">{u.email}</td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400 font-sans">
                      {u.department ? u.department.name.split(' (')[0] : 'Global Access'}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-bold text-[10px] text-gov-gold tracking-wider uppercase">
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded border uppercase ${
                        u.status === 'Active' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-400 font-sans">
                      {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {u.status === 'Active' && (
                        <button
                          onClick={() => handleDisableUser(u.id)}
                          className="text-slate-400 hover:text-rose-600 font-bold p-1"
                          title="Deactivate Account"
                        >
                          <Ban size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Register Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gov-card border border-gov-border rounded-2xl p-6 md:p-8 shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between border-b border-gov-border pb-3 mb-5">
              <h3 className="text-xl font-bold font-serif text-gov-navy">Register Staff Profile</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 p-2.5 rounded-lg text-xs font-semibold mb-4 flex items-center space-x-1.5">
                <ShieldAlert size={16} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 p-2.5 rounded-lg text-xs font-semibold mb-4 flex items-center space-x-1.5">
                <ShieldCheck size={16} />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleRegisterUser} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase mb-1">Official Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Sri Vinayak Prasad"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gov-bg border border-gov-border px-3 py-2 rounded-lg outline-none focus:border-gov-navy text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="prasad.vinayak@gov.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gov-bg border border-gov-border px-3 py-2 rounded-lg outline-none focus:border-gov-navy text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase mb-1">Access Passphrase *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gov-bg border border-gov-border px-3 py-2 rounded-lg outline-none focus:border-gov-navy text-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase mb-1">Department</label>
                  <select
                    value={deptId}
                    onChange={(e) => setDeptId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-gov-bg border border-gov-border px-3 py-2 rounded-lg outline-none focus:border-gov-navy text-slate-800 dark:text-white"
                  >
                    <option value="">Global Access</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name.split(' (')[0]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase mb-1">Security Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-gov-bg border border-gov-border px-3 py-2 rounded-lg outline-none focus:border-gov-navy text-slate-800 dark:text-white"
                  >
                    <option value="VIEWER">Viewer</option>
                    <option value="PROJECT_MANAGER">Project Manager</option>
                    <option value="ADMIN">Admin Officer</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-gov-navy hover:bg-gov-navyalt text-white font-bold rounded-lg shadow mt-2"
              >
                {submitting ? 'Registering Access...' : 'Commit Staff Registry'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Users;
