import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { Bot, User, Send, FileText, Database, HelpCircle } from 'lucide-react';

interface Project {
  id: number;
  project_code: string;
  name: string;
}

interface SourceCitation {
  document_id: number;
  document_name: string;
  page: number;
  excerpt: string;
}

interface Message {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  sources?: SourceCitation[];
}

export const DocumentAssistant: React.FC = () => {
  const { token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjId, setSelectedProjId] = useState<number | ''>('');
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'ai',
      text: 'Namaste. I am the CivicLens AI Document Assistant. I can parse tenders, detailed project reports (DPRs), and milestone progress sheets to answer queries with precise citations.',
      timestamp: new Date()
    }
  ]);
  
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    const fetchProjects = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/projects`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setProjects(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProjects();
  }, [token]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;

    const userMessage: Message = {
      id: messages.length + 1,
      sender: 'user',
      text: inputText,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentQuery = inputText;
    setInputText('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          project_id: selectedProjId ? Number(selectedProjId) : null,
          query: currentQuery
        })
      });

      const data = await response.json();

      if (response.ok) {
        const aiMessage: Message = {
          id: messages.length + 2,
          sender: 'ai',
          text: data.answer,
          timestamp: new Date(),
          sources: data.sources
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        const errMessage: Message = {
          id: messages.length + 2,
          sender: 'ai',
          text: 'Failed to retrieve analysis. Verify that documents exist and OCR indexing is complete.',
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, errMessage]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSampleQuery = (query: string) => {
    setInputText(query);
  };

  const sampleQueries = [
    "What are the major risks mentioned in the DPR?",
    "What is the approved budget for this project?",
    "Why was the project delayed?",
    "Summarize this project status."
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gov-border pb-4">
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-gov-navy leading-none">
          AI Document RAG Assistant
        </h1>
        <p className="text-xs text-gov-muted mt-1.5 font-sans">
          Query project documents and tender blueprints semantically with real-time text-chunk retrieval and page citations
        </p>
      </div>

      {/* Main double column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Panel: Query Scope Selector */}
        <div className="bg-gov-card border border-gov-border rounded-xl p-5 shadow-sm space-y-4 text-xs font-sans">
          <h3 className="font-serif font-bold text-gov-navy text-sm border-b border-gov-border pb-2 flex items-center gap-1.5">
            <Database size={14} className="text-gov-gold" />
            <span>Retrieval Scope</span>
          </h3>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 uppercase text-[9px]">Select Project Context</label>
            <select
              value={selectedProjId}
              onChange={(e) => setSelectedProjId(e.target.value ? Number(e.target.value) : '')}
              className="w-full border border-gov-border px-3 py-2.5 rounded-lg bg-gov-bg text-slate-800 dark:text-white outline-none focus:border-gov-navy"
            >
              <option value="">Query Global Database (All Files)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.project_code}] {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="border-t border-gov-border pt-4">
            <h4 className="text-[9px] font-bold text-gov-muted uppercase tracking-wider mb-2 flex items-center gap-1">
              <HelpCircle size={12} />
              <span>Suggested Queries</span>
            </h4>
            <div className="space-y-1.5">
              {sampleQueries.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSampleQuery(q)}
                  className="w-full text-left p-2.5 bg-gov-bg border border-gov-border hover:border-gov-navy text-slate-700 dark:text-slate-200 rounded-lg font-medium leading-normal hover:shadow-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Chat Assistant Area */}
        <div className="lg:col-span-3 bg-gov-card border border-gov-border rounded-xl p-5 shadow-sm flex flex-col h-[65vh]">
          {/* Scrollable conversation */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
            {messages.map((m) => {
              const isAi = m.sender === 'ai';
              return (
                <div key={m.id} className={`flex space-x-3 text-xs font-sans ${isAi ? '' : 'justify-end'}`}>
                  {/* Avatar */}
                  {isAi && (
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-gov-navy flex items-center justify-center text-gov-navy flex-shrink-0">
                      <Bot size={16} />
                    </div>
                  )}

                  {/* Bubble */}
                  <div className={`max-w-[80%] space-y-2`}>
                    <div className={`p-4 rounded-2xl leading-relaxed shadow-sm font-medium ${
                      isAi
                        ? 'bg-gov-bg border border-gov-border text-slate-800 dark:text-slate-100'
                        : 'bg-gov-navy text-white'
                    }`}>
                      {m.text}
                    </div>

                    {/* Sources card list */}
                    {isAi && m.sources && m.sources.length > 0 && (
                      <div className="bg-gov-bg border border-gov-border rounded-xl p-3 space-y-2">
                        <span className="text-[9px] font-bold text-gov-gold tracking-wider uppercase block">
                          Verified Document Sources:
                        </span>
                        <div className="grid grid-cols-1 gap-2">
                          {m.sources.map((s, idx) => (
                            <div key={idx} className="bg-gov-card border border-gov-border p-2 rounded-lg text-[10px]">
                              <div className="flex items-center justify-between font-bold text-gov-navy">
                                <span className="flex items-center gap-1">
                                  <FileText size={10} className="text-slate-400" />
                                  <span>{s.document_name}</span>
                                </span>
                                <span>Page {s.page}</span>
                              </div>
                              {s.excerpt && (
                                <p className="text-[9px] text-slate-500 dark:text-slate-400 italic mt-1 line-clamp-2">
                                  "{s.excerpt}"
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* User avatar */}
                  {!isAi && (
                    <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-gov-gold flex items-center justify-center text-gov-gold flex-shrink-0">
                      <User size={16} />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading bubble */}
            {loading && (
              <div className="flex space-x-3 text-xs font-sans">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-gov-navy flex items-center justify-center text-gov-navy flex-shrink-0 animate-pulse">
                  <Bot size={16} />
                </div>
                <div className="bg-gov-bg border border-gov-border text-slate-500 px-4 py-3 rounded-2xl flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  <span className="text-[10px] ml-1 font-semibold text-slate-400">Retrieving semantical context...</span>
                </div>
              </div>
            )}
          </div>

          {/* Form input */}
          <form onSubmit={handleSendMessage} className="border-t border-gov-border pt-4 flex gap-2">
            <input
              type="text"
              required
              disabled={loading}
              placeholder="Ask a question about project costings, environmental NOC target, steel delays, etc..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 border border-gov-border px-4 py-2.5 rounded-lg text-xs bg-gov-bg outline-none focus:border-gov-navy text-slate-800 dark:text-white transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="px-4 py-2.5 bg-gov-navy hover:bg-gov-navyalt text-white font-bold rounded-lg shadow-sm flex items-center justify-center"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default DocumentAssistant;
