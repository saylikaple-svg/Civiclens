import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { AlertOctagon, AlertTriangle, Send, CheckCircle2, Clock, User, Check, ShieldAlert, FileWarning, MessageSquare } from 'lucide-react';

interface ComplaintItem {
  id: number;
  project_id: number | null;
  project_code: string | null;
  project_name: string | null;
  user_id: number;
  user_name: string;
  feedback_type: string;
  category: string;
  title: string | null;
  query_text: string;
  priority: string;
  contact_email: string | null;
  response_text: string | null;
  status: string;
  created_at: string;
}

interface Project {
  id: number;
  project_code: string;
  name: string;
}

export const Reports: React.FC = () => {
  const { token, user, hasPermission } = useAuth();

  // Tab State
  const [activeTab, setActiveTab] = useState<'complaint' | 'data_issue'>('complaint');

  // Form States
  const [complaintType, setComplaintType] = useState('Project Delay & Stalling');
  const [category, setCategory] = useState('Roads & Highways');
  const [selectedProjId, setSelectedProjId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('High');
  const [contactEmail, setContactEmail] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Data List State
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin Reply State
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  // Adjust default complaint type when switching tabs
  useEffect(() => {
    if (activeTab === 'complaint') {
      setComplaintType('Project Delay & Stalling');
    } else {
      setComplaintType('Report Data / Milestone Discrepancy');
    }
  }, [activeTab]);

  const fetchComplaintsAndProjects = async () => {
    try {
      setLoading(true);
      const [fbRes, projRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/feedback`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/api/projects`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const fbData = await fbRes.json();
      const projData = await projRes.json();

      setComplaints(Array.isArray(fbData) ? fbData : []);
      setProjects(Array.isArray(projData) ? projData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchComplaintsAndProjects();
    if (user?.email) {
      setContactEmail(user.email);
    }
  }, [token, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !title.trim()) return;

    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          project_id: selectedProjId ? Number(selectedProjId) : null,
          feedback_type: complaintType,
          category: category,
          title: title,
          query_text: description,
          priority: priority,
          contact_email: contactEmail || user?.email
        })
      });

      if (res.ok) {
        setSubmitSuccess('Official grievance ticket logged successfully! An investigation reference has been generated.');
        setTitle('');
        setDescription('');
        setSelectedProjId('');
        fetchComplaintsAndProjects();
        setTimeout(() => setSubmitSuccess(''), 5000);
      } else {
        const errorData = await res.json();
        setSubmitError(errorData.detail || 'Failed to file grievance.');
      }
    } catch (err) {
      console.error(err);
      setSubmitError('Failed to communicate with grievance registry service.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent, complaintId: number) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setReplying(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/feedback/${complaintId}/reply`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          response_text: replyText
        })
      });

      if (res.ok) {
        setReplyText('');
        setActiveReplyId(null);
        fetchComplaintsAndProjects();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReplying(false);
    }
  };

  const canReply = hasPermission(['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Tab Selectors */}
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => setActiveTab('complaint')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'complaint'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-gov-card border border-gov-border text-slate-600 dark:text-slate-300 hover:border-gov-navy'
          }`}
        >
          <AlertOctagon size={14} />
          <span>Register Project Grievance</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('data_issue')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'data_issue'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-gov-card border border-gov-border text-slate-600 dark:text-slate-300 hover:border-gov-navy'
          }`}
        >
          <AlertTriangle size={14} />
          <span>Report Data Discrepancy</span>
        </button>
      </div>

      {/* Main Complaint Form Card */}
      <div className="bg-gov-card border border-gov-border rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl md:text-2xl font-serif font-bold text-gov-navy leading-none flex items-center gap-2">
            <ShieldAlert size={22} className="text-rose-600" />
            <span>{activeTab === 'complaint' ? 'File Official Complaint / Grievance' : 'Report Project Data Discrepancy'}</span>
          </h2>
          <p className="text-xs text-gov-muted mt-2 font-sans">
            Report project execution delays, contractor defaults, financial discrepancies, quality defects, or clearance issues to official monitoring authorities.
          </p>
        </div>

        {submitError && (
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 p-3 rounded-lg text-xs font-semibold flex items-center space-x-2">
            <AlertTriangle size={16} className="flex-shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {submitSuccess && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 p-3 rounded-lg text-xs font-semibold flex items-center space-x-2">
            <Check size={16} className="flex-shrink-0" />
            <span>{submitSuccess}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-xs font-sans">
          {/* Row 1: Complaint Type & Grievance Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase text-[9px]">
                Complaint / Issue Type *
              </label>
              <select
                value={complaintType}
                onChange={(e) => setComplaintType(e.target.value)}
                className="w-full border border-gov-border px-3.5 py-2.5 rounded-lg bg-gov-bg text-slate-800 dark:text-white outline-none focus:border-gov-navy"
              >
                {activeTab === 'complaint' ? (
                  <>
                    <option value="Project Delay & Stalling">Project Delay & Timeline Stalling</option>
                    <option value="Fund Misappropriation / Audit Alert">Fund Misappropriation / Audit Alert</option>
                    <option value="Poor Quality / Defective Workmanship">Poor Quality / Defective Construction</option>
                    <option value="Contractor Abandonment / Default">Contractor Abandonment / Default</option>
                    <option value="Environmental & Land Clearance Dispute">Environmental & Land Clearance Dispute</option>
                    <option value="Public Access & Safety Hazard">Public Access & Safety Hazard</option>
                  </>
                ) : (
                  <>
                    <option value="Budget Figure Error">Approved Budget Figure Error</option>
                    <option value="Milestone Timeline Discrepancy">Milestone Timeline Discrepancy</option>
                    <option value="Expenditure Inaccuracy">Expenditure Inaccuracy</option>
                    <option value="GIS Coordinate Mismatch">GIS Coordinate Mismatch</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase text-[9px]">
                Grievance Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gov-border px-3.5 py-2.5 rounded-lg bg-gov-bg text-slate-800 dark:text-white outline-none focus:border-gov-navy"
              >
                <option value="Roads & Highways">Roads & Highways (MoRTH)</option>
                <option value="Railways">Railways (MoR)</option>
                <option value="Housing & Urban Affairs">Housing & Urban Affairs (MoHUA)</option>
                <option value="Renewable Energy">Renewable Energy (MNRE)</option>
                <option value="Power & Grid">Power & Grid (MoP)</option>
                <option value="Telecommunications">Telecommunications (DoT)</option>
                <option value="Citizen & Public Grievance">Citizen & Public Grievance</option>
              </select>
            </div>
          </div>

          {/* Project Link Context */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase text-[9px]">
              Associate Specific Project / Scheme {activeTab === 'data_issue' ? '*' : '(Optional)'}
            </label>
            <select
              required={activeTab === 'data_issue'}
              value={selectedProjId}
              onChange={(e) => setSelectedProjId(e.target.value ? Number(e.target.value) : '')}
              className="w-full border border-gov-border px-3.5 py-2.5 rounded-lg bg-gov-bg text-slate-800 dark:text-white outline-none focus:border-gov-navy"
            >
              <option value="">Choose Project Link (Optional for general concerns)...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.project_code}] {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Row 2: Complaint Title / Subject */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase text-[9px]">
              Complaint Title / Subject *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Inordinate 6-month delay in bridge pier casting at Sector 4"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gov-border px-3.5 py-2.5 rounded-lg bg-gov-bg text-slate-800 dark:text-white outline-none focus:border-gov-navy placeholder-slate-400"
            />
          </div>

          {/* Row 3: Detailed Grievance Description */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase text-[9px]">
                Detailed Grievance Description & Facts *
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {description.length}/1000
              </span>
            </div>
            <textarea
              required
              maxLength={1000}
              placeholder="Provide exact facts, location, date of observation, contractor details, and specific issues noticed..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full border border-gov-border p-3.5 rounded-lg bg-gov-bg text-slate-800 dark:text-white outline-none focus:border-gov-navy placeholder-slate-400 resize-none leading-relaxed"
            />
          </div>

          {/* Row 4: Urgency / Priority & Contact Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase text-[9px]">
                Urgency / Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full border border-gov-border px-3.5 py-2.5 rounded-lg bg-gov-bg text-slate-800 dark:text-white outline-none focus:border-gov-navy"
              >
                <option value="Normal">Normal</option>
                <option value="Medium">Medium</option>
                <option value="High">High (Urgent Attention)</option>
                <option value="Critical">Critical Emergency</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase text-[9px]">
                Complainant Contact Email
              </label>
              <input
                type="email"
                placeholder="your.email@example.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full border border-gov-border px-3.5 py-2.5 rounded-lg bg-gov-bg text-slate-800 dark:text-white outline-none focus:border-gov-navy placeholder-slate-400"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || !title.trim() || !description.trim()}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-sm transition-all flex items-center space-x-2"
            >
              <Send size={14} />
              <span>{submitting ? 'Submitting Grievance Ticket...' : 'File Official Grievance'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Grievance Tracking Registry */}
      <div className="bg-gov-card border border-gov-border rounded-xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gov-border pb-3">
          <h3 className="font-serif font-bold text-gov-navy text-lg flex items-center gap-2">
            <FileWarning size={18} className="text-gov-gold" />
            <span>Grievance Registry & Resolution Directives ({complaints.length})</span>
          </h3>
          <span className="text-[10px] text-slate-400 font-sans">Official Investigation Ledger</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-2">
            <div className="w-8 h-8 border-4 border-gov-navy border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500">Retrieving grievance records...</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-10 bg-gov-bg rounded-xl text-xs text-slate-500 font-medium">
            No complaints or grievances logged in the registry.
          </div>
        ) : (
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
            {complaints.map((item) => (
              <div
                key={item.id}
                className={`border border-gov-border rounded-xl p-4.5 space-y-3 font-sans text-xs bg-gov-bg hover:shadow-sm transition-all ${
                  item.status === 'Pending' ? 'border-l-4 border-l-rose-500' : 'border-l-4 border-l-emerald-500'
                }`}
              >
                {/* Meta header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 uppercase">
                        {item.feedback_type}
                      </span>
                      <span className="text-[10px] text-gov-muted font-semibold">
                        Sector: {item.category}
                      </span>
                      {item.project_code && (
                        <span className="text-[9px] font-bold text-gov-gold uppercase tracking-wider">
                          [{item.project_code}]
                        </span>
                      )}
                    </div>
                    {item.title && (
                      <h4 className="font-bold text-gov-navy text-sm mt-1">{item.title}</h4>
                    )}
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-1">
                      <User size={11} />
                      <span className="font-bold text-slate-500 dark:text-slate-400">{item.user_name}</span>
                      <span>•</span>
                      <Clock size={11} />
                      <span>{new Date(item.created_at).toLocaleString()}</span>
                      <span>•</span>
                      <span className="font-mono text-[9px] text-slate-400">Ref #CMP-{String(item.id).padStart(4, '0')}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                      item.priority === 'Critical' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300' :
                      item.priority === 'High' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {item.priority} Urgency
                    </span>
                    <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded border uppercase ${
                      item.status === 'Answered'
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                    }`}>
                      {item.status === 'Answered' ? 'Directive Issued' : 'Under Investigation'}
                    </span>
                  </div>
                </div>

                {/* Grievance Statement */}
                <div className="bg-gov-card p-3.5 rounded-lg border border-gov-border">
                  <span className="text-[9px] font-bold uppercase text-gov-gold block mb-1">Grievance Statement:</span>
                  <p className="text-slate-700 dark:text-slate-200 font-medium leading-relaxed select-text">{item.query_text}</p>
                </div>

                {/* Response / Official Directive */}
                {item.response_text ? (
                  <div className="bg-blue-50/30 dark:bg-blue-950/20 p-3.5 rounded-lg border border-blue-200 dark:border-blue-900/40 pl-4 relative">
                    <span className="absolute left-0 top-0 bottom-0 w-1 bg-gov-navy rounded-l"></span>
                    <span className="font-bold text-gov-navy uppercase text-[9px] block mb-1 flex items-center gap-1">
                      <CheckCircle2 size={11} className="text-emerald-600 dark:text-emerald-400" />
                      <span>Official Investigation Findings & Directive:</span>
                    </span>
                    <p className="text-slate-800 dark:text-slate-100 font-semibold leading-relaxed select-text">{item.response_text}</p>
                  </div>
                ) : (
                  canReply && (
                    <div>
                      {activeReplyId === item.id ? (
                        <form onSubmit={(e) => handleReplySubmit(e, item.id)} className="space-y-2 mt-2">
                          <textarea
                            required
                            placeholder="Issue official administrative finding, inspection order, or resolution directive..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="w-full border border-gov-border p-2 rounded-lg text-xs outline-none focus:border-gov-navy resize-none h-16 bg-gov-card text-slate-800 dark:text-white"
                          />
                          <div className="flex justify-end space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveReplyId(null);
                                setReplyText('');
                              }}
                              className="px-3 py-1 border border-gov-border text-slate-600 dark:text-slate-300 rounded text-[11px]"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={replying}
                              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-[11px]"
                            >
                              {replying ? 'Recording...' : 'Issue Official Directive'}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button
                          onClick={() => {
                            setActiveReplyId(item.id);
                            setReplyText('');
                          }}
                          className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
                        >
                          <MessageSquare size={12} />
                          <span>Issue Official Resolution Directive</span>
                        </button>
                      )}
                    </div>
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default Reports;
