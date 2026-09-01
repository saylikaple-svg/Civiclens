import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  AlertOctagon,
  Bell,
  Users,
  ShieldCheck,
  LogOut,
  Search,
  MapPin,
  Settings,
  Sun,
  Moon,
  BarChart3,
  X,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [theme, setTheme] = useState<'light' | 'dark'>(
    (localStorage.getItem('civclens_theme') as 'light' | 'dark') || 'light'
  );

  // Global Search State
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchResults, setSearchResults] = useState<{ projects: any[]; documents: any[] }>({ projects: [], documents: [] });
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Check and apply stored theme on mount and changes
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('civclens_theme', theme);
  }, [theme]);

  // Live global search
  useEffect(() => {
    if (!token || !globalSearch.trim()) {
      setSearchResults({ projects: [], documents: [] });
      setShowSearchResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const [projRes, docRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/projects?search=${encodeURIComponent(globalSearch.trim())}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_BASE_URL}/api/documents`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const projs = await projRes.json();
        const docs = await docRes.json();

        const filteredDocs = Array.isArray(docs)
          ? docs.filter((d: any) => d.file_name.toLowerCase().includes(globalSearch.toLowerCase())).slice(0, 3)
          : [];

        setSearchResults({
          projects: Array.isArray(projs) ? projs.slice(0, 5) : [],
          documents: filteredDocs
        });
        setShowSearchResults(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [globalSearch, token]);

  // Click outside to close search popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearch.trim()) return;
    setShowSearchResults(false);
    navigate(`/projects?search=${encodeURIComponent(globalSearch.trim())}`);
  };

  const navItems = [
    { name: 'Overview Dashboard', path: '/', icon: <LayoutDashboard size={18} />, roles: ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'VIEWER'] },
    { name: 'Projects Ledger', path: '/projects', icon: <FolderKanban size={18} />, roles: ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'VIEWER'] },
    { name: 'Analytics', path: '/analytics', icon: <BarChart3 size={18} />, roles: ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'VIEWER'] },
    { name: 'Map', path: '/map', icon: <MapPin size={18} />, roles: ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'VIEWER'] },
    { name: 'OCR Documents', path: '/documents', icon: <FileText size={18} />, roles: ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'VIEWER'] },
    { name: 'AI Document RAG', path: '/chat', icon: <Sparkles size={18} />, roles: ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'VIEWER'] },
    { name: 'Complaints', path: '/reports', icon: <AlertOctagon size={18} />, roles: ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'VIEWER'] },
    { name: 'Critical Alerts', path: '/alerts', icon: <Bell size={18} />, roles: ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'VIEWER'] },
    { name: 'Users & RBAC', path: '/users', icon: <Users size={18} />, roles: ['SUPER_ADMIN'] },
    { name: 'Audit Trail Logs', path: '/audit', icon: <ShieldCheck size={18} />, roles: ['SUPER_ADMIN', 'ADMIN'] },
    { name: 'System Settings', path: '/settings', icon: <Settings size={18} />, roles: ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'VIEWER'] },
  ];

  const filteredNavItems = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <div className="min-h-screen flex flex-col bg-gov-bg">
      {/* Top Navbar matching the official government layout */}
      <header className="bg-gov-card border-b border-gov-border sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center space-x-3">
            <div className="flex flex-col">
              <span className="text-xl font-bold font-serif text-gov-gold leading-none">
                CivicLens
              </span>
              <span className="text-[9px] font-sans font-bold text-gov-navy tracking-widest uppercase mt-0.5">
                INTEGRATED MONITORING PLATFORM
              </span>
            </div>
          </div>

          {/* Center search (Live Interactive Global Search Bar) */}
          <div ref={searchContainerRef} className="relative hidden md:block w-80">
            <form onSubmit={handleSearchSubmit} className="flex items-center bg-gov-bg border border-gov-border rounded-lg px-3 py-1.5 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
              <Search size={16} className="text-slate-400 mr-2 flex-shrink-0" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                onFocus={() => {
                  if (globalSearch.trim()) setShowSearchResults(true);
                }}
                placeholder="Search project codes or documents..."
                className="bg-transparent border-none outline-none text-xs text-slate-700 dark:text-slate-200 w-full placeholder-slate-400"
              />
              {globalSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setGlobalSearch('');
                    setShowSearchResults(false);
                  }}
                  className="text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X size={13} />
                </button>
              )}
            </form>

            {/* Live Search Results Dropdown */}
            {showSearchResults && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-gov-card border border-gov-border rounded-xl shadow-2xl z-50 overflow-hidden text-xs font-sans max-h-96 overflow-y-auto">
                <div className="p-2 border-b border-gov-border bg-gov-bg flex items-center justify-between text-[10px] font-bold text-gov-muted uppercase tracking-wider">
                  <span>Search Matches {isSearching && '...'}</span>
                  <span className="text-[9px] lowercase font-normal">press enter to view all</span>
                </div>

                {searchResults.projects.length === 0 && searchResults.documents.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-xs">
                    No active projects or files found matching &quot;{globalSearch}&quot;
                  </div>
                ) : (
                  <div className="divide-y divide-gov-border">
                    {/* Project Matches */}
                    {searchResults.projects.length > 0 && (
                      <div className="p-2 space-y-1">
                        <span className="text-[9px] font-bold text-gov-gold uppercase tracking-wider px-2 block">
                          Projects ({searchResults.projects.length})
                        </span>
                        {searchResults.projects.map((proj) => (
                          <div
                            key={proj.id}
                            onClick={() => {
                              setShowSearchResults(false);
                              navigate(`/projects/${proj.id}`);
                            }}
                            className="p-2 rounded-lg hover:bg-gov-bg cursor-pointer transition-colors flex items-center justify-between group"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="font-bold text-gov-navy truncate group-hover:text-blue-600">
                                <span className="text-gov-gold font-mono text-[11px] mr-1.5">[{proj.project_code}]</span>
                                <span>{proj.name}</span>
                              </div>
                              <p className="text-[10px] text-slate-400 truncate">
                                {proj.state} • ₹{proj.budget} Cr • {proj.status}
                              </p>
                            </div>
                            <ArrowRight size={13} className="text-slate-400 group-hover:text-blue-600 flex-shrink-0" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Document Matches */}
                    {searchResults.documents.length > 0 && (
                      <div className="p-2 space-y-1 bg-gov-bg/40">
                        <span className="text-[9px] font-bold text-gov-gold uppercase tracking-wider px-2 block">
                          Documents ({searchResults.documents.length})
                        </span>
                        {searchResults.documents.map((doc) => (
                          <div
                            key={doc.id}
                            onClick={() => {
                              setShowSearchResults(false);
                              navigate('/documents');
                            }}
                            className="p-2 rounded-lg hover:bg-gov-bg cursor-pointer transition-colors flex items-center justify-between group"
                          >
                            <div className="min-w-0 pr-2 flex items-center space-x-2">
                              <FileText size={13} className="text-slate-400 flex-shrink-0" />
                              <div className="truncate">
                                <span className="font-bold text-slate-700 dark:text-slate-200 truncate block">
                                  {doc.file_name}
                                </span>
                                <span className="text-[10px] text-slate-400 uppercase font-mono">
                                  {doc.file_type} • OCR: {doc.ocr_status}
                                </span>
                              </div>
                            </div>
                            <ArrowRight size={13} className="text-slate-400 group-hover:text-blue-600 flex-shrink-0" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Profile Info */}
          {user && (
            <div className="flex items-center space-x-4">
              {/* Theme Toggle Button */}
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="text-slate-400 dark:text-slate-300 hover:text-gov-navy dark:hover:text-blue-400 transition-all p-2 rounded-full hover:bg-gov-bg mr-1 flex items-center justify-center"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-gov-navy">{user.name}</p>
                <p className="text-[9px] text-gov-gold font-bold uppercase tracking-wider">
                  {user.role.replace('_', ' ')}
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-gov-navy flex items-center justify-center text-gov-navy font-bold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-rose-600 transition-colors p-1.5"
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
        {/* Specific Gradient Bar underneath navigation - matching screenshot perfectly! */}
        <div className="h-1 bg-gradient-to-r from-[#1d4ed8] via-[#eab308] to-[#10b981] w-full"></div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex-1 flex flex-col md:flex-row py-6 gap-6">
        {/* Sidebar Panel */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-gov-card border border-gov-border rounded-xl p-4 shadow-sm sticky top-24 space-y-1">
            <div className="text-[10px] text-gov-muted font-bold tracking-widest uppercase px-3 mb-2 font-sans border-b border-gov-border pb-1">
              Command Modules
            </div>
            <nav className="space-y-1">
              {filteredNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold font-sans transition-all ${
                      isActive
                        ? 'bg-gov-lightgold text-gov-navy border-l-4 border-gov-gold shadow-sm font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-gov-bg hover:text-gov-navy'
                    }`}
                  >
                    <span className={isActive ? 'text-gov-navy' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Content Viewport */}
        <main className="flex-1 min-w-0 bg-gov-card border border-gov-border rounded-xl p-6 shadow-sm">
          {children}
        </main>
      </div>
    </div>
  );
};
export default Layout;
