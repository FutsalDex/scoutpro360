
"use client"

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Loader2, Crosshair, Users, User } from "lucide-react";
import { useTranslation } from '@/lib/i18n/context';
import { subscribeToGlobalPlayers, subscribeToPlayers } from "@/lib/services/db-service";
import { Player } from "@/lib/types";
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";

// Coordenadas geográficas realistas normalizadas para el SVG 1000x500
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Sincronizando coordenadas...</p>
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
              ? "Visión consolidada de toda la red de scouts del club." 
              : "Distribución geográfica de tus talentos identificados."}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] font-black py-1.5 px-4 tracking-widest uppercase flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            {global ? "INTELIGENCIA DE CLUB" : "RED PRIVADA"}
          </Badge>
        </div>
      </div>

      <Card className="border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden relative min-h-[600px] w-full border-2 rounded-[2.5rem]">
        <CardHeader className="border-b border-border/10 pb-6 relative z-10 bg-background/40 backdrop-blur-md flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-black uppercase tracking-widest text-foreground flex items-center gap-3">
              <Globe className="h-5 w-5 text-primary" /> {t.mapping.hotspotsTitle}
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground/60">Análisis geoespacial de la red de captación</CardDescription>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
             <Crosshair className="h-3 w-3 text-primary" />
             <span className="text-[8px] font-black text-primary uppercase tracking-widest">LIVE RADAR</span>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 h-[600px] relative bg-[#0a0f1d]">
          {/* Grid de fondo decorativo */}
          <div className="absolute inset-0 grid grid-cols-[repeat(40,minmax(0,1fr))] grid-rows-[repeat(25,minmax(0,1fr))] opacity-[0.1]">
            {[...Array(1000)].map((_, i) => (
              <div key={i} className="border-[0.5px] border-primary/20" />
            ))}
          </div>

          <div className="relative h-full w-full flex items-center justify-center p-8">
             <div className="w-full h-full max-w-[1200px] aspect-[2/1] relative">
                {/* SVG Realista del Mapa Mundi con trazados detallados */}
                <svg viewBox="0 0 1000 500" className="w-full h-full fill-primary/10 stroke-primary/30 stroke-[0.5] drop-shadow-[0_0_30px_rgba(224,176,80,0.1)]">
                   <g>
                     {/* América del Norte */}
                     <path d="M210,60 L240,50 L270,55 L310,70 L340,90 L350,130 L345,160 L320,190 L280,210 L250,230 L220,240 L180,230 L150,200 L130,170 L110,140 L100,100 L120,70 Z" />
                     {/* América del Sur */}
                     <path d="M280,280 L320,270 L360,285 L390,310 L410,350 L420,380 L410,420 L380,460 L340,480 L300,470 L275,440 L260,400 L265,340 Z" />
                     {/* Europa */}
                     <path d="M460,110 L480,95 L510,85 L540,80 L570,85 L590,110 L600,140 L590,170 L570,195 L540,205 L500,200 L470,180 L455,140 Z" />
                     {/* África */}
                     <path d="M460,210 L500,200 L540,195 L580,205 L610,230 L630,270 L640,320 L635,370 L610,420 L570,460 L520,470 L480,450 L460,400 L445,340 L440,280 Z" />
                     {/* Asia */}
                     <path d="M600,90 L650,75 L710,65 L780,70 L850,85 L910,110 L940,150 L950,200 L940,250 L910,300 L860,340 L800,360 L730,370 L670,360 L620,330 L600,280 L590,200 L595,130 Z" />
                     {/* Oceanía */}
                     <path d="M830,390 L870,380 L920,385 L950,400 L960,430 L950,470 L910,490 L860,490 L820,470 L810,430 Z" />
                     {/* Groenlandia (Bonus visual) */}
                     <path d="M360,30 L420,20 L480,35 L470,70 L410,85 L370,70 Z" opacity="0.3" />
                   </g>
                </svg>

                {/* Renderizado de Hotspots */}
                {Object.entries(statsByCountry).map(([name, stat]) => {
                  const pos = COUNTRY_COORDS[name];
                  if (!pos) return null;
                  
                  return (
                    <div 
                      key={name}
                      className="absolute group"
                      style={{
                        top: `${(pos.y / 500) * 100}%`,
                        left: `${(pos.x / 1000) * 100}%`
                      }}
                    >
                      <div className="relative -translate-x-1/2 -translate-y-1/2">
                        <div className="h-10 w-10 bg-primary/30 rounded-full absolute -inset-3 animate-ping opacity-40" />
                        <div className="h-4 w-4 bg-primary rounded-full border-2 border-white shadow-[0_0_20px_hsl(var(--primary))] transition-all group-hover:scale-150 cursor-pointer flex items-center justify-center">
                           <div className="h-1 w-1 rounded-full bg-white animate-pulse" />
                        </div>
                        
                        {/* Tooltip táctico */}
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#1b263b] px-5 py-4 rounded-xl border border-primary/40 opacity-0 group-hover:opacity-100 transition-all z-30 pointer-events-none scale-90 group-hover:scale-100 shadow-2xl">
                          <div className="flex items-center gap-3 mb-2">
                             <Badge className="bg-primary text-primary-foreground text-[8px] font-black">{name.toUpperCase()}</Badge>
                          </div>
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="text-[8px] text-muted-foreground uppercase font-black">Prospectos</p>
                              <p className="text-base font-black text-white">{stat.count}</p>
                            </div>
                            <div className="h-8 w-[1px] bg-white/10" />
                            <div className="flex flex-col gap-1">
                               <div className="flex items-center gap-1">
                                  {global ? <Users className="h-2 w-2 text-primary" /> : <User className="h-2 w-2 text-accent" />}
                                  <span className="text-[7px] font-bold text-primary/80 uppercase">{global ? "Club" : "Propio"}</span>
                               </div>
                               <div className="h-1 w-12 bg-secondary rounded-full overflow-hidden">
                                  <div className="h-full bg-primary" style={{ width: '80%' }} />
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

          {/* Leyenda de Red */}
          <div className="absolute bottom-8 left-8 flex items-center gap-8 bg-black/60 p-5 rounded-2xl border border-white/10 backdrop-blur-2xl shadow-2xl z-20">
             <div className="flex items-center gap-4">
               <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
               <p className="text-[10px] font-black uppercase tracking-widest text-white">
                  {global ? "Red Global ScoutPro 360" : "Mi Inteligencia de Mercado"}
               </p>
             </div>
             <div className="h-6 w-[1px] bg-white/20" />
             <div className="flex flex-col">
               <p className="text-[9px] font-bold text-muted-foreground uppercase">{players.length} Talentos Detectados</p>
               <p className="text-[7px] font-medium text-primary/60 uppercase tracking-tight italic">Sincronización segura con el núcleo de datos</p>
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
