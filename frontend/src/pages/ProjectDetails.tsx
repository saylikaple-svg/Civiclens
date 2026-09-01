import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import {
  IndianRupee,
  Calendar,
  AlertTriangle,
  Upload,
  BookOpen,
  ArrowLeft,
  FileText,
  Clock,
  Plus
} from 'lucide-react';

interface Milestone {
  id: number;
  name: string;
  description: string;
  planned_date: string;
  actual_date: string | null;
  status: string;
}

interface Project {
  id: number;
  project_code: string;
  name: string;
  description: string;
  state: string;
  district: string;
  budget: number;
  amount_spent: number;
  progress: number;
  financial_progress: number;
  status: string;
  risk_level: string;
  start_date: string;
  expected_end_date: string;
  actual_end_date: string | null;
  department: { id: number; name: string };
  milestones: Milestone[];
}

interface AIPrediction {
  risk_score: number;
  risk_level: string;
  expected_delay: number;
  contributing_factors: string[];
  recommended_actions: string[];
}

export const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token, hasPermission } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [prediction, setPrediction] = useState<AIPrediction | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [predLoading, setPredLoading] = useState(true);

  // Milestone completion update
  const [updatingMsId, setUpdatingMsId] = useState<number | null>(null);

  // New Milestone Form
  const [showMsForm, setShowMsForm] = useState(false);
  const [newMsName, setNewMsName] = useState('');
  const [newMsDesc, setNewMsDesc] = useState('');
  const [newMsDate, setNewMsDate] = useState('');

  // File Upload State
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // OCR View State
  const [viewingDocText, setViewingDocText] = useState<string | null>(null);
  const [viewingDocName, setViewingDocName] = useState('');

  // Project Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editProgress, setEditProgress] = useState<number>(0);
  const [editSpent, setEditSpent] = useState<number>(0);
  const [editStatus, setEditStatus] = useState('');
  const [editRisk, setEditRisk] = useState('');

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Project not found');
      const data = await res.json();
      setProject(data);
      
      // Seed edit states
      setEditProgress(data.progress);
      setEditSpent(data.amount_spent);
      setEditStatus(data.status);
      setEditRisk(data.risk_level);
    } catch (err) {
      console.error(err);
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrediction = async () => {
    try {
      setPredLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/projects/${id}/predict-delay`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPrediction(data);
    } catch (err) {
      console.error('Error fetching prediction:', err);
    } finally {
      setPredLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/documents?project_id=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!token || !id) return;
    fetchProjectDetails();
    fetchPrediction();
    fetchDocuments();
  }, [token, id]);

  const handleUpdateMilestone = async (milestoneId: number, currentStatus: string) => {
    setUpdatingMsId(milestoneId);
    try {
      const isCompleting = currentStatus !== 'Completed';
      const response = await fetch(`${API_BASE_URL}/api/projects/milestones/${milestoneId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: isCompleting ? 'Completed' : 'In Progress',
          actual_date: isCompleting ? new Date().toISOString() : null
        })
      });

      if (response.ok) {
        fetchProjectDetails();
        fetchPrediction();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingMsId(null);
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsName || !newMsDate) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${id}/milestones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newMsName,
          description: newMsDesc,
          planned_date: new Date(newMsDate).toISOString(),
          status: 'Not Started'
        })
      });

      if (response.ok) {
        setNewMsName('');
        setNewMsDesc('');
        setNewMsDate('');
        setShowMsForm(false);
        fetchProjectDetails();
        fetchPrediction();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('project_id', id!);
      formData.append('file', selectedFile);

      const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        setSelectedFile(null);
        fetchDocuments();
        setTimeout(fetchDocuments, 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleEditProject = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          progress: Number(editProgress),
          amount_spent: Number(editSpent),
          status: editStatus,
          risk_level: editRisk
        })
      });

      if (response.ok) {
        setIsEditing(false);
        fetchProjectDetails();
        fetchPrediction();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const generateReport = async (type: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          project_id: Number(id),
          report_type: type
        })
      });

      if (response.ok) {
        navigate('/reports');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 border-4 border-gov-navy border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-500 font-sans">Accessing scheme registry details...</p>
      </div>
    );
  }

  const canWrite = hasPermission(['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']);
  const remainingBudget = project.budget - project.amount_spent;

  return (
    <div className="space-y-6">
      {/* Back button & Page header */}
      <div className="border-b border-gov-border pb-4">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center space-x-1.5 text-xs text-gov-muted hover:text-gov-navy font-bold mb-3 font-sans"
        >
          <ArrowLeft size={14} />
          <span>Back to Schemes Ledger</span>
        </button>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <span className="inline-block px-2.5 py-0.5 text-[9px] font-bold bg-blue-50 dark:bg-blue-950/40 text-gov-navy border border-blue-200 dark:border-blue-800 rounded uppercase mb-1.5">
              {project.project_code}
            </span>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-gov-navy leading-tight">
              {project.name}
            </h1>
            <p className="text-xs text-gov-muted mt-1.5 font-sans">
              State Jurisdiction: <b className="text-slate-800 dark:text-slate-200">{project.state}</b> | District: <b className="text-slate-800 dark:text-slate-200">{project.district}</b> | Department: <b className="text-slate-800 dark:text-slate-200">{project.department.name}</b>
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${
              project.status === 'Completed' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' :
              project.status === 'Delayed' ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800' :
              'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
            }`}>
              Status: {project.status}
            </span>
            <span className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${
              project.risk_level === 'Low' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' :
              project.risk_level === 'Medium' ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' :
              project.risk_level === 'High' ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' :
              'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
            }`}>
              Risk: {project.risk_level}
            </span>
          </div>
        </div>
      </div>

      {/* Main double column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Hand: Core Monitoring parameters (Progress & Milestones) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section 1: Progress Metrics */}
          <div className="bg-gov-card border border-gov-border rounded-xl p-5 shadow-sm space-y-6">
            <div className="border-b border-gov-border pb-2 flex justify-between items-center">
              <h3 className="font-serif font-bold text-gov-navy text-base">Progress & Outlay Parameters</h3>
              {canWrite && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs text-gov-gold font-bold hover:underline"
                >
                  {isEditing ? 'Cancel Edit' : 'Edit Progress Logs'}
                </button>
              )}
            </div>

            {isEditing ? (
              // Inline edit form
              <div className="grid grid-cols-2 gap-4 text-xs font-sans p-4 bg-gov-bg rounded-xl border border-gov-border">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Physical Progress (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editProgress}
                    onChange={(e) => setEditProgress(Number(e.target.value))}
                    className="w-full bg-gov-card border border-gov-border px-3 py-2 rounded-lg text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Funds Spent (₹ Cr)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editSpent}
                    onChange={(e) => setEditSpent(Number(e.target.value))}
                    className="w-full bg-gov-card border border-gov-border px-3 py-2 rounded-lg text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full bg-gov-card border border-gov-border px-3 py-2 rounded-lg text-slate-800 dark:text-white"
                  >
                    <option value="Planning">Planning</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Delayed">Delayed</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Risk Level</label>
                  <select
                    value={editRisk}
                    onChange={(e) => setEditRisk(e.target.value)}
                    className="w-full bg-gov-card border border-gov-border px-3 py-2 rounded-lg text-slate-800 dark:text-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <button
                  onClick={handleEditProject}
                  className="col-span-2 py-2.5 bg-gov-navy text-white hover:bg-gov-navyalt font-bold rounded-lg"
                >
                  Save Metrics Override
                </button>
              </div>
            ) : (
              // Visual indicators view
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Physical Progress indicator */}
                <div className="flex flex-col items-center justify-center p-4 bg-gov-bg rounded-xl border border-gov-border">
                  <span className="text-[10px] text-gov-muted font-bold tracking-wide uppercase mb-3">Physical Completion Rate</span>
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    {/* SVG Radial loader */}
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="56" cy="56" r="46" stroke="#334155" strokeWidth="8" fill="transparent" />
                      <circle
                        cx="56"
                        cy="56"
                        r="46"
                        stroke="#10b981"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 46}
                        strokeDashoffset={2 * Math.PI * 46 * (1 - project.progress / 100)}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                    </svg>
                    <span className="absolute text-2xl font-bold font-serif text-gov-navy">
                      {project.progress.toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Financial outlay statistics */}
                <div className="space-y-3 font-sans text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block text-[9px] uppercase tracking-wider">Approved Outlay</span>
                    <div className="text-base font-bold font-serif text-gov-navy flex items-center">
                      <IndianRupee size={13} className="text-gov-gold" />
                      <span>{project.budget.toFixed(1)} Crores</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[9px] uppercase tracking-wider">Cumulative Expenditure</span>
                    <div className="text-base font-bold font-serif text-[#f43f5e] flex items-center">
                      <IndianRupee size={13} />
                      <span>{project.amount_spent.toFixed(1)} Crores</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[9px] uppercase tracking-wider">Unspent Outlay Balance</span>
                    <div className="text-base font-bold font-serif text-[#10b981] flex items-center">
                      <IndianRupee size={13} />
                      <span>{remainingBudget.toFixed(1)} Crores</span>
                    </div>
                  </div>
                  
                  {/* Outlay bar */}
                  <div className="pt-2 border-t border-gov-border">
                    <div className="flex justify-between font-bold text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                      <span>Fund utilization:</span>
                      <span>{project.financial_progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gov-gold h-full rounded-full"
                        style={{ width: `${project.financial_progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Milestone Timeline tracking */}
          <div className="bg-gov-card border border-gov-border rounded-xl p-5 shadow-sm space-y-4">
            <div className="border-b border-gov-border pb-2 flex justify-between items-center">
              <h3 className="font-serif font-bold text-gov-navy text-base">Key Milestones Execution Timeline</h3>
              {canWrite && (
                <button
                  onClick={() => setShowMsForm(!showMsForm)}
                  className="flex items-center space-x-1 text-xs text-gov-navy font-bold hover:underline"
                >
                  <Plus size={12} />
                  <span>Add Milestone</span>
                </button>
              )}
            </div>

            {/* Add Milestone Inline Form */}
            {showMsForm && (
              <form onSubmit={handleAddMilestone} className="p-4 bg-gov-bg border border-gov-border rounded-xl space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Milestone Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="M-04: Concrete Works"
                      value={newMsName}
                      onChange={(e) => setNewMsName(e.target.value)}
                      className="w-full bg-gov-card border border-gov-border px-3 py-2 rounded-lg text-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Planned Target Date *</label>
                    <input
                      type="date"
                      required
                      value={newMsDate}
                      onChange={(e) => setNewMsDate(e.target.value)}
                      className="w-full bg-gov-card border border-gov-border px-3 py-2 rounded-lg text-slate-800 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Milestone Scope</label>
                  <input
                    type="text"
                    placeholder="Brief description of requirements..."
                    value={newMsDesc}
                    onChange={(e) => setNewMsDesc(e.target.value)}
                    className="w-full bg-gov-card border border-gov-border px-3 py-2 rounded-lg text-slate-800 dark:text-white"
                  />
                </div>
                <div className="flex space-x-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowMsForm(false)}
                    className="px-3 py-1.5 border border-gov-border text-slate-600 dark:text-slate-300 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-gov-navy text-white font-bold rounded-lg"
                  >
                    Save Milestone
                  </button>
                </div>
              </form>
            )}

            {/* Timeline steps */}
            {project.milestones.length === 0 ? (
              <p className="text-xs text-slate-500 font-medium">No milestones established for this scheme.</p>
            ) : (
              <div className="relative pl-6 border-l-2 border-gov-border space-y-6">
                {project.milestones.map((ms) => {
                  const isCompleted = ms.status === 'Completed';
                  const isDelayed = ms.status === 'Delayed' || (!isCompleted && new Date(ms.planned_date) < new Date());

                  return (
                    <div key={ms.id} className="relative group text-xs">
                      {/* Timeline dot */}
                      <span className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 bg-gov-card flex items-center justify-center ${
                        isCompleted ? 'border-emerald-500' :
                        isDelayed ? 'border-rose-500' : 'border-slate-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          isCompleted ? 'bg-emerald-500' :
                          isDelayed ? 'bg-rose-500' : 'bg-slate-400'
                        }`}></span>
                      </span>

                      {/* Content block */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 p-3 bg-gov-bg hover:bg-gov-bg/80 rounded-lg border border-gov-border transition-colors">
                        <div>
                          <h4 className="font-bold text-gov-navy">{ms.name}</h4>
                          {ms.description && <p className="text-slate-500 dark:text-slate-400 mt-0.5">{ms.description}</p>}
                          <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-1.5">
                            <span className="flex items-center gap-1">
                              <Calendar size={11} />
                              <span>Target: {new Date(ms.planned_date).toLocaleDateString()}</span>
                            </span>
                            {ms.actual_date && (
                              <span>• Completed: {new Date(ms.actual_date).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center space-x-3 flex-shrink-0">
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase border ${
                            isCompleted ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' :
                            isDelayed ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}>
                            {isCompleted ? 'Completed' : isDelayed ? 'Overdue' : 'Pending'}
                          </span>
                          
                          {canWrite && (
                            <button
                              disabled={updatingMsId === ms.id}
                              onClick={() => handleUpdateMilestone(ms.id, ms.status)}
                              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all shadow-sm ${
                                isCompleted
                                  ? 'border border-gov-border hover:bg-gov-bg text-slate-600 dark:text-slate-300 bg-gov-card'
                                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                              }`}
                            >
                              {updatingMsId === ms.id ? 'Updating...' : isCompleted ? 'Reopen' : 'Complete'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Hand: AI Delay prediction, OCR uploads & Reports */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Section 1: AI Project Intelligence */}
          <div className="bg-gov-card border border-gov-border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-gov-navy text-base border-b border-gov-border pb-2 flex items-center gap-1.5">
              AI Project Intelligence
            </h3>

            {predLoading ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-2">
                <div className="w-8 h-8 border-4 border-gov-navy border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] text-slate-500">Generating ML delay projection models...</p>
              </div>
            ) : prediction ? (
              <div className="space-y-4 text-xs font-sans">
                {/* Risk score stats */}
                <div className="flex items-center justify-between bg-gov-bg border border-gov-border p-4 rounded-xl">
                  <div>
                    <span className="text-[9px] text-gov-muted font-bold block uppercase tracking-wider">Delay Probability</span>
                    <span className="text-3xl font-bold font-serif text-gov-navy leading-none">
                      {prediction.risk_score}%
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-gov-muted font-bold block uppercase tracking-wider">Predicted Overrun</span>
                    <span className={`text-base font-bold font-serif ${prediction.expected_delay > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {prediction.expected_delay > 0 ? `+ ${prediction.expected_delay} Days` : 'On Schedule'}
                    </span>
                  </div>
                </div>

                {/* Factors checklist */}
                <div>
                  <h4 className="text-[10px] font-bold text-gov-muted tracking-wider uppercase mb-1.5">Primary Delay Factors</h4>
                  <ul className="space-y-1.5 list-disc pl-4 text-slate-600 dark:text-slate-300 font-medium">
                    {prediction.contributing_factors.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>

                {/* Recommendations */}
                <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 p-4 rounded-xl">
                  <h4 className="text-[10px] font-bold text-amber-800 dark:text-amber-400 tracking-wider uppercase mb-1.5 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    <span>AI Recommended Action Plan</span>
                  </h4>
                  <ul className="space-y-1.5 list-disc pl-4 text-amber-900 dark:text-amber-200 font-semibold leading-relaxed">
                    {prediction.recommended_actions.map((act, i) => (
                      <li key={i}>{act}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 font-medium">Unable to calculate ML predictions.</p>
            )}
          </div>

          {/* Section 2: Document manager (OCR & Upload) */}
          <div className="bg-gov-card border border-gov-border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-gov-navy text-base border-b border-gov-border pb-2">
              Scheme Document Registry
            </h3>

            {/* Upload form */}
            {canWrite && (
              <form onSubmit={handleFileUpload} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="flex-1 border border-gov-border rounded-lg p-1.5 text-xs bg-gov-bg outline-none focus:border-gov-navy cursor-pointer text-slate-700 dark:text-slate-200"
                />
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="px-3.5 py-2 bg-gov-navy hover:bg-gov-navyalt text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center space-x-1.5"
                >
                  <Upload size={13} />
                  <span>{uploading ? 'Scanning...' : 'Upload'}</span>
                </button>
              </form>
            )}

            {/* List files */}
            {documents.length === 0 ? (
              <p className="text-xs text-slate-500 font-medium py-3 text-center border border-dashed border-gov-border rounded-lg">
                No reports, approve directives or DPR sheets uploaded yet.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="border border-gov-border bg-gov-bg/40 p-3 rounded-lg flex items-center justify-between text-xs font-sans hover:shadow-sm"
                  >
                    <div className="min-w-0 pr-2">
                      <h4 className="font-bold text-gov-navy truncate flex items-center gap-1.5">
                        <FileText size={13} className="text-slate-400" />
                        <span>{doc.file_name}</span>
                      </h4>
                      <p className="text-[9px] text-slate-400 mt-0.5">
                        OCR Status: <span className={`font-bold ${
                          doc.ocr_status === 'Completed' ? 'text-emerald-600 dark:text-emerald-400' :
                          doc.ocr_status === 'Processing' ? 'text-blue-500 animate-pulse' : 'text-slate-500'
                        }`}>{doc.ocr_status}</span>
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {doc.extracted_text && (
                        <button
                          onClick={() => {
                            setViewingDocText(doc.extracted_text);
                            setViewingDocName(doc.file_name);
                          }}
                          className="text-[10px] text-gov-gold font-bold hover:underline"
                        >
                          OCR Text
                        </button>
                      )}
                      <a
                        href={`${API_BASE_URL}/api/documents/${doc.id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-gov-navy font-bold hover:underline"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: AI Report Generator */}
          {canWrite && (
            <div className="bg-gov-card border border-gov-border rounded-xl p-5 shadow-sm space-y-3">
              <h3 className="font-serif font-bold text-gov-navy text-base border-b border-gov-border pb-2">
                Executive Report Builder
              </h3>
              <p className="text-[11px] text-gov-muted">
                Instantly compile and index formatted summaries, delay projections, and risk mitigation strategies.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => generateReport('Project Status Report')}
                  className="px-2.5 py-2 border border-gov-border hover:border-gov-navy bg-gov-bg hover:bg-gov-card text-slate-700 dark:text-slate-200 font-bold rounded-lg flex items-center justify-center space-x-1.5"
                >
                  <BookOpen size={12} />
                  <span>Status Summary</span>
                </button>
                <button
                  onClick={() => generateReport('Delay Report')}
                  className="px-2.5 py-2 border border-gov-border hover:border-gov-navy bg-gov-bg hover:bg-gov-card text-slate-700 dark:text-slate-200 font-bold rounded-lg flex items-center justify-center space-x-1.5"
                >
                  <Clock size={12} />
                  <span>Delay Assessment</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* OCR Preview Overlay Modal */}
      {viewingDocText && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gov-card border border-gov-border rounded-2xl p-6 md:p-8 shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between border-b border-gov-border pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold font-serif text-gov-navy">OCR Extracted Document Text</h3>
                <p className="text-[10px] text-slate-400 font-sans mt-0.5">{viewingDocName}</p>
              </div>
              <button
                onClick={() => setViewingDocText(null)}
                className="text-slate-400 hover:text-slate-200 font-bold text-sm"
              >
                ✕
              </button>
            </div>
            
            <div className="bg-gov-bg p-4 border border-gov-border rounded-xl overflow-y-auto flex-1 max-h-[50vh] text-xs font-mono text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed select-text">
              {viewingDocText}
            </div>

            <div className="mt-5 text-right">
              <button
                onClick={() => setViewingDocText(null)}
                className="px-4 py-2 bg-gov-navy hover:bg-gov-navyalt text-white text-xs font-bold rounded-lg"
              >
                Close Text Reader
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ProjectDetails;
