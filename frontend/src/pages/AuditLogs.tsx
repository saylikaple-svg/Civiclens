import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { ShieldCheck, Search, Calendar } from 'lucide-react';

interface AuditLog {
  id: number;
  user_id: number;
  user_name: string;
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  details: string | null;
  timestamp: string;
}

export const AuditLogs: React.FC = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!token) return;

    const fetchLogs = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/audit-logs`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setLogs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [token]);

  // Filter logs
  const filteredLogs = logs.filter((log) =>
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gov-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gov-navy leading-none">
            Platform Audit Trail Logs
          </h1>
          <p className="text-xs text-gov-muted mt-1.5 font-sans">
            Cryptographic ledger tracking user actions, document uploads, OCR indexing, and AI report requests
          </p>
        </div>
        <div className="relative w-full sm:w-64 text-xs">
          <input
            type="text"
            placeholder="Search action, logs or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-gov-bg border border-gov-border rounded-lg outline-none focus:border-gov-navy text-slate-800 dark:text-white"
          />
          <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-gov-navy border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500 font-sans">Accessing audit trail registries...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-12 bg-gov-card border border-gov-border rounded-xl text-xs text-slate-500 font-medium">
          No audit logs recorded in registry matching search query.
        </div>
      ) : (
        <div className="border border-gov-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gov-border bg-gov-card text-xs text-left">
              <thead className="bg-gov-bg font-sans text-[10px] text-gov-muted font-bold tracking-wider uppercase border-b border-gov-border">
                <tr>
                  <th className="px-5 py-4">Log Timestamp</th>
                  <th className="px-5 py-4">User Profile</th>
                  <th className="px-5 py-4">Action Event</th>
                  <th className="px-5 py-4">Reference Context</th>
                  <th className="px-5 py-4">Activity Audit Trail Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gov-border font-medium text-slate-700 dark:text-slate-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gov-bg/50">
                    <td className="px-5 py-4 text-slate-400 font-sans flex items-center gap-1.5">
                      <Calendar size={13} />
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-4 font-bold text-gov-navy">{log.user_name}</td>
                    <td className="px-5 py-4">
                      <span className="inline-block px-2.5 py-0.5 text-[9px] font-bold rounded bg-gov-bg text-slate-700 dark:text-slate-300 border border-gov-border uppercase font-sans">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-400 font-mono">
                      {log.entity_type ? `${log.entity_type.toUpperCase()} #${log.entity_id}` : 'General'}
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300 font-sans break-all max-w-sm">
                      {log.details || 'No additional parameters logged.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
export default AuditLogs;
