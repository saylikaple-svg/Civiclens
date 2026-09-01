import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, PieChart as ChartIcon, BarChart3, ShieldAlert } from 'lucide-react';

interface DeptPerformance {
  department: string;
  avg_progress: number;
  total_budget: number;
  total_spent: number;
  projects_count: number;
}

interface DistributionItem {
  name: string;
  value: number;
}

interface ProgressRange {
  name: string;
  count: number;
}

interface ChartsData {
  department_performance: DeptPerformance[];
  risk_distribution: DistributionItem[];
  status_distribution: DistributionItem[];
  progress_ranges: ProgressRange[];
}

export const Analytics: React.FC = () => {
  const { token } = useAuth();
  const [data, setData] = useState<ChartsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchChartsData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/analytics/charts`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const chartData = await res.json();
        setData(chartData);
      } catch (err) {
        console.error('Error fetching analytics charts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChartsData();
  }, [token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 border-4 border-gov-navy border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-500 font-sans">Compiling project statistics...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 bg-gov-card border border-gov-border rounded-xl">
        <p className="text-xs text-slate-400 font-medium">Failed to load analytics datasets.</p>
      </div>
    );
  }

  // Color mappings for Pie Charts
  const STATUS_COLORS: Record<string, string> = {
    Completed: '#10b981',   // Emerald
    'In Progress': '#3b82f6', // Blue
    Delayed: '#ef4444',      // Red
    Planning: '#f59e0b',     // Amber
    'On Hold': '#64748b'     // Muted Slate
  };

  const RISK_COLORS: Record<string, string> = {
    Low: '#10b981',          // Green
    Medium: '#eab308',       // Yellow
    High: '#f97316',         // Orange
    Critical: '#ef4444'      // Red
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gov-border pb-4">
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-gov-navy leading-none">
          Analytics Command Panel
        </h1>
        <p className="text-xs text-gov-muted mt-1.5 font-sans">
          Real-time metrics charts, sector spending analysis, and project completion parameters across all departments
        </p>
      </div>

      {/* Grid of Summary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Department wise budget vs spending */}
        <div className="bg-gov-card border border-gov-border rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-gov-navy text-sm border-b border-gov-border pb-2 flex items-center gap-1.5">
            <BarChart3 size={15} className="text-gov-gold" />
            <span>Ministry Spending vs Approved Budget (₹ Crores)</span>
          </h3>
          <div className="h-72 w-full text-[10px] font-sans">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.department_performance}
                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
                <XAxis dataKey="department" tickLine={false} axisLine={false} tick={{ fill: 'currentColor' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: 'currentColor' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--color-gov-card)', borderColor: 'var(--color-gov-border)', color: 'var(--color-gov-text)' }}
                />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ paddingTop: 10 }} />
                <Bar dataKey="total_budget" name="Approved Budget" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total_spent" name="Actual Spent" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Project status breakdown */}
        <div className="bg-gov-card border border-gov-border rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-gov-navy text-sm border-b border-gov-border pb-2 flex items-center gap-1.5">
            <ChartIcon size={15} className="text-gov-gold" />
            <span>Undergoing Project Status Share</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 items-center">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.status_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data.status_distribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={STATUS_COLORS[entry.name] || '#94a3b8'} 
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--color-gov-card)', borderColor: 'var(--color-gov-border)', color: 'var(--color-gov-text)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Pie Chart Legend List */}
            <div className="space-y-2.5 text-xs font-sans pl-4">
              {data.status_distribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: STATUS_COLORS[item.name] || '#94a3b8' }}
                    />
                    <span className="text-slate-600 dark:text-slate-300 font-semibold">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-800 dark:text-white">{item.value} Projects</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 3: Project Risk Distribution */}
        <div className="bg-gov-card border border-gov-border rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-gov-navy text-sm border-b border-gov-border pb-2 flex items-center gap-1.5">
            <ShieldAlert size={15} className="text-gov-gold" />
            <span>Infrastructure Risk Level Share</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 items-center">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.risk_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data.risk_distribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={RISK_COLORS[entry.name] || '#94a3b8'} 
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--color-gov-card)', borderColor: 'var(--color-gov-border)', color: 'var(--color-gov-text)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Pie Chart Legend List */}
            <div className="space-y-2.5 text-xs font-sans pl-4">
              {data.risk_distribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: RISK_COLORS[item.name] || '#94a3b8' }}
                    />
                    <span className="text-slate-600 dark:text-slate-300 font-semibold">{item.name} Risk</span>
                  </div>
                  <span className="font-bold text-slate-800 dark:text-white">{item.value} Projects</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 4: Completion range distribution */}
        <div className="bg-gov-card border border-gov-border rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-gov-navy text-sm border-b border-gov-border pb-2 flex items-center gap-1.5">
            <TrendingUp size={15} className="text-gov-gold" />
            <span>Project Completion Brackets Distribution</span>
          </h3>
          <div className="h-72 w-full text-[10px] font-sans">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.progress_ranges}
                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: 'currentColor' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: 'currentColor' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--color-gov-card)', borderColor: 'var(--color-gov-border)', color: 'var(--color-gov-text)' }}
                />
                <Bar dataKey="count" name="Projects" fill="#fbbf24" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};
export default Analytics;
