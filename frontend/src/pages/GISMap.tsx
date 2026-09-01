import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Map as MapIcon, Layers, Info } from 'lucide-react';
import { IndiaMap } from '../components/IndiaMap';

interface Project {
  id: number;
  project_code: string;
  name: string;
  description: string;
  state: string;
  district: string;
  latitude: number;
  longitude: number;
  budget: number;
  progress: number;
  status: string;
  risk_level: string;
}

interface StateMetric {
  state: string;
  total_projects: number;
  ongoing: number;
  completed: number;
  delayed: number;
  high_risk: number;
  total_budget: number;
  total_spent: number;
  budget_utilization: number;
}

export const GISMap: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  // Active Tab state
  const [activeTab, setActiveTab] = useState<'osm' | 'svg'>('osm');

  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [stateMetrics, setStateMetrics] = useState<StateMetric[]>([]);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);

  // SVG customized pins mapping
  const createMarkerIcon = (status: string, isSelected: boolean = false) => {
    const color = status === 'Completed' ? '#10b981' : status === 'Delayed' ? '#ef4444' : '#f59e0b';
    const size = isSelected ? 32 : 24;
    return L.divIcon({
      html: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
               <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" fill="${color}" stroke="#ffffff" stroke-width="2"/>
               <circle cx="12" cy="9" r="3.5" fill="#ffffff"/>
             </svg>`,
      className: 'custom-leaflet-marker',
      iconSize: [size, size],
      iconAnchor: [size / 2, size],
      popupAnchor: [0, -size]
    });
  };

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch projects
        const projRes = await fetch(`${API_BASE_URL}/api/projects`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const projData = await projRes.json();
        setProjects(projData);
        setFilteredProjects(projData);

        // Fetch state metrics for SVG Map
        const stateRes = await fetch(`${API_BASE_URL}/api/analytics/states`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const stateData = await stateRes.json();
        setStateMetrics(stateData);
      } catch (err) {
        console.error('Error fetching GIS data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Initialize Map
  useEffect(() => {
    if (loading || activeTab !== 'osm' || !mapContainerRef.current) return;

    // Create map if it does not exist
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        attributionControl: false
      }).setView([20.5937, 78.9629], 5); // Center of India
      
      // Load official OpenStreetMap free tiles (No API key required)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(mapRef.current);

      markerGroupRef.current = L.layerGroup().addTo(mapRef.current);
    }

    // Clean up markers
    if (markerGroupRef.current) {
      markerGroupRef.current.clearLayers();
    }

    // Add markers
    filteredProjects.forEach((proj) => {
      if (!proj.latitude || !proj.longitude || !mapRef.current || !markerGroupRef.current) return;

      const marker = L.marker([proj.latitude, proj.longitude], {
        icon: createMarkerIcon(proj.status)
      });

      // Bind detailed popup
      const popupContent = `
        <div class="p-2 font-sans text-xs min-w-[180px]">
          <span class="text-[9px] font-bold text-amber-600 block uppercase">${proj.project_code}</span>
          <h4 class="font-bold text-slate-800 leading-tight mb-1">${proj.name}</h4>
          <div class="space-y-0.5 text-slate-500 mb-2">
            <div>State: <b>${proj.state}</b></div>
            <div>Progress: <b>${proj.progress.toFixed(0)}%</b></div>
            <div>Budget: <b>₹${proj.budget} Cr</b></div>
            <div>Status: <span class="font-bold text-slate-700">${proj.status}</span></div>
          </div>
          <button 
            id="btn-goto-${proj.id}" 
            class="w-full bg-[#1e3a8a] text-white py-1 rounded text-center font-bold font-sans cursor-pointer hover:bg-[#172554]"
          >
            Open Project Ledger
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-goto-${proj.id}`);
        if (btn) {
          btn.onclick = () => {
            navigate(`/projects/${proj.id}`);
          };
        }
      });

      marker.addTo(markerGroupRef.current);
    });

    // Zoom map dynamically to markers if filtered projects change
    if (filteredProjects.length > 0 && mapRef.current) {
      const coordinates = filteredProjects.map(p => L.latLng(p.latitude, p.longitude));
      const bounds = L.latLngBounds(coordinates);
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });
    }
  }, [loading, filteredProjects, activeTab]);

  // Search Location Handler
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setFilteredProjects(projects);
      setSelectedState(null);
      if (mapRef.current && activeTab === 'osm') {
        mapRef.current.setView([20.5937, 78.9629], 5);
      }
      return;
    }

    const query = searchQuery.toLowerCase();
    
    // Filter projects matching State or District/City
    const matches = projects.filter(
      p => p.state.toLowerCase().includes(query) || 
           p.district.toLowerCase().includes(query) ||
           p.name.toLowerCase().includes(query)
    );

    setFilteredProjects(matches);
  };

  const handleZoomToProject = (proj: Project) => {
    if (activeTab === 'osm' && mapRef.current) {
      mapRef.current.setView([proj.latitude, proj.longitude], 10);
    }
  };

  const handleStateSelectFromMap = (stateName: string | null) => {
    setSelectedState(stateName);
    if (!stateName) {
      setFilteredProjects(projects);
    } else {
      const matches = projects.filter(p => p.state.toLowerCase() === stateName.toLowerCase());
      setFilteredProjects(matches);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gov-navy leading-none">
            Geospatial Project Map
          </h1>
          <p className="text-xs text-gov-muted mt-1.5 font-sans">
            Interactive map tracking central sector project distributions overlaying physical coordinates
          </p>
        </div>

        {/* Tab switch buttons */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-gov-border self-start">
          <button
            onClick={() => setActiveTab('osm')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold font-sans transition-all ${
              activeTab === 'osm'
                ? 'bg-gov-navy text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-gov-navy'
            }`}
          >
            <MapIcon size={12} />
            <span>GIS Map View (Dark Mode Only)</span>
          </button>
          <button
            onClick={() => setActiveTab('svg')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold font-sans transition-all ${
              activeTab === 'svg'
                ? 'bg-gov-navy text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-gov-navy'
            }`}
          >
            <Layers size={12} />
            <span>SVG State View</span>
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[70vh]">
        {/* Left Side: Sidebar List and Search */}
        <div className="lg:col-span-4 bg-gov-card border border-gov-border rounded-xl p-5 flex flex-col h-full overflow-hidden shadow-sm">
          {/* Search Box */}
          <form onSubmit={handleSearch} className="mb-4">
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 text-[9px] uppercase tracking-wider font-sans">
              Search State, City or Project Name
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Maharashtra, Bengaluru, Satara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-20 py-2.5 bg-gov-bg border border-gov-border rounded-lg text-xs outline-none focus:border-gov-navy text-slate-800 dark:text-white"
              />
              <Search size={14} className="absolute left-3 top-3.5 text-slate-400" />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 px-3 py-1 bg-gov-navy text-white text-[10px] font-bold rounded"
              >
                Search
              </button>
            </div>
          </form>

          {/* List of projects */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            <div className="flex justify-between items-center text-[10px] font-sans font-bold text-gov-muted uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-1 mb-2">
              <span>Undergoing Projects ({filteredProjects.length})</span>
              {selectedState && (
                <button
                  onClick={() => handleStateSelectFromMap(null)}
                  className="text-amber-700 dark:text-amber-400 normal-case font-bold hover:underline"
                >
                  Clear State Filter
                </button>
              )}
            </div>
            
            {loading ? (
              <div className="text-center py-10 text-xs text-slate-500 font-sans">Loading data...</div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 font-medium">No projects match criteria.</div>
            ) : (
              filteredProjects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleZoomToProject(p)}
                  className="bg-gov-bg border border-gov-border hover:border-gov-navy dark:hover:border-blue-400 p-3 rounded-lg flex items-center justify-between text-xs cursor-pointer hover:shadow-sm transition-all"
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-[9px] font-bold text-slate-400 block">{p.project_code}</span>
                    <h4 className="font-bold text-gov-navy dark:text-blue-300 truncate">{p.name}</h4>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans block">{p.district}, {p.state}</span>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0">
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase border ${
                      p.status === 'Completed' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' :
                      p.status === 'Delayed' ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800' :
                      'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                    }`}>
                      {p.status}
                    </span>
                    {activeTab === 'osm' && (
                      <span className="text-[9px] text-slate-400 mt-1 font-sans">Focus Pin</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Map Canvas tab choices */}
        <div className="lg:col-span-8 h-full rounded-xl overflow-hidden border border-gov-border relative shadow-sm">
          {activeTab === 'osm' ? (
            <div className="w-full h-full relative">
              {loading && (
                <div className="absolute inset-0 z-[1000] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs text-slate-300 font-sans">Rendering OpenStreetMap tiles...</p>
                  </div>
                </div>
              )}
              <div ref={mapContainerRef} className="w-full h-full z-10 bg-slate-900 dark-map"></div>
            </div>
          ) : (
            <div className="w-full h-full bg-gov-card overflow-auto flex flex-col items-center justify-center p-6 min-h-[500px]">
              <div className="text-center mb-2">
                <span className="text-xs text-slate-500 font-bold dark:text-slate-400">Geospatial Project Distribution Map</span>
                <p className="text-[10px] text-slate-400">Click states to filter the list of projects in the sidebar ledger</p>
              </div>
              <IndiaMap 
                data={stateMetrics}
                selectedState={selectedState}
                onSelectState={handleStateSelectFromMap}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default GISMap;
