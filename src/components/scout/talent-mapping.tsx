"use client"

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { listFolderFiles } from "@/lib/services/storage-service";
import { subscribeToPlayers, subscribeToGlobalPlayers } from "@/lib/services/db-service";
import { Player } from "@/lib/types";
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { Loader2, AlertCircle, Globe, Activity, Database, Plus, Minus, Maximize, Move } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Mapeo de coordenadas ajustado para la imagen oficial
const COUNTRY_COORDINATES: Record<string, { x: number, y: number }> = {
  // Europa
  "España": { x: 485, y: 165 },
  "Portugal": { x: 472, y: 168 },
  "Francia": { x: 495, y: 145 },
  "Reino Unido": { x: 480, y: 125 },
  "Alemania": { x: 508, y: 135 },
  "Italia": { x: 512, y: 160 },
  "Bélgica": { x: 500, y: 138 },
  "Países Bajos": { x: 502, y: 132 },
  "Croacia": { x: 525, y: 158 },
  "Serbia": { x: 535, y: 158 },
  
  // América
  "Canadá": { x: 220, y: 110 },
  "Estados Unidos": { x: 215, y: 175 },
  "México": { x: 205, y: 240 },
  "Colombia": { x: 275, y: 315 },
  "Ecuador": { x: 265, y: 335 },
  "Brasil": { x: 335, y: 360 },
  "Chile": { x: 285, y: 430 },
  "Argentina": { x: 305, y: 430 },
  "Uruguay": { x: 325, y: 425 },

  // África
  "Marruecos": { x: 480, y: 210 },
  "Argelia": { x: 500, y: 210 },
  "Senegal": { x: 465, y: 275 },
  "Costa de Marfil": { x: 485, y: 295 },
  "Nigeria": { x: 505, y: 295 },
  "Camerún": { x: 515, y: 310 },
  "Egipto": { x: 555, y: 230 },

  // Asia y Oceanía
  "Turquía": { x: 565, y: 180 },
  "China": { x: 775, y: 210 },
  "Corea del Sur": { x: 825, y: 205 },
  "Japón": { x: 865, y: 195 },
  "Australia": { x: 850, y: 415 }
};

interface TalentMappingProps {
  global?: boolean;
}

export function TalentMapping({ global = false }: TalentMappingProps) {
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Zoom and Pan State
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const centralPoint = { x: 485, y: 165 }; // Punto focal (España/Europa)

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const files = await listFolderFiles("RECURSOS");
        const mapFile = files.find(f => f.name.toLowerCase() === 'mapamundi.png');
        if (mapFile) setMapUrl(mapFile.url);

        let unsubPlayers = () => {};
        if (global) {
          unsubPlayers = subscribeToGlobalPlayers(setPlayers);
        } else if (userId) {
          unsubPlayers = subscribeToPlayers(userId, setPlayers);
        }

        setLoading(false);
        return () => unsubPlayers();
      } catch (error) {
        console.error("Mapping initialization failed:", error);
        setLoading(false);
      }
    }
    if (userId || global) init();
  }, [userId, global]);

  // Filter players that should be shown on map
  const visiblePlayers = useMemo(() => {
    return players.filter(p => p.showOnMap !== false);
  }, [players]);

  const countryStats = useMemo(() => {
    const stats: Record<string, { count: number, coords: { x: number, y: number } }> = {};
    visiblePlayers.forEach(p => {
      const coords = COUNTRY_COORDINATES[p.nationality];
      if (coords) {
        if (!stats[p.nationality]) {
          stats[p.nationality] = { count: 0, coords };
        }
        stats[p.nationality].count += 1;
      }
    });
    return stats;
  }, [visiblePlayers]);

  const drawConnection = (pos: { x: number, y: number }, key: string) => {
    if (pos.x === centralPoint.x && pos.y === centralPoint.y) return null;
    const midX = (centralPoint.x + pos.x) / 2;
    const midY = (centralPoint.y + pos.y) / 2 - 40;
    return (
      <path 
        key={`line-${key}`}
        d={`M ${centralPoint.x} ${centralPoint.y} Q ${midX} ${midY} ${pos.x} ${pos.y}`}
        fill="none"
        stroke="url(#gradient-flow)"
        strokeWidth="0.8"
        strokeDasharray="4 2"
        className="opacity-30 animate-in fade-in duration-1000"
      />
    );
  };

  // Zoom and Pan Handlers
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => {
    setScale(prev => {
      const newScale = Math.max(prev - 0.5, 1);
      if (newScale === 1) setPosition({ x: 0, y: 0 });
      return newScale;
    });
  };
  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale === 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale === 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Sincronizando Cartografía...</p>
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in duration-1000 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 px-1">
        <div className="flex flex-col gap-2">
          <div className="h-1 w-12 bg-primary rounded-full mb-2" />
          <h1 className="text-4xl font-headline font-black text-foreground uppercase tracking-tight">
            {global ? "Mapeo Global Red" : "Mapa de Talentos"}
          </h1>
          <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest">
            {global ? "Visualización consolidada de la red de captación" : "Tus descubrimientos en el mercado internacional"}
          </p>
        </div>
        
        <div className="flex items-center gap-6 bg-card/40 border border-white/5 p-4 rounded-2xl backdrop-blur-xl">
           <div className="text-center">
              <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Nodos Activos</p>
              <p className="text-xl font-black text-primary">{Object.keys(countryStats).length}</p>
           </div>
           <div className="h-8 w-px bg-white/10" />
           <div className="text-center">
              <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Total Visibles</p>
              <p className="text-xl font-black text-white">{visiblePlayers.length}</p>
           </div>
        </div>
      </div>

      <Card className="border-none bg-transparent overflow-hidden relative min-h-[500px] w-full shadow-[0_0_80px_rgba(0,0,0,0.6)] rounded-[3rem] border border-white/5 ring-1 ring-white/10 group">
        <CardContent 
          className={cn(
            "p-0 h-full relative bg-black/40 flex items-center justify-center overflow-hidden",
            scale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-default"
          )}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Zoom Controls */}
          <div className="absolute bottom-8 right-8 z-50 flex flex-col gap-2">
            <Button 
              size="icon" 
              variant="secondary" 
              className="bg-black/60 border border-white/10 backdrop-blur-md rounded-xl hover:bg-primary hover:text-primary-foreground transition-all"
              onClick={handleZoomIn}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              variant="secondary" 
              className="bg-black/60 border border-white/10 backdrop-blur-md rounded-xl hover:bg-primary hover:text-primary-foreground transition-all"
              onClick={handleZoomOut}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              variant="secondary" 
              className="bg-black/60 border border-white/10 backdrop-blur-md rounded-xl hover:bg-primary hover:text-primary-foreground transition-all"
              onClick={handleResetZoom}
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>

          <div className="absolute top-8 right-8 z-50">
             {scale > 1 && (
               <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 border border-primary/40 rounded-full animate-in fade-in zoom-in-90">
                 <Move className="h-3 w-3 text-primary" />
                 <span className="text-[8px] font-black text-primary uppercase tracking-widest">Arrastra para navegar</span>
               </div>
             )}
          </div>
          
          <div 
            className="relative w-full h-full flex items-center justify-center p-4 transition-transform duration-200 ease-out"
            style={{ 
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              transformOrigin: 'center center'
            }}
          >
            {mapUrl ? (
              <>
                <img 
                  src={mapUrl} 
                  alt="Tactical World Map" 
                  className="w-full h-auto max-h-[85vh] object-contain block opacity-90 select-none pointer-events-none"
                  style={{ filter: 'contrast(1.1) brightness(0.9)' }}
                  loading="eager"
                />

                <svg 
                  viewBox="0 0 1000 500" 
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <defs>
                    <linearGradient id="gradient-flow" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                      <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                    </linearGradient>
                    <radialGradient id="glow-hotspot">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  <g>
                    {Object.entries(countryStats).map(([country, stat]) => drawConnection(stat.coords, country))}
                  </g>

                  {Object.entries(countryStats).map(([country, stat]) => {
                    const size = 6 + (stat.count * 2);
                    return (
                      <g key={`hotspot-${country}`} className="cursor-help pointer-events-auto">
                        <circle 
                          cx={stat.coords.x} 
                          cy={stat.coords.y} 
                          r={size * 2.5} 
                          fill="url(#glow-hotspot)" 
                          className="animate-pulse opacity-40"
                        />
                        <circle 
                          cx={stat.coords.x} 
                          cy={stat.coords.y} 
                          r={size / 2} 
                          fill="hsl(var(--primary))" 
                        />
                        <text 
                          x={stat.coords.x} 
                          y={stat.coords.y - size - 5} 
                          textAnchor="middle" 
                          className="fill-white font-black text-[7px] uppercase tracking-tighter opacity-80"
                        >
                          {country} ({stat.count})
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 text-muted-foreground/40 py-40">
                <AlertCircle className="h-12 w-12" />
                <p className="text-[10px] font-black uppercase tracking-widest italic">Inyectando Inteligencia Geográfica...</p>
              </div>
            )}
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 bg-primary/10 border border-primary/20 backdrop-blur-2xl rounded-full shadow-2xl animate-in slide-in-from-bottom-4 duration-1000">
             <Activity className="h-4 w-4 text-primary animate-pulse" />
             <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Sincronización de Red de Captación Activa</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}