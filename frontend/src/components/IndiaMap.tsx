import React, { useState } from 'react';

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

interface IndiaMapProps {
  data: StateMetric[];
  onSelectState: (stateName: string | null) => void;
  selectedState: string | null;
}

export const IndiaMap: React.FC<IndiaMapProps> = ({ data, onSelectState, selectedState }) => {
  const [hoveredState, setHoveredState] = useState<StateMetric | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Map state names to coordinate locations on our stylized 500x550 SVG map
  const stateCoordinates: Record<string, { x: number; y: number; dx?: number; dy?: number }> = {
    "Jammu and Kashmir": { x: 195, y: 70 },
    "Punjab": { x: 175, y: 130 },
    "Haryana": { x: 195, y: 160 },
    "Delhi": { x: 215, y: 170 },
    "Rajasthan": { x: 135, y: 210 },
    "Gujarat": { x: 90, y: 280 },
    "Madhya Pradesh": { x: 220, y: 290 },
    "Uttar Pradesh": { x: 275, y: 220 },
    "Bihar": { x: 360, y: 230 },
    "West Bengal": { x: 410, y: 290 },
    "Maharashtra": { x: 185, y: 375 },
    "Karnataka": { x: 180, y: 460 },
    "Goa": { x: 145, y: 440 },
    "Kerala": { x: 200, y: 530 },
    "Tamil Nadu": { x: 245, y: 510 },
    "Andhra Pradesh": { x: 245, y: 430 },
    "Telangana": { x: 235, y: 395 },
    "Odisha": { x: 345, y: 340 },
    "Chhattisgarh": { x: 285, y: 330 },
    "Assam": { x: 470, y: 220 },
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left + 15,
      y: e.clientY - rect.top + 15,
    });
  };

  return (
    <div className="bg-gov-card border border-gov-border rounded-xl p-5 shadow-sm relative flex flex-col items-center">
      <div className="w-full flex items-center justify-between border-b border-gov-border pb-3 mb-4">
        <div>
          <h3 className="text-lg font-serif font-bold text-gov-navy flex items-center gap-1.5">
            Geospatial Project Distribution
          </h3>
          <p className="text-xs text-gov-muted">Interactive state-wise progress & risk monitoring</p>
        </div>
        {selectedState && (
          <button
            onClick={() => onSelectState(null)}
            className="text-xs bg-gov-bg hover:bg-gov-card border border-gov-border text-gov-navy font-semibold px-2.5 py-1 rounded"
          >
            Clear State Filter
          </button>
        )}
      </div>

      <div 
        className="relative w-full max-w-[460px] aspect-[9/10] bg-gov-bg rounded-lg border border-gov-border flex items-center justify-center overflow-hidden cursor-crosshair"
        onMouseMove={handleMouseMove}
      >
        {/* Schematic Outline map of India using stylized SVG paths */}
        <svg viewBox="0 0 500 560" className="w-full h-full select-none">
          {/* Main landmass background outline */}
          <path
            d="M 190 40 L 220 50 L 230 75 L 210 110 L 225 140 L 255 145 L 275 125 L 290 145 L 320 180 L 335 180 L 350 205 L 430 200 L 450 180 L 485 200 L 490 230 L 470 250 L 450 240 L 430 265 L 415 260 L 410 280 L 435 300 L 400 340 L 375 350 L 360 380 L 305 470 L 270 520 L 255 550 L 240 550 L 230 520 L 210 500 L 195 530 L 185 510 L 180 470 L 150 440 L 155 405 L 140 390 L 165 350 L 135 320 L 95 315 L 75 300 L 65 280 L 75 250 L 115 255 L 120 220 L 110 180 L 140 150 L 180 145 L 175 110 L 190 40 Z"
            className="fill-slate-200/70 dark:fill-slate-800 stroke-slate-300 dark:stroke-slate-700"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Regional grids / boundaries */}
          <line x1="220" y1="290" x2="185" y2="375" className="stroke-slate-300 dark:stroke-slate-700" strokeDasharray="3,3" />
          <line x1="220" y1="290" x2="275" y2="220" className="stroke-slate-300 dark:stroke-slate-700" strokeDasharray="3,3" />
          <line x1="185" y1="375" x2="180" y2="460" className="stroke-slate-300 dark:stroke-slate-700" strokeDasharray="3,3" />
          <line x1="275" y1="220" x2="360" y2="230" className="stroke-slate-300 dark:stroke-slate-700" strokeDasharray="3,3" />

          {/* Render markers for states that have project metrics */}
          {data.map((stateMetric) => {
            const coord = stateCoordinates[stateMetric.state];
            if (!coord) return null;

            const isSelected = selectedState === stateMetric.state;
            
            // Marker color coding
            let markerColor = "fill-emerald-500 stroke-emerald-100 dark:stroke-emerald-950";
            if (stateMetric.delayed > 2) {
              markerColor = "fill-rose-500 stroke-rose-100 dark:stroke-rose-950";
            } else if (stateMetric.high_risk > 0) {
              markerColor = "fill-amber-500 stroke-amber-100 dark:stroke-amber-950";
            }

            return (
              <g
                key={stateMetric.state}
                className="cursor-pointer group"
                onClick={() => onSelectState(isSelected ? null : stateMetric.state)}
                onMouseEnter={() => setHoveredState(stateMetric)}
                onMouseLeave={() => setHoveredState(null)}
              >
                {/* State outline pulse ring on hover/select */}
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r={isSelected ? 16 : 10}
                  className={`opacity-30 ${
                    isSelected
                      ? 'fill-gov-gold animate-ping'
                      : 'fill-slate-400 dark:fill-slate-600 group-hover:fill-gov-navy group-hover:scale-125 transition-all'
                  }`}
                />
                
                {/* Core Pin Dot */}
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r={isSelected ? 7 : 5}
                  className={`${markerColor} stroke-2 shadow-lg transition-transform`}
                />
                
                {/* Label tag for key states */}
                <text
                  x={coord.x}
                  y={coord.y - 12}
                  textAnchor="middle"
                  className={`text-[9px] font-sans font-bold select-none pointer-events-none fill-slate-700 dark:fill-slate-300 ${
                    isSelected ? 'fill-gov-gold dark:fill-amber-400 font-extrabold text-[10px]' : 'opacity-85'
                  }`}
                >
                  {stateMetric.state.substring(0, 5)}..
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip card */}
        {hoveredState && (
          <div
            className="absolute z-10 bg-slate-900 text-white p-3.5 rounded-lg shadow-xl text-xs pointer-events-none border border-slate-700 min-w-[200px]"
            style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
          >
            <h4 className="font-serif font-bold text-gov-gold border-b border-slate-700 pb-1 mb-1.5 flex justify-between">
              <span>{hoveredState.state}</span>
              <span className="text-[10px] font-sans text-slate-300">MoSPI Sector</span>
            </h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Total Projects:</span>
                <span className="font-semibold">{hoveredState.total_projects}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Completed:</span>
                <span className="font-semibold">{hoveredState.completed}</span>
              </div>
              <div className="flex justify-between text-amber-400">
                <span>Ongoing:</span>
                <span className="font-semibold">{hoveredState.ongoing}</span>
              </div>
              {hoveredState.delayed > 0 && (
                <div className="flex justify-between text-rose-400">
                  <span>Delayed:</span>
                  <span className="font-semibold">{hoveredState.delayed}</span>
                </div>
              )}
              {hoveredState.high_risk > 0 && (
                <div className="flex justify-between text-yellow-300">
                  <span>High Risk:</span>
                  <span className="font-semibold font-bold">⚠️ {hoveredState.high_risk}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-700 pt-1 mt-1 font-sans text-[11px] text-gov-gold">
                <span>Budget Utilized:</span>
                <span className="font-bold">{hoveredState.budget_utilization}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Map Legend */}
      <div className="w-full grid grid-cols-3 gap-2 mt-4 text-[10px] border-t border-gov-border pt-3">
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
          <span className="text-gov-muted font-medium">On Track / Complete</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
          <span className="text-gov-muted font-medium">Medium Risk</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
          <span className="text-gov-muted font-medium">Critical Overdue</span>
        </div>
      </div>
    </div>
  );
};
export default IndiaMap;
