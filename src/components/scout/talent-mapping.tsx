"use client"

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Loader2, Crosshair, Users, User, Activity } from "lucide-react";
import { useTranslation } from '@/lib/i18n/context';
import { subscribeToGlobalPlayers, subscribeToPlayers } from "@/lib/services/db-service";
import { Player } from "@/lib/types";
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { cn } from "@/lib/utils";
import Image from "next/image";
import placeholderData from '@/app/lib/placeholder-images.json';

// Coordenadas geográficas realistas normalizadas para el SVG 1000x500 sobre la imagen de fondo
const COUNTRY_COORDS: Record<string, { x: number, y: number }> = {
  "España": { x: 485, y: 165 },
  "Argentina": { x: 315, y: 430 },
  "Brasil": { x: 360, y: 350 },
  "Portugal": { x: 475, y: 170 },
  "Francia": { x: 495, y: 145 },
  "Italia": { x: 512, y: 165 },
  "Alemania": { x: 510, y: 135 },
  "Reino Unido": { x: 482, y: 125 },
  "México": { x: 210, y: 245 },
  "Colombia": { x: 285, y: 315 },
  "Uruguay": { x: 335, y: 430 },
  "Chile": { x: 295, y: 430 },
  "Ecuador": { x: 270, y: 335 },
  "Perú": { x: 280, y: 365 },
  "Bélgica": { x: 500, y: 140 },
  "Países Bajos": { x: 500, y: 135 },
  "Egipto": { x: 565, y: 225 },
  "Marruecos": { x: 485, y: 215 },
  "Nigeria": { x: 515, y: 295 },
  "Japón": { x: 885, y: 195 },
  "Australia": { x: 855, y: 425 },
  "Estados Unidos": { x: 210, y: 175 },
  "Canadá": { x: 195, y: 115 },
  "Rusia": { x: 695, y: 115 },
  "China": { x: 775, y: 205 },
  "India": { x: 705, y: 265 },
  "Sudáfrica": { x: 545, y: 425 },
  "Noruega": { x: 505, y: 85 },
  "Suecia": { x: 525, y: 90 },
};

interface TalentMappingProps {
  global?: boolean;
}

export function TalentMapping({ global = false }: TalentMappingProps) {
  const { t } = useTranslation();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Obtenemos la URL del JSON de recursos
  const mapImage = placeholderData.placeholderImages.find(img => img.id === 'map-background')?.imageUrl || "";

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (global) {
      const unsub = subscribeToGlobalPlayers((data) => {
        setPlayers(data);
        setLoading(false);
      });
      return () => unsub();
    } else if (userId) {
      const unsub = subscribeToPlayers(userId, (data) => {
        setPlayers(data);
        setLoading(false);
      });
      return () => unsub();
    }
  }, [global, userId]);

  const statsByCountry = players.reduce((acc, player) => {
    const country = player.nationality || 'Unknown';
    if (!acc[country]) {
      acc[country] = { count: 0 };
    }
    acc[country].count += 1;
    return acc;
  }, {} as Record<string, { count: number }>);

  const drawConnection = (pos: {x: number, y: number}, countryName: string) => {
    const centralPoint = { x: 485, y: 165 }; // Sede central (Europa)
    if (Math.abs(pos.x - centralPoint.x) < 10 && Math.abs(pos.y - centralPoint.y) < 10) return null;

    return (
      <path 
        key={`conn-${countryName}`}
        d={`M ${centralPoint.x} ${centralPoint.y} Q ${(centralPoint.x + pos.x)/2} ${(centralPoint.y + pos.y)/2 - 120} ${pos.x} ${pos.y}`}
        fill="none"
        stroke="url(#gradient-line)"
        strokeWidth="1.5"
        strokeDasharray="5,5"
        className="opacity-60"
      />
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
        <div className="h-16 w-16 rounded-2xl border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">Iniciando Nodo Geográfico...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-headline font-black text-foreground uppercase tracking-tight">
            {global ? "Geopolítica del Talento" : "Mi Red de Captación"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {global 
              ? "Patrimonio total de inteligencia de la organización." 
              : "Visión geográfica de tu cartera de prospectos identificados."}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] font-black py-2 px-5 tracking-widest uppercase flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            {global ? "INTELIGENCIA GLOBAL" : "NODO PERSONAL"}
          </Badge>
        </div>
      </div>

      <Card className="border-border/40 bg-card/40 backdrop-blur-xl shadow-[0_0_80px_rgba(0,0,0,0.6)] overflow-hidden relative min-h-[700px] w-full border-2 rounded-[3rem]">
        <CardHeader className="border-b border-white/10 pb-6 relative z-10 bg-background/60 backdrop-blur-md flex flex-row items-center justify-between px-10">
          <div>
            <CardTitle className="text-xl font-black uppercase tracking-widest text-foreground flex items-center gap-3 font-headline">
              <Globe className="h-6 w-6 text-primary" /> {t.mapping.hotspotsTitle}
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Análisis Táctico de Mercados • Tiempo Real</CardDescription>
          </div>
          <div className="flex items-center gap-3 px-5 py-2.5 bg-primary/10 rounded-full border border-primary/20">
             <Crosshair className="h-4 w-4 text-primary" />
             <span className="text-[9px] font-black text-primary uppercase tracking-widest">SISTEMA VIGÍA ACTIVO</span>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 h-[700px] relative bg-[#050810]">
          {/* Imagen de fondo oficial desde RECURSOS */}
          {mapImage && (
            <div className="absolute inset-0 z-0">
               <Image 
                 src={mapImage} 
                 alt="Tactical World Map" 
                 fill 
                 className="object-cover opacity-80 contrast-125"
                 priority
                 unoptimized
               />
               <div className="absolute inset-0 bg-gradient-to-t from-[#050810] via-transparent to-transparent opacity-60" />
            </div>
          )}

          {/* Grid de fondo decorativo para profundidad */}
          <div className="absolute inset-0 grid grid-cols-[repeat(50,minmax(0,1fr))] grid-rows-[repeat(30,minmax(0,1fr))] opacity-[0.03] z-5">
            {[...Array(1500)].map((_, i) => (
              <div key={i} className="border-[0.5px] border-primary/20" />
            ))}
          </div>

          <div className="relative h-full w-full flex items-center justify-center p-4 z-10">
             <div className="w-full h-full max-w-[1200px] aspect-[2/1] relative">
                {/* SVG Overlay para Datos y Flujos */}
                <svg viewBox="0 0 1000 500" className="w-full h-full">
                   <defs>
                      <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="1" />
                        <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.2" />
                      </linearGradient>
                      <radialGradient id="glow">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                      </radialGradient>
                   </defs>

                   {/* Render de Conexiones */}
                   <g>
                      {Object.entries(statsByCountry).map(([name, stat]) => {
                        const pos = COUNTRY_COORDS[name];
                        return pos ? drawConnection(pos, name) : null;
                      })}
                   </g>

                   {/* Resaltado de Hotspots (Glow dinámico) */}
                   <g>
                     {Object.entries(statsByCountry).map(([name, stat]) => {
                        const pos = COUNTRY_COORDS[name];
                        if (!pos) return null;
                        const radius = 20 + stat.count * 4;
                        return (
                          <circle 
                            key={`glow-${name}`}
                            cx={pos.x} cy={pos.y} 
                            r={radius} 
                            fill="url(#glow)"
                            className="animate-pulse"
                          />
                        );
                     })}
                   </g>
                </svg>

                {/* Marcadores Interactivos */}
                {Object.entries(statsByCountry).map(([name, stat]) => {
                  const pos = COUNTRY_COORDS[name];
                  if (!pos) return null;
                  
                  return (
                    <div 
                      key={name}
                      className="absolute group z-20"
                      style={{
                        top: `${(pos.y / 500) * 100}%`,
                        left: `${(pos.x / 1000) * 100}%`
                      }}
                    >
                      <div className="relative -translate-x-1/2 -translate-y-1/2">
                        {/* Indicador pulsante */}
                        <div className="h-10 w-10 bg-primary/30 rounded-full absolute -inset-3 animate-ping opacity-20" />
                        
                        {/* Marcador Táctico */}
                        <div className={cn(
                          "h-5 w-5 bg-primary rounded-full border-2 border-white shadow-2xl transition-all group-hover:scale-150 cursor-pointer flex items-center justify-center",
                          stat.count > 3 ? "ring-4 ring-primary/20" : ""
                        )}>
                           <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        </div>
                        
                        {/* Tooltip táctico profesional */}
                        <div className="absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#1b263b]/95 backdrop-blur-2xl px-6 py-5 rounded-[2rem] border border-white/10 opacity-0 group-hover:opacity-100 transition-all z-30 pointer-events-none scale-90 group-hover:scale-100 shadow-[0_30px_60px_rgba(0,0,0,0.8)]">
                          <div className="flex items-center gap-4 mb-4">
                             <Badge className="bg-primary text-primary-foreground text-[10px] font-black px-4 py-1">{name.toUpperCase()}</Badge>
                             <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                                <span className="text-[8px] font-black text-accent uppercase tracking-tighter">Nodo Crítico</span>
                             </div>
                          </div>
                          <div className="flex items-center gap-8">
                            <div>
                              <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mb-1">Patrimonio Club</p>
                              <p className="text-3xl font-black text-white font-headline">{stat.count} <span className="text-sm text-primary font-bold">JUG</span></p>
                            </div>
                            <div className="h-12 w-[1px] bg-white/10" />
                            <div className="flex flex-col gap-2">
                               <div className="flex items-center gap-2">
                                  {global ? <Users className="h-3 w-3 text-primary" /> : <User className="h-3 w-3 text-accent" />}
                                  <span className="text-[8px] font-bold text-white/60 uppercase tracking-widest">{global ? "Red ScoutPro" : "Cartera Scout"}</span>
                               </div>
                               <div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                  <div className="h-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" style={{ width: `${Math.min(100, stat.count * 15)}%` }} />
                               </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
             </div>
          </div>

          {/* Cuadro Central de Inteligencia */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 md:left-12 md:translate-x-0 flex items-center gap-10 bg-[#1b263b]/80 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-3xl shadow-[0_0_80px_rgba(0,0,0,0.6)] z-30 group hover:border-primary/30 transition-colors">
             <div className="flex items-center gap-6">
               <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 group-hover:scale-110 transition-transform">
                  <Activity className="h-7 w-7 text-primary" />
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-1.5 animate-pulse">Sincronización Transcontinental</p>
                  <p className="text-sm font-black uppercase tracking-[0.1em] text-white">
                     {global ? "CENTRO DE INTELIGENCIA GLOBAL" : "ANÁLISIS DE MERCADO PRIVADO"}
                  </p>
               </div>
             </div>
             <div className="hidden lg:block h-12 w-[1px] bg-white/10" />
             <div className="hidden lg:flex flex-col">
               <p className="text-xs font-black text-white uppercase">{players.length} PROSPECTOS EN RADAR</p>
               <p className="text-[9px] font-bold text-primary/70 uppercase tracking-tight italic mt-1">Validación mediante Algoritmo PIM v2.4</p>
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}