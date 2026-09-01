import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { Bell, AlertTriangle, Check, Clock, IndianRupee, ShieldAlert } from 'lucide-react';

interface AlertItem {
  id: number;
  project_id: number;
  project_code: string;
  project_name: string;
  type: string;
  severity: string;
  message: string;
  status: string;
  created_at: string;
}

export const Alerts: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/alerts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setAlerts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchAlerts();
  }, [token]);

  const handleMarkRead = async (alertId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/alerts/${alertId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === alertId ? { ...a, status: 'read' } : a))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const unreadAlerts = alerts.filter((a) => a.status === 'unread');
      await Promise.all(
        unreadAlerts.map((a) =>
          fetch(`${API_BASE_URL}/api/alerts/${a.id}/read`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );
      setAlerts((prev) => prev.map((a) => ({ ...a, status: 'read' })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gov-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gov-navy leading-none flex items-center gap-2">
            <span>Critical Alerts & Threshold Anomalies</span>
          </h1>
          <p className="text-xs text-gov-muted mt-1.5 font-sans">
            Real-time threshold alerts automatically flagged from active project schedules and financial ratios
          </p>
        </div>
        {alerts.some((a) => a.status === 'unread') && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center space-x-1 px-3 py-1.5 border border-gov-border hover:border-gov-navy text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg bg-gov-card shadow-sm"
          >
            <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>Mark All Acknowledged</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-gov-navy border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500 font-sans">Accessing warning log registries...</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-16 bg-gov-card border border-gov-border rounded-xl">
          <Check size={36} className="text-emerald-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold font-serif text-gov-navy">Platform Clear</h3>
          <p className="text-xs text-gov-muted mt-1 max-w-xs mx-auto">
            All pipelines currently compliant. No milestone delays or budget discrepancies registered.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const isUnread = alert.status === 'unread';
            
            return (
              <div
                key={alert.id}
                className={`border border-gov-border rounded-xl p-4.5 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4 bg-gov-card hover:shadow-sm ${
                  isUnread ? 'border-l-4 border-l-gov-navy' : 'opacity-70'
                }`}
              >
                {/* Warning details */}
                <div className="flex items-start space-x-3.5 text-xs font-sans">
                  {/* Warning type icon */}
                  <div className={`p-2.5 rounded-xl flex-shrink-0 ${
                    alert.type === 'Budget' ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40' :
                    alert.type === 'Milestone' ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40' :
                    'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40'
                  }`}>
                    {alert.type === 'Budget' ? <IndianRupee size={18} /> :
                     alert.type === 'Milestone' ? <Clock size={18} /> : <ShieldAlert size={18} />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-[10px] font-bold text-gov-gold uppercase tracking-wider">
                        {alert.type} Anomaly
                      </span>
                      <span className={`px-2 py-0.5 text-[8px] font-bold rounded uppercase ${
                        alert.severity === 'Critical' ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300' :
                        alert.severity === 'High' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {alert.severity} Severity
                      </span>
                      {isUnread && (
                        <span className="w-1.5 h-1.5 rounded-full bg-gov-navy animate-pulse"></span>
                      )}
                    </div>
                    
                    {/* Linked project details */}
                    <div
                      onClick={() => navigate(`/projects/${alert.project_id}`)}
                      className="font-serif font-bold text-gov-navy hover:underline cursor-pointer text-sm"
                    >
                      {alert.project_name} <span className="text-xs font-sans text-slate-400 font-medium">({alert.project_code})</span>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-2xl pt-1">
                      {alert.message}
                    </p>

                    <div className="text-[9px] text-slate-400 font-sans pt-1">
                      Log Timestamp: {new Date(alert.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Warning actions */}
                <div className="flex-shrink-0 flex items-center space-x-2.5 sm:self-center">
                  <button
                    onClick={() => navigate(`/projects/${alert.project_id}`)}
                    className="px-3 py-1.5 border border-gov-border hover:border-gov-navy font-bold text-[10px] rounded bg-gov-bg text-slate-700 dark:text-slate-200"
                  >
                    Open Scheme
                  </button>
                  {isUnread && (
                    <button
                      onClick={() => handleMarkRead(alert.id)}
                      className="px-3 py-1.5 bg-gov-navy hover:bg-gov-navyalt text-white font-bold text-[10px] rounded shadow-sm flex items-center gap-1"
                    >
                      <Check size={11} />
                      <span>Acknowledge</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default Alerts;
