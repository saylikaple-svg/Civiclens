import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ExternalLink, Layers, RefreshCw } from 'lucide-react';

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

interface DashboardMapProps {
  projects: Project[];
  selectedState: string | null;
  onSelectState: (state: string | null) => void;
}

export const DashboardMap: React.FC<DashboardMapProps> = ({
  projects,
  selectedState,
  onSelectState
}) => {
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);

  // SVG customized pins mapping matching screenshot 2
  const createMarkerIcon = (status: string, isSelected: boolean = false) => {
    const color =
      status === 'Completed' ? '#10b981' : status === 'Delayed' ? '#ef4444' : '#f59e0b';
    const size = isSelected ? 32 : 24;
    return L.divIcon({
      html: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
               <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" fill="${color}" stroke="#ffffff" stroke-width="2"/>
               <circle cx="12" cy="9" r="3.5" fill="#ffffff"/>
             </svg>`,
      className: 'custom-leaflet-marker transition-transform hover:scale-125',
      iconSize: [size, size],
      iconAnchor: [size / 2, size],
      popupAnchor: [0, -size]
    });
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        attributionControl: false,
        zoomControl: true,
        scrollWheelZoom: true
      }).setView([22.5, 79.5], 4.5); // Centered across India

      // Free, fast OpenStreetMap tile provider
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(mapRef.current);

      markerGroupRef.current = L.layerGroup().addTo(mapRef.current);
    }

    return () => {
      // Cleanup on unmount
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Markers
  useEffect(() => {
    if (!mapRef.current || !markerGroupRef.current) return;

    markerGroupRef.current.clearLayers();

    projects.forEach((proj) => {
      if (!proj.latitude || !proj.longitude) return;

      const isSelected = selectedState === proj.state;
      const icon = createMarkerIcon(proj.status, isSelected);

      const marker = L.marker([proj.latitude, proj.longitude], { icon });

      // Custom HTML Popup Card
      const popupHtml = document.createElement('div');
      popupHtml.className = 'p-1 font-sans text-xs space-y-1.5 min-w-[210px] text-slate-800 dark:text-slate-100';
      popupHtml.innerHTML = `
        <div class="border-b border-slate-200 dark:border-slate-700 pb-1.5">
          <span class="text-[9px] font-bold font-mono text-amber-600 dark:text-amber-400 block uppercase">[${proj.project_code}]</span>
          <h4 class="font-bold text-slate-900 dark:text-white text-xs leading-tight mt-0.5">${proj.name}</h4>
          <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">${proj.state} ${proj.district ? '• ' + proj.district : ''}</p>
        </div>
        <div class="grid grid-cols-2 gap-1.5 py-1 text-[10px]">
          <div>
            <span class="text-slate-400 block text-[9px] uppercase">Budget</span>
            <span class="font-bold font-serif text-slate-800 dark:text-slate-200">₹${proj.budget} Cr</span>
          </div>
          <div>
            <span class="text-slate-400 block text-[9px] uppercase">Status</span>
            <span class="font-bold ${
              proj.status === 'Completed' ? 'text-emerald-500' : proj.status === 'Delayed' ? 'text-rose-500' : 'text-amber-500'
            }">${proj.status}</span>
          </div>
        </div>
        <button id="view-proj-${proj.id}" class="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-[10px] flex items-center justify-center space-x-1 shadow-sm mt-1">
          <span>Open Project Dossier</span>
        </button>
      `;

      popupHtml.querySelector(`#view-proj-${proj.id}`)?.addEventListener('click', (e) => {
        e.stopPropagation();
        navigate(`/projects/${proj.id}`);
      });

      marker.bindPopup(popupHtml, {
        className: 'custom-gov-popup'
      });

      marker.on('click', () => {
        onSelectState(proj.state);
      });

      markerGroupRef.current?.addLayer(marker);
    });
  }, [projects, selectedState, navigate, onSelectState]);

  // Center map on state when selected
  useEffect(() => {
    if (!mapRef.current || !selectedState) return;

    const stateProjects = projects.filter((p) => p.state === selectedState && p.latitude && p.longitude);
    if (stateProjects.length > 0) {
      const avgLat = stateProjects.reduce((sum, p) => sum + p.latitude, 0) / stateProjects.length;
      const avgLng = stateProjects.reduce((sum, p) => sum + p.longitude, 0) / stateProjects.length;
      mapRef.current.setView([avgLat, avgLng], 6, { animate: true });
    }
  }, [selectedState, projects]);

  const handleResetView = () => {
    onSelectState(null);
    if (mapRef.current) {
      mapRef.current.setView([22.5, 79.5], 4.5, { animate: true });
    }
  };

  return (
    <div className="bg-gov-card border border-gov-border rounded-xl p-4 shadow-sm space-y-3 font-sans relative">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gov-border pb-2.5">
        <div className="flex items-center space-x-2">
          <Layers size={16} className="text-gov-gold" />
          <h3 className="font-serif font-bold text-gov-navy text-sm">
            National GIS Infrastructure Map (OSM)
          </h3>
          <span className="text-[10px] text-slate-400 font-sans">({projects.length} Geo-tagged Sites)</span>
        </div>

        <div className="flex items-center space-x-2">
          {selectedState && (
            <button
              onClick={handleResetView}
              className="text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-gov-navy px-2 py-1 bg-gov-bg border border-gov-border rounded flex items-center gap-1"
            >
              <RefreshCw size={10} />
              <span>Reset State Focus</span>
            </button>
          )}

          {/* Map Pin Legend */}
          <div className="flex items-center space-x-2.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              <span>Completed</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
              <span>Ongoing</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
              <span>Delayed</span>
            </span>
          </div>
        </div>
      </div>

      {/* Leaflet Map DOM Canvas */}
      <div className="relative w-full h-[460px] rounded-xl overflow-hidden border border-gov-border shadow-inner">
        <div
          ref={mapContainerRef}
          className="w-full h-full dark-map"
          style={{ minHeight: '460px', zIndex: 1 }}
        />

        {selectedState && (
          <div className="absolute top-3 right-3 z-[400] bg-slate-900/90 backdrop-blur-md text-white border border-slate-700 px-3 py-1.5 rounded-lg shadow-xl text-xs flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-gov-gold animate-pulse"></span>
            <span className="font-bold">Filtering: {selectedState}</span>
            <button
              onClick={handleResetView}
              className="text-slate-400 hover:text-white font-bold ml-1 text-xs"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
export default DashboardMap;
