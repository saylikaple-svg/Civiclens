import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { FileText, Upload, Search, Download, Trash2, Eye, Scan, Sparkles, Copy, Check, MessageSquare, AlertCircle } from 'lucide-react';

interface DocumentItem {
  id: number;
  project_id: number;
  file_name: string;
  file_type: string;
  ocr_status: string;
  extracted_text: string | null;
  created_at: string;
}

interface Project {
  id: number;
  project_code: string;
  name: string;
}

export const Documents: React.FC = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search filter
  const [searchTerm, setSearchTerm] = useState('');
  
  // Upload & Scan Form
  const [selectedProjId, setSelectedProjId] = useState<number | ''>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // OCR Modal
  const [viewingDocText, setViewingDocText] = useState<string | null>(null);
  const [viewingDocName, setViewingDocName] = useState('');
  const [viewingDocId, setViewingDocId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchDocsAndProjects = async () => {
    try {
      setLoading(true);
      const [docRes, projRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/documents`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/api/projects`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      
      const docsData = await docRes.json();
      const projsData = await projRes.json();
      
      setDocuments(Array.isArray(docsData) ? docsData : []);
      setProjects(Array.isArray(projsData) ? projsData : []);
    } catch (err) {
      console.error('Error loading documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchDocsAndProjects();
  }, [token]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjId || !selectedFile) {
      setUploadError('Please choose a project and select a document to scan.');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      const formData = new FormData();
      formData.append('project_id', String(selectedProjId));
      formData.append('file', selectedFile);

      const res = await fetch(`${API_BASE_URL}/api/documents/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        setUploadSuccess(`"${selectedFile.name}" submitted for OCR scanning!`);
        setSelectedFile(null);
        setSelectedProjId('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchDocsAndProjects();
        // Trigger auto-refresh after background OCR worker processes text
        setTimeout(fetchDocsAndProjects, 3000);
      } else {
        const errorData = await res.json();
        setUploadError(errorData.detail || 'Upload failed.');
      }
    } catch (err) {
      console.error(err);
      setUploadError('Failed to communicate with OCR parsing service.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: number) => {
    if (!confirm('Are you sure you want to delete this document from intelligence indexing?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/documents/${docId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setDocuments(documents.filter((d) => d.id !== docId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyText = () => {
    if (!viewingDocText) return;
    navigator.clipboard.writeText(viewingDocText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filtered list
  const filteredDocs = documents.filter((doc) =>
    doc.file_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gov-border pb-4">
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-gov-navy leading-none">
          Document Intelligence & OCR Scanner
        </h1>
        <p className="text-xs text-gov-muted mt-1.5 font-sans">
          Upload and scan project DPRs, invoices, tenders, and site inspection sheets for automated AI text recognition
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Document Scanner & Upload Zone */}
        <div className="bg-gov-card border border-gov-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gov-border pb-2.5">
            <h3 className="font-serif font-bold text-gov-navy text-sm flex items-center gap-1.5">
              <Scan size={16} className="text-gov-gold" />
              <span>Document OCR Scanner</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-sans font-semibold">Tesseract / PDF Parser</span>
          </div>

          {uploadError && (
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 p-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 p-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5">
              <Check size={14} className="flex-shrink-0" />
              <span>{uploadSuccess}</span>
            </div>
          )}

          <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs font-sans">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase text-[9px]">
                Target Project / Scheme *
              </label>
              <select
                required
                value={selectedProjId}
                onChange={(e) => setSelectedProjId(e.target.value ? Number(e.target.value) : '')}
                className="w-full border border-gov-border px-3 py-2.5 rounded-lg bg-gov-bg text-slate-800 dark:text-white outline-none focus:border-gov-navy"
              >
                <option value="">Choose Project...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.project_code}] {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Drag and Drop Zone */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase text-[9px]">
                Scannable File Attachment *
              </label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center space-y-2 ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/30'
                    : 'border-gov-border hover:border-gov-navy bg-gov-bg/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.xlsx,.txt,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />

                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Upload size={18} />
                </div>

                {selectedFile ? (
                  <div className="space-y-0.5">
                    <p className="font-bold text-gov-navy truncate max-w-[200px]">{selectedFile.name}</p>
                    <p className="text-[10px] text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB • Click to change</p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-700 dark:text-slate-200">
                      Click to browse or drag file here
                    </p>
                    <p className="text-[10px] text-slate-400">PDF, DOCX, TXT, PNG, JPG (Max 50MB)</p>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading || !selectedProjId || !selectedFile}
              className="w-full py-2.5 bg-gov-navy hover:bg-gov-navyalt text-white font-bold rounded-lg shadow-sm flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Running OCR Engine...</span>
                </>
              ) : (
                <>
                  <Scan size={14} />
                  <span>Scan & Index Document</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Indexed Document Repository Table */}
        <div className="lg:col-span-2 bg-gov-card border border-gov-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gov-border pb-3 gap-3">
            <h3 className="font-serif font-bold text-gov-navy text-sm flex items-center gap-1.5">
              <FileText size={15} className="text-gov-gold" />
              <span>Indexed Document Repository ({filteredDocs.length})</span>
            </h3>
            <div className="relative w-full sm:w-60">
              <input
                type="text"
                placeholder="Search file names..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-gov-bg border border-gov-border rounded-lg text-xs outline-none focus:border-gov-navy text-slate-800 dark:text-white"
              />
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-2">
              <div className="w-8 h-8 border-4 border-gov-navy border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-500">Retrieving indexed file list...</p>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-12 bg-gov-bg rounded-xl text-xs text-slate-500 font-medium">
              No scanned briefs or DPR sheets matching filters. Use the scanner panel on the left to index a file.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left divide-y divide-gov-border bg-gov-card">
                <thead className="bg-gov-bg text-[10px] text-gov-muted font-bold tracking-wider uppercase font-sans border-b border-gov-border">
                  <tr>
                    <th className="px-4 py-3">Document Title</th>
                    <th className="px-4 py-3">Project Link</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">OCR Status</th>
                    <th className="px-4 py-3">Upload Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gov-border text-slate-700 dark:text-slate-200 font-medium">
                  {filteredDocs.map((doc) => {
                    const linkedProj = projects.find((p) => p.id === doc.project_id);
                    return (
                      <tr key={doc.id} className="hover:bg-gov-bg/50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-gov-navy">
                          <div className="flex items-center space-x-1.5 max-w-[200px] truncate">
                            <FileText size={14} className="text-slate-400 flex-shrink-0" />
                            <span className="truncate" title={doc.file_name}>{doc.file_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-sans">
                          {linkedProj ? (
                            <span className="font-bold text-[10px] text-gov-gold">[{linkedProj.project_code}]</span>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-400 font-mono uppercase text-[10px]">{doc.file_type}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase border ${
                            doc.ocr_status === 'Completed' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' :
                            doc.ocr_status === 'Processing' ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 animate-pulse' :
                            'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                          }`}>
                            {doc.ocr_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 font-sans text-[10px]">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end space-x-2.5">
                            {doc.extracted_text && (
                              <button
                                onClick={() => {
                                  setViewingDocText(doc.extracted_text);
                                  setViewingDocName(doc.file_name);
                                  setViewingDocId(doc.id);
                                }}
                                className="text-[10px] text-gov-gold font-bold hover:underline flex items-center gap-0.5"
                                title="Read Extracted Text"
                              >
                                <Eye size={12} />
                                <span>Preview OCR</span>
                              </button>
                            )}
                            <a
                              href={`${API_BASE_URL}/api/documents/${doc.id}/download`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-gov-navy font-bold hover:underline flex items-center gap-0.5"
                            >
                              <Download size={12} />
                              <span>Download</span>
                            </a>
                            <button
                              onClick={() => handleDelete(doc.id)}
                              className="text-slate-400 hover:text-rose-600 font-bold p-1"
                              title="Remove file"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* OCR Text Display Modal */}
      {viewingDocText && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gov-card border border-gov-border rounded-2xl p-6 md:p-8 shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-gov-border pb-3">
              <div>
                <h3 className="text-base font-bold font-serif text-gov-navy flex items-center gap-2">
                  <Sparkles size={16} className="text-gov-gold" />
                  <span>OCR Extracted Intelligence Text</span>
                </h3>
                <p className="text-[10px] text-slate-400 font-sans mt-0.5">{viewingDocName}</p>
              </div>
              <button
                onClick={() => setViewingDocText(null)}
                className="text-slate-400 hover:text-slate-200 font-bold text-sm"
              >
                ✕
              </button>
            </div>
            
            <div className="bg-gov-bg p-4 border border-gov-border rounded-xl overflow-y-auto max-h-[50vh] text-xs font-mono text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed select-text shadow-inner">
              {viewingDocText}
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopyText}
                  className="px-3 py-1.5 border border-gov-border hover:border-gov-navy text-slate-700 dark:text-slate-200 font-bold rounded-lg text-xs flex items-center gap-1.5 bg-gov-card"
                >
                  {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Extracted Text'}</span>
                </button>

                <button
                  onClick={() => {
                    setViewingDocText(null);
                    navigate('/chat');
                  }}
                  className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold rounded-lg text-xs flex items-center gap-1.5 border border-blue-200 dark:border-blue-800"
                >
                  <MessageSquare size={13} />
                  <span>Query with AI Assistant</span>
                </button>
              </div>

              <button
                onClick={() => setViewingDocText(null)}
                className="px-4 py-2 bg-gov-navy hover:bg-gov-navyalt text-white text-xs font-bold rounded-lg"
              >
                Close Reader
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Documents;
