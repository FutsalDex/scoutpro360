
"use client"

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { listFolderFiles } from "@/lib/services/storage-service";
import { subscribeToPlayers, subscribeToGlobalPlayers } from "@/lib/services/db-service";
import { Player } from "@/lib/types";
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { Loader2, AlertCircle, Globe, Activity, Database } from "lucide-react";
import { cn } from "@/lib/utils";

// Mapeo de coordenadas aproximadas para la imagen mapamundi.png (proporción 1000x500)
const COUNTRY_COORDINATES: Record<string, { x: number, y: number }> = {
  "España": { x: 485, y: 165 },
  "Portugal": { x: 472, y: 168 },
  "Francia": { x: 495, y: 148 },
  "Reino Unido": { x: 482, y: 125 },
  "Alemania": { x: 512, y: 138 },
  "Italia": { x: 515, y: 162 },
  "Países Bajos": { x: 505, y: 132 },
  "Bélgica": { x: 500, y: 138 },
  "Brasil": { x: 320, y: 350 },
  "Argentina": { x: 310, y: 430 },
  "Uruguay": { x: 330, y: 425 },
  "Colombia": { x: 285, y: 310 },
  "Chile": { x: 295, y: 420 },
  "Ecuador": { x: 275, y: 325 },
  "México": { x: 200, y: 245 },
  "Estados Unidos": { x: 200, y: 175 },
  "Canadá": { x: 220, y: 120 },
  "Nigeria": { x: 510, y: 300 },
  "Senegal": { x: 465, y: 285 },
  "Camerún": { x: 520, y: 315 },
  "Costa de Marfil": { x: 490, y: 305 },
  "Marruecos": { x: 480, y: 215 },
  "Argelia": { x: 500, y: 215 },
  "Egipto": { x: 565, y: 235 },
  "Japón": { x: 865, y: 195 },
  "Corea del Sur": { x: 835, y: 200 },
  "China": { x: 790, y: 210 },
  "Australia": { x: 855, y: 420 },
  "Turquía": { x: 575, y: 175 },
  "Croacia": { x: 535, y: 155 },
  "Serbia": { x: 545, y: 155 },
  "Bélgica": { x: 502, y: 135 },
};

interface TalentMappingProps {
  global?: boolean;
}

export function TalentMapping({ global = false }: TalentMappingProps) {
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Europa es nuestro punto central de mando para las conexiones
  const centralPoint = { x: 485, y: 165 };

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    async function init() {
      try {
        // 1. Cargar imagen de mapa
        const files = await listFolderFiles("RECURSOS");
        const mapFile = files.find(f => f.name.toLowerCase() === 'mapamundi.png');
        if (mapFile) setMapUrl(mapFile.url);

        // 2. Suscribirse a jugadores
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

  // Agrupar jugadores por país para calcular la intensidad de los hotspots
  const countryStats = useMemo(() => {
    const stats: Record<string, { count: number, coords: { x: number, y: number } }> = {};
    players.forEach(p => {
      const coords = COUNTRY_COORDINATES[p.nationality];
      if (coords) {
        if (!stats[p.nationality]) {
          stats[p.nationality] = { count: 0, coords };
        }
        stats[p.nationality].count += 1;
      }
    });
    return stats;
  }, [players]);

  const drawConnection = (pos: { x: number, y: number }, key: string) => {
    // No dibujar conexión si es el mismo punto central
    if (pos.x === centralPoint.x && pos.y === centralPoint.y) return null;
    
    // Curva Bezier para efecto de arco
    const midX = (centralPoint.x + pos.x) / 2;
    const midY = (centralPoint.y + pos.y) / 2 - 40; // Elevación del arco

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
              <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Total Prospectos</p>
              <p className="text-xl font-black text-white">{players.length}</p>
           </div>
        </div>
      </div>

      <Card className="border-none bg-transparent overflow-hidden relative min-h-[500px] w-full shadow-[0_0_80px_rgba(0,0,0,0.6)] rounded-[3rem] border border-white/5 ring-1 ring-white/10">
        <CardContent className="p-0 h-full relative bg-black/40 flex items-center justify-center overflow-hidden">
          
          {/* Capa 1: Grid Táctico */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

          {mapUrl ? (
            <div className="relative w-full h-full flex items-center justify-center p-4">
              {/* Capa 2: Imagen Mapamundi Base */}
              <img 
                src={mapUrl} 
                alt="Tactical World Map" 
                className="w-full h-auto max-h-[85vh] object-contain block opacity-90 transition-all duration-700"
                style={{ filter: 'contrast(1.1) brightness(0.9)' }}
                loading="eager"
              />

              {/* Capa 3: Capa SVG de Inteligencia (Overlays) */}
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
                  <filter id="blur">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
                  </filter>
                </defs>

                {/* Líneas de conexión */}
                <g>
                  {Object.entries(countryStats).map(([country, stat]) => drawConnection(stat.coords, country))}
                </g>

                {/* Hotspots de Países */}
                {Object.entries(countryStats).map(([country, stat]) => {
                  const size = 6 + (stat.count * 2); // Crece según el número de jugadores
                  return (
                    <g key={`hotspot-${country}`} className="cursor-help pointer-events-auto">
                      {/* Resplandor externo */}
                      <circle 
                        cx={stat.coords.x} 
                        cy={stat.coords.y} 
                        r={size * 2.5} 
                        fill="url(#glow-hotspot)" 
                        className="animate-pulse opacity-40"
                      />
                      {/* Punto núcleo */}
                      <circle 
                        cx={stat.coords.x} 
                        cy={stat.coords.y} 
                        r={size / 2} 
                        fill="hsl(var(--primary))" 
                        className="shadow-2xl"
                      />
                      {/* Etiqueta flotante sutil */}
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
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-muted-foreground/40 py-40">
              <AlertCircle className="h-12 w-12" />
              <p className="text-[10px] font-black uppercase tracking-widest italic">Inyectando Inteligencia Geográfica...</p>
            </div>
          )}

          {/* Cuadro de Estado Flotante Inferior */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 bg-primary/10 border border-primary/20 backdrop-blur-2xl rounded-full shadow-2xl animate-in slide-in-from-bottom-4 duration-1000">
             <Activity className="h-4 w-4 text-primary animate-pulse" />
             <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Sincronización de Red de Captación Activa</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
