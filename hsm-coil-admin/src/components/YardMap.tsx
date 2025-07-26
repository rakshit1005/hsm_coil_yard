import React from 'react';

interface YardMapProps {
  highlightedCoil: {x: number, y: number} | null;
}

const YardMap = ({ highlightedCoil }: YardMapProps) => {
  return (
    <div className="relative bg-slate-700 rounded-lg overflow-hidden" style={{ height: '300px' }}>
      {/* Yard Layout Grid */}
      <svg className="w-full h-full" viewBox="0 0 400 300">
        {/* Background grid */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#475569" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Yard Sections */}
        <rect x="50" y="50" width="80" height="60" fill="#1e40af" fillOpacity="0.3" stroke="#3b82f6" strokeWidth="2" rx="4"/>
        <text x="90" y="85" textAnchor="middle" className="fill-blue-400 text-xs font-semibold">Yard A</text>
        
        <rect x="150" y="50" width="80" height="60" fill="#059669" fillOpacity="0.3" stroke="#10b981" strokeWidth="2" rx="4"/>
        <text x="190" y="85" textAnchor="middle" className="fill-green-400 text-xs font-semibold">Yard B</text>
        
        <rect x="250" y="50" width="80" height="60" fill="#dc2626" fillOpacity="0.3" stroke="#ef4444" strokeWidth="2" rx="4"/>
        <text x="290" y="85" textAnchor="middle" className="fill-red-400 text-xs font-semibold">Yard C</text>
        
        {/* Gates */}
        <rect x="50" y="150" width="40" height="30" fill="#7c3aed" fillOpacity="0.4" stroke="#8b5cf6" strokeWidth="2" rx="4"/>
        <text x="70" y="170" textAnchor="middle" className="fill-purple-400 text-xs font-semibold">Gate-1</text>
        
        <rect x="120" y="150" width="40" height="30" fill="#7c3aed" fillOpacity="0.4" stroke="#8b5cf6" strokeWidth="2" rx="4"/>
        <text x="140" y="170" textAnchor="middle" className="fill-purple-400 text-xs font-semibold">Gate-2</text>
        
        <rect x="190" y="150" width="40" height="30" fill="#7c3aed" fillOpacity="0.4" stroke="#8b5cf6" strokeWidth="2" rx="4"/>
        <text x="210" y="170" textAnchor="middle" className="fill-purple-400 text-xs font-semibold">Gate-3</text>
        
        {/* Loading Bays */}
        <rect x="270" y="150" width="50" height="30" fill="#ea580c" fillOpacity="0.4" stroke="#f97316" strokeWidth="2" rx="4"/>
        <text x="295" y="170" textAnchor="middle" className="fill-orange-400 text-xs font-semibold">Load A</text>
        
        <rect x="270" y="200" width="50" height="30" fill="#ea580c" fillOpacity="0.4" stroke="#f97316" strokeWidth="2" rx="4"/>
        <text x="295" y="220" textAnchor="middle" className="fill-orange-400 text-xs font-semibold">Load B</text>
        
        {/* Crane paths */}
        <line x1="40" y1="20" x2="360" y2="20" stroke="#64748b" strokeWidth="3" strokeDasharray="5,5"/>
        <text x="200" y="15" textAnchor="middle" className="fill-slate-400 text-xs">Crane Rail</text>
        
        {/* Static coil positions */}
        <circle cx="70" cy="70" r="3" fill="#fbbf24" />
        <circle cx="85" cy="75" r="3" fill="#fbbf24" />
        <circle cx="100" cy="65" r="3" fill="#fbbf24" />
        
        <circle cx="170" cy="80" r="3" fill="#fbbf24" />
        <circle cx="185" cy="70" r="3" fill="#fbbf24" />
        
        <circle cx="270" cy="75" r="3" fill="#fbbf24" />
        <circle cx="285" cy="85" r="3" fill="#fbbf24" />
        <circle cx="300" cy="70" r="3" fill="#fbbf24" />
        <circle cx="315" cy="80" r="3" fill="#fbbf24" />
      </svg>
      
      {/* Highlighted coil dot */}
      {highlightedCoil && (
        <div 
          className="absolute w-4 h-4 bg-red-500 rounded-full animate-ping"
          style={{ 
            left: `${highlightedCoil.x}px`, 
            top: `${highlightedCoil.y}px`,
            transform: 'translate(-50%, -50%)'
          }}
        />
      )}
      
      {/* Legend */}
      <div className="absolute bottom-2 left-2 bg-slate-800/90 rounded px-2 py-1 text-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            <span className="text-yellow-400">Coils</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-400">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YardMap;
