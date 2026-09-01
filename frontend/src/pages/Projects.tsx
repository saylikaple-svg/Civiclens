import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import {
  FolderKanban,
  Search,
  Plus,
  Filter,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  MapPin,
  Calendar,
  Building,
  Check,
  AlertCircle
} from 'lucide-react';

interface Department {
  id: number;
  name: string;
}

interface Project {
  id: number;
  project_code: string;
  name: string;
  description: string;
  department_id: number;
  department: Department;
  state: string;
  district: string;
  latitude: number;
  longitude: number;
  budget: number;
  expenditure?: number;
  amount_spent?: number;
  progress: number;
  financial_progress?: number;
  status: string;
  risk_level: string;
  predicted_delay_days?: number;
  start_date: string;
  target_end_date?: string;
  expected_end_date?: string;
}

export const Projects: React.FC = () => {
  const { token, user, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [projects, setProjects] = useState<Project[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('');

  // Sync with search parameter when URL changes
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    setSearchTerm(urlSearch);
  }, [searchParams]);
  
  // Create Project Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCode, setModalCode] = useState('');
  const [modalName, setModalName] = useState('');
  const [modalDesc, setModalDesc] = useState('');
  const [modalDeptId, setModalDeptId] = useState<number | ''>('');
  const [modalState, setModalState] = useState('');
  const [modalDistrict, setModalDistrict] = useState('');
  const [modalLat, setModalLat] = useState<number>(20);
  const [modalLng, setModalLng] = useState<number>(78);
  const [modalBudget, setModalBudget] = useState<number | ''>('');
  const [modalStartDate, setModalStartDate] = useState('');
  const [modalEndDate, setModalEndDate] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // States list for selection
  const indianStates = [
    "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Gujarat", "Haryana",
    "Jammu and Kashmir", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Odisha",
    "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal"
  ];

  const fetchProjects = async () => {
    try {
      setLoading(true);
      let url = `${API_BASE_URL}/api/projects?`;
      if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}&`;
      if (selectedState) url += `state=${encodeURIComponent(selectedState)}&`;
      if (selectedDept) url += `department_id=${selectedDept}&`;
      if (selectedStatus) url += `status=${encodeURIComponent(selectedStatus)}&`;
      if (selectedRisk) url += `risk_level=${encodeURIComponent(selectedRisk)}&`;
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    
    // Fetch departments list
    const fetchDepts = async () => {
      try {
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
      }
    };

    fetchDepts();
    fetchProjects();
  }, [token, selectedState, selectedDept, selectedStatus, selectedRisk]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProjects();
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setSubmitting(true);

    if (!modalDeptId || !modalBudget) {
      setFormError('Please fill in all required fields.');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          project_code: modalCode,
          name: modalName,
          description: modalDesc,
          department_id: Number(modalDeptId),
          state: modalState,
          district: modalDistrict,
          latitude: Number(modalLat),
          longitude: Number(modalLng),
          budget: Number(modalBudget),
          amount_spent: 0.0,
          progress: 0.0,
          status: 'Planning',
          risk_level: 'Low',
          start_date: modalStartDate,
          expected_end_date: modalEndDate
        })
      });

      if (response.ok) {
        setFormSuccess('Project registered successfully!');
        setTimeout(() => {
          setIsModalOpen(false);
          setFormSuccess('');
          // Reset fields
          setModalCode('');
          setModalName('');
          setModalDesc('');
          setModalDeptId('');
          setModalState('');
          setModalDistrict('');
          setModalBudget('');
          setModalStartDate('');
          setModalEndDate('');
          fetchProjects();
        }, 1200);
      } else {
        const data = await response.json();
        setFormError(data.detail || 'Failed to create project scheme.');
      }
    } catch (err) {
      console.error(err);
      setFormError('Failed to connect to the backend server.');
    } finally {
      setSubmitting(false);
    }
  };

  const canWrite = hasPermission(['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gov-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gov-navy leading-none">
            National Projects Ledger
          </h1>
          <p className="text-xs text-gov-muted mt-1.5 font-sans">
            Central repository of MoSPI monitored infrastructure and developmental works across India
          </p>
        </div>
        {canWrite && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-gov-navy text-white hover:bg-gov-navyalt text-xs font-bold rounded-lg shadow-sm"
          >
            <Plus size={14} />
            <span>Register New Scheme</span>
          </button>
        )}
      </div>

      {/* Filter panel */}
      <div className="bg-gov-card border border-gov-border rounded-xl p-4 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search project code/name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gov-bg border border-gov-border rounded-lg text-xs outline-none focus:border-gov-navy text-slate-800 dark:text-white"
            />
            <Search size={14} className="absolute left-3 top-3 text-slate-400" />
          </div>

          {/* State Filter */}
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="bg-gov-bg border border-gov-border rounded-lg px-3 py-2 text-xs outline-none focus:border-gov-navy text-slate-700 dark:text-slate-200"
          >
            <option value="">All States</option>
            {indianStates.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-gov-bg border border-gov-border rounded-lg px-3 py-2 text-xs outline-none focus:border-gov-navy text-slate-700 dark:text-slate-200"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name.split(' (')[0]}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-gov-bg border border-gov-border rounded-lg px-3 py-2 text-xs outline-none focus:border-gov-navy text-slate-700 dark:text-slate-200"
          >
            <option value="">All Statuses</option>
            <option value="Planning">Planning</option>
            <option value="In Progress">In Progress</option>
            <option value="Delayed">Delayed</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
          </select>

          {/* Risk Filter */}
          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="bg-gov-bg border border-gov-border rounded-lg px-3 py-2 text-xs outline-none focus:border-gov-navy text-slate-700 dark:text-slate-200"
          >
            <option value="">All Risk Thresholds</option>
            <option value="Low">Low Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="High">High Risk</option>
            <option value="Critical">Critical Risk</option>
          </select>
        </form>
      </div>

      {/* Projects Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-gov-navy border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500 font-sans">Compiling project grids...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 bg-gov-card border border-gov-border rounded-xl">
          <AlertCircle size={36} className="text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold font-serif text-gov-navy">No Schemes Found</h3>
          <p className="text-xs text-gov-muted mt-1 max-w-xs mx-auto">
            Try adjusting search queries or selection filters to browse registry items.
          </p>
        </div>
      ) : (
        <div className="border border-gov-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gov-border bg-gov-card text-xs text-left">
              <thead className="bg-gov-bg font-sans text-[10px] text-gov-muted font-bold tracking-wider uppercase border-b border-gov-border">
                <tr>
                  <th className="px-5 py-4">Code</th>
                  <th className="px-5 py-4">Project Title</th>
                  <th className="px-5 py-4">State</th>
                  <th className="px-5 py-4">Department</th>
                  <th className="px-5 py-4 text-right">Budget</th>
                  <th className="px-5 py-4">Physical Progress</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Risk Level</th>
                  <th className="px-5 py-4">Target Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gov-border font-medium text-slate-700 dark:text-slate-200">
                {projects.map((proj) => (
                  <tr
                    key={proj.id}
                    onClick={() => navigate(`/projects/${proj.id}`)}
                    className="hover:bg-gov-bg/60 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-4 font-bold text-gov-navy">{proj.project_code}</td>
                    <td className="px-5 py-4 font-serif font-bold text-gov-navy max-w-xs truncate">
                      {proj.name}
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{proj.state}</td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400 font-sans">
                      {proj.department.name.split(' (')[0]}
                    </td>
                    <td className="px-5 py-4 text-right font-serif font-bold text-gov-navy">
                      ₹{proj.budget.toFixed(1)} Cr
                    </td>
                    <td className="px-5 py-4 w-40">
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[#10b981] h-full rounded-full"
                            style={{ width: `${proj.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] font-bold">{proj.progress.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 text-[9px] font-bold rounded-full uppercase border ${
                        proj.status === 'Completed' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' :
                        proj.status === 'Delayed' ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800' :
                        proj.status === 'Planning' ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700' :
                        'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                      }`}>
                        {proj.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                        proj.risk_level === 'Critical' ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20' :
                        proj.risk_level === 'High' ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20' :
                        proj.risk_level === 'Medium' ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20' :
                        'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20'
                      }`}>
                        {proj.risk_level}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400 text-[11px] font-sans">
                      {proj.expected_end_date ? new Date(proj.expected_end_date).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Register Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gov-card border border-gov-border rounded-2xl p-6 md:p-8 shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gov-border pb-3 mb-5">
              <h3 className="text-xl font-bold font-serif text-gov-navy">Register New Scheme</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 p-3 rounded-lg text-xs font-semibold flex items-center space-x-2 mb-4">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 p-3 rounded-lg text-xs font-semibold mb-4">
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase mb-1">Project Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="PRJ-NH102"
                    value={modalCode}
                    onChange={(e) => setModalCode(e.target.value)}
                    className="w-full bg-gov-bg border border-gov-border px-3 py-2 rounded-lg outline-none focus:border-gov-navy text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase mb-1">Project Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="National Highway Bypass..."
                    value={modalName}
                    onChange={(e) => setModalName(e.target.value)}
                    className="w-full bg-gov-bg border border-gov-border px-3 py-2 rounded-lg outline-none focus:border-gov-navy text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase mb-1">Scope/Description</label>
                <textarea
                  placeholder="Summarize the core scheme target, clearances, and contractor parameters..."
                  value={modalDesc}
                  onChange={(e) => setModalDesc(e.target.value)}
                  className="w-full bg-gov-bg border border-gov-border px-3 py-2 rounded-lg outline-none focus:border-gov-navy h-20 text-slate-800 dark:text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase mb-1">Department *</label>
                  <select
                    required
                    value={modalDeptId}
                    onChange={(e) => setModalDeptId(Number(e.target.value))}
                    className="w-full bg-gov-bg border border-gov-border px-3 py-2 rounded-lg outline-none focus:border-gov-navy text-slate-800 dark:text-white"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase mb-1">Approved Budget (₹ Crores) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="450.50"
                    value={modalBudget}
                    onChange={(e) => setModalBudget(Number(e.target.value))}
                    className="w-full bg-gov-bg border border-gov-border px-3 py-2 rounded-lg outline-none focus:border-gov-navy text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase mb-1">State *</label>
                  <select
                    required
                    value={modalState}
                    onChange={(e) => setModalState(e.target.value)}
                    className="w-full bg-gov-bg border border-gov-border px-3 py-2 rounded-lg outline-none focus:border-gov-navy text-slate-800 dark:text-white"
                  >
                    <option value="">Select State</option>
                    {indianStates.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase mb-1">District *</label>
                  <input
                    type="text"
                    required
                    placeholder="Pune"
                    value={modalDistrict}
                    onChange={(e) => setModalDistrict(e.target.value)}
                    className="w-full bg-gov-bg border border-gov-border px-3 py-2 rounded-lg outline-none focus:border-gov-navy text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={modalLat}
                    onChange={(e) => setModalLat(Number(e.target.value))}
                    className="w-full bg-gov-bg border border-gov-border px-3 py-2 rounded-lg outline-none focus:border-gov-navy text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={modalLng}
                    onChange={(e) => setModalLng(Number(e.target.value))}
                    className="w-full bg-gov-bg border border-gov-border px-3 py-2 rounded-lg outline-none focus:border-gov-navy text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-gov-border pt-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase mb-1 flex items-center gap-1">
                    <Calendar size={12} />
                    <span>Project Start Date *</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={modalStartDate}
                    onChange={(e) => setModalStartDate(e.target.value)}
                    className="w-full bg-gov-bg border border-gov-border px-3 py-2 rounded-lg outline-none focus:border-gov-navy text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase mb-1 flex items-center gap-1">
                    <Calendar size={12} />
                    <span>Expected Completion *</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={modalEndDate}
                    onChange={(e) => setModalEndDate(e.target.value)}
                    className="w-full bg-gov-bg border border-gov-border px-3 py-2 rounded-lg outline-none focus:border-gov-navy text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-4 py-3 bg-[#1e3a8a] hover:bg-[#172554] text-white font-bold rounded-lg shadow transition-all flex items-center justify-center"
              >
                {submitting ? 'Registering...' : 'Register Project Outlay'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Projects;
