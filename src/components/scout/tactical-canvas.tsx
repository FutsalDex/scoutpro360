
"use client"

import React, { useRef, useState } from 'react';

interface Point {
  x: number;
  y: number;
}

export function TacticalCanvas() {
  const svgRef = useRef<SVGSVGElement>(null);
  // Posición inicial: centro del campo
  const [marker, setMarker] = useState<Point>({ x: 200, y: 300 });

  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    // Coordenadas normalizadas para el viewBox de 400x600
    const x = Math.max(10, Math.min(390, ((clientX - rect.left) / rect.width) * 400));
    const y = Math.max(10, Math.min(590, ((clientY - rect.top) / rect.height) * 600));
    setMarker({ x, y });
  };

  return (
    <div className="flex flex-col items-center w-full max-w-[400px] mx-auto">
      <div 
        className="relative w-full aspect-[2/3] bg-[#2E7D32] rounded-lg overflow-hidden border-2 border-white/40 shadow-2xl touch-none cursor-crosshair"
        onClick={handleInteraction}
      >
        {/* Pitch Lines */}
        <svg 
          ref={svgRef} 
          viewBox="0 0 400 600" 
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {/* Stripes for grass effect */}
          {[...Array(10)].map((_, i) => (
            <rect key={i} x="0" y={i * 60} width="400" height="30" fill="white" opacity="0.05" />
          ))}

          {/* Outer line */}
          <rect x="10" y="10" width="380" height="580" fill="none" stroke="white" strokeWidth="2" />
          
          {/* Halfway line */}
          <line x1="10" y1="300" x2="390" y2="300" stroke="white" strokeWidth="2" />
          <circle cx="200" cy="300" r="60" fill="none" stroke="white" strokeWidth="2" />
          <circle cx="200" cy="300" r="3" fill="white" />

          {/* Top Penalty Area */}
          <rect x="80" y="10" width="240" height="100" fill="none" stroke="white" strokeWidth="2" />
          <rect x="140" y="10" width="120" height="40" fill="none" stroke="white" strokeWidth="2" />
          <path d="M 140 110 A 90 90 0 0 0 260 110" fill="none" stroke="white" strokeWidth="2" />
          <circle cx="200" cy="75" r="2.5" fill="white" />

          {/* Bottom Penalty Area */}
          <rect x="80" y="490" width="240" height="100" fill="none" stroke="white" strokeWidth="2" />
          <rect x="140" y="550" width="120" height="40" fill="none" stroke="white" strokeWidth="2" />
          <path d="M 140 490 A 90 90 0 0 1 260 490" fill="none" stroke="white" strokeWidth="2" />
          <circle cx="200" cy="525" r="2.5" fill="white" />

          {/* Corners */}
          <circle cx="10" cy="10" r="15" fill="none" stroke="white" strokeWidth="2" />
          <circle cx="390" cy="10" r="15" fill="none" stroke="white" strokeWidth="2" />
          <circle cx="10" cy="590" r="15" fill="none" stroke="white" strokeWidth="2" />
          <circle cx="390" cy="590" r="15" fill="none" stroke="white" strokeWidth="2" />

          {/* The Marker */}
          <g transform={`translate(${marker.x}, ${marker.y})`} className="drop-shadow-xl transition-all duration-300">
            <circle r="15" fill="white" />
            <circle r="12" fill="#E0B050" />
            <circle r="12" fill="none" stroke="white" strokeWidth="1" />
          </g>
        </svg>
      </div>
    </div>
  );
}
