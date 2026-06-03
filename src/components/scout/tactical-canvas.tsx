
"use client"

import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { MousePointer2, Flame, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Point {
  x: number;
  y: number;
}

type Mode = 'position' | 'heatmap';

export function TacticalCanvas() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [mode, setMode] = useState<Mode>('position');
  // Posición inicial: centro del campo
  const [marker, setMarker] = useState<Point>({ x: 200, y: 300 });
  const [heatmapPoints, setHeatmapPoints] = useState<Point[]>([]);

  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    // Coordenadas normalizadas para el viewBox de 400x600
    const x = Math.max(0, Math.min(400, ((clientX - rect.left) / rect.width) * 400));
    const y = Math.max(0, Math.min(600, ((clientY - rect.top) / rect.height) * 600));
    
    if (mode === 'position') {
      setMarker({ x, y });
    } else {
      setHeatmapPoints(prev => [...prev, { x, y }]);
    }
  };

  const clearHeatmap = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHeatmapPoints([]);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-[450px] mx-auto gap-4">
      {/* Controles de Herramientas */}
      <div className="flex gap-2 p-1 bg-secondary/30 rounded-lg border border-border/50">
        <Button
          size="sm"
          variant={mode === 'position' ? 'default' : 'ghost'}
          onClick={() => setMode('position')}
          className="h-8 text-[10px] font-bold uppercase tracking-widest gap-2"
        >
          <MousePointer2 className="h-3 w-3" /> Posición
        </Button>
        <Button
          size="sm"
          variant={mode === 'heatmap' ? 'default' : 'ghost'}
          onClick={() => setMode('heatmap')}
          className="h-8 text-[10px] font-bold uppercase tracking-widest gap-2"
        >
          <Flame className="h-3 w-3" /> Mapa de Calor
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={clearHeatmap}
          className="h-8 text-[10px] font-bold uppercase tracking-widest gap-2 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" /> Limpiar
        </Button>
      </div>

      <div 
        className="relative w-full aspect-[2/3] bg-[#001524] rounded-lg overflow-hidden border-2 border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] touch-none cursor-crosshair"
        onClick={handleInteraction}
      >
        {/* Pitch Lines */}
        <svg 
          ref={svgRef} 
          viewBox="0 0 400 600" 
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          <defs>
            {/* Gradiente para los puntos de calor */}
            <radialGradient id="heatGradient">
              <stop offset="0%" stopColor="#ff0000" stopOpacity="0.6" />
              <stop offset="40%" stopColor="#ffcc00" stopOpacity="0.4" />
              <stop offset="70%" stopColor="#00ff00" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#0000ff" stopOpacity="0" />
            </radialGradient>
            
            {/* Filtro de desenfoque para suavizar el calor */}
            <filter id="blurFilter">
              <feGaussianBlur in="SourceGraphic" stdDeviation="15" />
            </filter>
          </defs>

          {/* Stripes/Grid Effect */}
          <g opacity="0.1">
            {[...Array(20)].map((_, i) => (
              <line key={`v-${i}`} x1={i * 20} y1="0" x2={i * 20} y2="600" stroke="white" strokeWidth="1" />
            ))}
            {[...Array(30)].map((_, i) => (
              <line key={`h-${i}`} x1="0" y1={i * 20} x2="400" y2={i * 20} stroke="white" strokeWidth="1" />
            ))}
          </g>

          {/* Pitch Markings */}
          <rect x="10" y="10" width="380" height="580" fill="none" stroke="white" strokeWidth="1.5" opacity="0.4" />
          <line x1="10" y1="300" x2="390" y2="300" stroke="white" strokeWidth="1.5" opacity="0.4" />
          <circle cx="200" cy="300" r="60" fill="none" stroke="white" strokeWidth="1.5" opacity="0.4" />
          
          {/* Areas */}
          <rect x="80" y="10" width="240" height="100" fill="none" stroke="white" strokeWidth="1.5" opacity="0.4" />
          <rect x="80" y="490" width="240" height="100" fill="none" stroke="white" strokeWidth="1.5" opacity="0.4" />

          {/* Renderizado del Mapa de Calor */}
          <g filter="url(#blurFilter)">
            {heatmapPoints.map((point, index) => (
              <circle 
                key={index} 
                cx={point.x} 
                cy={point.y} 
                r="40" 
                fill="url(#heatGradient)" 
              />
            ))}
          </g>

          {/* Marcador del Jugador */}
          <g transform={`translate(${marker.x}, ${marker.y})`} className="drop-shadow-2xl transition-all duration-300">
            <circle r="18" fill="white" opacity="0.9" />
            <circle r="14" fill="#E0B050" />
            <circle r="14" fill="none" stroke="white" strokeWidth="1" />
            <text 
              y="1" 
              textAnchor="middle" 
              dominantBaseline="middle" 
              fill="white" 
              fontSize="8" 
              fontWeight="bold"
              style={{ userSelect: 'none' }}
            >
              ID
            </text>
          </g>
        </svg>

        {/* Overlay Indicativo del Modo */}
        <div className="absolute top-2 right-2 flex items-center gap-2 pointer-events-none">
          <div className={cn(
            "h-2 w-2 rounded-full animate-pulse",
            mode === 'position' ? "bg-primary" : "bg-red-500"
          )} />
          <span className="text-[9px] font-bold text-white uppercase tracking-tighter opacity-60">
            Modo: {mode === 'position' ? 'Posición' : 'Mapa de Calor'}
          </span>
        </div>
      </div>
      <p className="text-[9px] text-muted-foreground uppercase tracking-widest text-center">
        {mode === 'position' 
          ? "Haz clic para ubicar la posición principal" 
          : "Haz clic repetidamente para pintar las zonas de influencia"}
      </p>
    </div>
  );
}
