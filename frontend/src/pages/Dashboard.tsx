import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { KPICard } from '../components/KPICard';
import { IndiaMap } from '../components/IndiaMap';
import { DashboardMap } from '../components/DashboardMap';
import {
  FolderOpen,
  FileCheck,
  Clock,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  FileWarning,
  IndianRupee,
  MapPin,
  Layers
} from 'lucide-react';

// Custom Count-Up animation hook
function useCountUp(target: number, duration: number = 900): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let frameId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(easeOut * target);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [target, duration]);

  return count;
}

interface KPIStats {
  total_projects: number;
  completed: number;
  ongoing: number;
  delayed: number;
  high_risk: number;
  total_budget_cr: number;
  total_spent_cr: number;
  budget_utilization_pct: number;
}

interface StateData {
  state: string;
  total_projects: number;
  completed: number;
  ongoing: number;
  delayed: number;
  high_risk: number;
  total_budget: number;
  total_spent: number;
  budget_utilization: number;
  projects: {
    id: number;
    code: string;
    name: string;
    budget: number;
    progress: number;
    status: string;
  }[];
}

interface AlertData {
  id: number;
  project_id: number;
  project_name: string;
  severity: string;
  type: string;
  message: string;
  created_at: string;
  project_code: string;
}

interface Project {
  id: number;
  project_code: string;
  name: string;
  state: string;
  district?: string;
  latitude: number;
  longitude: number;
  budget: number;
  expenditure?: number;
  progress?: number;
  status: string;
  risk_level?: string;
  department?: { name: string };
}

const FinancialOverview: React.FC<{ kpis: KPIStats | null }> = ({ kpis }) => {
  const animatedBudget = useCountUp(kpis?.total_budget_cr || 0, 1100);
  const animatedSpent = useCountUp(kpis?.total_spent_cr || 0, 1100);
  const animatedUtilization = useCountUp(kpis?.budget_utilization_pct || 0, 1100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-gov-border rounded-xl p-4 bg-gov-bg/60 dark:bg-[#0b0f19]/80 shadow-inner">
      <div className="flex flex-col justify-center group cursor-pointer hover:bg-gov-card/60 p-2.5 rounded-lg transition-all duration-300">
        <span className="text-[10px] text-gov-muted font-bold tracking-wider uppercase group-hover:text-gov-navy transition-colors">
          Approved Total Budget
        </span>
        <div className="text-xl font-bold font-serif text-gov-navy flex items-center mt-1 group-hover:scale-105 origin-left transition-transform duration-200">
          <IndianRupee size={16} className="text-gov-gold mr-0.5" />
          <span>{animatedBudget.toLocaleString('en-IN', { maximumFractionDigits: 1 })} Cr</span>
        </div>
        <span className="text-[9px] text-slate-400 font-sans mt-0.5">Central Sector outlay</span>
      </div>

      <div className="flex flex-col justify-center border-y md:border-y-0 md:border-x border-gov-border py-3 md:py-0 md:px-6 group cursor-pointer hover:bg-gov-card/60 p-2.5 rounded-lg transition-all duration-300">
        <span className="text-[10px] text-gov-muted font-bold tracking-wider uppercase group-hover:text-gov-navy transition-colors">
          Cumulative Expenditure
        </span>
        <div className="text-xl font-bold font-serif text-gov-navy flex items-center mt-1 group-hover:scale-105 origin-left transition-transform duration-200">
          <IndianRupee size={16} className="text-gov-gold mr-0.5" />
          <span>{animatedSpent.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr</span>
        </div>
        <span className="text-[9px] text-slate-400 font-sans mt-0.5">Verified bills and disbursals</span>
      </div>

      <div className="flex flex-col justify-center md:pl-4 group cursor-pointer hover:bg-gov-card/60 p-2.5 rounded-lg transition-all duration-300">
        <span className="text-[10px] text-gov-muted font-bold tracking-wider uppercase group-hover:text-gov-navy transition-colors">
          Fund Utilization Rate
        </span>
        <div className="flex items-center space-x-3 mt-1">
          <div className="text-xl font-bold font-serif text-emerald-600 dark:text-emerald-400 group-hover:scale-105 origin-left transition-transform duration-200">
            {animatedUtilization.toFixed(2)}%
          </div>
          <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2 min-w-[100px] overflow-hidden p-0.5">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
              style={{ width: `${Math.min(100, animatedUtilization)}%` }}
            ></div>
          </div>
        </div>
        <span className="text-[9px] text-slate-400 font-sans mt-0.5">Spent vs Allocated balance</span>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  
  const [kpis, setKpis] = useState<KPIStats | null>(null);
  const [mapData, setMapData] = useState<StateData[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [selectedStateName, setSelectedStateName] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<'osm' | 'schematic'>('osm');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch KPIs, State Metrics, Projects, and Alerts in parallel
        const [kpiRes, mapRes, projRes, alertRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/analytics/kpis`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/analytics/map`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/projects`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/alerts?status=unread`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const kpiData = await kpiRes.json();
        const mData = await mapRes.json();
        const pData = await projRes.json();
        const aData = await alertRes.json();

        setKpis(kpiData);
        setMapData(Array.isArray(mData) ? mData : []);
        setProjects(Array.isArray(pData) ? pData : []);
        setAlerts(Array.isArray(aData) ? aData.slice(0, 4) : []);
      } catch (err) {
        console.error('Error fetching dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 border-4 border-gov-navy border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-500 font-sans">Compiling dashboard intelligence...</p>
      </div>
    );
  }

  // Get current selected state metrics
  const selectedStateMetrics = mapData.find((d) => d.state === selectedStateName);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gov-border pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gov-navy leading-none">
            Integrated Project-Monitoring Dashboard
          </h1>
          <p className="text-xs text-gov-muted mt-1.5 font-sans">
            Central monitoring command desk for major national sector projects and ML risk projections
          </p>
        </div>
        <div className="text-[11px] font-sans font-bold text-slate-500 dark:text-slate-300 bg-gov-bg border border-gov-border px-3 py-1.5 rounded-lg flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>System Online: WAL Database Sync</span>
        </div>
      </div>

      {/* KPI Stats Cards - matching MPLADS styles in screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Projects Monitor"
          value={kpis?.total_projects || 0}
          subtext1="Active schemes across Indian States"
          subtext2="Infrastructure Corridors"
          icon={<FolderOpen size={20} />}
          color="blue"
        />
        <KPICard
          title="Completed Schemes"
          value={kpis?.completed || 0}
          subtext1="Successfully commissioned & audited"
          subtext2={`${((kpis?.completed || 0) / (kpis?.total_projects || 1) * 100).toFixed(1)}% Completion Rate`}
          icon={<FileCheck size={20} />}
          color="green"
        />
        <KPICard
          title="Delayed Milestones"
          value={kpis?.delayed || 0}
          subtext1="Schedule slippages detected"
          subtext2="Overdue target dates"
          icon={<Clock size={20} />}
          color="red"
        />
        <KPICard
          title="High Risk Forecast"
          value={kpis?.high_risk || 0}
          subtext1="AI predicted delay > 75%"
          subtext2="Requires prompt intervention"
          icon={<AlertTriangle size={20} />}
          color="yellow"
        />
      </div>

      {/* Sub-KPI Financial Overview with Count-Up & Hover Animations */}
      <FinancialOverview kpis={kpis} />

      {/* Main Grid: Interactive Map + Drilling Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: India Map Viewport */}
        <div className="lg:col-span-7 space-y-2">
          {/* Map Mode Selector */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setMapMode('osm')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mapMode === 'osm'
                    ? 'bg-gov-navy text-white shadow-sm'
                    : 'bg-gov-card border border-gov-border text-slate-600 dark:text-slate-300 hover:border-gov-navy'
                }`}
              >
                <MapPin size={13} />
                <span>GIS OpenStreetMap</span>
              </button>

              <button
                type="button"
                onClick={() => setMapMode('schematic')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mapMode === 'schematic'
                    ? 'bg-gov-navy text-white shadow-sm'
                    : 'bg-gov-card border border-gov-border text-slate-600 dark:text-slate-300 hover:border-gov-navy'
                }`}
              >
                <Layers size={13} />
                <span>State Schematic View</span>
              </button>
            </div>

            <span className="text-[10px] text-slate-400 font-sans hidden sm:inline-block">
              Click any site marker or state to filter
            </span>
          </div>

          {mapMode === 'osm' ? (
            <DashboardMap
              projects={projects}
              selectedState={selectedStateName}
              onSelectState={setSelectedStateName}
            />
          ) : (
            <IndiaMap
              data={mapData}
              onSelectState={setSelectedStateName}
              selectedState={selectedStateName}
            />
          )}
        </div>

        {/* Right Side: State Drilling Dashboard */}
        <div className="lg:col-span-5 bg-gov-card border border-gov-border rounded-xl p-5 shadow-sm space-y-4">
          {!selectedStateMetrics ? (
            <div className="h-[460px] flex flex-col justify-center items-center text-center p-6 bg-gov-bg rounded-xl border border-dashed border-gov-border">
              <TrendingUp size={36} className="text-slate-300 mb-3" />
              <h3 className="text-sm font-bold font-serif text-gov-navy mb-1.5">No State Filter Applied</h3>
              <p className="text-[11px] text-gov-muted max-w-xs leading-relaxed">
                Click on any project site pin on the OpenStreetMap or select a region to inspect localized project breakdowns, budgets, and warning flags.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected State Header */}
              <div className="border-b border-gov-border pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold text-gov-gold tracking-widest uppercase">State Level Intelligence</span>
                  <h3 className="text-xl font-bold font-serif text-gov-navy">{selectedStateMetrics.state}</h3>
                </div>
                <button
                  onClick={() => setSelectedStateName(null)}
                  className="text-xs text-slate-400 hover:text-rose-500 font-bold px-2 py-1 bg-gov-bg border border-gov-border rounded"
                >
                  Clear
                </button>
              </div>

              {/* State KPI Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gov-bg border border-gov-border p-3 rounded-lg text-center">
                  <span className="text-[9px] text-gov-muted font-bold block uppercase">Total Projects</span>
                  <span className="text-lg font-bold font-serif text-gov-navy">{selectedStateMetrics.total_projects}</span>
                </div>
                <div className="bg-gov-bg border border-gov-border p-3 rounded-lg text-center">
                  <span className="text-[9px] text-gov-muted font-bold block uppercase">Utilized Fund</span>
                  <span className="text-lg font-bold font-serif text-gov-navy">{selectedStateMetrics.budget_utilization}%</span>
                </div>
              </div>

              {/* State detail distribution */}
              <div className="space-y-2 text-xs border-b border-gov-border pb-4">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500 dark:text-slate-400">Ongoing Schemes:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedStateMetrics.ongoing}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500 dark:text-slate-400">Completed Projects:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedStateMetrics.completed}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500 dark:text-slate-400">Delayed Milestones:</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">{selectedStateMetrics.delayed}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500 dark:text-slate-400">High Risk Threshold:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">{selectedStateMetrics.high_risk}</span>
                </div>
                <div className="flex justify-between font-medium border-t border-gov-border pt-2 mt-1">
                  <span className="text-slate-500 dark:text-slate-400">State Outlay:</span>
                  <span className="font-bold text-gov-navy">₹{selectedStateMetrics.total_budget.toFixed(1)} Cr</span>
                </div>
              </div>

              {/* List of projects in this State */}
              <div>
                <h4 className="text-[10px] font-bold text-gov-muted tracking-wider uppercase mb-2">
                  Projects in {selectedStateMetrics.state} ({selectedStateMetrics.projects.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedStateMetrics.projects.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => navigate(`/projects/${p.id}`)}
                      className="bg-gov-card border border-gov-border hover:border-gov-navy p-3 rounded-lg flex items-center justify-between text-xs cursor-pointer hover:shadow-sm transition-all"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-[9px] font-bold text-slate-400 block font-mono">[{p.code}]</span>
                        <h5 className="font-bold text-gov-navy truncate">{p.name}</h5>
                        <div className="flex items-center space-x-1.5 mt-0.5 text-[9px] text-slate-400">
                          <span>Progress: {p.progress.toFixed(0)}%</span>
                          <span>•</span>
                          <span>Budget: ₹{p.budget} Cr</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end flex-shrink-0">
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase ${
                          p.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          p.status === 'Delayed' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {p.status}
                        </span>
                        <ArrowRight size={12} className="text-slate-300 mt-1.5" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Panel: Recent Warnings & Critical Anomalies */}
      <div className="bg-gov-card border border-gov-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div>
            <h3 className="text-lg font-serif font-bold text-gov-navy flex items-center gap-1.5">
              Recent Warnings & Scheduling Anomalies
            </h3>
            <p className="text-xs text-gov-muted">Automated threshold warnings generated by the monitoring engine</p>
          </div>
          <button
            onClick={() => navigate('/alerts')}
            className="text-xs text-amber-700 hover:text-amber-800 font-bold hover:underline"
          >
            View All Warning Logs
          </button>
        </div>

        {alerts.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500 font-medium font-sans">
            ✅ No unread critical warnings or progress anomalies detected in current active pipelines.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => navigate(`/projects/${alert.project_id}`)}
                className="bg-gov-bg border border-gov-border rounded-xl p-4 flex items-start space-x-3 hover:border-gov-navy cursor-pointer hover:shadow-sm transition-all"
              >
                <div className={`p-2 rounded-lg flex-shrink-0 ${
                  alert.severity === 'Critical' ? 'bg-rose-950/20 text-rose-400 border border-rose-800/40' : 'bg-amber-950/20 text-amber-400 border border-amber-800/40'
                }`}>
                  <FileWarning size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-gov-gold uppercase tracking-wider">{alert.type} Anomaly</span>
                    <span className="text-[9px] text-slate-400 font-medium">
                      {new Date(alert.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-gov-navy mt-0.5 truncate">{alert.project_name}</h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed mt-1 line-clamp-2">
                    {alert.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default Dashboard;
